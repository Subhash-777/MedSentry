#!/usr/bin/env python3
"""
Test image consultation with live deployed ai-router edge function.
Simulates the exact request sent by AIConsultantScreen when the user uploads
a photo of Daflon 500mg and asks "Explain about this tablet and what is it used for".
"""
import os
import sys
import json
import base64
import requests
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
from dotenv import load_dotenv

load_dotenv("scripts/.env")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    print("FATAL: Missing SUPABASE_URL or SUPABASE_ANON_KEY in scripts/.env")
    sys.exit(1)

ROUTER_URL = f"{SUPABASE_URL}/functions/v1/ai-router"

# 1. Authenticate Elena
login_resp = requests.post(
    f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
    headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
    json={"email": "elena.ramirez@medsentry.demo", "password": "Demo_Review_2026_Showcase!"},
    timeout=10,
)
if login_resp.status_code != 200:
    print(f"Auth failed: {login_resp.status_code} {login_resp.text}")
    sys.exit(1)

auth_data = login_resp.json()
jwt_token = auth_data["access_token"]
user_id = auth_data["user"]["id"]
print(f"Authenticated user: {user_id}")

# 2. Generate a synthetic medicine blister pack image for Daflon 500mg
img = Image.new("RGB", (600, 300), color="#D8DCE3")
draw = ImageDraw.Draw(img)

# Blister pack metallic styling and text
draw.rectangle([20, 20, 580, 280], outline="#8A9BA8", width=3)
draw.rectangle([40, 40, 560, 100], fill="#C5222E")  # Red banner
draw.text((60, 55), "DAFLON 500 mg", fill="#FFFFFF")
draw.text((60, 120), "Micronized Purified Flavonoid Fraction 500mg", fill="#1A202C")
draw.text((60, 150), "Diosmin 450mg + Hesperidin 50mg", fill="#2D3748")
draw.text((60, 180), "SERVIER LABORATORIES / CDSCO SCHEDULE H", fill="#4A5568")
draw.text((60, 210), "Batch No: SER2026-X | Mfg: 01/2026 | Exp: 12/2028", fill="#718096")

buf = BytesIO()
img.save(buf, format="JPEG", quality=85)
b64_image = base64.b64encode(buf.getvalue()).decode("utf-8")
print(f"Generated synthetic test blister pack image ({len(b64_image)} base64 chars)")

# 3. Call deployed ai-router simulating AIConsultantScreen
payload = {
    "request_type": "consultant",
    "messages": [
        {"role": "user", "content": "Explain about this tablet and what is it used for"}
    ],
    "image_base64": b64_image,
    "userContext": {
        "userId": user_id,
        "query": "Explain about this tablet and what is it used for"
    }
}

headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {jwt_token}",
    "Content-Type": "application/json"
}

print(f"Posting request to {ROUTER_URL}...")
resp = requests.post(ROUTER_URL, headers=headers, json=payload, timeout=30)
print(f"HTTP Status: {resp.status_code}")

if resp.status_code != 200:
    print(f"Error response: {resp.text}")
    sys.exit(1)

res_json = resp.json()
print("=" * 60)
print(f"Provider used: {res_json.get('provider')}")
print(f"Safety flagged: {res_json.get('flagged')}")
print("Response text excerpt:")
print(res_json.get("text", "")[:600])
print("=" * 60)

retrieval = res_json.get("retrieval")
if retrieval:
    print(f"Medicine matches returned: {len(retrieval.get('medicine_matches', []))}")
    for m in retrieval.get("medicine_matches", []):
        print(f" - {m.get('name')} ({m.get('generic_name')}) -> {m.get('schedule_category')} [{m.get('prescription_status')}]")
    print(f"Sources: {[s.get('title') for s in retrieval.get('sources', [])]}")
else:
    print("No retrieval metadata returned.")

# Assertions
text_lower = res_json.get("text", "").lower()
assert "daflon" in text_lower or "flavonoid" in text_lower, "AI did not identify Daflon / Flavonoid from the image!"
print("\n>>> SUCCESS: Image Consultation successfully recognized tablet and provided clinical guidance!")
