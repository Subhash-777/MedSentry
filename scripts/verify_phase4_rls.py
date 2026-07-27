import psycopg2, os
from dotenv import load_dotenv

load_dotenv('/home/subhash/projects/MedSentry/scripts/.env')
conn = psycopg2.connect(os.environ['SUPABASE_DB_URL'])

try:
    with conn.cursor() as cur:
        # 1. Setup Test Data (runs as 'postgres' role by default on direct connections)
        cur.execute("INSERT INTO auth.users (id) VALUES (gen_random_uuid()) RETURNING id;")
        dependent_id = cur.fetchone()[0]
        cur.execute("INSERT INTO auth.users (id) VALUES (gen_random_uuid()) RETURNING id;")
        caregiver_id = cur.fetchone()[0]
        cur.execute("INSERT INTO auth.users (id) VALUES (gen_random_uuid()) RETURNING id;")
        viewer_id = cur.fetchone()[0]
        
        cur.execute(f"INSERT INTO profiles (id, full_name, caregiver_consent_revoked) VALUES ('{dependent_id}', 'Test Dependent', false);")
        cur.execute(f"INSERT INTO profiles (id, full_name) VALUES ('{caregiver_id}', 'Test Caregiver');")
        cur.execute(f"INSERT INTO profiles (id, full_name) VALUES ('{viewer_id}', 'Test Viewer');")
        
        cur.execute(f"INSERT INTO family_groups (owner_id, name, invite_code) VALUES ('{caregiver_id}', 'Test Circle', 'TEST12') RETURNING id;")
        group_id = cur.fetchone()[0]
        cur.execute(f"INSERT INTO family_members (group_id, member_id, role) VALUES ('{group_id}', '{caregiver_id}', 'owner');")
        cur.execute(f"INSERT INTO family_members (group_id, member_id, role) VALUES ('{group_id}', '{dependent_id}', 'viewer');")
        cur.execute(f"INSERT INTO family_members (group_id, member_id, role) VALUES ('{group_id}', '{viewer_id}', 'viewer');")
        
        cur.execute(f"INSERT INTO medication_courses (user_id, total_pills, daily_dose) VALUES ('{dependent_id}', 30, 1) RETURNING id;")
        course_id = cur.fetchone()[0]

        def run_update_as(user_id, sql):
            cur.execute("SAVEPOINT test_sp;")
            try:
                # Use standard Supabase PostgREST simulation pattern
                cur.execute("SET LOCAL ROLE authenticated;")
                cur.execute(f"SELECT set_config('request.jwt.claims', '{{\"sub\": \"{user_id}\", \"role\": \"authenticated\"}}', true);")
                
                cur.execute(sql)
                count = cur.rowcount
                cur.execute("RELEASE SAVEPOINT test_sp;")
                return f"Rows affected: {count}" if count > 0 else "DENIED (0 rows updated by RLS filter)"
            except Exception as e:
                cur.execute("ROLLBACK TO SAVEPOINT test_sp;")
                return f"EXCEPTION / WITH CHECK VIOLATION: {str(e).strip()}"
            finally:
                # Revert back to the session user (postgres)
                cur.execute("RESET ROLE;")

        print("\n--- 1. NEW PROOF: Viewer attempts to self-promote to 'owner' ---")
        print("Action:", run_update_as(viewer_id, f"UPDATE family_members SET role = 'owner' WHERE member_id = '{viewer_id}';"))
        
        print("\n--- 2. PROOF: Viewer attempts to edit Dependent's course ---")
        print("Action:", run_update_as(viewer_id, f"UPDATE medication_courses SET daily_dose = 2 WHERE id = '{course_id}';"))
        
        print("\n--- 3. PROOF: Caregiver attempts to edit Dependent's course ---")
        print("Action:", run_update_as(caregiver_id, f"UPDATE medication_courses SET daily_dose = 3 WHERE id = '{course_id}';"))
        
        print("\n--- 4. PROOF: Fetch exact Caregiver Audit Log output ---")
        cur.execute("SELECT action, details FROM caregiver_audit_log ORDER BY created_at DESC LIMIT 1;")
        audit_row = cur.fetchone()
        if audit_row:
            print(f"Triggered Audit Record:\n  Action: {audit_row[0]}\n  Payload: {audit_row[1]}")
        else:
            print("No audit record found!")

        print("\n--- 5. PROOF: Dependent revokes Caregiver Consent ---")
        cur.execute(f"UPDATE profiles SET caregiver_consent_revoked = true WHERE id = '{dependent_id}';")
        print("Caregiver consent revoked by Dependent.")
        
        print("\n--- 6. PROOF: Caregiver attempts to edit Dependent's course again ---")
        print("Action:", run_update_as(caregiver_id, f"UPDATE medication_courses SET daily_dose = 4 WHERE id = '{course_id}';"))

finally:
    print("\n--- Tearing down: Rolling back all test changes ---")
    conn.rollback()
    conn.close()
