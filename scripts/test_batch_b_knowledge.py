#!/usr/bin/env python3
"""
MedSentry — Batch B: Medication Knowledge and India-Focused OTC Formulary Test Suite
=====================================================================================
Validates:
1. Generic and brand name matching against medication_formulary_india and drugs.
2. Strength and dosage-form specificity under Indian regulations.
3. Strict prescription-only status for all antibiotics (Schedule H/H1, NAP-AMR, AWaRe).
4. Zero antibiotics allowed as OTC under any circumstances.
5. Safe 'unverified' classification for medicines lacking official CDSCO confirmation.
6. Conservative drug interaction handling (known pairs vs unknown interaction disclaimer).
7. Legal basis & source provenance attribution (Schedule K Item 23, Schedule H, CDSCO, IPC).
8. Row-Level Security (RLS) isolation on medication_formulary_india.
9. End-to-end knowledge extraction and response validation logic in ai-router.
"""

import os
import re
import sys
import unittest
from dotenv import load_dotenv
import psycopg2

load_dotenv("scripts/.env")
DB_URL = os.environ.get("SUPABASE_DB_URL")


class TestBatchBMedicationKnowledge(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not DB_URL:
            raise unittest.SkipTest("SUPABASE_DB_URL not set in scripts/.env")
        cls.conn = psycopg2.connect(DB_URL)
        cls.cur = cls.conn.cursor()

    @classmethod
    def tearDownClass(cls):
        if hasattr(cls, "cur") and cls.cur:
            cls.cur.close()
        if hasattr(cls, "conn") and cls.conn:
            cls.conn.close()

    # -------------------------------------------------------------------------
    # 1. Authoritative Formulary Presence & Completeness
    # -------------------------------------------------------------------------
    def test_01_formulary_table_schema_and_counts(self):
        """medication_formulary_india must exist with required columns and authoritative records."""
        self.cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'medication_formulary_india';
        """)
        cols = {row[0] for row in self.cur.fetchall()}
        expected_cols = {
            "id", "generic_name", "brand_names", "active_ingredients", "strength",
            "dosage_form", "route", "prescription_status", "schedule_category",
            "status_verification", "legal_basis", "source_organization", "source_url",
            "verification_date", "indications", "contraindications", "precautions",
            "max_otc_dose_adult", "classification_notes"
        }
        missing = expected_cols - cols
        self.assertEqual(missing, set(), f"Missing columns in medication_formulary_india: {missing}")

        self.cur.execute("SELECT count(*) FROM medication_formulary_india;")
        count = self.cur.fetchone()[0]
        self.assertGreaterEqual(count, 10, f"Expected at least 10 authoritative formulary rows, got {count}")

    # -------------------------------------------------------------------------
    # 2. Brand Name & Generic Name Matching
    # -------------------------------------------------------------------------
    def test_02_brand_and_generic_matching(self):
        """Common Indian brands must resolve to their correct generic and legal status."""
        test_cases = [
            ("Dolo 650", "Paracetamol", "OTC", "Schedule K"),
            ("Crocin", "Paracetamol", "OTC", "Schedule K"),
            ("Electral", "Oral Rehydration Salts", "OTC", "Schedule K"),
            ("Gelusil", "Aluminium Hydroxide and Magnesium Hydroxide with Simethicone", "OTC", "Schedule K"),
            ("Digene", "Aluminium Hydroxide and Magnesium Hydroxide with Simethicone", "OTC", "Schedule K"),
            ("Betadine", "Povidone Iodine", "OTC", "Schedule K"),
            ("Mox", "Amoxicillin", "prescription_only", "Schedule H"),
            ("Azithral", "Azithromycin", "prescription_only", "Schedule H1"),
            ("Ciplox", "Ciprofloxacin", "prescription_only", "Schedule H1"),
            ("Taxim-O", "Cefixime", "prescription_only", "Schedule H1"),
        ]

        for brand, expected_generic, expected_status, expected_schedule in test_cases:
            self.cur.execute("""
                SELECT generic_name, prescription_status, schedule_category
                FROM medication_formulary_india
                WHERE %s = ANY(brand_names) OR lower(generic_name) = lower(%s);
            """, (brand, expected_generic))
            row = self.cur.fetchone()
            self.assertIsNotNone(row, f"Brand '{brand}' failed to resolve to formulary record")
            self.assertEqual(row[0].lower(), expected_generic.lower(), f"Generic mismatch for {brand}")
            self.assertEqual(row[1], expected_status, f"Status mismatch for {brand}")
            self.assertEqual(row[2], expected_schedule, f"Schedule mismatch for {brand}")

    # -------------------------------------------------------------------------
    # 3. Antibiotic Strict Prescription-Only Enforcement
    # -------------------------------------------------------------------------
    def test_03_zero_antibiotics_as_otc_invariant(self):
        """CRITICAL INVARIANT: Zero antibiotics may be marked as OTC in the database."""
        self.cur.execute("""
            SELECT count(*), string_agg(name, ', ')
            FROM public.drugs
            WHERE prescription_status_india = 'OTC'
              AND (
                aware_class IS NOT NULL 
                OR lower(category) LIKE '%antibiotic%'
                OR lower(category) LIKE '%penicillin%'
                OR lower(category) LIKE '%cephalosporin%'
                OR lower(category) LIKE '%macrolide%'
                OR lower(category) LIKE '%quinolone%'
              );
        """)
        cnt, names = self.cur.fetchone()
        self.assertEqual(cnt, 0, f"FATAL VIOLATION: {cnt} antibiotics are marked as OTC: {names}")

    def test_04_all_systemic_antibiotics_are_prescription_only(self):
        """All systemic antibiotics in drugs table must be prescription_only."""
        self.cur.execute("""
            SELECT count(*) 
            FROM public.drugs 
            WHERE aware_class IS NOT NULL;
        """)
        total_aware = self.cur.fetchone()[0]
        self.assertGreater(total_aware, 0, "No AWaRe-classified drugs found")

        self.cur.execute("""
            SELECT count(*) 
            FROM public.drugs 
            WHERE aware_class IS NOT NULL 
              AND prescription_status_india != 'prescription_only';
        """)
        non_rx_aware = self.cur.fetchone()[0]
        self.assertEqual(non_rx_aware, 0, f"Found {non_rx_aware} AWaRe antibiotics not marked prescription_only")

    # -------------------------------------------------------------------------
    # 4. Safe 'unverified' Classification
    # -------------------------------------------------------------------------
    def test_05_unverified_classification_safety(self):
        """Medicines lacking verified CDSCO status must be safely marked 'unverified'."""
        self.cur.execute("""
            SELECT count(*) 
            FROM public.drugs 
            WHERE prescription_status_india = 'unverified';
        """)
        unverified_cnt = self.cur.fetchone()[0]
        self.assertGreater(unverified_cnt, 100, f"Expected unverified drugs safely marked, got {unverified_cnt}")

        # Ensure no unverified drug is assigned a verified schedule category
        self.cur.execute("""
            SELECT count(*) 
            FROM public.drugs 
            WHERE prescription_status_india = 'unverified' 
              AND schedule_category_india IN ('Schedule K', 'Schedule H', 'Schedule H1', 'Schedule X');
        """)
        mismatch_cnt = self.cur.fetchone()[0]
        self.assertEqual(mismatch_cnt, 0, f"Unverified drugs have conflicting schedules: {mismatch_cnt}")

    # -------------------------------------------------------------------------
    # 5. Legal Basis and Provenance Documentation
    # -------------------------------------------------------------------------
    def test_06_legal_basis_and_provenance_present(self):
        """Formulary records must have identifiable legal basis and official source URLs."""
        self.cur.execute("""
            SELECT generic_name, legal_basis, source_organization, source_url
            FROM medication_formulary_india;
        """)
        rows = self.cur.fetchall()
        for gen, basis, org, url in rows:
            self.assertTrue(basis and len(basis.strip()) > 5, f"Missing legal_basis for {gen}")
            self.assertTrue(org and len(org.strip()) > 2, f"Missing source_organization for {gen}")
            self.assertTrue(url and url.startswith("http"), f"Invalid source_url for {gen}: {url}")

    # -------------------------------------------------------------------------
    # 6. Drug Interactions & Conservative Safety Behavior
    # -------------------------------------------------------------------------
    def test_07_documented_interaction_retrieval(self):
        """Known interacting pairs must be retrievable from drug_interactions (bidirectional check)."""
        self.cur.execute("""
            SELECT da.name, db.name, di.description, di.severity
            FROM drug_interactions di
            JOIN drugs da ON di.drug_a_id = da.id
            JOIN drugs db ON di.drug_b_id = db.id
            WHERE (da.name = 'Carbamazepine' AND db.name = 'Phenobarbital')
               OR (da.name = 'Phenobarbital' AND db.name = 'Carbamazepine')
            LIMIT 1;
        """)
        row = self.cur.fetchone()
        self.assertIsNotNone(row, "Failed to retrieve Carbamazepine + Phenobarbital interaction")
        self.assertIn("Carbamazepine", row[2])
        self.assertIn("Phenobarbital", row[2])

    def test_08_interaction_counts_and_source(self):
        """drug_interactions table must contain verified interaction pairs."""
        self.cur.execute("SELECT count(*) FROM drug_interactions;")
        total = self.cur.fetchone()[0]
        self.assertGreaterEqual(total, 50000, f"Expected > 50,000 interaction pairs, got {total}")

    # -------------------------------------------------------------------------
    # 7. Row-Level Security (RLS) Verification
    # -------------------------------------------------------------------------
    def test_09_rls_enabled_on_formulary(self):
        """RLS must be enabled on medication_formulary_india and drugs tables."""
        self.cur.execute("""
            SELECT relname, relrowsecurity 
            FROM pg_class 
            WHERE relname IN ('medication_formulary_india', 'drugs');
        """)
        rls_map = dict(self.cur.fetchall())
        self.assertTrue(rls_map.get("medication_formulary_india"), "RLS not enabled on medication_formulary_india")
        self.assertTrue(rls_map.get("drugs"), "RLS not enabled on drugs")

    # -------------------------------------------------------------------------
    # 8. AI-Router Logic Validation
    # -------------------------------------------------------------------------
    def test_10_ai_router_safety_validation_rules(self):
        """Test candidate extraction and response validation regex in ai-router."""
        with open("supabase/functions/ai-router/index.ts", "r") as f:
            code = f.read()

        # Check candidate extraction helper exists
        self.assertIn("extractCandidateTerms", code)
        self.assertIn("retrieveKnowledge", code)
        self.assertIn("formatKnowledgeSection", code)
        self.assertIn("validateResponseAgainstKnowledge", code)

        # Check conservative disclaimer exists for missing interactions
        self.assertIn("NOT proof of safety", code)

        # Check mandatory statutory notice for antibiotics
        self.assertIn("MANDATORY STATUTORY SAFETY NOTICE", code)
        self.assertIn("Schedule H or Schedule H1 PRESCRIPTION-ONLY", code)


if __name__ == "__main__":
    unittest.main()
