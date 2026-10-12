#!/usr/bin/env python3
"""
MedSentry — Batch C: Comprehensive Evaluation Runner
====================================================
Executes the local evaluation loop across all 14 clinical and safety domains,
asserting response validation, evidence coverage, guardrails, and non-regression.

Usage:
  python3 scripts/run_batch_c_eval.py [--live] [--safety-gates] [--all] [--json]

Options:
  --live          Run with live provider inference (optional, requires provider API keys).
  --safety-gates  Execute automated safety regression gates (scripts/test_batch_c_safety_gates.py).
  --all           Run complete suite (Batch A, A2, B, C evaluation, and safety gates).
  --json          Output results in machine-readable JSON format.
"""

import argparse
import json
import os
import subprocess
import sys
from dotenv import load_dotenv

load_dotenv("scripts/.env")


def run_command(cmd, desc, env=None):
    print(f"\n{'='*70}\n[RUNNING] {desc}\nCommand: {' '.join(cmd)}\n{'='*70}")
    proc = subprocess.run(cmd, env=env, text=True, capture_output=False)
    if proc.returncode != 0:
        print(f"[FAILED] {desc} returned non-zero exit code: {proc.returncode}")
        return False
    print(f"[PASSED] {desc}")
    return True


def run_deno_eval(is_live=False, is_json=False):
    deno_cmd = [
        "deno",
        "run",
        "--env-file=scripts/.env",
        "--allow-net",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "tests/evaluation/eval_runner.ts",
    ]
    if is_live:
        deno_cmd.append("--live")
    if is_json:
        deno_cmd.append("--json")

    print(f"\n{'='*70}\n[BATCH C EVALUATION LOOP]\nMode: {'LIVE_PROVIDER' if is_live else 'MOCKED_WITH_RUNTIME_RETRIEVAL_AND_VALIDATION'}\n{'='*70}")
    proc = subprocess.run(deno_cmd, text=True, capture_output=False)
    return proc.returncode == 0


def main():
    parser = argparse.ArgumentParser(description="MedSentry Batch C Evaluation Runner")
    parser.add_argument("--live", action="store_true", help="Execute live AI provider inference")
    parser.add_argument("--safety-gates", action="store_true", help="Run automated safety regression gates")
    parser.add_argument("--all", action="store_true", help="Run full regression test suite (A, A2, B, C, Gates)")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON")
    args = parser.parse_args()

    results = {}

    if args.all:
        print("\n" + "#"*70)
        print("MEDSENTRY FULL REGRESSION & EVALUATION SUITE")
        print("#"*70)

        # Batch A: Medication context & dose logs
        results["Batch A (Medication Context)"] = run_command(
            ["python3", "scripts/test_batch_a_medication_context.py"],
            "Batch A: Medication Context & Dose History",
        )

        # Batch A2: UI Fixes & Markdown Rendering
        results["Batch A2 (UI & Markdown)"] = run_command(
            ["python3", "scripts/test_batch_a2_ui.py"],
            "Batch A2: UI Fixes & Markdown Parser",
        )

        # Batch B: Knowledge & Formulary
        results["Batch B (Knowledge & Formulary)"] = run_command(
            ["python3", "scripts/test_batch_b_knowledge.py"],
            "Batch B: India Formulary & Antibiotic Invariants",
        )

    # Batch C Main Evaluation Loop
    eval_passed = run_deno_eval(is_live=args.live, is_json=args.json)
    results["Batch C (Clinical Evaluation Loop)"] = eval_passed

    # Safety Regression Gates
    if args.safety_gates or args.all:
        results["Batch C Safety Regression Gates"] = run_command(
            ["python3", "scripts/test_batch_c_safety_gates.py"],
            "Batch C: Safety Regression Gates",
        )

    # Summary report
    print("\n" + "="*70)
    print("MEDSENTRY TEST & EVALUATION EXECUTION SUMMARY")
    print("="*70)
    all_passed = True
    for suite, passed in results.items():
        status = "PASSED" if passed else "FAILED"
        print(f" - {suite.padEnd(45) if hasattr(suite, 'padEnd') else suite.ljust(45)}: {status}")
        if not passed:
            all_passed = False
    print("="*70)

    if not all_passed:
        print("[STATUS] FAILED: One or more test suites failed.")
        sys.exit(1)
    else:
        print("[STATUS] SUCCESS: All test suites and safety gates passed cleanly.")
        sys.exit(0)


if __name__ == "__main__":
    main()
