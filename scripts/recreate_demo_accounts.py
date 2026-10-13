#!/usr/bin/env python3
"""
MedSentry — Demo Account Recreation Script
============================================
Deletes old demo accounts (the Ramirez family) and recreates them with:
  - Shorter, easier email IDs
  - A single common password for all accounts

New Credentials:
  elena@demo.ms   → Elena Ramirez      (Circle Owner)
  carlos@demo.ms  → Carlos Ramirez     (Caregiver)
  rosa@demo.ms    → Rosa Ramirez       (Linked Dependent)
  sofia@demo.ms   → Sofia Ramirez      (Family Viewer)
  admin@demo.ms   → Dr. Marcus Vance   (Admin)
  Password: MedSentry@123

Usage:
  python3 scripts/recreate_demo_accounts.py
"""

import os
import sys
import uuid
import json
import hashlib
import hmac
import base64
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

# ── Config ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("demo-recreate")

SCRIPTS_DIR = Path(__file__).parent
load_dotenv(SCRIPTS_DIR / ".env")

SUPABASE_DB_URL = os.environ.get("SUPABASE_DB_URL")
if not SUPABASE_DB_URL:
    log.error("SUPABASE_DB_URL not set in scripts/.env")
    sys.exit(1)

# ── New Demo Credentials ─────────────────────────────────────────────────────

NEW_PASSWORD = "MedSentry@123"

OLD_EMAILS = [
    "elena.ramirez@medsentry.demo",
    "carlos.ramirez@medsentry.demo",
    "rosa.ramirez@medsentry.demo",
    "sofia.ramirez@medsentry.demo",
    "admin.marcus@medsentry.demo",
]

# New accounts with pre-generated UUIDs so we can reference them in related tables
NEW_USERS = {
    "elena": {
        "id": str(uuid.uuid4()),
        "email": "elena@demo.ms",
        "full_name": "Elena Ramirez",
        "is_admin": False,
        "account_type": "standard",
        "region": "California",
        "age": 38,
        "weight_kg": 62.0,
        "height_cm": 165.0,
        "known_conditions": ["Hypertension", "Type 2 Diabetes"],
        "allergies": ["Penicillin"],
    },
    "carlos": {
        "id": str(uuid.uuid4()),
        "email": "carlos@demo.ms",
        "full_name": "Carlos Ramirez",
        "is_admin": False,
        "account_type": "standard",
        "region": "California",
        "age": 42,
        "weight_kg": 78.5,
        "height_cm": 175.0,
        "known_conditions": ["Asthma"],
        "allergies": [],
    },
    "rosa": {
        "id": str(uuid.uuid4()),
        "email": "rosa@demo.ms",
        "full_name": "Rosa Ramirez",
        "is_admin": False,
        "account_type": "linked_dependent",
        "region": "California",
        "age": 72,
        "weight_kg": 55.0,
        "height_cm": 158.0,
        "known_conditions": ["Osteoporosis", "Hypertension", "Arthritis"],
        "allergies": ["Sulfa drugs"],
    },
    "sofia": {
        "id": str(uuid.uuid4()),
        "email": "sofia@demo.ms",
        "full_name": "Sofia Ramirez",
        "is_admin": False,
        "account_type": "standard",
        "region": "California",
        "age": 19,
        "weight_kg": 52.0,
        "height_cm": 162.0,
        "known_conditions": [],
        "allergies": [],
    },
    "admin": {
        "id": str(uuid.uuid4()),
        "email": "admin@demo.ms",
        "full_name": "Dr. Marcus Vance",
        "is_admin": True,
        "account_type": "standard",
        "region": "California",
        "age": 45,
        "weight_kg": 80.0,
        "height_cm": 178.0,
        "known_conditions": [],
        "allergies": [],
    },
}


# ── Supabase bcrypt-compatible password hash ─────────────────────────────────

def make_encrypted_password(password: str) -> str:
    """
    Supabase uses bcrypt for auth.users.encrypted_password.
    We use Python's bcrypt library to generate a proper hash.
    Falls back to a placeholder if bcrypt not installed.
    """
    try:
        import bcrypt
        salt = bcrypt.gensalt(rounds=10)
        hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
        return hashed.decode("utf-8")
    except ImportError:
        log.warning("bcrypt not installed — using pg crypt() fallback via SQL")
        return None  # Signal to use SQL


# ── Delete old demo accounts ─────────────────────────────────────────────────

def delete_old_accounts(cur):
    """Remove old demo users and all their cascaded data from auth.users."""
    log.info("Fetching old demo user IDs…")
    email_list = ", ".join(f"'{e}'" for e in OLD_EMAILS)
    cur.execute(f"SELECT id, email FROM auth.users WHERE email IN ({email_list})")
    old_users = cur.fetchall()

    if not old_users:
        log.info("No old demo accounts found — skipping deletion.")
        return []

    old_ids = [str(r[0]) for r in old_users]
    log.info("Found %d old accounts: %s", len(old_users), [r[1] for r in old_users])

    id_list = ", ".join(f"'{i}'" for i in old_ids)

    # Table → correct user-reference column mapping (from schema inspection)
    # Use savepoints per table so one failure doesn't abort the transaction
    table_col_map = [
        ("admin_audit_log",      "admin_id"),
        ("admin_audit_log",      "target_user_id"),
        ("ai_consultations",     "user_id"),
        ("api_usage_logs",       "user_id"),
        ("caregiver_audit_log",  "caregiver_id"),
        ("caregiver_audit_log",  "target_member_id"),
        ("chatbot_messages",     None),          # no user_id col — purge via thread
        ("chatbot_threads",      "user_id"),
        ("dose_logs",            None),          # no user_id col — purge via course
        ("medication_courses",   "user_id"),
        ("misuse_events",        None),          # no user_id col — purge via course_id
        ("prescriptions",        "user_id"),
        ("symptom_journal",      "user_id"),
        ("user_badges",          "user_id"),
        ("family_members",       None),          # purge via group_id
        ("family_groups",        "owner_id"),
        ("cabinet_inventory",    None),          # purge via group_id
    ]

    # First, get course IDs belonging to demo users (for tables that reference course_id)
    cur.execute(f"SELECT id FROM public.medication_courses WHERE user_id IN ({id_list})")
    course_ids = [str(r[0]) for r in cur.fetchall()]
    course_id_list = ", ".join(f"'{i}'" for i in course_ids) if course_ids else "''"

    # Get family group IDs owned by demo users
    cur.execute(f"SELECT id FROM public.family_groups WHERE owner_id IN ({id_list})")
    group_ids = [str(r[0]) for r in cur.fetchall()]
    group_id_list = ", ".join(f"'{i}'" for i in group_ids) if group_ids else "''"

    def safe_delete(label, sql, *params):
        # Savepoint names must be valid SQL identifiers (no dots/spaces)
        import re as _re
        sp = "sp_" + _re.sub(r"[^a-zA-Z0-9_]", "_", label)[:40]
        try:
            cur.execute(f"SAVEPOINT {sp}")
            cur.execute(sql, params if params else None)
            log.info("  Cleaned %s: %d rows", label, cur.rowcount)
            cur.execute(f"RELEASE SAVEPOINT {sp}")
        except Exception as e:
            cur.execute(f"ROLLBACK TO SAVEPOINT {sp}")
            log.warning("  Skipped %s: %s", label, str(e)[:80])

    # Chatbot messages (via thread)
    safe_delete("chatbot_messages via threads",
        f"DELETE FROM public.chatbot_messages WHERE thread_id IN "
        f"(SELECT id FROM public.chatbot_threads WHERE user_id IN ({id_list}))")

    safe_delete("chatbot_threads",
        f"DELETE FROM public.chatbot_threads WHERE user_id IN ({id_list})")

    # Dose logs via course
    if course_ids:
        safe_delete("dose_logs",
            f"DELETE FROM public.dose_logs WHERE course_id IN ({course_id_list})")

    # Misuse events via course
    if course_ids:
        safe_delete("misuse_events",
            f"DELETE FROM public.misuse_events WHERE course_id IN ({course_id_list})")

    # Family members via group
    if group_ids:
        safe_delete("family_members",
            f"DELETE FROM public.family_members WHERE group_id IN ({group_id_list})")

    # Cabinet inventory via group
    if group_ids:
        safe_delete("cabinet_inventory",
            f"DELETE FROM public.cabinet_inventory WHERE group_id IN ({group_id_list})")

    # Other direct user_id tables
    for table, col in [
        ("medication_courses",  "user_id"),
        ("prescriptions",       "user_id"),
        ("symptom_journal",     "user_id"),
        ("user_badges",         "user_id"),
        ("ai_consultations",    "user_id"),
        ("api_usage_logs",      "user_id"),
        ("caregiver_audit_log", "caregiver_id"),
        ("admin_audit_log",     "admin_id"),
        ("admin_audit_log",     "target_user_id"),
        ("family_groups",       "owner_id"),
    ]:
        safe_delete(f"{table}.{col}",
            f"DELETE FROM public.{table} WHERE {col} IN ({id_list})")

    # Clean profiles
    cur.execute(f"DELETE FROM public.profiles WHERE id IN ({id_list})")
    log.info("  Deleted %d profiles", cur.rowcount)

    # Delete from auth.users (must be last)
    cur.execute(f"DELETE FROM auth.users WHERE id IN ({id_list})")
    log.info("  Deleted %d auth.users rows", cur.rowcount)

    return old_ids


# ── Create new auth.users rows ───────────────────────────────────────────────

def create_auth_user(cur, user: dict, encrypted_password: str):
    """Insert a new row into auth.users."""
    now = datetime.now(timezone.utc).isoformat()
    user_id = user["id"]

    cur.execute(
        """
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password,
            email_confirmed_at, created_at, updated_at,
            raw_app_meta_data, raw_user_meta_data,
            is_sso_user, is_anonymous, confirmation_token
        ) VALUES (
            %s, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            %s, %s, %s, %s, %s,
            %s, %s,
            false, false, ''
        )
        """,
        (
            user_id,
            user["email"],
            encrypted_password,
            now,  # email_confirmed_at — pre-confirmed for demo
            now,  # created_at
            now,  # updated_at
            json.dumps({"provider": "email", "providers": ["email"]}),
            json.dumps({
                "sub": user_id,
                "email": user["email"],
                "full_name": user["full_name"],
                "email_verified": True,
            }),
        ),
    )
    log.info("  Created auth.user: %s (%s)", user["email"], user_id)


# ── Create new profiles rows ─────────────────────────────────────────────────

def create_profile(cur, user: dict):
    """Insert profile row."""
    cur.execute(
        """
        INSERT INTO public.profiles (
            id, full_name, age, weight_kg, height_cm,
            known_conditions, allergies, preferred_language,
            is_admin, account_type, region, caregiver_consent_revoked, created_at
        ) VALUES (
            %s, %s, %s, %s, %s,
            %s, %s, 'en',
            %s, %s, %s, false, NOW()
        )
        """,
        (
            user["id"],
            user["full_name"],
            user.get("age"),
            user.get("weight_kg"),
            user.get("height_cm"),
            user.get("known_conditions", []),
            user.get("allergies", []),
            user["is_admin"],
            user["account_type"],
            user["region"],
        ),
    )
    log.info("  Created profile: %s", user["full_name"])


# ── Seed demo data ────────────────────────────────────────────────────────────

def seed_demo_data(cur, users: dict):
    """Seed medications, family groups, symptom journal, etc. for demo."""
    elena = users["elena"]
    carlos = users["carlos"]
    rosa = users["rosa"]
    sofia = users["sofia"]

    now = datetime.now(timezone.utc)
    today = now.date()

    # 1. Family group (The Ramirez Family)
    # Schema: id, name, owner_id, invite_code, created_at
    family_id = str(uuid.uuid4())
    log.info("Creating family group…")
    try:
        invite_code = base64.urlsafe_b64encode(os.urandom(6)).decode().rstrip("=")
        cur.execute(
            """
            INSERT INTO public.family_groups (id, name, owner_id, invite_code, created_at)
            VALUES (%s, %s, %s, %s, NOW())
            """,
            (family_id, "The Ramirez Family", elena["id"], invite_code),
        )
        # family_members schema: id, group_id, member_id, role, is_linked_dependent, joined_at
        for member_key, role, is_dep in [("carlos", "caregiver", False), ("rosa", "dependent", True), ("sofia", "viewer", False)]:
            m = users[member_key]
            cur.execute(
                """
                INSERT INTO public.family_members (id, group_id, member_id, role, is_linked_dependent, joined_at)
                VALUES (%s, %s, %s, %s, %s, NOW())
                """,
                (str(uuid.uuid4()), family_id, m["id"], role, is_dep),
            )
        log.info("  Family group created with 3 members")
    except Exception as e:
        log.warning("  family_groups seed skipped: %s", e)

    # 2. Medication courses for Elena
    # Schema: id, user_id, drug_id, prescription_id, total_pills, daily_dose, start_date,
    #         days_remaining, is_antibiotic, necessity_flag, status, created_at, expiry_date,
    #         batch_number, refill_date, dosage_amount, frequency, instructions, custom_name
    log.info("Creating medication courses for Elena…")
    medications_elena = [
        {
            "custom_name": "Metformin 500mg",
            "dosage_amount": "500mg",
            "frequency": "Twice daily",
            "instructions": "Take with meals. For Type 2 Diabetes management.",
            "start_date": (today - timedelta(days=90)).isoformat(),
            "total_pills": 180,
            "daily_dose": 2,
            "days_remaining": 4,  # Low stock — triggers alert in demo
            "is_antibiotic": False,
            "status": "active",
        },
        {
            "custom_name": "Amlodipine 5mg",
            "dosage_amount": "5mg",
            "frequency": "Once daily",
            "instructions": "For Hypertension. Take in the morning.",
            "start_date": (today - timedelta(days=60)).isoformat(),
            "total_pills": 60,
            "daily_dose": 1,
            "days_remaining": 18,
            "is_antibiotic": False,
            "status": "active",
        },
        {
            "custom_name": "Amoxicillin 500mg",
            "dosage_amount": "500mg",
            "frequency": "Three times daily",
            "instructions": "Complete the full course. Antibiotic for throat infection.",
            "start_date": (today - timedelta(days=5)).isoformat(),
            "expiry_date": (today + timedelta(days=5)).isoformat(),
            "total_pills": 21,
            "daily_dose": 3,
            "days_remaining": 3,  # Near empty — low stock nudge
            "is_antibiotic": True,
            "status": "active",
        },
    ]

    elena_course_ids = []
    for med in medications_elena:
        course_id = str(uuid.uuid4())
        elena_course_ids.append(course_id)
        try:
            cur.execute(
                """
                INSERT INTO public.medication_courses (
                    id, user_id, custom_name, dosage_amount, frequency, instructions,
                    start_date, total_pills, daily_dose, days_remaining, is_antibiotic,
                    status, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                """,
                (
                    course_id,
                    elena["id"],
                    med["custom_name"],
                    med["dosage_amount"],
                    med["frequency"],
                    med["instructions"],
                    med["start_date"],
                    med["total_pills"],
                    med["daily_dose"],
                    med["days_remaining"],
                    med["is_antibiotic"],
                    med["status"],
                ),
            )
        except Exception as e:
            log.warning("  medication_courses elena skipped: %s", e)

    log.info("  Created %d medication courses for Elena", len(elena_course_ids))

    # 3. Dose logs for Elena — 7 day streak (78% adherence)
    # Schema: id, course_id, scheduled_time, status, confirmed_by, logged_at
    log.info("Seeding dose logs for Elena (7-day streak, 78% adherence)…")

    for course_id in elena_course_ids[:2]:  # Only for ongoing meds
        for day_offset in range(14, 0, -1):
            dose_date = today - timedelta(days=day_offset)
            # Days 1-7 and 12-14 are taken (gives ~78% adherence)
            status = "taken" if day_offset <= 7 or day_offset >= 12 else "missed"
            sched_time = datetime.combine(dose_date, datetime.min.time()).replace(
                tzinfo=timezone.utc) + timedelta(hours=8)
            try:
                cur.execute(
                    """
                    INSERT INTO public.dose_logs (id, course_id, scheduled_time, status, logged_at)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (
                        str(uuid.uuid4()),
                        course_id,
                        sched_time.isoformat(),
                        status,
                        sched_time.isoformat() if status == "taken" else None,
                    ),
                )
            except Exception as e:
                log.warning("  dose_logs skipped: %s", e)

    # 4. Medication courses for Rosa (managed by Carlos)
    log.info("Creating medication courses for Abuela Rosa…")
    medications_rosa = [
        {
            "custom_name": "Alendronate 70mg",
            "dosage_amount": "70mg",
            "frequency": "Once weekly",
            "instructions": "For Osteoporosis. Take on empty stomach with full glass of water.",
            "start_date": (today - timedelta(days=120)).isoformat(),
            "total_pills": 24,
            "daily_dose": 1,
            "days_remaining": 8,
            "is_antibiotic": False,
            "status": "active",
        },
        {
            "custom_name": "Paracetamol 500mg Syrup",
            "dosage_amount": "500mg/10ml",
            "frequency": "As needed",
            "instructions": "Shared cabinet item. Near-expiry warning demo.",
            "start_date": (today - timedelta(days=30)).isoformat(),
            "expiry_date": (today + timedelta(days=30)).isoformat(),  # Near expiry
            "total_pills": 10,
            "daily_dose": 1,
            "days_remaining": 2,
            "is_antibiotic": False,
            "status": "active",
        },
    ]
    for med in medications_rosa:
        try:
            cur.execute(
                """
                INSERT INTO public.medication_courses (
                    id, user_id, custom_name, dosage_amount, frequency, instructions,
                    start_date, total_pills, daily_dose, days_remaining, is_antibiotic,
                    status, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                """,
                (
                    str(uuid.uuid4()),
                    rosa["id"],
                    med["custom_name"],
                    med["dosage_amount"],
                    med["frequency"],
                    med["instructions"],
                    med["start_date"],
                    med["total_pills"],
                    med["daily_dose"],
                    med["days_remaining"],
                    med["is_antibiotic"],
                    med["status"],
                ),
            )
        except Exception as e:
            log.warning("  medication_courses rosa skipped: %s", e)

    log.info("  Created medication courses for Rosa")

    # 5. Symptom journal for Elena — Severe Rash entry
    # Schema: id, user_id, symptom, severity, status, linked_course_id, created_at,
    #         duration_onset, category_location, image_url
    log.info("Creating symptom journal entry for Elena…")
    for symptom_text, sev in [
        ("Skin Rash on arms after Amoxicillin — possible allergic reaction. Will consult doctor.", "severe"),
        ("Mild headache, morning", "mild"),
    ]:
        try:
            cur.execute(
                """
                INSERT INTO public.symptom_journal (
                    id, user_id, symptom, severity, status, created_at
                ) VALUES (%s, %s, %s, %s, %s, NOW())
                """,
                (str(uuid.uuid4()), elena["id"], symptom_text, sev, "active"),
            )
        except Exception as e:
            log.warning("  symptom_journal skipped: %s", e)
    log.info("  Created symptom journal entries for Elena")

    # 6. AI consultation history for Elena
    # Schema: chatbot_threads(id, user_id, title, created_at)
    #         chatbot_messages(id, thread_id, role, content, provider_used, created_at)
    log.info("Creating AI consultation history…")
    try:
        thread_id = str(uuid.uuid4())
        cur.execute(
            """
            INSERT INTO public.chatbot_threads (id, user_id, title, created_at)
            VALUES (%s, %s, %s, NOW())
            """,
            (thread_id, elena["id"], "Amoxicillin Rash — Is it safe to continue?"),
        )
        for msg_role, msg_content in [
            ("user", "I developed a rash after taking Amoxicillin 500mg. Is this dangerous? Should I stop?"),
            ("assistant", "A rash after starting Amoxicillin can indicate an allergic reaction. Given that you have a recorded Penicillin allergy in your profile, this is a significant concern — Amoxicillin is a penicillin-type antibiotic. I strongly recommend stopping the medication and consulting your doctor immediately. Do not take another dose until you have medical clearance. If you develop difficulty breathing, facial swelling, or throat tightening, seek emergency care right away."),
        ]:
            cur.execute(
                """
                INSERT INTO public.chatbot_messages (id, thread_id, role, content, provider_used, created_at)
                VALUES (%s, %s, %s, %s, %s, NOW())
                """,
                (str(uuid.uuid4()), thread_id, msg_role, msg_content, "gemini"),
            )
        log.info("  Created chatbot thread and messages")
    except Exception as e:
        log.warning("  chatbot seed skipped: %s", e)

    # 7. Misuse event (for Admin AMR heatmap)
    # Schema: id, region, drug_category, event_type, created_at, course_id
    log.info("Creating misuse event for AMR heatmap…")
    try:
        # Use the Amoxicillin course id (last in elena_course_ids)
        amox_course_id = elena_course_ids[-1] if elena_course_ids else None
        cur.execute(
            """
            INSERT INTO public.misuse_events (
                id, region, drug_category, event_type, created_at, course_id
            ) VALUES (%s, %s, %s, %s, NOW(), %s)
            """,
            (
                str(uuid.uuid4()),
                "California",
                "Antibiotic",
                "incomplete_course",
                amox_course_id,
            ),
        )
        log.info("  Created misuse event")
    except Exception as e:
        log.warning("  misuse_events skipped: %s", e)

    # 8. User badge for Elena (7-day streak)
    # Schema: id, user_id, badge_type, unlocked_at, metadata
    log.info("Creating badge for Elena…")
    try:
        cur.execute(
            """
            INSERT INTO public.user_badges (id, user_id, badge_type, unlocked_at, metadata)
            VALUES (%s, %s, %s, NOW(), %s)
            """,
            (
                str(uuid.uuid4()),
                elena["id"],
                "streak_7",
                json.dumps({"streak_days": 7, "description": "7-Day Adherence Streak"}),
            ),
        )
        log.info("  Created 7-day streak badge for Elena")
    except Exception as e:
        log.warning("  user_badges skipped: %s", e)

    log.info("Demo data seeding complete.")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    log.info("Connecting to Supabase Postgres…")
    try:
        conn = psycopg2.connect(SUPABASE_DB_URL)
        conn.autocommit = False
    except Exception as e:
        log.error("Connection failed: %s", e)
        sys.exit(1)

    cur = conn.cursor()

    # Pre-generate encrypted password
    log.info("Hashing password with bcrypt…")
    encrypted_pw = make_encrypted_password(NEW_PASSWORD)
    if encrypted_pw is None:
        # Fallback: we'll use SQL crypt() — requires pgcrypto extension
        log.info("Using pg crypt() fallback for password hashing")

    try:
        # Step 1: Delete old accounts
        log.info("=" * 60)
        log.info("STEP 1: Deleting old demo accounts…")
        log.info("=" * 60)
        delete_old_accounts(cur)
        conn.commit()
        log.info("Old accounts deleted and committed.")

        # Step 2: Create new auth users
        log.info("=" * 60)
        log.info("STEP 2: Creating new auth users…")
        log.info("=" * 60)

        for key, user in NEW_USERS.items():
            if encrypted_pw:
                create_auth_user(cur, user, encrypted_pw)
            else:
                # Use pg crypt() for bcrypt
                now_ts = datetime.now(timezone.utc).isoformat()
                cur.execute(
                    """
                    INSERT INTO auth.users (
                        id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data,
                        is_sso_user, is_anonymous, confirmation_token
                    ) VALUES (
                        %s, '00000000-0000-0000-0000-000000000000',
                        'authenticated', 'authenticated',
                        %s, crypt(%s, gen_salt('bf', 10)),
                        %s, %s, %s,
                        %s, %s,
                        false, false, ''
                    )
                    """,
                    (
                        user["id"],
                        user["email"],
                        NEW_PASSWORD,
                        now_ts,
                        now_ts,
                        now_ts,
                        json.dumps({"provider": "email", "providers": ["email"]}),
                        json.dumps({
                            "sub": user["id"],
                            "email": user["email"],
                            "full_name": user["full_name"],
                            "email_verified": True,
                        }),
                    ),
                )
                log.info("  Created auth.user (via crypt): %s", user["email"])

        conn.commit()
        log.info("Auth users created and committed.")

        # Step 3: Create profiles
        log.info("=" * 60)
        log.info("STEP 3: Creating user profiles…")
        log.info("=" * 60)
        for key, user in NEW_USERS.items():
            create_profile(cur, user)
        conn.commit()
        log.info("Profiles created and committed.")

        # Step 4: Seed demo data
        log.info("=" * 60)
        log.info("STEP 4: Seeding demo data…")
        log.info("=" * 60)
        seed_demo_data(cur, NEW_USERS)
        conn.commit()
        log.info("Demo data seeded and committed.")

    except Exception as e:
        conn.rollback()
        log.error("FAILED — rolled back: %s", e)
        import traceback
        traceback.print_exc()
        cur.close()
        conn.close()
        sys.exit(1)

    cur.close()
    conn.close()

    # ── Summary ────────────────────────────────────────────────────────────────
    print("\n" + "=" * 62)
    print("  MedSentry — Demo Accounts Recreated Successfully!")
    print("=" * 62)
    print(f"\n  🔑  Common Password : {NEW_PASSWORD}")
    print()
    print("  👤  Demo Accounts:")
    for key, u in NEW_USERS.items():
        role = "Admin" if u["is_admin"] else u["account_type"].replace("_", " ").title()
        print(f"      {u['email']:<20}  {u['full_name']:<22}  [{role}]")
    print()
    print("  📌  Presentation Flow:")
    print("      1. Login as elena@demo.ms → Home Dashboard (78% adherence,")
    print("         7-day streak, low-stock alert), Meds, Symptom Journal, AI Chat")
    print("      2. Login as carlos@demo.ms → Family Circle, Rosa's meds,")
    print("         Shared Cabinet (Paracetamol near-expiry)")
    print("      3. Login as admin@demo.ms → Admin Console, Audit Logs,")
    print("         AMR Misuse Heatmap (California)")
    print("=" * 62 + "\n")


if __name__ == "__main__":
    main()
