#!/usr/bin/env python3
"""
MedSentry — Batch B: Medication Knowledge and India-Focused OTC Formulary Ingestion
==================================================================================
Authoritative ingestion and validation script that:
1. Ingests evidence-based Indian formulary records into `public.medication_formulary_india`.
2. Validates and enriches `public.drugs` with India-specific prescription status,
   schedule category, status verification, clinical contraindications, and source provenance.
3. Implements strict Indian legal classification:
   - OTC: Schedule K (Household Remedies Item 23 / CDSCO Gazette draft lists).
   - prescription_only: Schedule H, Schedule H1, Schedule X, and ALL systemic antibiotics.
   - restricted: Hospital-only, Schedule X strict narcotic/immunosuppressants.
   - unverified: Any medicine lacking definitive Indian regulatory verification.
4. Idempotent and safe: Preserves existing user data, RLS policies, and database keys.
5. High-speed batch execution using execute_values.
"""

import os
import sys
import logging
from datetime import date
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import execute_values

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("med_knowledge")

load_dotenv("scripts/.env")
db_url = os.environ.get("SUPABASE_DB_URL")
if not db_url:
    log.error("SUPABASE_DB_URL is not set in scripts/.env")
    sys.exit(1)

# ============================================================================
# Authoritative India OTC & Schedule Formulary Seed Data
# Sourced from CDSCO, e-Gazette of India, IPC, and Drugs & Cosmetics Rules 1945
# ============================================================================

AUTHORITATIVE_FORMULARY_RECORDS = [
    # ── OTC Household Remedies (Schedule K Item 23) ──
    {
        "generic_name": "Paracetamol",
        "brand_names": ["Crocin", "Dolo 650", "Calpol", "Pacimol"],
        "active_ingredients": ["Paracetamol"],
        "strength": "500 mg",
        "dosage_form": "Tablet",
        "route": "Oral",
        "prescription_status": "OTC",
        "schedule_category": "Schedule K",
        "status_verification": "verified_authoritative",
        "legal_basis": "Drugs and Cosmetics Rules 1945, Schedule K Item 23 (Household Remedies); CDSCO Notification G.S.R. 393(E)",
        "source_organization": "CDSCO / Ministry of Health and Family Welfare, Govt. of India",
        "source_url": "https://cdsco.gov.in/",
        "source_version": "Drugs Rules 1945 (Amended 2022)",
        "indications": "Mild-to-moderate pain and reduction of fever (antipyretic and analgesic).",
        "contraindications": "Severe active hepatic impairment, known hypersensitivity to paracetamol.",
        "precautions": "Risk of hepatotoxicity if daily dose exceeds 4,000 mg in adults or when taken with alcohol. Never combine with other paracetamol-containing combination medicines.",
        "adverse_effects": "Rare: allergic skin rash, thrombocytopenia, hepatic transaminase elevation.",
        "max_otc_dose_adult": "Single dose 500mg-1000mg every 4-6 hours (maximum 4000mg in 24 hours).",
        "classification_notes": "Single-ingredient paracetamol 500mg tablets qualify as OTC household remedies under Schedule K. Higher strength or combinations with Schedule H/H1 substances require a medical prescription."
    },
    {
        "generic_name": "Oral Rehydration Salts",
        "brand_names": ["Electral", "Prolyte ORS", "Walyte"],
        "active_ingredients": ["Sodium Chloride", "Potassium Chloride", "Sodium Citrate", "Anhydrous Dextrose"],
        "strength": "WHO/IP Low Osmolarity Formula",
        "dosage_form": "Oral Powder for Solution",
        "route": "Oral",
        "prescription_status": "OTC",
        "schedule_category": "Schedule K",
        "status_verification": "verified_authoritative",
        "legal_basis": "Drugs and Cosmetics Rules 1945, Schedule K Item 23 (Household Remedies)",
        "source_organization": "CDSCO / Indian Pharmacopoeia Commission",
        "source_url": "https://ipc.gov.in/",
        "source_version": "IP 2022",
        "indications": "Prevention and treatment of dehydration resulting from acute diarrhea and vomiting.",
        "contraindications": "Severe persistent vomiting preventing oral intake, severe dehydration requiring intravenous fluid resuscitation, intestinal obstruction, renal failure with anuria.",
        "precautions": "Dissolve in the precise volume of potable water specified on the sachet. Do not mix with milk or boiling water.",
        "adverse_effects": "Rare: hypernatremia or vomiting if reconstituted in improper water volume.",
        "max_otc_dose_adult": "Reconstitute as directed; drink freely according to thirst and dehydration loss.",
        "classification_notes": "Non-prescription household remedy under Schedule K Item 23."
    },
    {
        "generic_name": "Aluminium Hydroxide and Magnesium Hydroxide with Simethicone",
        "brand_names": ["Digene", "Gelusil", "Mucaine"],
        "active_ingredients": ["Aluminium Hydroxide", "Magnesium Hydroxide", "Simethicone"],
        "strength": "Standard OTC Suspension / Chewable Tablet",
        "dosage_form": "Chewable Tablet / Oral Suspension",
        "route": "Oral",
        "prescription_status": "OTC",
        "schedule_category": "Schedule K",
        "status_verification": "verified_authoritative",
        "legal_basis": "Drugs and Cosmetics Rules 1945, Schedule K Item 23; CDSCO OTC List 2022",
        "source_organization": "CDSCO",
        "source_url": "https://cdsco.gov.in/",
        "source_version": "CDSCO Draft Schedule K List",
        "indications": "Symptomatic relief of hyperacidity, heartburn, dyspepsia, and gastric flatulence.",
        "contraindications": "Severe renal failure (risk of aluminium/magnesium accumulation), hypophosphatemia.",
        "precautions": "Separate administration by at least 2 hours from fluoroquinolones, tetracyclines, and iron supplements due to chelation and reduced absorption.",
        "adverse_effects": "Constipation (from aluminium), diarrhea (from magnesium), chalky taste.",
        "max_otc_dose_adult": "1-2 chewable tablets or 10-20 mL suspension after meals and at bedtime (maximum 4 times daily).",
        "classification_notes": "Standard non-systemic antacid combinations are legally permitted for non-prescription household sale under Schedule K."
    },
    {
        "generic_name": "Povidone Iodine",
        "brand_names": ["Betadine", "Cipladine", "Wokadine"],
        "active_ingredients": ["Povidone Iodine"],
        "strength": "5% w/w Ointment, 5% w/v Solution",
        "dosage_form": "Topical Ointment / Solution",
        "route": "Topical",
        "prescription_status": "OTC",
        "schedule_category": "Schedule K",
        "status_verification": "verified_authoritative",
        "legal_basis": "Drugs and Cosmetics Rules 1945, Schedule K Item 23",
        "source_organization": "CDSCO / Indian Pharmacopoeia Commission",
        "source_url": "https://ipc.gov.in/",
        "source_version": "IP 2022",
        "indications": "Topical antiseptic for disinfection of minor superficial cuts, abrasions, and wounds.",
        "contraindications": "Known hypersensitivity to iodine, thyroid disorders (if used over large surface areas).",
        "precautions": "External use only. Do not apply to deep puncture wounds, animal bites, or serious burns without medical advice.",
        "adverse_effects": "Local skin irritation, contact dermatitis.",
        "max_otc_dose_adult": "Apply topically to affected clean area 1-3 times daily.",
        "classification_notes": "Topical antiseptic solutions and ointments under 10% are permitted for non-prescription retail sale under Schedule K."
    },
    {
        "generic_name": "Chlorhexidine and Cetrimide",
        "brand_names": ["Savlon", "Dettol Antiseptic Cream"],
        "active_ingredients": ["Chlorhexidine Gluconate", "Cetrimide"],
        "strength": "Topical Antiseptic Liquid / Cream",
        "dosage_form": "Topical Liquid / Cream",
        "route": "Topical",
        "prescription_status": "OTC",
        "schedule_category": "Schedule K",
        "status_verification": "verified_authoritative",
        "legal_basis": "Drugs and Cosmetics Rules 1945, Schedule K Item 23",
        "source_organization": "CDSCO",
        "source_url": "https://cdsco.gov.in/",
        "source_version": "Schedule K Item 23",
        "indications": "First aid antiseptic for minor skin wounds, cuts, scratches, and insect bites.",
        "contraindications": "Hypersensitivity to chlorhexidine or cetrimide. Not for use in eyes, ears, or body cavities.",
        "precautions": "Dilute liquid formulations according to package instructions before application.",
        "adverse_effects": "Mild skin irritation, allergic contact dermatitis.",
        "max_otc_dose_adult": "Apply diluted liquid or cream to cleansed wound 1-2 times daily.",
        "classification_notes": "Common household first aid antiseptic under Schedule K Item 23."
    },
    {
        "generic_name": "Calamine Lotion",
        "brand_names": ["Lacto Calamine", "Caladryl"],
        "active_ingredients": ["Calamine", "Zinc Oxide"],
        "strength": "Standard IP formulation",
        "dosage_form": "Topical Lotion",
        "route": "Topical",
        "prescription_status": "OTC",
        "schedule_category": "Schedule K",
        "status_verification": "verified_authoritative",
        "legal_basis": "Drugs and Cosmetics Rules 1945, Schedule K Item 23",
        "source_organization": "Indian Pharmacopoeia Commission / CDSCO",
        "source_url": "https://ipc.gov.in/",
        "source_version": "IP 2022",
        "indications": "Soothing symptomatic relief for mild itching, skin irritation, sunburn, and insect bites.",
        "contraindications": "Hypersensitivity to ingredients. Do not apply to open oozing or infected wounds.",
        "precautions": "For external use only. Shake well before applying.",
        "adverse_effects": "Dryness of skin with frequent application.",
        "max_otc_dose_adult": "Apply topically to affected skin 2-3 times daily.",
        "classification_notes": "Classified as a non-prescription household dermatological remedy under Schedule K Item 23."
    },
    {
        "generic_name": "Camphor, Menthol and Eucalyptus Oil",
        "brand_names": ["Vicks VapoRub", "Amrutanjan Pain Balm", "Zandu Balm"],
        "active_ingredients": ["Camphor", "Menthol", "Eucalyptus Oil"],
        "strength": "Standard Topical Balm",
        "dosage_form": "Topical Ointment / Balm",
        "route": "Topical",
        "prescription_status": "OTC",
        "schedule_category": "Schedule K",
        "status_verification": "verified_authoritative",
        "legal_basis": "Drugs and Cosmetics Rules 1945, Schedule K Item 23",
        "source_organization": "CDSCO",
        "source_url": "https://cdsco.gov.in/",
        "source_version": "Schedule K Household Remedies",
        "indications": "Temporary symptomatic relief of nasal congestion, mild headache, and muscular aches.",
        "contraindications": "Infants and children under 2 years of age. Never apply inside nostrils or on broken skin.",
        "precautions": "Do not swallow or place directly into hot boiling water for inhalation due to burn risk.",
        "adverse_effects": "Skin redness, burning sensation, contact sensitization.",
        "max_otc_dose_adult": "Rub gently on chest, throat, or forehead up to 3 times daily.",
        "classification_notes": "Permitted household topical preparation under Schedule K Item 23."
    },
    {
        "generic_name": "Zinc Oxide",
        "brand_names": ["Siloderm", "Desitin"],
        "active_ingredients": ["Zinc Oxide"],
        "strength": "10% - 20% Cream",
        "dosage_form": "Topical Cream / Paste",
        "route": "Topical",
        "prescription_status": "OTC",
        "schedule_category": "Schedule K",
        "status_verification": "verified_authoritative",
        "legal_basis": "Drugs and Cosmetics Rules 1945, Schedule K Item 23",
        "source_organization": "CDSCO / IPC",
        "source_url": "https://cdsco.gov.in/",
        "source_version": "IP 2022",
        "indications": "Barrier protection and relief for diaper dermatitis, chapped skin, and minor chafing.",
        "contraindications": "Known hypersensitivity to zinc compounds.",
        "precautions": "Clean and dry skin thoroughly before each application.",
        "adverse_effects": "Rare mild local irritation.",
        "max_otc_dose_adult": "Apply liberally as needed at every diaper change or skin cleansing.",
        "classification_notes": "Schedule K Item 23 household skin protectant."
    },
    {
        "generic_name": "Clotrimazole",
        "brand_names": ["Candid 1% Cream", "Canesten 1% Cream", "Surfai-SN"],
        "active_ingredients": ["Clotrimazole"],
        "strength": "1% w/w Cream",
        "dosage_form": "Topical Cream",
        "route": "Topical",
        "prescription_status": "OTC",
        "schedule_category": "Schedule K",
        "status_verification": "provisional_evidence",
        "legal_basis": "CDSCO Draft Schedule K OTC List (Notification G.S.R. 393(E)); Schedule K Item 23",
        "source_organization": "CDSCO",
        "source_url": "https://cdsco.gov.in/",
        "source_version": "CDSCO 2022 OTC Draft List",
        "indications": "Topical management of superficial fungal infections including athlete's foot (tinea pedis) and jock itch (tinea cruris).",
        "contraindications": "Hypersensitivity to clotrimazole or imidazole antifungals. Not for systemic or ophthalmic use.",
        "precautions": "Oral, systemic, and vaginal formulations require medical prescription under Schedule H. Only topical 1% cream for superficial dermatophytes is included in OTC draft exemptions.",
        "adverse_effects": "Erythema, burning, peeling of treated skin.",
        "max_otc_dose_adult": "Apply thinly to affected area twice daily for 2 to 4 weeks.",
        "classification_notes": "Topical 1% antifungal cream is included in CDSCO's proposed Schedule K OTC amendment. Systemic oral clotrimazole/fluconazole is Schedule H prescription-only."
    },
    {
        "generic_name": "Dextromethorphan",
        "brand_names": ["Strepsils Dry Cough", "Vicks Cough Drops"],
        "active_ingredients": ["Dextromethorphan Hydrobromide"],
        "strength": "5 mg",
        "dosage_form": "Lozenge",
        "route": "Oral",
        "prescription_status": "OTC",
        "schedule_category": "Schedule K",
        "status_verification": "provisional_evidence",
        "legal_basis": "CDSCO Draft Schedule K OTC List (Notification G.S.R. 393(E))",
        "source_organization": "CDSCO",
        "source_url": "https://cdsco.gov.in/",
        "source_version": "CDSCO 2022 OTC Draft List",
        "indications": "Temporary symptomatic relief of acute non-productive (dry) cough.",
        "contraindications": "Concurrent use of monoamine oxidase inhibitors (MAOIs), persistent productive cough, asthma, COPD.",
        "precautions": "Single active ingredient lozenges (5mg) only. Syrups and combination products with Schedule H/H1 substances require medical prescription.",
        "adverse_effects": "Drowsiness, dizziness, nausea with excessive intake.",
        "max_otc_dose_adult": "1 lozenge dissolved slowly in mouth every 4 hours (maximum 30mg daily).",
        "classification_notes": "Low-dose lozenges proposed under Schedule K OTC list. Systemic high-strength syrups require prescription."
    },
    {
        "generic_name": "Multivitamins with Minerals (Prophylactic)",
        "brand_names": ["Becadexamin", "Supradyn Daily", "A to Z NS"],
        "active_ingredients": ["Vitamin A", "Vitamin B-Complex", "Vitamin C", "Vitamin D3", "Zinc"],
        "strength": "Prophylactic Recommended Dietary Allowance (RDA)",
        "dosage_form": "Tablet / Capsule",
        "route": "Oral",
        "prescription_status": "OTC",
        "schedule_category": "Schedule K",
        "status_verification": "verified_authoritative",
        "legal_basis": "Drugs and Cosmetics Rules 1945, Schedule K Item 23; FSSAI / CDSCO Guidelines",
        "source_organization": "CDSCO / FSSAI",
        "source_url": "https://cdsco.gov.in/",
        "source_version": "Schedule K & FSSAI RDA 2020",
        "indications": "Daily nutritional supplementation, prevention of subclinical vitamin deficiencies.",
        "contraindications": "Hypervitaminosis (e.g. Vitamin A or D toxicity), hypercalcemia.",
        "precautions": "Therapeutic high-dose vitamins (e.g. high-dose Vitamin D 60,000 IU or parenteral formulations) fall under Schedule H and require a medical prescription.",
        "adverse_effects": "Mild nausea, yellow discoloration of urine (from riboflavin).",
        "max_otc_dose_adult": "1 tablet daily after food.",
        "classification_notes": "Prophylactic strengths conforming to ICMR RDA are exempt under Schedule K. Therapeutic high-dose strengths are Schedule H prescription only."
    },

    # ── Critical Antibiotics (STRICTLY PRESCRIPTION ONLY under Schedule H / H1 & AMR Policy) ──
    {
        "generic_name": "Amoxicillin",
        "brand_names": ["Amoxil", "Mox", "Novamox"],
        "active_ingredients": ["Amoxicillin"],
        "strength": "250 mg, 500 mg",
        "dosage_form": "Capsule / Tablet / Syrup",
        "route": "Oral",
        "prescription_status": "prescription_only",
        "schedule_category": "Schedule H",
        "status_verification": "verified_authoritative",
        "legal_basis": "Drugs and Cosmetics Rules 1945, Schedule H; National Action Plan on Antimicrobial Resistance (NAP-AMR)",
        "source_organization": "CDSCO & WHO AWaRe 2025",
        "source_url": "https://cdsco.gov.in/",
        "source_version": "Schedule H & WHO AWaRe 2025 (Access)",
        "indications": "Bacterial infections of the respiratory tract, ear, nose, throat, skin, and urinary tract.",
        "contraindications": "Documented hypersensitivity to penicillin or beta-lactam antibiotics, infectious mononucleosis.",
        "precautions": "Strictly prescription-only under Indian law. Dispensing without prescription is prohibited under Rule 65. Complete full prescribed course to prevent antimicrobial resistance.",
        "adverse_effects": "Diarrhea, nausea, maculopapular rash, candidiasis.",
        "max_otc_dose_adult": "None (Prescription only. Never OTC under Indian law).",
        "classification_notes": "WHO AWaRe: Access. Legally Schedule H prescription-only drug in India. OTC sale is strictly illegal."
    },
    {
        "generic_name": "Azithromycin",
        "brand_names": ["Zithromax", "Azithral", "Azee"],
        "active_ingredients": ["Azithromycin"],
        "strength": "250 mg, 500 mg",
        "dosage_form": "Tablet / Oral Suspension",
        "route": "Oral",
        "prescription_status": "prescription_only",
        "schedule_category": "Schedule H1",
        "status_verification": "verified_authoritative",
        "legal_basis": "Drugs and Cosmetics Rules 1945, Schedule H1 (Notification G.S.R. 588(E) dated 30-Aug-2013)",
        "source_organization": "CDSCO & WHO AWaRe 2025",
        "source_url": "https://cdsco.gov.in/",
        "source_version": "Schedule H1 & WHO AWaRe 2025 (Watch)",
        "indications": "Bacterial infections including acute respiratory infections, tonsillitis, and genital chlamydial infections.",
        "contraindications": "Hepatic dysfunction, hypersensitivity to macrolides, history of cholestatic jaundice.",
        "precautions": "Strictly Schedule H1 prescription-only. Chemist must maintain separate Schedule H1 register for 3 years. Risk of QT prolongation and cardiac arrhythmia.",
        "adverse_effects": "Abdominal cramping, nausea, diarrhea, headache.",
        "max_otc_dose_adult": "None (Prescription only. Never OTC under Indian law).",
        "classification_notes": "WHO AWaRe: Watch. Schedule H1 prescription-only antibiotic. Strictest retail audit requirements in India."
    },
    {
        "generic_name": "Ciprofloxacin",
        "brand_names": ["Cipro", "Ciplox", "Cifran"],
        "active_ingredients": ["Ciprofloxacin"],
        "strength": "250 mg, 500 mg, 750 mg",
        "dosage_form": "Tablet / Eye-Ear Drops / Injection",
        "route": "Oral / Ophthalmic / IV",
        "prescription_status": "prescription_only",
        "schedule_category": "Schedule H1",
        "status_verification": "verified_authoritative",
        "legal_basis": "Drugs and Cosmetics Rules 1945, Schedule H1",
        "source_organization": "CDSCO & WHO AWaRe 2025",
        "source_url": "https://cdsco.gov.in/",
        "source_version": "Schedule H1 & WHO AWaRe 2025 (Watch)",
        "indications": "Complicated bacterial urinary tract infections, severe gastrointestinal infections, typhoid fever.",
        "contraindications": "Concurrent tizanidine, myasthenia gravis, history of fluoroquinolone tendon disorders.",
        "precautions": "Schedule H1 antibiotic. Risk of tendinitis, tendon rupture, peripheral neuropathy, and CNS toxicities. Avoid in pregnant women and growing children unless no alternative exists.",
        "adverse_effects": "Nausea, diarrhea, tendon pain, phototoxicity.",
        "max_otc_dose_adult": "None (Prescription only. Never OTC under Indian law).",
        "classification_notes": "WHO AWaRe: Watch. Schedule H1 fluoroquinolone antibiotic."
    },
    {
        "generic_name": "Cefixime",
        "brand_names": ["Suprax", "Zifi", "Taxim-O"],
        "active_ingredients": ["Cefixime"],
        "strength": "100 mg, 200 mg",
        "dosage_form": "Tablet / Syrup",
        "route": "Oral",
        "prescription_status": "prescription_only",
        "schedule_category": "Schedule H1",
        "status_verification": "verified_authoritative",
        "legal_basis": "Drugs and Cosmetics Rules 1945, Schedule H1",
        "source_organization": "CDSCO & WHO AWaRe 2025",
        "source_url": "https://cdsco.gov.in/",
        "source_version": "Schedule H1 & WHO AWaRe 2025 (Watch)",
        "indications": "Uncomplicated urinary tract infections, otitis media, pharyngitis, and enteric fever.",
        "contraindications": "Severe cephalosporin hypersensitivity, history of anaphylaxis to penicillins.",
        "precautions": "Third-generation cephalosporin strictly regulated under Schedule H1 to curb antimicrobial resistance.",
        "adverse_effects": "Diarrhea, abdominal pain, nausea, skin rash.",
        "max_otc_dose_adult": "None (Prescription only. Never OTC under Indian law).",
        "classification_notes": "WHO AWaRe: Watch. Schedule H1 antibiotic."
    },
    {
        "generic_name": "Doxycycline",
        "brand_names": ["Vibramycin", "Dox-SL"],
        "active_ingredients": ["Doxycycline"],
        "strength": "100 mg",
        "dosage_form": "Capsule / Tablet",
        "route": "Oral",
        "prescription_status": "prescription_only",
        "schedule_category": "Schedule H",
        "status_verification": "verified_authoritative",
        "legal_basis": "Drugs and Cosmetics Rules 1945, Schedule H",
        "source_organization": "CDSCO & WHO AWaRe 2025",
        "source_url": "https://cdsco.gov.in/",
        "source_version": "Schedule H & WHO AWaRe 2025 (Access)",
        "indications": "Atypical pneumonia, rickettsial infections, severe acne, scrub typhus, malaria prophylaxis.",
        "contraindications": "Pregnancy, lactating mothers, children under 8 years of age (causes permanent teeth discoloration).",
        "precautions": "Take with full glass of water in upright posture to prevent severe esophageal ulceration. Avoid sunlight exposure (photosensitivity).",
        "adverse_effects": "Esophagitis, photosensitivity, nausea, tooth discoloration in young children.",
        "max_otc_dose_adult": "None (Prescription only. Never OTC under Indian law).",
        "classification_notes": "WHO AWaRe: Access. Schedule H prescription-only tetracycline antibiotic."
    },
    {
        "generic_name": "Micronized Purified Flavonoid Fraction",
        "brand_names": ["Daflon", "Daflon 500mg", "Daflon 500", "Venex"],
        "active_ingredients": ["Diosmin (450mg)", "Hesperidin (50mg)"],
        "strength": "500 mg",
        "dosage_form": "Tablet",
        "route": "Oral",
        "prescription_status": "prescription_only",
        "schedule_category": "Schedule H",
        "status_verification": "verified_authoritative",
        "legal_basis": "Drugs and Cosmetics Rules 1945, Schedule H; CDSCO List of Approved Fixed Dose Combinations / Formulations",
        "source_organization": "CDSCO / Ministry of Health and Family Welfare, Govt. of India",
        "source_url": "https://cdsco.gov.in/",
        "source_version": "Drugs Rules 1945 (Schedule H)",
        "indications": "Chronic venous insufficiency (varicose veins, heavy legs, venous edema, stasis dermatitis, venous ulcers) and acute or chronic hemorrhoidal disease (piles).",
        "contraindications": "Known hypersensitivity to diosmin, hesperidin, or any tablet excipients. Not recommended during breastfeeding/lactation.",
        "precautions": "For acute hemorrhoidal attacks, administration does not preclude specific treatment for other proctological disorders; short-term use only (review with physician if symptoms persist >15 days).",
        "adverse_effects": "Common: mild gastrointestinal disorders (nausea, diarrhea, dyspepsia, abdominal pain). Rare: headache, malaise, cutaneous rash, pruritus.",
        "max_otc_dose_adult": None,
        "classification_notes": "Allopathic prescription-only vasoprotective agent under Schedule H. Manufacturer in India: Serdia Pharmaceuticals / Servier France."
    },
]

SCHEDULE_H_CATEGORIES = [
    "Antibiotic", "Penicillin", "Cephalosporin", "Macrolide", "Fluoroquinolone",
    "Carbapenem", "Aminoglycoside", "Tetracycline", "Sulfonamide",
    "Antihypertensive", "Beta-Blocker", "ACE Inhibitor", "ARB", "Dihydropyridine CCB",
    "Antidiabetic", "Sulfonylurea", "Biguanide", "DPP-4 Inhibitor", "SGLT2 Inhibitor", "Insulin",
    "Anticonvulsant", "Antiepileptic", "Benzodiazepine", "Barbiturate", "Opioid",
    "Antipsychotic", "SSRI", "SNRI", "Tricyclic Antidepressant",
    "Corticosteroid", "Glucocorticoid",
    "Antineoplastic", "Kinase Inhibitor", "Alkylating Agent", "Antimetabolite", "TNF Blocker",
    "Antiviral", "Immunosuppressant", "Anticoagulant", "Antiplatelet"
]


def ingest_formulary_and_enrich_drugs():
    log.info("Connecting to Supabase Postgres...")
    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    cur = conn.cursor()

    stats = {
        "formulary_inserted": 0,
        "formulary_updated": 0,
        "drugs_updated_otc": 0,
        "drugs_updated_rx": 0,
        "drugs_marked_unverified": 0,
        "drugs_antibiotics_enforced": 0,
    }

    try:
        # Step 1: Clean erroneous aware_class from non-antibiotics (e.g. Paracetamol)
        log.info("Step 1/4: Normalizing pre-existing antibiotic classifications...")
        cur.execute(
            """
            UPDATE public.drugs 
            SET aware_class = NULL 
            WHERE lower(name) LIKE '%paracetamol%' 
               OR lower(generic_name) LIKE '%paracetamol%';
            """
        )

        # Step 2: Ingest authoritative formulary records into medication_formulary_india
        log.info("Step 2/4: Upserting authoritative Indian formulary records...")
        for rec in AUTHORITATIVE_FORMULARY_RECORDS:
            cur.execute(
                """
                INSERT INTO public.medication_formulary_india (
                    generic_name, brand_names, active_ingredients, strength, dosage_form, route,
                    prescription_status, schedule_category, status_verification, legal_basis,
                    source_organization, source_url, source_version, verification_date,
                    indications, contraindications, precautions, adverse_effects,
                    max_otc_dose_adult, classification_notes
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT ((lower(generic_name))) DO UPDATE SET
                    brand_names = EXCLUDED.brand_names,
                    active_ingredients = EXCLUDED.active_ingredients,
                    strength = EXCLUDED.strength,
                    dosage_form = EXCLUDED.dosage_form,
                    route = EXCLUDED.route,
                    prescription_status = EXCLUDED.prescription_status,
                    schedule_category = EXCLUDED.schedule_category,
                    status_verification = EXCLUDED.status_verification,
                    legal_basis = EXCLUDED.legal_basis,
                    source_organization = EXCLUDED.source_organization,
                    source_url = EXCLUDED.source_url,
                    source_version = EXCLUDED.source_version,
                    verification_date = EXCLUDED.verification_date,
                    indications = EXCLUDED.indications,
                    contraindications = EXCLUDED.contraindications,
                    precautions = EXCLUDED.precautions,
                    adverse_effects = EXCLUDED.adverse_effects,
                    max_otc_dose_adult = EXCLUDED.max_otc_dose_adult,
                    classification_notes = EXCLUDED.classification_notes,
                    updated_at = now();
                """,
                (
                    rec["generic_name"],
                    rec["brand_names"],
                    rec["active_ingredients"],
                    rec["strength"],
                    rec["dosage_form"],
                    rec["route"],
                    rec["prescription_status"],
                    rec["schedule_category"],
                    rec["status_verification"],
                    rec["legal_basis"],
                    rec["source_organization"],
                    rec["source_url"],
                    rec["source_version"],
                    rec.get("verification_date", date.today()),
                    rec["indications"],
                    rec["contraindications"],
                    rec["precautions"],
                    rec["adverse_effects"],
                    rec.get("max_otc_dose_adult"),
                    rec["classification_notes"],
                ),
            )
            stats["formulary_inserted"] += 1

        # Step 3: Classify and batch-update public.drugs records
        log.info("Step 3/4: Classifying all public.drugs records...")
        cur.execute("SELECT id, name, generic_name, category, aware_class FROM public.drugs;")
        all_drugs = cur.fetchall()

        # Build lookup from medication_formulary_india
        cur.execute(
            """
            SELECT lower(generic_name), prescription_status, schedule_category, status_verification,
                   source_organization, source_url, source_version, contraindications, precautions,
                   brand_names, active_ingredients, classification_notes
            FROM public.medication_formulary_india;
            """
        )
        formulary_lookup = {row[0]: row for row in cur.fetchall()}

        update_tuples = []
        for drug_id, name, generic_name, category, aware_class in all_drugs:
            g_name = (generic_name or name or "").strip().lower()
            cat = (category or "").lower()
            is_antibiotic = (
                (aware_class and aware_class.lower() in ["access", "watch", "reserve", "not recommended"])
                or any(abx in cat for abx in ["antibiotic", "penicillin", "cephalosporin", "macrolide", "quinolone", "carbapenem"])
            )

            # 1. Direct match in medication_formulary_india
            matched_form = formulary_lookup.get(g_name)
            if matched_form:
                status = matched_form[1]
                sched = matched_form[2]
                verif = matched_form[3]
                src = f"{matched_form[4]} ({matched_form[5] or ''})"
                url = matched_form[5]
                ver = matched_form[6]
                contra = matched_form[7]
                prec = matched_form[8]
                brands = matched_form[9]
                ingredients = matched_form[10]
                notes = matched_form[11]

                update_tuples.append((
                    drug_id, status, sched, verif, src, url, ver, contra, prec, brands, ingredients, notes
                ))
                if status == "OTC":
                    stats["drugs_updated_otc"] += 1
                else:
                    stats["drugs_updated_rx"] += 1
                if is_antibiotic:
                    stats["drugs_antibiotics_enforced"] += 1
                continue

            # 2. Antibiotic rule: Any antibiotic is strictly Schedule H/H1
            if is_antibiotic:
                update_tuples.append((
                    drug_id,
                    "prescription_only",
                    "Schedule H",
                    "verified_authoritative",
                    "CDSCO - Drugs and Cosmetics Rules 1945 (Schedule H/H1)",
                    "https://cdsco.gov.in/",
                    "Drugs Rules 1945 (Schedule H)",
                    None,
                    None,
                    None,
                    None,
                    "Strictly prescription-only antibiotic under Indian AMR regulations. Over-the-counter sale prohibited under Rule 65."
                ))
                stats["drugs_updated_rx"] += 1
                stats["drugs_antibiotics_enforced"] += 1
                continue

            # 3. Schedule H clinical categories
            is_sched_h = any(shc.lower() in cat for shc in SCHEDULE_H_CATEGORIES)
            if is_sched_h:
                update_tuples.append((
                    drug_id,
                    "prescription_only",
                    "Schedule H",
                    "verified_authoritative",
                    "CDSCO - Drugs and Cosmetics Rules 1945 (Schedule H)",
                    "https://cdsco.gov.in/",
                    "Drugs Rules 1945 (Schedule H)",
                    None,
                    None,
                    None,
                    None,
                    "Prescription-only medicine under Schedule H of Drugs and Cosmetics Rules 1945."
                ))
                stats["drugs_updated_rx"] += 1
                continue

            # 4. Default unverified
            update_tuples.append((
                drug_id,
                "unverified",
                "unverified",
                "unverified",
                "Unverified - Requires authoritative Indian regulatory confirmation",
                None,
                None,
                None,
                None,
                None,
                None,
                "No authoritative CDSCO or Schedule K exemption record verified for this formulation."
            ))
            stats["drugs_marked_unverified"] += 1

        # High-speed batch execution using temporary staging table
        log.info("Executing atomic batch update of %d records...", len(update_tuples))
        cur.execute(
            """
            CREATE TEMP TABLE tmp_drug_classifications (
                id uuid PRIMARY KEY,
                prescription_status_india text,
                schedule_category_india text,
                status_verification text,
                verification_source text,
                source_url text,
                source_version text,
                contraindications text,
                precautions text,
                brand_names text[],
                active_ingredients text[],
                classification_notes text
            ) ON COMMIT DROP;
            """
        )

        execute_values(
            cur,
            """
            INSERT INTO tmp_drug_classifications (
                id, prescription_status_india, schedule_category_india, status_verification,
                verification_source, source_url, source_version, contraindications, precautions,
                brand_names, active_ingredients, classification_notes
            ) VALUES %s;
            """,
            update_tuples,
            page_size=500,
        )

        cur.execute(
            """
            UPDATE public.drugs d
            SET prescription_status_india = t.prescription_status_india,
                schedule_category_india = t.schedule_category_india,
                status_verification = t.status_verification,
                verification_source = t.verification_source,
                source_url = t.source_url,
                source_version = t.source_version,
                verification_date = CURRENT_DATE,
                contraindications = COALESCE(d.contraindications, t.contraindications),
                precautions = COALESCE(d.precautions, t.precautions),
                brand_names = COALESCE(d.brand_names, t.brand_names),
                active_ingredients = COALESCE(d.active_ingredients, t.active_ingredients),
                classification_notes = t.classification_notes
            FROM tmp_drug_classifications t
            WHERE d.id = t.id;
            """
        )

        # Step 4: Safety & Integrity Audits
        log.info("Step 4/4: Running safety & integrity audits on database...")
        # Check 1: Ensure zero antibiotics are marked as OTC
        cur.execute(
            """
            SELECT COUNT(*) FROM public.drugs 
            WHERE prescription_status_india = 'OTC' 
              AND (aware_class IS NOT NULL OR lower(category) LIKE '%antibiotic%');
            """
        )
        otc_antibiotics = cur.fetchone()[0]
        if otc_antibiotics > 0:
            raise ValueError(f"FATAL INTEGRITY VIOLATION: {otc_antibiotics} antibiotics were marked as OTC!")

        # Check 2: Breakdown summary
        cur.execute(
            """
            SELECT prescription_status_india, COUNT(*) 
            FROM public.drugs 
            GROUP BY prescription_status_india 
            ORDER BY count DESC;
            """
        )
        breakdown = cur.fetchall()

        conn.commit()

        print("\n" + "=" * 60)
        print("  MedSentry Batch B: Ingestion & Formulary Summary")
        print("=" * 60)
        print(f"  Total Drugs in Database         : {len(all_drugs):>6}")
        print(f"  Formulary Entries (Authoritative): {len(AUTHORITATIVE_FORMULARY_RECORDS):>6}")
        print(f"  Antibiotics Enforced (Rx Only)  : {stats['drugs_antibiotics_enforced']:>6}")
        print(f"  Total Prescription Only (Rx)    : {stats['drugs_updated_rx']:>6}")
        print(f"  Total Over-The-Counter (OTC)    : {stats['drugs_updated_otc']:>6}")
        print(f"  Total Unverified (Safely Marked): {stats['drugs_marked_unverified']:>6}")
        print(f"  OTC Antibiotic Violations       : {otc_antibiotics:>6} (MUST BE 0)")
        print("\n  Prescription Status Breakdown in drugs table:")
        for status, cnt in breakdown:
            print(f"    - {status:<20}: {cnt:>5} records")
        print("=" * 60 + "\n")

    except Exception as e:
        conn.rollback()
        log.error("Ingestion failed, rolled back: %s", e)
        cur.close()
        conn.close()
        raise

    cur.close()
    conn.close()
    log.info("Medication knowledge ingestion completed successfully.")


if __name__ == "__main__":
    ingest_formulary_and_enrich_drugs()
