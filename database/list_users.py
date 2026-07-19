import os
import requests

def main():
    env = {}
    env_path = os.path.join('tradeora-web', '.env.local')
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            if '=' in line and not line.strip().startswith('#'):
                k, v = line.strip().split('=', 1)
                env[k.strip()] = v.strip()

    supabase_url = env.get('NEXT_PUBLIC_SUPABASE_URL')
    service_key = env.get('SUPABASE_SERVICE_ROLE_KEY')

    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}"
    }

    url = f"{supabase_url}/auth/v1/admin/users"
    res = requests.get(url, headers=headers)
    if res.status_code == 200:
        users = res.json()
        users_list = users.get('users', []) if isinstance(users, dict) else users
        print("Registered Emails in Supabase:")
        for u in users_list:
            print(f"- {u.get('email')}")
    else:
        print(f"Failed: {res.text}")

if __name__ == '__main__':
    main()
