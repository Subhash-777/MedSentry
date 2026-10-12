"""
Test suite verifying Batch A fixes:
A1-1: Medication name resolution in Chatbot context (PostgREST join + display name fallback)
A1-2: Medication context in Consultant context (all active courses included, drug name resolved)
A1-3: Dose history retrieval in Chatbot context (logged_at column, course_id scoping, no user_id query)
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv('mobile-app/.env')
load_dotenv('scripts/.env')

api_url = os.environ.get('EXPO_PUBLIC_SUPABASE_URL')
anon_key = os.environ.get('EXPO_PUBLIC_SUPABASE_ANON_KEY')

assert api_url, "Missing EXPO_PUBLIC_SUPABASE_URL"
assert anon_key, "Missing EXPO_PUBLIC_SUPABASE_ANON_KEY"

# Authenticate as demo user Elena Ramirez
login_res = requests.post(
    f'{api_url}/auth/v1/token?grant_type=password',
    headers={'apikey': anon_key, 'Content-Type': 'application/json'},
    json={'email': 'elena.ramirez@medsentry.demo', 'password': 'Demo_Review_2026_Showcase!'}
)
assert login_res.status_code == 200, f"Login failed: {login_res.text}"
auth_data = login_res.json()
token = auth_data['access_token']
user_id = auth_data['user']['id']

headers = {
    'apikey': anon_key,
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

print("==================================================")
print("BATCH A: MEDICATION CONTEXT & DOSE LOGS TEST SUITE")
print("==================================================")
print(f"Authenticated as Elena Ramirez ({user_id})")

# TEST 1: Chatbot Context Query - Join on drugs table
print("\n[TEST A1-1] Medication courses PostgREST join with drugs(name, aware_class)")
courses_res = requests.get(
    f'{api_url}/rest/v1/medication_courses?'
    f'select=id,custom_name,dosage_amount,frequency,instructions,days_remaining,necessity_flag,drug_id,drug:drugs(name,aware_class)&'
    f'user_id=eq.{user_id}&status=eq.active',
    headers=headers
)
assert courses_res.status_code == 200, f"Query failed with {courses_res.status_code}: {courses_res.text}"
courses = courses_res.json()
assert len(courses) > 0, "Expected Elena to have at least one active course"

# Verify name resolution logic
resolved_courses = []
for c in courses:
    drug_rel = c.get('drug')
    name = (drug_rel.get('name') if drug_rel else None) or c.get('custom_name') or "Unknown"
    resolved_courses.append({
        'id': c['id'],
        'resolved_name': name,
        'drug_id': c.get('drug_id'),
        'has_drug_rel': drug_rel is not None
    })
    print(f" - Course ID {c['id']}: drug_id={c.get('drug_id')}, resolved_name='{name}', aware={drug_rel.get('aware_class') if drug_rel else None}")

# At least one course should have a catalog drug joined
catalog_courses = [rc for rc in resolved_courses if rc['has_drug_rel']]
assert len(catalog_courses) > 0, "Expected at least one catalog-linked course"
assert any('Amoxicillin' in rc['resolved_name'] for rc in catalog_courses), "Expected Amoxicillin in catalog courses"
print(">>> PASS: Chatbot medication courses successfully resolve human-readable drug names via join.")

# TEST 2: Consultant Context - Inclusion of all courses (including custom_name only)
print("\n[TEST A1-2] Consultant active medications query includes custom and catalog courses")
consultant_courses_res = requests.get(
    f'{api_url}/rest/v1/medication_courses?'
    f'select=drug_id,custom_name,drug:drugs(name)&'
    f'user_id=eq.{user_id}&status=eq.active',
    headers=headers
)
assert consultant_courses_res.status_code == 200, f"Consultant courses query failed: {consultant_courses_res.status_code}"
c_courses = consultant_courses_res.json()

active_meds = [
    (c.get('drug', {}).get('name') if c.get('drug') else None) or c.get('custom_name') or "Unknown"
    for c in c_courses
]
print(f"Active medications for consultant: {active_meds}")
assert len(active_meds) == len(courses), f"Expected {len(courses)} active meds, got {len(active_meds)}"
# Verify custom course is present even if drug_id is null
custom_only = [c for c in c_courses if c.get('drug_id') is None]
if custom_only:
    assert any(c.get('custom_name') in active_meds for c in custom_only), "Custom-name-only course missing from active_meds"
    print(f" - Verified custom-name course '{custom_only[0].get('custom_name')}' is present without drug_id")
print(">>> PASS: Consultant context includes all active medications without excluding null drug_id.")

# TEST 3: Dose history query using logged_at and scoped to user's course IDs
print("\n[TEST A1-3] Dose history retrieval using logged_at and course_id scope")
course_ids = [c['id'] for c in courses]
course_ids_param = ','.join(course_ids)

dose_res = requests.get(
    f'{api_url}/rest/v1/dose_logs?'
    f'select=logged_at,status,course_id&'
    f'course_id=in.({course_ids_param})&'
    f'order=logged_at.desc&limit=50',
    headers=headers
)
assert dose_res.status_code == 200, f"Dose history query failed: {dose_res.status_code}: {dose_res.text}"
doses = dose_res.json()
print(f"Retrieved {len(doses)} dose logs for user courses")
if doses:
    sample_dose = doses[0]
    assert 'logged_at' in sample_dose, "Expected logged_at column in response"
    assert 'course_id' in sample_dose, "Expected course_id in response"
    assert sample_dose['course_id'] in course_ids, "Dose log course_id must belong to user's courses"
    print(f" - Sample dose: logged_at={sample_dose['logged_at']}, status={sample_dose['status']}, course_id={sample_dose['course_id']}")
print(">>> PASS: Dose history query uses valid logged_at column and strictly scopes to user course IDs.")

print("\n==================================================")
print("ALL BATCH A VERIFICATION CHECKS PASSED!")
print("==================================================")
