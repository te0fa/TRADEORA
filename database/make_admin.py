import os
import requests
import sys

def main():
    # Load env variables from tradeora-web/.env.local
    env = {}
    env_path = os.path.join('tradeora-web', '.env.local')
    if not os.path.exists(env_path):
        print("Error: tradeora-web/.env.local file not found.")
        sys.exit(1)
        
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            if '=' in line and not line.strip().startswith('#'):
                k, v = line.strip().split('=', 1)
                env[k.strip()] = v.strip()

    supabase_url = env.get('NEXT_PUBLIC_SUPABASE_URL')
    service_key = env.get('SUPABASE_SERVICE_ROLE_KEY')

    if not supabase_url or not service_key:
        print("Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env.local")
        sys.exit(1)

    if len(sys.argv) < 2:
        print("Usage: python database/make_admin.py <user_email>")
        sys.exit(1)

    email = sys.argv[1].strip().lower()

    # Get auth users using admin API
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}"
    }

    url = f"{supabase_url}/auth/v1/admin/users"
    print(f"Fetching users from Supabase Auth admin API...")
    res = requests.get(url, headers=headers)
    if res.status_code != 200:
        print(f"Failed to fetch users: {res.text}")
        sys.exit(1)

    users = res.json()
    users_list = users.get('users', []) if isinstance(users, dict) else users

    target_user = None
    for u in users_list:
        u_email = u.get('email', '').strip().lower()
        if u_email == email:
            target_user = u
            break

    if not target_user:
        print(f"User with email {email} not found in Supabase Auth.")
        sys.exit(1)

    user_id = target_user['id']
    print(f"Found user {email} with ID: {user_id}")

    # Upsert into user_profiles table using Postgrest REST API
    profile_url = f"{supabase_url}/rest/v1/user_profiles"
    profile_headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }

    # First check if the profile exists
    check_url = f"{supabase_url}/rest/v1/user_profiles?id=eq.{user_id}"
    check_res = requests.get(check_url, headers=headers)
    
    profile_data = {
        "id": user_id,
        "role": "admin"
    }

    if check_res.status_code == 200 and len(check_res.json()) > 0:
        # Update existing
        print("Updating existing user profile role to admin...")
        update_url = f"{supabase_url}/rest/v1/user_profiles?id=eq.{user_id}"
        res = requests.patch(update_url, headers=headers, json={"role": "admin"})
    else:
        # Insert new
        print("Inserting new user profile with admin role...")
        res = requests.post(profile_url, headers=profile_headers, json=profile_data)

    if res.status_code in [200, 201, 204]:
        print(f"\nSuccess! User {email} has been granted the admin role.")
    else:
        print(f"Failed to update profile: {res.text}")

if __name__ == '__main__':
    main()
