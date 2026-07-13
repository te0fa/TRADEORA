import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# General settings
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
DATA_FOLDER = os.getenv("DATA_FOLDER", str(BASE_DIR / "data"))
DEFAULT_SOURCE = os.getenv("DEFAULT_SOURCE", "egx_bulletin")

# Ensure directories exist
os.makedirs(DATA_FOLDER, exist_ok=True)
os.makedirs(str(BASE_DIR / "logs"), exist_ok=True)

def validate_config() -> tuple[bool, str]:
    """Validates if essential configuration keys are set."""
    if not SUPABASE_URL:
        return False, "SUPABASE_URL is missing. Please add it to your .env file."
    if not SUPABASE_KEY:
        return False, "SUPABASE_KEY is missing. Please add it to your .env file."
    return True, "Config is valid."
