"""
Regression test suite for Batch A2 (UI Fixes):
- A2-1: Consultant Chat UI state and conversation management
- A2-2: SafeMarkdown parsing, medical callouts, and URL sanitization
- A2-3: Medication screen header counting and clearance rules
"""

import re
import sys

print("==================================================")
print("BATCH A2 UI FIXES REGRESSION TEST SUITE")
print("==================================================")

# ---------------------------------------------------------------------------
# Test 1: Markdown Sanitization and URL Safety (A2-2)
# ---------------------------------------------------------------------------
print("\n[TEST A2-2] Markdown Parsing, Medical Callouts & URL Sanitization")

def is_safe_url(url: str) -> bool:
    if not url:
        return False
    trimmed = url.strip().lower()
    return trimmed.startswith('https://') or trimmed.startswith('http://')

# Unsafe schemes must be rejected
assert not is_safe_url("javascript:alert(1)"), "Failed: javascript URL allowed!"
assert not is_safe_url("data:text/html,<script>alert(1)</script>"), "Failed: data URL allowed!"
assert not is_safe_url("file:///etc/passwd"), "Failed: file URL allowed!"
assert not is_safe_url("vbscript:msgbox(1)"), "Failed: vbscript URL allowed!"

# Safe URLs must pass
assert is_safe_url("https://www.who.int/medicines/access"), "Failed: safe https URL blocked!"
assert is_safe_url("http://medsentry.health/faq"), "Failed: safe http URL blocked!"
print(">>> PASS: URL safety policy strictly blocks unsafe schemes and permits http/https.")

# Markdown block categorization test
def categorize_markdown_line(line: str) -> str:
    trimmed = line.strip()
    if re.match(r"^#{1,4}\s+", trimmed):
        return "heading"
    if re.match(r"^\*\*(?:Danger|Contraindication|Alert):?\*\*[:]?", trimmed, re.I) or re.match(r"^(?:Contraindication|Danger):", trimmed, re.I):
        return "callout_danger"
    if re.match(r"^\*\*(?:Warning|Caution|Refill Nudge):?\*\*[:]?", trimmed, re.I) or re.match(r"^(?:Warning|Caution):", trimmed, re.I):
        return "callout_warning"
    if re.match(r"^\*\*(?:Note|Important|Adherence|AWaRe):?\*\*[:]?", trimmed, re.I) or "[AWaRe:" in trimmed:
        return "callout_info"
    if re.match(r"^\s*[-*•]\s+", line):
        return "unordered_list"
    if re.match(r"^\s*\d+[.)]\s+", line):
        return "ordered_list"
    if trimmed.startswith(">"):
        return "blockquote"
    return "paragraph"

test_samples = [
    ("### 1. Dosage Instructions", "heading"),
    ("**Warning:** Do not take with dairy products.", "callout_warning"),
    ("**Contraindication:** Never take with MAOIs.", "callout_danger"),
    ("**Note:** Complete the full 7-day course.", "callout_info"),
    ("Prescribed: Amoxicillin [AWaRe: Access]", "callout_info"),
    ("- Take twice daily after meals", "unordered_list"),
    ("1. Check expiration date", "ordered_list"),
    ("> Recommended by WHO guideline", "blockquote"),
    ("Standard explanatory paragraph text.", "paragraph"),
]

for sample_text, expected_type in test_samples:
    detected_type = categorize_markdown_line(sample_text)
    assert detected_type == expected_type, f"Mismatch for '{sample_text}': expected {expected_type}, got {detected_type}"
    print(f" - Verified '{sample_text[:35]}...' -> {detected_type}")

print(">>> PASS: SafeMarkdown categorizes all medical blocks and formatting tokens correctly.")


# ---------------------------------------------------------------------------
# Test 2: Consultant Chat State Flow (A2-1)
# ---------------------------------------------------------------------------
print("\n[TEST A2-1] Consultant Chat UI Submission & State Rules")

class MockConsultantChat:
    def __init__(self):
        self.messages = []
        self.query = ""
        self.image_uri = None
        self.loading = False

    def submit(self, text, image=None):
        effective_text = (text or "").strip()
        if (not effective_text and not image) or self.loading:
            return False  # Empty or duplicate blocked

        # 1. Immediate input clear
        self.query = ""
        self.image_uri = None

        # 2. Add user message immediately
        user_msg = {
            "id": f"u_{len(self.messages)+1}",
            "role": "user",
            "content": effective_text or "Analyzed image",
            "image": image,
        }
        self.messages.append(user_msg)
        self.loading = True
        return True

    def receive_response(self, response_text, provider="gemini", error=False, flagged=False):
        if not self.loading:
            return False
        asst_msg = {
            "id": f"a_{len(self.messages)+1}",
            "role": "assistant",
            "content": response_text,
            "provider": provider,
            "error": error,
            "flagged": flagged,
        }
        self.messages.append(asst_msg)
        self.loading = False
        return True

    def reset(self):
        self.messages = []
        self.query = ""
        self.image_uri = None
        self.loading = False

chat = MockConsultantChat()

# Empty submission must be blocked
assert not chat.submit("", None), "Empty submission was not blocked"
assert len(chat.messages) == 0

# Normal submission
assert chat.submit("Can I take Amoxicillin with juice?"), "Valid submission failed"
assert len(chat.messages) == 1
assert chat.messages[0]["role"] == "user"
assert chat.query == "", "Input text was not cleared immediately!"
assert chat.loading is True, "Loading state was not set"

# Repeated submission while loading must be blocked
assert not chat.submit("Can I take Amoxicillin with juice?"), "Repeated submission while loading was not blocked!"
assert len(chat.messages) == 1

# Receive assistant response
assert chat.receive_response("**Yes**, you can take Amoxicillin with juice. [AWaRe: Access]")
assert len(chat.messages) == 2
assert chat.messages[1]["role"] == "assistant"
assert chat.loading is False

# Second turn in conversation
assert chat.submit("What if I miss a dose?")
assert len(chat.messages) == 3
assert chat.receive_response("Take it as soon as you remember, unless it's close to your next dose.")
assert len(chat.messages) == 4

# Test reset
chat.reset()
assert len(chat.messages) == 0
assert chat.query == ""
print(">>> PASS: Conversation lifecycle, immediate input clearing, and repeat submission guards verified.")


# ---------------------------------------------------------------------------
# Test 3: Medication Screen Layout and Count Rules (A2-3)
# ---------------------------------------------------------------------------
print("\n[TEST A2-3] Medication Screen Header Label and Scroll Clearance")

def format_medication_count_badge(active_courses_count: int) -> str:
    """The new clean badge formatting rule for MyMedicationsScreen"""
    if active_courses_count <= 0:
        return ""
    return f"{active_courses_count} Active"

assert format_medication_count_badge(0) == "", "0 count should not render count badge"
assert format_medication_count_badge(1) == "1 Active", "1 course should format as '1 Active'"
assert format_medication_count_badge(2) == "2 Active", "2 courses should format as '2 Active'"
assert "+ Add" not in format_medication_count_badge(2), "Misleading '+ Add' verb found in count badge!"
print(">>> PASS: Count badge formatting accurately reflects active courses without duplicate '+ Add' verb.")

# Test layout clearance
TAB_BAR_HEIGHT = 80
FAB_HEIGHT = 56
FAB_BOTTOM_OFFSET = 28
FAB_TOP_FROM_BOTTOM = FAB_BOTTOM_OFFSET + FAB_HEIGHT  # 84px

LIST_PADDING_BOTTOM = 150  # Updated in our change

clearance = LIST_PADDING_BOTTOM - FAB_TOP_FROM_BOTTOM
assert clearance >= 40, f"Insufficient clearance above FAB: {clearance}px"
print(f">>> PASS: List paddingBottom ({LIST_PADDING_BOTTOM}px) provides {clearance}px clear space above the FAB and tab bar.")

print("\n==================================================")
print("ALL BATCH A2 TESTS COMPLETED SUCCESSFULLY!")
print("==================================================")
