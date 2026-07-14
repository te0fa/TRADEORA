import os
import ast
import sys
import pkgutil

# Mapping of import names to their corresponding pip package names in requirements.txt
IMPORT_TO_PIP_MAP = {
    "bs4": "beautifulsoup4",
    "dotenv": "python-dotenv",
    "pydantic_settings": "pydantic-settings",
    "supabase": "supabase",
    "pandas": "pandas",
    "openpyxl": "openpyxl",
    "pypdf": "pypdf",
    "playwright": "playwright",
    "pdfplumber": "pdfplumber",
    "pytz": "pytz",
    "requests": "requests",
    "selenium": "selenium",
    "pytest": "pytest"
}

def get_stdlib_modules() -> set:
    """Returns a set of standard library module names."""
    # sys.stdlib_module_names is available in Python 3.10+
    if hasattr(sys, "stdlib_module_names"):
        return sys.stdlib_module_names
        
    # Fallback for older python versions
    stdlib = set(sys.builtin_module_names)
    for m in pkgutil.iter_modules():
        if m.module_finder and "site-packages" not in getattr(m.module_finder, "path", ""):
            stdlib.add(m.name)
    return stdlib

def parse_imports_from_file(filepath: str) -> set:
    """Parses a Python file and returns a set of all top-level imported package names."""
    imports = set()
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            tree = ast.parse(f.read(), filename=filepath)
            
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.add(alias.name.split(".")[0])
            elif isinstance(node, ast.ImportFrom):
                if node.level == 0 and node.module: # Exclude relative imports
                    imports.add(node.module.split(".")[0])
    except Exception as e:
        print(f"Error parsing {filepath}: {e}")
    return imports

def get_project_packages(root_dir: str) -> set:
    """Returns top-level directories/files in the project root that act as local packages."""
    packages = set()
    for item in os.listdir(root_dir):
        # If it is a directory containing __init__.py or just a local python file (excluding script scripts)
        item_path = os.path.join(root_dir, item)
        if os.path.isdir(item_path) and not item.startswith(".") and item != "tests":
            packages.add(item)
        elif os.path.isfile(item_path) and item.endswith(".py") and item != "main.py":
            packages.add(item[:-3])
    return packages

def read_requirements(req_path: str) -> set:
    """Parses requirements.txt and returns normalized package names."""
    packages = set()
    if not os.path.exists(req_path):
        return packages
        
    with open(req_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            # Parse package name before versions (e.g. supabase>=2.28.3 -> supabase)
            pkg = line.split(">")[0].split("=")[0].split("<")[0].strip().lower()
            packages.add(pkg)
    return packages

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    req_path = os.path.join(root_dir, "requirements.txt")
    
    print("=" * 70)
    print("                 RUNNING DEPRENDENCY AUDIT & IMPORT VERIFIER                 ")
    print("=" * 70)
    
    # 1. Load context
    stdlib_modules = get_stdlib_modules()
    local_packages = get_project_packages(root_dir)
    required_packages = read_requirements(req_path)
    
    # 2. Scan all python files
    all_imports = set()
    for root, dirs, files in os.walk(root_dir):
        # Exclude hidden, virtualenv, cache, and test folders
        dirs[:] = [d for d in dirs if not d.startswith(".") and d not in ["venv", "env", "tests", "__pycache__", "build", "dist"]]
        
        for file in files:
            if file.endswith(".py"):
                path = os.path.join(root, file)
                all_imports.update(parse_imports_from_file(path))
                
    # 3. Filter imports
    missing_packages = {}
    
    for imp in sorted(all_imports):
        # Exclude stdlib and local project packages
        if imp in stdlib_modules or imp in local_packages:
            continue
            
        # Map import name to pip package name
        pip_name = IMPORT_TO_PIP_MAP.get(imp, imp).lower()
        
        if pip_name not in required_packages:
            # Check if it is a known module that we might have missed or a built-in
            missing_packages[imp] = pip_name
            
    # 4. Report results
    if missing_packages:
        print("\n[ERR] Dependency Audit Failed! Found missing imports in codebase:")
        print("-" * 70)
        for imp, pip_name in missing_packages.items():
            print(f"  - Import '{imp}' -> Requires pip package '{pip_name}' in requirements.txt")
        print("-" * 70)
        print("Please add the missing packages to requirements.txt before committing.")
        sys.exit(1)
    else:
        print("\n[SUCCESS] Dependency Audit Passed! All imports are accounted for in requirements.txt.")
        sys.exit(0)

if __name__ == "__main__":
    main()
