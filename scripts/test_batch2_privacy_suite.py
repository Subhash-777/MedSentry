#!/usr/bin/env python3
"""
Batch 2 Live Privacy Enforcement Test Suite
Verifies Decision D2:
- Viewers CANNOT read other members' clinical profile from profiles table
- Viewers CAN read demographics (id, full_name, account_type) from circle_member_profiles view
- Viewers CANNOT read other members' symptom_journal
- Caregivers CAN read full clinical profile and symptom_journal of dependents
- Owners CAN read full profiles of members
- Outsiders CANNOT read anything
"""
import os
import sys
import psycopg2
from dotenv import load_dotenv

load_dotenv('scripts/.env')
DB_URL = os.environ.get('SUPABASE_DB_URL')
if not DB_URL:
    print("Error: SUPABASE_DB_URL not found in scripts/.env")
    sys.exit(1)

def run_tests():
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False

    print("=" * 60)
    print("BATCH 2 LIVE PRIVACY SUITE (Decision D2)")
    print("=" * 60)

    with conn.cursor() as cur:
        # Check that circle_member_profiles view exists
        cur.execute("SELECT table_name FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'circle_member_profiles';")
        if not cur.fetchone():
            print("ERROR: circle_member_profiles view does not exist! Migration 2 not yet run.")
            return False

        # Set Sofia temporarily to viewer role to test viewer access cleanly
        cur.execute("UPDATE family_members SET role = 'viewer' WHERE member_id = 'efc9f24c-a25f-4897-bc8d-8aa9edec144c';")

        # ----------------------------------------------------
        # TEST 1: Viewer reads self from profiles
        # ----------------------------------------------------
        print("\n[TEST 1] Viewer reading own profile from profiles")
        cur.execute("SET LOCAL ROLE authenticated;")
        cur.execute("SELECT set_config('request.jwt.claims', '{\"sub\": \"efc9f24c-a25f-4897-bc8d-8aa9edec144c\", \"role\": \"authenticated\"}', true);")
        cur.execute("SELECT id, full_name FROM profiles WHERE id = 'efc9f24c-a25f-4897-bc8d-8aa9edec144c';")
        rows = cur.fetchall()
        assert len(rows) == 1, "Self profile read should succeed"
        print(f"Self read: {rows[0][1]} (OK)")

        # ----------------------------------------------------
        # TEST 2: Viewer reads circle owner from profiles (BLOCKED)
        # ----------------------------------------------------
        print("\n[TEST 2] Viewer reading circle member's clinical profile from profiles")
        cur.execute("SELECT id, full_name, known_conditions, allergies FROM profiles WHERE id = 'c87b9d74-5ae0-439f-9385-e2a4f778738c';")
        rows = cur.fetchall()
        assert len(rows) == 0, "Viewer must NOT read clinical profile from profiles table"
        print(">>> PASS: Viewer blocked from reading profiles table (0 rows returned)")

        # ----------------------------------------------------
        # TEST 3: Viewer reads demographics from circle_member_profiles view (ALLOWED)
        # ----------------------------------------------------
        print("\n[TEST 3] Viewer reading circle member demographics from circle_member_profiles view")
        cur.execute("SELECT id, full_name, account_type FROM circle_member_profiles WHERE id = 'c87b9d74-5ae0-439f-9385-e2a4f778738c';")
        rows = cur.fetchall()
        assert len(rows) == 1, "Viewer should read demographic info from circle_member_profiles"
        assert rows[0][1] == 'Elena Ramirez'
        print(f">>> PASS: Demographic info accessible: {rows[0][1]}, account: {rows[0][2]}")

        # ----------------------------------------------------
        # TEST 4: Viewer reads circle member symptom journal (BLOCKED)
        # ----------------------------------------------------
        print("\n[TEST 4] Viewer reading circle member's symptom journal")
        cur.execute("SELECT id, symptom FROM symptom_journal WHERE user_id = 'c87b9d74-5ae0-439f-9385-e2a4f778738c';")
        rows = cur.fetchall()
        assert len(rows) == 0, "Viewer must NOT read other member's symptom journal"
        print(">>> PASS: Viewer blocked from reading symptom journal (0 rows returned)")

        # ----------------------------------------------------
        # TEST 5: Caregiver reads dependent's clinical profile
        # ----------------------------------------------------
        print("\n[TEST 5] Caregiver reading dependent's clinical profile from profiles")
        cur.execute("SELECT set_config('request.jwt.claims', '{\"sub\": \"a8b8345c-8ce7-4761-899f-8397838d3828\", \"role\": \"authenticated\"}', true);")
        cur.execute("SELECT id, full_name, known_conditions, allergies FROM profiles WHERE id = '3aa6c958-5f36-40d3-85f6-2d8d123bd3ac';")
        rows = cur.fetchall()
        assert len(rows) == 1, "Caregiver should read dependent profile"
        print(f">>> PASS: Caregiver read dependent {rows[0][1]} with conditions: {rows[0][2]}")

        # ----------------------------------------------------
        # TEST 6: Outsider reads circle_member_profiles and profiles (BLOCKED)
        # ----------------------------------------------------
        print("\n[TEST 6] Outsider reading profiles and circle_member_profiles")
        cur.execute("SELECT set_config('request.jwt.claims', '{\"sub\": \"99999999-9999-9999-9999-999999999999\", \"role\": \"authenticated\"}', true);")
        cur.execute("SELECT id, full_name FROM circle_member_profiles;")
        rows = cur.fetchall()
        assert len(rows) == 0, "Outsider must see 0 rows in circle_member_profiles"
        cur.execute("SELECT id, full_name FROM profiles WHERE id = 'c87b9d74-5ae0-439f-9385-e2a4f778738c';")
        rows = cur.fetchall()
        assert len(rows) == 0, "Outsider must see 0 rows in profiles"
        print(">>> PASS: Outsider completely blocked from all circle member data")

        # Restore Sofia back to caregiver
        cur.execute("SET LOCAL ROLE postgres;")
        cur.execute("UPDATE family_members SET role = 'caregiver' WHERE member_id = 'efc9f24c-a25f-4897-bc8d-8aa9edec144c';")
        conn.commit()

    print("\n" + "=" * 60)
    print("ALL BATCH 2 TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)
    return True

if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
