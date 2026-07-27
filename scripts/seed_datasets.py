#!/usr/bin/env python3
"""
MedSentry — Phase 2 Dataset Seeder
===================================
Seeds the Supabase `drugs` and `drug_interactions` tables from the 8 datasets
in datasets/. Requires SUPABASE_DB_URL to be set in scripts/.env (or as an
environment variable) — this is the direct Postgres connection string from
Supabase → Settings → Database → Connection String (URI mode, NOT the anon key).

Usage
-----
1. Set SUPABASE_DB_URL in scripts/.env:
   SUPABASE_DB_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres

2. Run from the project root:
   python3 scripts/seed_datasets.py

Severity Heuristic (per agreed design decision)
-------------------------------------------------
For drug_interactions.severity (from db_drug_interactions.csv "Interaction Description"):
  - Scan description for keywords (case-insensitive):
      severe/serious/dangerous/life-threatening/fatal/contraindicated → 'severe'
      moderate/significant/caution/monitor/reduce  → 'moderate'
      mild/minor/minimal/slight/weak               → 'mild'
  - If no match: severity = NULL, severity_source = 'unclassified'
  - If match:    severity_source = 'parsed'
  - unclassified rows become the Phase 3 AI re-classification worklist

Tables seeded
-------------
- drugs              (from pharma_az_db + antibiotics_list + AWaRe xlsx)
- drug_interactions  (from db_drug_interactions.csv — ~191,541 interaction pairs)

Tables NOT seeded here (Phase 2 CRUD / Phase 3 AI / Phase 4 Family):
- prescriptions, medication_courses, dose_logs, misuse_events,
  ai_consultations, chatbot_*, api_usage_logs, admin_audit_log,
  cabinet_inventory, symptom_journal, family_*, profiles
"""

import csv
import os
import re
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

import psycopg2
from psycopg2.extras import execute_values
import openpyxl

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("seed")

SCRIPTS_DIR = Path(__file__).parent
DATASETS_DIR = SCRIPTS_DIR.parent / "datasets"
ENV_FILE = SCRIPTS_DIR / ".env"

load_dotenv(ENV_FILE)

SUPABASE_DB_URL = os.environ.get("SUPABASE_DB_URL")
if not SUPABASE_DB_URL:
    log.error(
        "SUPABASE_DB_URL not set.\n"
        "Add it to scripts/.env:\n"
        "  SUPABASE_DB_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres\n"
        "Get it from: Supabase dashboard → Settings → Database → Connection String (URI)\n"
        "Use the 'Transaction' or 'Session' pooler URI — do NOT paste the anon key here."
    )
    sys.exit(1)

# ---------------------------------------------------------------------------
# Severity heuristic (plan.md §5 / agreed design decision)
# ---------------------------------------------------------------------------

SEVERE_RE = re.compile(
    r"\b(severe|serious|dangerous|life.threatening|fatal|lethal|contraindicated|avoid|death)\b",
    re.IGNORECASE,
)
MODERATE_RE = re.compile(
    r"\b(moderate|significant|caution|monitor|adjust|reduce|decrease|increase|interact)\b",
    re.IGNORECASE,
)
MILD_RE = re.compile(
    r"\b(mild|minor|minimal|slight|weak|small|low risk)\b",
    re.IGNORECASE,
)


def classify_severity(description: str) -> tuple:
    """
    Returns (severity, severity_source).
    severity_source is 'parsed' if a keyword was found, 'unclassified' otherwise.
    severity is NULL (None in Python) when unclassified.
    """
    if not description or not description.strip():
        return None, "unclassified"
    if SEVERE_RE.search(description):
        return "severe", "parsed"
    if MODERATE_RE.search(description):
        return "moderate", "parsed"
    if MILD_RE.search(description):
        return "mild", "parsed"
    return None, "unclassified"


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def clean_text(v):
    if v is None:
        return None
    s = str(v).strip()
    return s if s else None


def safe_csv_open(path):
    """Open CSV with utf-8, fall back to latin-1 if needed."""
    try:
        f = open(path, "r", encoding="utf-8", newline="")
        f.read(512)  # probe
        f.seek(0)
        return f
    except UnicodeDecodeError:
        return open(path, "r", encoding="latin-1", newline="")


# ---------------------------------------------------------------------------
# AWaRe classification lookup  (sheet-name → tier)
# ---------------------------------------------------------------------------

def load_aware_lookup():
    """
    Parse B09489-eng.xlsx from the 'Access', 'Watch', 'Reserve', and
    'Not recommended' sheets.  Returns {normalized_name: tier}.
    """
    xlsx_path = DATASETS_DIR / "aware_classification" / "B09489-eng.xlsx"
    if not xlsx_path.exists():
        log.warning("AWaRe xlsx not found at %s — skipping AWaRe classification", xlsx_path)
        return {}

    tiers = {
        "Access": "Access",
        "Watch": "Watch",
        "Reserve": "Reserve",
        "Not recommended": "Not recommended",
    }
    lookup = {}

    wb = openpyxl.load_workbook(str(xlsx_path), read_only=True)
    for sheet_name, tier_label in tiers.items():
        if sheet_name not in wb.sheetnames:
            continue
        ws = wb[sheet_name]
        header_found = False
        for row in ws.iter_rows(values_only=True):
            if not header_found:
                if row and row[0] == "Antibiotic":
                    header_found = True
                continue
            antibiotic = clean_text(row[0]) if row else None
            if antibiotic:
                lookup[antibiotic.lower()] = tier_label
    wb.close()
    log.info("AWaRe lookup loaded: %d antibiotics", len(lookup))
    return lookup


# ---------------------------------------------------------------------------
# Load drugs from pharma_az_db  (primary source)
# ---------------------------------------------------------------------------

def load_pharma_drugs(aware_lookup):
    path = DATASETS_DIR / "pharma_az_db" / "Drug finder db w_o brands - deepseek_csv_20250915_dff2b8.csv"
    if not path.exists():
        log.warning("pharma_az_db not found at %s", path)
        return []

    drugs = []
    with safe_csv_open(path) as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = clean_text(row.get("Generic Name"))
            if not name:
                continue
            aware_class = aware_lookup.get(name.lower())
            drugs.append({
                "name": name,
                "generic_name": name,
                "category": clean_text(row.get("Drug Class")),
                "aware_class": aware_class,
                "common_uses": clean_text(row.get("Indications")),
                "side_effects": clean_text(row.get("Side Effects")),
                "interaction_notes": clean_text(row.get("Interaction warnings & Precautions")),
            })

    log.info("pharma_az_db: %d drug records loaded", len(drugs))
    return drugs


# ---------------------------------------------------------------------------
# Load additional antibiotics from antibiotics_list.csv (supplement)
# ---------------------------------------------------------------------------

def load_antibiotic_list(aware_lookup):
    path = DATASETS_DIR / "antibiotic_overview" / "antibiotics_list.csv"
    if not path.exists():
        log.warning("antibiotics_list.csv not found at %s", path)
        return []

    drugs = []
    with safe_csv_open(path) as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = clean_text(row.get("Name") or row.get("name"))
            if not name:
                continue
            aware_class = aware_lookup.get(name.lower())
            drugs.append({
                "name": name,
                "generic_name": name,
                "category": clean_text(row.get("Family") or row.get("family")),
                "aware_class": aware_class,
                "common_uses": clean_text(row.get("Usage") or row.get("usage")),
                "side_effects": None,
                "interaction_notes": None,
            })

    log.info("antibiotics_list.csv: %d antibiotic records loaded", len(drugs))
    return drugs


# ---------------------------------------------------------------------------
# Seed drugs table
# ---------------------------------------------------------------------------

def seed_drugs(cursor, aware_lookup):
    """
    Inserts drugs (de-duplicated by lowercase name) and returns
    {normalized_name: uuid} mapping for interaction seeding.
    """
    pharma = load_pharma_drugs(aware_lookup)
    abx = load_antibiotic_list(aware_lookup)

    # Merge, deduplicate by normalized name (pharma DB takes precedence)
    seen = {}
    for d in pharma + abx:
        key = (d["name"] or "").strip().lower()
        if key and key not in seen:
            seen[key] = d

    if not seen:
        log.warning("No drug records to insert")
        return {}

    rows = list(seen.values())
    log.info("Inserting %d unique drugs…", len(rows))

    # Insert in batches of 500
    batch_size = 500
    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        execute_values(
            cursor,
            """
            INSERT INTO drugs (name, generic_name, category, aware_class, common_uses, side_effects, interaction_notes)
            VALUES %s
            ON CONFLICT DO NOTHING
            """,
            [
                (
                    d["name"],
                    d["generic_name"],
                    d["category"],
                    d["aware_class"],
                    d["common_uses"],
                    d["side_effects"],
                    d["interaction_notes"],
                )
                for d in batch
            ],
            page_size=200,
        )

    # Build name→uuid lookup from DB (after insert so we have IDs)
    cursor.execute("SELECT id, lower(name) AS lname FROM drugs WHERE name IS NOT NULL")
    name_to_id = {row[1]: row[0] for row in cursor.fetchall()}
    log.info("drugs table: %d unique keys returned from DB", len(name_to_id))
    return name_to_id


# ---------------------------------------------------------------------------
# Seed drug_interactions
# ---------------------------------------------------------------------------

def seed_drug_interactions(cursor, name_to_id):
    """
    Seeds drug_interactions from db_drug_interactions.csv.
    Applies severity heuristic. Returns classification stats dict.
    """
    path = DATASETS_DIR / "drug_drug_interactions" / "db_drug_interactions.csv"
    if not path.exists():
        log.warning("db_drug_interactions.csv not found at %s", path)
        return {}

    counts = {"inserted": 0, "skipped_both_unknown": 0, "parsed": 0, "unclassified": 0}
    batch = []
    batch_size = 2000

    def flush():
        if not batch:
            return
        execute_values(
            cursor,
            """
            INSERT INTO drug_interactions (drug_a_id, drug_b_id, severity, severity_source, description)
            VALUES %s
            ON CONFLICT DO NOTHING
            """,
            batch,
            page_size=500,
        )
        batch.clear()

    log.info("Reading db_drug_interactions.csv (~191k rows)…")
    with safe_csv_open(path) as f:
        reader = csv.DictReader(f)
        for row in reader:
            drug_a_name = clean_text(row.get("Drug 1"))
            drug_b_name = clean_text(row.get("Drug 2"))
            description = clean_text(row.get("Interaction Description"))

            drug_a_id = name_to_id.get((drug_a_name or "").lower())
            drug_b_id = name_to_id.get((drug_b_name or "").lower())

            # Skip pairs where BOTH drugs are unknown — can't form FK references
            if not drug_a_id and not drug_b_id:
                counts["skipped_both_unknown"] += 1
                continue

            severity, severity_source = classify_severity(description or "")
            counts[severity_source] += 1
            counts["inserted"] += 1

            batch.append((drug_a_id, drug_b_id, severity, severity_source, description))

            if len(batch) >= batch_size:
                flush()
                if counts["inserted"] % 20000 == 0:
                    log.info("  …%d interactions processed so far", counts["inserted"])

    flush()
    return counts


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    log.info("Connecting to Supabase Postgres…")
    try:
        conn = psycopg2.connect(SUPABASE_DB_URL)
        conn.autocommit = False
    except Exception as e:
        log.error("Connection failed: %s", e)
        sys.exit(1)

    cur = conn.cursor()

    try:
        # Step 1 — AWaRe lookup
        log.info("Step 1/3: Loading AWaRe classification lookup…")
        aware_lookup = load_aware_lookup()

        # Step 2 — Seed drugs
        log.info("Step 2/3: Seeding drugs table…")
        name_to_id = seed_drugs(cur, aware_lookup)
        conn.commit()
        log.info("drugs committed.")

        # Step 3 — Seed drug_interactions
        log.info("Step 3/3: Seeding drug_interactions table…")
        stats = seed_drug_interactions(cur, name_to_id)
        conn.commit()
        log.info("drug_interactions committed.")

        # Final report
        cur.execute("SELECT COUNT(*) FROM drugs")
        drugs_total = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM drug_interactions")
        interactions_total = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM drug_interactions WHERE severity_source = 'parsed'")
        parsed_count = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM drug_interactions WHERE severity_source = 'unclassified'")
        unclassified_count = cur.fetchone()[0]

        cur.execute(
            "SELECT severity, COUNT(*) FROM drug_interactions GROUP BY severity ORDER BY severity NULLS LAST"
        )
        severity_breakdown = cur.fetchall()

        print("\n" + "=" * 62)
        print("  MedSentry Phase 2 — Seed Complete")
        print("=" * 62)
        print(f"  drugs                    : {drugs_total:>10,} rows")
        print(f"  drug_interactions        : {interactions_total:>10,} rows")
        print(f"    severity_source=parsed : {parsed_count:>10,}")
        print(f"    severity_source=unclassified")
        print(f"    (Phase 3 AI worklist)  : {unclassified_count:>10,}")
        print(f"\n  Severity breakdown:")
        for sev, cnt in severity_breakdown:
            label = str(sev) if sev else "NULL (unclassified)"
            print(f"    {label:<25}: {cnt:>10,}")
        print(f"\n  Skipped (both drugs unknown): {stats.get('skipped_both_unknown', 0):>10,}")
        print("=" * 62 + "\n")

    except Exception as e:
        conn.rollback()
        log.error("Seed failed, transaction rolled back: %s", e)
        cur.close()
        conn.close()
        raise

    cur.close()
    conn.close()
    log.info("Seed script complete.")


if __name__ == "__main__":
    main()
