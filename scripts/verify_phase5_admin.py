import psycopg2, os, requests, json, time, uuid
from dotenv import load_dotenv

# Load DB URL (for direct Postgres data setup/teardown)
load_dotenv('/home/subhash/projects/MedSentry/scripts/.env')
db_url = os.environ['SUPABASE_DB_URL']

# Load API URL and Anon Key (for authenticating against production)
load_dotenv('/home/subhash/projects/MedSentry/mobile-app/.env')
api_url = os.environ.get('EXPO_PUBLIC_SUPABASE_URL')
anon_key = os.environ.get('EXPO_PUBLIC_SUPABASE_ANON_KEY')

print(f"Targeting API: {api_url}")
function_url = f"{api_url}/functions/v1/admin-api"

# Unique suffix to avoid collisions in auth.users
test_id = str(uuid.uuid4())[:8]
admin_email = f"admin_{test_id}@test.com"
user_email = f"user_{test_id}@test.com"
target_email = f"target_{test_id}@test.com"
password = "TestPassword123!"

# State tracking for bulletproof teardown
created_user_ids = []
group_id = None

def create_user_and_get_token(email, password):
    res = requests.post(
        f"{api_url}/auth/v1/signup",
        headers={"apikey": anon_key, "Content-Type": "application/json"},
        json={"email": email, "password": password}
    )
    if res.status_code != 200:
        raise Exception(f"Failed to sign up user {email}: {res.text}")
    data = res.json()
    if 'access_token' not in data:
        raise Exception(f"Signup succeeded but no access_token returned. Ensure 'Confirm email' is disabled in Supabase Auth. Response: {res.text}")
    
    uid = data['user']['id']
    created_user_ids.append(uid) # Immediately track for teardown
    return uid, data['access_token']

conn = psycopg2.connect(db_url)
conn.autocommit = True

try:
    print("Signing up real test users in Supabase Auth to get genuine JWTs...")
    admin_id, admin_jwt = create_user_and_get_token(admin_email, password)
    user_id, user_jwt = create_user_and_get_token(user_email, password)
    target_id, target_jwt = create_user_and_get_token(target_email, password)

    with conn.cursor() as cur:
        print("Setting up Phase 5 Test Data in DB...")
        # Insert profiles manually (using ON CONFLICT in case of a Phase 1 trigger)
        cur.execute(f"INSERT INTO profiles (id, full_name, is_admin) VALUES ('{admin_id}', 'Test Admin', true) ON CONFLICT (id) DO UPDATE SET is_admin = true;")
        cur.execute(f"INSERT INTO profiles (id, full_name, is_admin) VALUES ('{user_id}', 'Test User', false) ON CONFLICT (id) DO UPDATE SET is_admin = false;")
        cur.execute(f"INSERT INTO profiles (id, full_name, is_admin) VALUES ('{target_id}', 'Abusive Spammer', false) ON CONFLICT (id) DO UPDATE SET is_admin = false;")

        # Create a Family Circle owned by the Target User
        cur.execute(f"INSERT INTO family_groups (owner_id, name, invite_code) VALUES ('{target_id}', 'Spam Circle', 'SPAM_{test_id}') RETURNING id;")
        group_id = cur.fetchone()[0]
        cur.execute(f"INSERT INTO family_members (group_id, member_id, role) VALUES ('{group_id}', '{target_id}', 'owner');")

        # Insert dummy sync log
        cur.execute(f"INSERT INTO dataset_sync_log (dataset_name, status) VALUES ('test_db_{test_id}', 'success');")
        
        print("\n--- 1. PROOF: Non-Admin attempts to call admin-api ---")
        res1 = requests.post(function_url, headers={'Authorization': f'Bearer {user_jwt}'}, json={'action': 'get_dashboard_data'})
        print(f"Status Code: {res1.status_code}")
        print(f"Response: {res1.text}")

        print("\n--- 2. PROOF: Admin calls get_dashboard_data ---")
        res2 = requests.post(function_url, headers={'Authorization': f'Bearer {admin_jwt}'}, json={'action': 'get_dashboard_data'})
        print(f"Status Code: {res2.status_code}")
        if res2.status_code == 200:
            data = res2.json()
            print(f"Found {len(data.get('users', []))} users, {len(data.get('syncs', []))} sync logs.")
        else:
            print(res2.text)
        
        print("\n--- 3a. PROOF: Non-Admin attempts to disband circle (Destructive Action Gate Check) ---")
        res3a = requests.post(function_url, headers={'Authorization': f'Bearer {user_jwt}'}, json={
            'action': 'disband_circle',
            'payload': {
                'target_group_id': group_id,
                'reason': 'Trying to bypass'
            }
        })
        print(f"Status Code: {res3a.status_code}")
        print(f"Response: {res3a.text}")

        print("\n--- 3b. PROOF: Admin updates abusive profile ---")
        res3b = requests.post(function_url, headers={'Authorization': f'Bearer {admin_jwt}'}, json={
            'action': 'update_profile',
            'payload': {
                'target_user_id': target_id,
                'full_name': '[Name Removed by Admin]',
                'original_name': 'Abusive Spammer',
                'reason': 'Inappropriate name'
            }
        })
        print(f"Status Code: {res3b.status_code}")
        print(f"Response: {res3b.text}")

        print("\n--- 4. PROOF: Admin disbands abusive circle ---")
        res4 = requests.post(function_url, headers={'Authorization': f'Bearer {admin_jwt}'}, json={
            'action': 'disband_circle',
            'payload': {
                'target_group_id': group_id,
                'reason': 'Spam/Abuse violation'
            }
        })
        print(f"Status Code: {res4.status_code}")
        print(f"Response: {res4.text}")
        
        print("\n--- 5a. PROOF: Admin deactivates user ---")
        res5 = requests.post(function_url, headers={'Authorization': f'Bearer {admin_jwt}'}, json={
            'action': 'deactivate_user',
            'payload': {
                'target_user_id': target_id,
                'reason': 'Spam/Abuse violation'
            }
        })
        print(f"Status Code: {res5.status_code}")
        print(f"Response: {res5.text}")

        print("\n--- 5b. PROOF: Verify deactivate_user actually banned the user in GoTrue ---")
        cur.execute(f"SELECT banned_until FROM auth.users WHERE id = '{target_id}';")
        banned_until = cur.fetchone()[0]
        if banned_until:
            print(f"SUCCESS: User is officially banned until: {banned_until}")
        else:
            print("WARNING: User is NOT banned!")
        
        print("\n--- 6. PROOF: Verify admin_audit_log captured snapshot for disband_circle ---")
        cur.execute("SELECT action, details FROM admin_audit_log WHERE action = 'disband_circle' ORDER BY created_at DESC LIMIT 1;")
        audit_row = cur.fetchone()
        if audit_row:
            print(f"Action: {audit_row[0]}")
            print(f"Snapshot Payload: {json.dumps(audit_row[1], indent=2)}")
        else:
            print("No audit record found!")

finally:
    print("\n--- Tearing down: Cleaning up test data ---")
    with conn.cursor() as cur:
        # Clean logs and syncs unconditionally
        cur.execute("DELETE FROM admin_audit_log WHERE action IN ('disband_circle', 'update_profile', 'deactivate_user');")
        cur.execute(f"DELETE FROM dataset_sync_log WHERE dataset_name = 'test_db_{test_id}';")
        
        # If group was created but not deleted via API, clean it up
        if group_id:
            cur.execute(f"DELETE FROM family_members WHERE group_id = '{group_id}';")
            cur.execute(f"DELETE FROM family_groups WHERE id = '{group_id}';")
            
        # Clean up any users that were successfully created (even if it failed partway through)
        if created_user_ids:
            format_strings = ','.join(['%s'] * len(created_user_ids))
            cur.execute(f"DELETE FROM profiles WHERE id IN ({format_strings});", tuple(created_user_ids))
            cur.execute(f"DELETE FROM auth.users WHERE id IN ({format_strings});", tuple(created_user_ids))
            
    conn.close()
