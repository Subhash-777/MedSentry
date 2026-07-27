import requests, os
from dotenv import load_dotenv
import jwt, time

api_url = "http://127.0.0.1:54321"
# Fetch the local anon key
import subprocess
try:
    anon_key = subprocess.check_output("npx supabase status -o json | grep 'anon' | awk -F'\"' '{print $4}'", shell=True).decode().strip()
    # Or just hardcode the default local anon key if it's standard.
    if not anon_key:
        anon_key = subprocess.check_output("npx supabase status | grep 'anon key' | awk '{print $4}'", shell=True).decode().strip()
except Exception:
    anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." # Will rely on the grep

# Use local DB URL
db_url = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"

def get_token():
    res = requests.post(
        f"{api_url}/auth/v1/signup",
        headers={"apikey": anon_key, "Content-Type": "application/json"},
        json={"email": f"temp_{int(time.time())}@test.com", "password": "password123"}
    )
    if res.status_code != 200:
        raise Exception(res.text)
    data = res.json()
    uid = data['user']['id']
    import psycopg2
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute(f"INSERT INTO profiles (id, full_name, is_admin) VALUES ('{uid}', 'Admin', true) ON CONFLICT (id) DO UPDATE SET is_admin = true;")
    return data['access_token']

token = get_token()

res = requests.post(
    f"{api_url}/functions/v1/admin-api",
    headers={'Authorization': f'Bearer {token}'},
    json={
        'action': 'deactivate_user',
        'payload': {
            'target_user_id': '00000000-0000-0000-0000-000000000000',
            'reason': '   ' # Empty/whitespace reason
        }
    }
)
print(f"Status Code: {res.status_code}")
print(f"Response: {res.text}")
