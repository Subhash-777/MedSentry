#!/usr/bin/env python3
"""
MedSentry Screen Renderer - Screens 01 to 10 (Improvised High-Fidelity)
Exact 19:9 FHD+ (1080x2280 px) via 412x870 dp native scaling.
Directly mirrors React Native Expo components & Design System v2.
Zero empty space, authentic components, realistic clinical data.
"""

import os
import subprocess
import base64
import tempfile

BASE_DIR = '/home/subhash/projects/MedSentry'
OUTPUT_DIR = os.path.join(BASE_DIR, 'report_assets/app_screenshots')
LOGO_PATH = os.path.join(BASE_DIR, 'mobile-app/assets/logo.png')

os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(LOGO_PATH, 'rb') as f:
    LOGO_B64 = base64.b64encode(f.read()).decode('utf-8')

# Design Tokens (Design System v2: Organic & Balanced)
C = {
    'bg': '#F5F0E6',
    'surface': '#FDFAF6',
    'surfaceElevated': '#FFFFFF',
    'sageGreen': '#81C784',
    'sageGreenSolid': '#2E7D32',
    'mutedAccent': '#4DB6AC',
    'mutedAccentSolid': '#20756C',
    'warningAmber': '#E6B655',
    'warningAmberSolid': '#B8860B',
    'dangerClay': '#C97B63',
    'dangerClaySolid': '#A85A46',
    'textColor': '#37474F',
    'midSlate': '#546E7A',
    'warmCocoa': '#D7CCC8',
    'paleJade': '#A5D6A7',
    'border': 'rgba(215, 204, 200, 0.55)',
    'borderStrong': 'rgba(129, 199, 132, 0.45)',
}

def get_icon(name, size=20, color='currentColor', stroke=2):
    paths = {
        'home': '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
        'scan': '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M5 12h14"/>',
        'meds': '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
        'family': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        'ai': '<path d="M12 6V2H8"/><path d="m8 18-4 4V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z"/><path d="M2 12h2"/><path d="M9 11v2"/><path d="M15 11v2"/><path d="M20 12h2"/>',
        'journal': '<path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/><path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/>',
        'profile': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>',
        'admin': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
        'check': '<polyline points="20 6 9 17 4 12"/>',
        'checkCircle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
        'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        'plus': '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
        'arrowRight': '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
        'chevronRight': '<polyline points="9 18 15 12 9 6"/>',
        'chevronLeft': '<polyline points="15 18 9 12 15 6"/>',
        'search': '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
        'stethoscope': '<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>',
        'sparkles': '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1 1.275-1.275L12 3Z"/>',
        'cabinet': '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
        'copy': '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
        'alertTriangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
        'trash': '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
        'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        'mail': '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
        'lock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
        'eye': '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
        'shield': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
        'fileText': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><polyline points="14 2 14 8 20 8"/>',
        'pill': '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>',
        'camera': '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
        'fingerprint': '<path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>',
    }
    p = paths.get(name, paths['home'])
    return f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="{stroke}" stroke-linecap="round" stroke-linejoin="round">{p}</svg>'

def render_status_bar(is_dark=False, time_str="9:41"):
    col = "#FFFFFF" if is_dark else C['textColor']
    return f'''
    <div style="height:32px; display:flex; justify-content:space-between; align-items:center; padding:0 18px; font-size:13px; font-weight:700; color:{col}; z-index:99; position:relative;">
      <div>{time_str}</div>
      <div style="display:flex; align-items:center; gap:6px;">
        <span style="font-size:9.5px; font-weight:800; border:1.2px solid {col}; border-radius:4px; padding:1px 3px; line-height:1;">5G</span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="{col}" stroke-width="2.2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20" stroke-width="3"/></svg>
        <div style="display:flex; align-items:center; gap:1.5px;">
          <div style="width:19px; height:10px; border:1.5px solid {col}; border-radius:3px; padding:1px; display:flex;">
            <div style="width:90%; height:100%; background:{col}; border-radius:1px;"></div>
          </div>
          <div style="width:2px; height:4px; background:{col}; border-radius:0 1px 1px 0;"></div>
        </div>
      </div>
    </div>
    '''

def render_tab_bar(active='home', show_admin=False):
    tabs = [
        ('home', 'Home', 'home'),
        ('scan', 'Scan', 'scan'),
        ('meds', 'Meds', 'meds'),
        ('family', 'Family', 'family'),
        ('ai', 'AI', 'ai'),
        ('journal', 'Journal', 'journal'),
        ('profile', 'Profile', 'profile'),
    ]
    if show_admin:
        tabs.append(('admin', 'Admin', 'admin'))

    html = f'''
    <div style="position:absolute; bottom:0; left:0; right:0; height:62px; background:{C['surface']}; border-top:1px solid {C['border']}; display:flex; justify-content:space-around; align-items:center; padding:0 4px 6px 4px; z-index:90; box-shadow:0 -2px 10px rgba(141,110,99,0.06);">
    '''
    for key, label, icon_name in tabs:
        is_active = (key == active)
        icon_col = C['sageGreenSolid'] if is_active else C['midSlate']
        label_col = C['sageGreenSolid'] if is_active else C['midSlate']
        font_wt = "800" if is_active else "600"
        pill_style = f"background:rgba(129, 199, 132, 0.22); border:1px solid rgba(129, 199, 132, 0.5);" if is_active else "border:1px solid transparent;"
        html += f'''
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:44px; height:44px; border-radius:12px; font-size:10px; font-weight:{font_wt}; color:{label_col}; {pill_style}">
          <div style="color:{icon_col}; display:flex; align-items:center; justify-content:center;">{get_icon(icon_name, 17, icon_col, 2)}</div>
          <div style="margin-top:2px; font-size:9.5px; line-height:1;">{label}</div>
        </div>
        '''
    html += '</div>'
    return html

def wrap_screen(content, bg=None, is_dark=False, time_str="9:41", active_tab=None, show_admin=False, top_bar=None, no_padding=False):
    bg_col = bg or C['bg']
    bottom_h = 62 if active_tab else 16
    nav_html = render_tab_bar(active_tab, show_admin) if active_tab else f'''
    <div style="position:absolute; bottom:6px; left:0; right:0; display:flex; justify-content:center; align-items:center;">
      <div style="width:110px; height:4px; background:rgba(84,110,122,0.3); border-radius:2px;"></div>
    </div>
    '''
    top_bar_html = top_bar if top_bar else render_status_bar(is_dark, time_str)
    pad = "padding:0;" if no_padding else "padding:12px 16px;"

    return f'''<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
    * {{ box-sizing: border-box; margin: 0; padding: 0; user-select: none; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; }}
    body {{
      width: 412px;
      height: 870px;
      transform: scale(2.62136);
      transform-origin: 0 0;
      background: {bg_col};
      color: {C['textColor']};
      overflow: hidden;
      position: relative;
    }}
    .content-area {{
      position: absolute;
      top: 32px;
      left: 0;
      right: 0;
      bottom: {bottom_h}px;
      {pad}
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }}
    .card {{
      background: {C['surface']};
      border-radius: 16px;
      border: 1px solid {C['border']};
      padding: 13px;
      margin-bottom: 10px;
      box-shadow: 0 2px 8px rgba(141,110,99,0.06);
    }}
    .btn-primary {{
      background: {C['sageGreenSolid']};
      color: #FFFFFF;
      font-weight: 800;
      font-size: 13.5px;
      border-radius: 14px;
      height: 46px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(46,125,50,0.25);
    }}
    .badge-access {{ background: rgba(129, 199, 132, 0.22); color: {C['sageGreenSolid']}; border: 1px solid rgba(129, 199, 132, 0.5); border-radius: 8px; padding: 2px 7px; font-size: 10px; font-weight: 800; }}
    .badge-watch {{ background: rgba(230, 182, 85, 0.22); color: {C['warningAmberSolid']}; border: 1px solid rgba(230, 182, 85, 0.5); border-radius: 8px; padding: 2px 7px; font-size: 10px; font-weight: 800; }}
    .badge-reserve {{ background: rgba(201, 123, 99, 0.22); color: {C['dangerClaySolid']}; border: 1px solid rgba(201, 123, 99, 0.5); border-radius: 8px; padding: 2px 7px; font-size: 10px; font-weight: 800; }}
  </style>
</head>
<body>
  {top_bar_html}
  <div class="content-area">
    {content}
  </div>
  {nav_html}
</body>
</html>
'''

def render_screen(filename, html_content):
    out_path = os.path.join(OUTPUT_DIR, filename)
    with tempfile.NamedTemporaryFile(suffix='.html', mode='w', delete=False) as tf:
        tf.write(html_content)
        t_name = tf.name
    try:
        cmd = [
            '/usr/bin/brave',
            '--headless',
            '--no-sandbox',
            '--disable-gpu',
            '--window-size=1080,2280',
            f'--screenshot={out_path}',
            f'file://{t_name}'
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        sz = os.path.getsize(out_path)
        print(f"✓ [{filename}] ({sz:,} bytes)")
    finally:
        if os.path.exists(t_name):
            os.remove(t_name)

# ─────────────────────────────────────────────────────────────────────────────
# 1. Onboarding Screen
# ─────────────────────────────────────────────────────────────────────────────
def screen_01():
    content = f'''
    <div style="display:flex; flex-direction:column; justify-content:space-between; height:100%; padding:4px 0 10px 0;">
      <!-- Header Lockup -->
      <div style="display:flex; flex-direction:column; align-items:center; text-align:center;">
        <div style="width:84px; height:84px; border-radius:24px; background:rgba(165,214,167,0.3); border:1.5px solid rgba(129,199,132,0.45); display:flex; align-items:center; justify-content:center; box-shadow:0 6px 18px rgba(76,175,80,0.12); margin-bottom:10px;">
          <img src="data:image/png;base64,{LOGO_B64}" style="width:62px; height:62px; object-fit:contain;" />
        </div>
        <div style="font-size:25px; font-weight:800; color:{C['textColor']}; letter-spacing:1.5px;">
          MED<span style="color:{C['sageGreenSolid']};">SENTRY</span>
        </div>
        <div style="font-size:12px; font-weight:600; color:{C['midSlate']}; margin-top:2px;">Your Mindful Medication Guide</div>
        <div style="margin-top:6px; display:inline-flex; align-items:center; gap:6px; background:rgba(129,199,132,0.18); border:1px solid rgba(129,199,132,0.45); border-radius:12px; padding:3px 10px;">
          <span style="font-size:9.5px; font-weight:800; color:{C['sageGreenSolid']}; text-transform:uppercase; letter-spacing:0.5px;">WHO AWaRe 2023 Compliant</span>
        </div>
      </div>

      <!-- Features Stack -->
      <div style="display:flex; flex-direction:column; gap:9px; margin:8px 0;">
        <div class="card" style="display:flex; align-items:center; gap:12px; padding:11px 13px; margin-bottom:0;">
          <div style="width:40px; height:40px; border-radius:12px; background:rgba(165,214,167,0.35); display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']}; flex-shrink:0;">
            {get_icon('scan', 20, C['sageGreenSolid'], 2)}
          </div>
          <div>
            <div style="font-size:13.5px; font-weight:800; color:{C['textColor']};">Scan Medications &amp; Rx</div>
            <div style="font-size:10.5px; color:{C['midSlate']}; line-height:1.3; margin-top:1px;">Gemini Vision OCR parses prescriptions and 2D GS1 barcodes</div>
          </div>
        </div>

        <div class="card" style="display:flex; align-items:center; gap:12px; padding:11px 13px; margin-bottom:0;">
          <div style="width:40px; height:40px; border-radius:12px; background:rgba(165,214,167,0.35); display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']}; flex-shrink:0;">
            {get_icon('meds', 20, C['sageGreenSolid'], 2)}
          </div>
          <div>
            <div style="font-size:13.5px; font-weight:800; color:{C['textColor']};">Antimicrobial Stewardship</div>
            <div style="font-size:10.5px; color:{C['midSlate']}; line-height:1.3; margin-top:1px;">WHO Access, Watch &amp; Reserve classification for safe therapy</div>
          </div>
        </div>

        <div class="card" style="display:flex; align-items:center; gap:12px; padding:11px 13px; margin-bottom:0;">
          <div style="width:40px; height:40px; border-radius:12px; background:rgba(165,214,167,0.35); display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']}; flex-shrink:0;">
            {get_icon('family', 20, C['sageGreenSolid'], 2)}
          </div>
          <div>
            <div style="font-size:13.5px; font-weight:800; color:{C['textColor']};">Family Care Circle</div>
            <div style="font-size:10.5px; color:{C['midSlate']}; line-height:1.3; margin-top:1px;">Coordinate household inventory &amp; track senior dependents</div>
          </div>
        </div>

        <div class="card" style="display:flex; align-items:center; gap:12px; padding:11px 13px; margin-bottom:0;">
          <div style="width:40px; height:40px; border-radius:12px; background:rgba(165,214,167,0.35); display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']}; flex-shrink:0;">
            {get_icon('ai', 20, C['sageGreenSolid'], 2)}
          </div>
          <div>
            <div style="font-size:13.5px; font-weight:800; color:{C['textColor']};">AI Clinical Consultant</div>
            <div style="font-size:10.5px; color:{C['midSlate']}; line-height:1.3; margin-top:1px;">Clinical advisory on dosage timing, interactions &amp; food rules</div>
          </div>
        </div>
      </div>

      <!-- Trust Badges & Call to Action -->
      <div>
        <div style="display:flex; justify-content:center; gap:16px; margin-bottom:14px; font-size:10.5px; font-weight:700; color:{C['midSlate']};">
          <span style="display:flex; align-items:center; gap:4px;">{get_icon('shield', 13, C['sageGreenSolid'])} Row-Level Security</span>
          <span style="display:flex; align-items:center; gap:4px;">{get_icon('check', 13, C['sageGreenSolid'])} Offline ID Vault</span>
        </div>
        <div class="btn-primary" style="font-size:15px; letter-spacing:0.3px;">Get Started</div>
        <div style="text-align:center; margin-top:10px;">
          <span style="font-size:12px; color:{C['midSlate']};">Already have an account? </span>
          <span style="font-size:12px; font-weight:800; color:{C['sageGreenSolid']};">Sign In</span>
        </div>
      </div>
    </div>
    '''
    render_screen("01_onboarding_welcome.png", wrap_screen(content))

# ─────────────────────────────────────────────────────────────────────────────
# 2. Auth Sign In Screen (Full Layout, No Awkward Gap)
# ─────────────────────────────────────────────────────────────────────────────
def screen_02():
    content = f'''
    <div style="display:flex; flex-direction:column; justify-content:space-between; height:100%; padding:2px 0;">
      <!-- Hero Header -->
      <div style="display:flex; flex-direction:column; align-items:center; margin-bottom:6px;">
        <div style="width:62px; height:62px; border-radius:18px; background:rgba(165,214,167,0.3); border:1.5px solid rgba(129,199,132,0.45); display:flex; align-items:center; justify-content:center; margin-bottom:6px;">
          <img src="data:image/png;base64,{LOGO_B64}" style="width:44px; height:44px; object-fit:contain;" />
        </div>
        <div style="font-size:21px; font-weight:800; color:{C['textColor']}; letter-spacing:1px;">
          MED<span style="color:{C['sageGreenSolid']};">SENTRY</span>
        </div>
        <div style="font-size:11px; color:{C['midSlate']}; margin-top:1px;">Your Mindful Medication Guide</div>
      </div>

      <!-- Sign In Card -->
      <div class="card" style="padding:16px 16px; margin-bottom:10px;">
        <div style="font-size:17px; font-weight:800; color:{C['textColor']}; margin-bottom:12px;">Welcome back</div>

        <div style="font-size:10px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:4px;">EMAIL</div>
        <div style="display:flex; align-items:center; height:42px; background:rgba(215,204,200,0.22); border-radius:12px; border:1px solid {C['border']}; padding:0 12px; gap:10px; margin-bottom:10px;">
          <div style="color:{C['midSlate']};">{get_icon('mail', 16, C['midSlate'])}</div>
          <div style="font-size:12.5px; color:{C['textColor']}; font-weight:600;">alex.sharma@medsentry.health</div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span style="font-size:10px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.6px;">PASSWORD</span>
          <span style="font-size:10.5px; font-weight:700; color:{C['sageGreenSolid']};">Forgot?</span>
        </div>
        <div style="display:flex; align-items:center; height:42px; background:rgba(215,204,200,0.22); border-radius:12px; border:1px solid {C['border']}; padding:0 12px; gap:10px; margin-bottom:10px;">
          <div style="color:{C['midSlate']};">{get_icon('lock', 16, C['midSlate'])}</div>
          <div style="font-size:14px; color:{C['textColor']}; flex:1; letter-spacing:2px;">••••••••••••</div>
          <div style="color:{C['midSlate']};">{get_icon('eye', 16, C['midSlate'])}</div>
        </div>

        <div style="display:flex; align-items:center; gap:8px; margin-bottom:14px;">
          <div style="width:16px; height:16px; border-radius:4px; background:{C['sageGreenSolid']}; display:flex; align-items:center; justify-content:center; color:#FFF;">
            {get_icon('check', 11, '#FFF', 3)}
          </div>
          <span style="font-size:11.5px; color:{C['midSlate']}; font-weight:600;">Remember this device for 30 days</span>
        </div>

        <div class="btn-primary" style="height:44px; margin-bottom:10px;">Sign In</div>

        <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
          <div style="flex:1; height:1px; background:{C['border']};"></div>
          <div style="font-size:10px; font-weight:800; color:{C['midSlate']};">OR</div>
          <div style="flex:1; height:1px; background:{C['border']};"></div>
        </div>

        <div style="height:40px; background:#FFFFFF; border:1px solid {C['border']}; border-radius:12px; display:flex; align-items:center; justify-content:center; gap:9px; margin-bottom:8px;">
          <div style="width:18px; height:18px; border-radius:9px; background:rgba(219,68,55,0.1); border:1px solid rgba(219,68,55,0.3); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; color:#DB4437;">G</div>
          <div style="font-size:12px; font-weight:700; color:{C['textColor']};">Continue with Google</div>
        </div>

        <div style="height:40px; background:rgba(129,199,132,0.12); border:1px solid rgba(129,199,132,0.35); border-radius:12px; display:flex; align-items:center; justify-content:center; gap:8px;">
          <div style="color:{C['sageGreenSolid']};">{get_icon('fingerprint', 15, C['sageGreenSolid'])}</div>
          <div style="font-size:11.5px; font-weight:700; color:{C['sageGreenSolid']};">Biometric Quick Sign In</div>
        </div>
      </div>

      <!-- Clinical Security Credentials Banner (Fills Space Authentically) -->
      <div class="card" style="padding:11px 13px; margin-bottom:10px; background:rgba(129,199,132,0.12); border-color:rgba(129,199,132,0.35);">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
          <div style="color:{C['sageGreenSolid']};">{get_icon('shield', 15, C['sageGreenSolid'])}</div>
          <div style="font-size:11px; font-weight:800; color:{C['sageGreenSolid']};">Clinical Tenant Isolation</div>
        </div>
        <div style="font-size:10px; color:{C['midSlate']}; line-height:1.35;">
          End-to-end encrypted biometric credentials with zero third-party telemetry. Offline health pass verification verified for 2026.10 build.
        </div>
      </div>

      <!-- Footer & Links -->
      <div style="text-align:center;">
        <div style="display:flex; justify-content:center; align-items:center; gap:6px; margin-bottom:6px;">
          <span style="font-size:12px; color:{C['midSlate']};">Don't have an account?</span>
          <span style="font-size:12px; font-weight:800; color:{C['mutedAccentSolid']};">Sign Up</span>
        </div>
        <div style="display:inline-flex; align-items:center; gap:5px; font-size:10px; font-weight:700; color:{C['midSlate']}; background:rgba(215,204,200,0.35); padding:4px 10px; border-radius:10px;">
          {get_icon('shield', 11, C['midSlate'])} Protected by Supabase Row-Level Security
        </div>
      </div>
    </div>
    '''
    render_screen("02_auth_signin.png", wrap_screen(content))

# ─────────────────────────────────────────────────────────────────────────────
# 3. Auth Sign Up Screen (Full Layout)
# ─────────────────────────────────────────────────────────────────────────────
def screen_03():
    content = f'''
    <div style="display:flex; flex-direction:column; justify-content:space-between; height:100%; padding:2px 0;">
      <!-- Hero Header -->
      <div style="display:flex; flex-direction:column; align-items:center; margin-bottom:6px;">
        <div style="width:58px; height:58px; border-radius:18px; background:rgba(165,214,167,0.3); border:1.5px solid rgba(129,199,132,0.45); display:flex; align-items:center; justify-content:center; margin-bottom:6px;">
          <img src="data:image/png;base64,{LOGO_B64}" style="width:40px; height:40px; object-fit:contain;" />
        </div>
        <div style="font-size:20px; font-weight:800; color:{C['textColor']}; letter-spacing:0.8px;">Create Your Account</div>
        <div style="font-size:11px; color:{C['midSlate']}; margin-top:1px;">Join MedSentry for personalized medication tracking</div>
      </div>

      <!-- Sign Up Form Card -->
      <div class="card" style="padding:14px 15px; margin-bottom:8px;">
        <div style="font-size:9.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:3px;">FULL NAME</div>
        <div style="display:flex; align-items:center; height:38px; background:rgba(215,204,200,0.22); border-radius:11px; border:1px solid {C['border']}; padding:0 11px; gap:9px; margin-bottom:8px;">
          <div style="color:{C['midSlate']};">{get_icon('user', 15, C['midSlate'])}</div>
          <div style="font-size:12px; color:{C['textColor']}; font-weight:600;">Dr. Alex Sharma</div>
        </div>

        <div style="font-size:9.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:3px;">EMAIL ADDRESS</div>
        <div style="display:flex; align-items:center; height:38px; background:rgba(215,204,200,0.22); border-radius:11px; border:1px solid {C['border']}; padding:0 11px; gap:9px; margin-bottom:8px;">
          <div style="color:{C['midSlate']};">{get_icon('mail', 15, C['midSlate'])}</div>
          <div style="font-size:12px; color:{C['textColor']}; font-weight:600;">alex.sharma@medsentry.health</div>
        </div>

        <div style="font-size:9.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:3px;">PASSWORD</div>
        <div style="display:flex; align-items:center; height:38px; background:rgba(215,204,200,0.22); border-radius:11px; border:1px solid {C['border']}; padding:0 11px; gap:9px; margin-bottom:8px;">
          <div style="color:{C['midSlate']};">{get_icon('lock', 15, C['midSlate'])}</div>
          <div style="font-size:13px; color:{C['textColor']}; flex:1; letter-spacing:2px;">••••••••••••</div>
          <div style="color:{C['midSlate']};">{get_icon('eye', 15, C['midSlate'])}</div>
        </div>

        <!-- Account Profile Role Pills -->
        <div style="font-size:9.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:5px;">PROFILE ROLE</div>
        <div style="display:flex; gap:8px; margin-bottom:10px;">
          <div style="flex:1; background:rgba(129,199,132,0.22); border:1.5px solid {C['sageGreenSolid']}; border-radius:10px; padding:6px; text-align:center; font-size:11px; font-weight:800; color:{C['sageGreenSolid']};">
            ✓ Caregiver / Patient
          </div>
          <div style="flex:1; background:rgba(215,204,200,0.2); border:1px solid {C['border']}; border-radius:10px; padding:6px; text-align:center; font-size:11px; font-weight:600; color:{C['midSlate']};">
            Clinician / Doctor
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
          <div style="width:16px; height:16px; border-radius:4px; background:{C['sageGreenSolid']}; display:flex; align-items:center; justify-content:center; color:#FFF; flex-shrink:0;">
            {get_icon('check', 11, '#FFF', 3)}
          </div>
          <div style="font-size:10.5px; color:{C['midSlate']}; font-weight:500; line-height:1.3;">
            I accept the <span style="color:{C['sageGreenSolid']}; font-weight:700;">Terms</span> &amp; <span style="color:{C['sageGreenSolid']}; font-weight:700;">Clinical Privacy Policy</span>
          </div>
        </div>

        <div class="btn-primary" style="height:42px; margin-bottom:8px;">Create Account</div>

        <div style="display:flex; justify-content:center; align-items:center; gap:6px;">
          <span style="font-size:11.5px; color:{C['midSlate']};">Already have an account?</span>
          <span style="font-size:11.5px; font-weight:800; color:{C['mutedAccentSolid']};">Sign In</span>
        </div>
      </div>

      <!-- Trust Credentials Card -->
      <div class="card" style="padding:10px 12px; margin-bottom:8px; background:rgba(77,182,172,0.12); border-color:rgba(77,182,172,0.35);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span style="font-size:10.5px; font-weight:800; color:{C['mutedAccentSolid']};">Encrypted Offline ID Vault</span>
          <span style="font-size:9.5px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.2); padding:1px 6px; border-radius:5px;">AES-256</span>
        </div>
        <div style="font-size:10px; color:{C['midSlate']}; line-height:1.35;">
          Every account provisions an isolated cryptographic namespace under Supabase Row-Level Security, preventing cross-tenant leakage.
        </div>
      </div>

      <!-- Trust Seal -->
      <div style="text-align:center;">
        <div style="display:inline-flex; align-items:center; gap:5px; font-size:10px; font-weight:700; color:{C['midSlate']}; background:rgba(215,204,200,0.35); padding:4px 10px; border-radius:10px;">
          {get_icon('shield', 11, C['sageGreenSolid'])} 256-bit AES Clinical Vault Encryption
        </div>
      </div>
    </div>
    '''
    render_screen("03_auth_signup.png", wrap_screen(content))

# ─────────────────────────────────────────────────────────────────────────────
# 4. Auth Email Verification Screen (Full Checklist Layout)
# ─────────────────────────────────────────────────────────────────────────────
def screen_04():
    content = f'''
    <div style="display:flex; flex-direction:column; justify-content:space-between; height:100%; padding:4px 0 6px 0;">
      <!-- Hero Emblem -->
      <div style="display:flex; flex-direction:column; align-items:center; margin-bottom:6px;">
        <div style="width:68px; height:68px; border-radius:24px; background:rgba(165,214,167,0.35); border:2px solid {C['sageGreen']}; display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']}; box-shadow:0 6px 20px rgba(76,175,80,0.15); margin-bottom:8px;">
          {get_icon('checkCircle', 36, C['sageGreenSolid'], 2.5)}
        </div>
        <div style="font-size:22px; font-weight:800; color:{C['textColor']};">Email Verified!</div>
        <div style="font-size:11.5px; color:{C['midSlate']}; text-align:center; max-width:320px; line-height:1.35; margin-top:3px;">
          Your address <span style="font-weight:700; color:{C['textColor']};">alex.sharma@medsentry.health</span> is confirmed. Account credentials registered.
        </div>
      </div>

      <!-- Clinical Security Checklist Card -->
      <div class="card" style="padding:14px; margin-bottom:10px;">
        <div style="font-size:10px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:10px;">ACTIVE CLINICAL MODULES</div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(215,204,200,0.2); padding:7px 10px; border-radius:9px;">
            <div style="font-size:11.5px; font-weight:700;">Supabase Auth Session</div>
            <span style="background:rgba(129,199,132,0.22); color:{C['sageGreenSolid']}; font-size:9.5px; font-weight:800; padding:2px 7px; border-radius:6px;">✓ ACTIVE</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(215,204,200,0.2); padding:7px 10px; border-radius:9px;">
            <div style="font-size:11.5px; font-weight:700;">Family Circle Association</div>
            <span style="background:rgba(129,199,132,0.22); color:{C['sageGreenSolid']}; font-size:9.5px; font-weight:800; padding:2px 7px; border-radius:6px;">✓ OWNER</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(215,204,200,0.2); padding:7px 10px; border-radius:9px;">
            <div style="font-size:11.5px; font-weight:700;">Offline Medical ID Vault</div>
            <span style="background:rgba(129,199,132,0.22); color:{C['sageGreenSolid']}; font-size:9.5px; font-weight:800; padding:2px 7px; border-radius:6px;">✓ READY</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(215,204,200,0.2); padding:7px 10px; border-radius:9px;">
            <div style="font-size:11.5px; font-weight:700;">WHO AWaRe Engine</div>
            <span style="background:rgba(129,199,132,0.22); color:{C['sageGreenSolid']}; font-size:9.5px; font-weight:800; padding:2px 7px; border-radius:6px;">✓ SYNCHRONIZED</span>
          </div>
        </div>
      </div>

      <!-- Quick Biometric Pass Activation Card -->
      <div class="card" style="padding:12px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="width:34px; height:34px; border-radius:10px; background:rgba(129,199,132,0.18); display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']};">
            {get_icon('fingerprint', 18, C['sageGreenSolid'])}
          </div>
          <div>
            <div style="font-size:12px; font-weight:800;">Biometric Instant Unlock</div>
            <div style="font-size:10px; color:{C['midSlate']};">Pixel Imprint &amp; Face ID access enabled</div>
          </div>
        </div>
        <div style="width:36px; height:20px; border-radius:10px; background:{C['sageGreenSolid']}; display:flex; align-items:center; justify-content:flex-end; padding:2px;">
          <div style="width:16px; height:16px; border-radius:8px; background:#FFF;"></div>
        </div>
      </div>

      <!-- Action Button & Auto-redirect -->
      <div>
        <div class="btn-primary" style="gap:8px; margin-bottom:8px;">
          <span>Continue to Dashboard</span>
          <span>{get_icon('arrowRight', 16, '#FFF', 2)}</span>
        </div>
        <div style="text-align:center; font-size:11px; color:{C['midSlate']}; font-weight:500;">
          Automatic redirection enabled in 5 seconds
        </div>
      </div>
    </div>
    '''
    render_screen("04_auth_email_verification.png", wrap_screen(content))

# ─────────────────────────────────────────────────────────────────────────────
# 5. Home Dashboard Morning (Filled Down, Authentic Timeline)
# ─────────────────────────────────────────────────────────────────────────────
def screen_05():
    content = f'''
    <!-- Top greeting header -->
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
      <div>
        <div style="display:flex; align-items:center; gap:5px; font-size:12px; color:{C['midSlate']}; font-weight:600; margin-bottom:2px;">
          <span>☀️</span> Good morning,
        </div>
        <div style="font-size:22px; font-weight:800; color:{C['textColor']}; letter-spacing:-0.4px;">Dr. Alex Sharma</div>
      </div>
      <div style="width:42px; height:42px; border-radius:21px; background:rgba(129,199,132,0.2); border:2px solid {C['sageGreen']}; display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']};">
        {get_icon('stethoscope', 22, C['sageGreenSolid'], 2)}
      </div>
    </div>

    <!-- Stats row -->
    <div class="card" style="display:flex; justify-content:space-around; align-items:center; padding:9px 12px; margin-bottom:9px;">
      <div style="text-align:center;"><div style="font-size:18px; font-weight:800;">3</div><div style="font-size:9.5px; font-weight:600; color:{C['midSlate']}; text-transform:uppercase;">Active</div></div>
      <div style="width:1px; height:24px; background:{C['border']};"></div>
      <div style="text-align:center;"><div style="font-size:18px; font-weight:800;">1</div><div style="font-size:9.5px; font-weight:600; color:{C['midSlate']}; text-transform:uppercase;">Taken today</div></div>
      <div style="width:1px; height:24px; background:{C['border']};"></div>
      <div style="text-align:center;"><div style="font-size:18px; font-weight:800; color:{C['sageGreenSolid']};">100%</div><div style="font-size:9.5px; font-weight:600; color:{C['midSlate']}; text-transform:uppercase;">Adherence</div></div>
    </div>

    <!-- Upcoming dose hero card -->
    <div class="card" style="border-color:{C['borderStrong']}; padding:13px; margin-bottom:9px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span style="background:rgba(129,199,132,0.18); border:1px solid rgba(129,199,132,0.4); color:{C['sageGreenSolid']}; font-size:9px; font-weight:800; padding:2px 7px; border-radius:10px;">UPCOMING DOSE</span>
        <span style="background:rgba(129,199,132,0.18); border:1px solid rgba(129,199,132,0.4); color:{C['sageGreenSolid']}; font-size:9px; font-weight:800; padding:2px 7px; border-radius:10px;">TODAY</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:24px; font-weight:800; letter-spacing:-0.5px; line-height:1;">08:00 AM</div>
          <div style="font-size:12px; font-weight:600; color:{C['midSlate']}; margin:3px 0 8px 0;">Amoxicillin 500mg · 1 capsule</div>
          <div style="display:inline-flex; align-items:center; gap:5px; background:{C['sageGreenSolid']}; color:#FFF; font-size:11px; font-weight:700; padding:4px 11px; border-radius:9px;">
            <span>✓</span> Log Dose
          </div>
        </div>
        <div style="width:46px; height:46px; border-radius:23px; background:rgba(129,199,132,0.18); border:1.5px solid rgba(129,199,132,0.4); display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']};">
          {get_icon('meds', 22, C['sageGreenSolid'], 2)}
        </div>
      </div>
    </div>

    <!-- Row: Adherence Ring & Quick Scan -->
    <div style="display:flex; gap:9px; margin-bottom:9px;">
      <div class="card" style="flex:1; margin-bottom:0; text-align:center; padding:10px;">
        <div style="font-size:9px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">ADHERENCE</div>
        <div style="width:54px; height:54px; border-radius:27px; border:5px solid rgba(129,199,132,0.22); margin:0 auto 4px auto; display:flex; align-items:center; justify-content:center;">
          <div style="width:40px; height:40px; border-radius:20px; border:2.5px solid {C['sageGreenSolid']}; display:flex; align-items:center; justify-content:center; font-size:12.5px; font-weight:800; color:{C['sageGreenSolid']};">100%</div>
        </div>
        <div style="font-size:10px; font-weight:700; color:{C['sageGreenSolid']};">On track</div>
      </div>
      <div style="flex:0.85; background:{C['mutedAccentSolid']}; border-radius:16px; padding:12px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 3px 10px rgba(32,117,108,0.2);">
        <div>
          <div style="color:#FFF; margin-bottom:4px;">{get_icon('scan', 20, '#FFF', 2)}</div>
          <div style="font-size:15.5px; font-weight:800; color:#FFF; line-height:1.15;">Quick<br/>Scan</div>
        </div>
        <div style="width:26px; height:26px; border-radius:13px; background:rgba(255,255,255,0.22); display:flex; align-items:center; justify-content:center; color:#FFF; font-size:13px;">→</div>
      </div>
    </div>

    <!-- Row: My Meds & Family -->
    <div style="display:flex; gap:9px; margin-bottom:9px;">
      <div class="card" style="flex:1; margin-bottom:0; padding:10px;">
        <div style="width:26px; height:26px; border-radius:8px; background:rgba(215,204,200,0.4); display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']}; margin-bottom:6px;">
          {get_icon('journal', 15, C['sageGreenSolid'], 2)}
        </div>
        <div style="font-size:12.5px; font-weight:800; line-height:1.2; margin-bottom:2px;">My Medications</div>
        <div style="font-size:10px; font-weight:700; color:{C['sageGreenSolid']};">3 active courses</div>
      </div>
      <div class="card" style="flex:0.9; margin-bottom:0; padding:10px; display:flex; flex-direction:column; justify-content:space-between;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:9px; font-weight:800; color:{C['midSlate']}; letter-spacing:0.5px;">FAMILY</span>
          <span style="width:6px; height:6px; border-radius:3px; background:{C['sageGreenSolid']};"></span>
        </div>
        <div style="margin:2px 0;">
          <div style="font-size:9.5px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.18); padding:2px 6px; border-radius:7px; display:inline-block;">✓ Synced</div>
        </div>
        <div style="font-size:10px; color:{C['midSlate']}; font-weight:600;">All members good</div>
      </div>
    </div>

    <!-- AI Consultant Shortcut -->
    <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; margin-bottom:9px;">
      <div>
        <div style="display:flex; align-items:center; gap:5px; margin-bottom:2px;">
          <span style="color:{C['sageGreenSolid']}; font-size:11px;">✨</span>
          <span style="font-size:12.5px; font-weight:800;">AI Consultant</span>
        </div>
        <div style="font-size:10px; color:{C['midSlate']}; font-weight:500;">Ask about your medications or scan an image</div>
      </div>
      <div style="width:28px; height:28px; border-radius:14px; background:rgba(165,214,167,0.35); display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']};">
        {get_icon('ai', 16, C['sageGreenSolid'], 2)}
      </div>
    </div>

    <!-- Admin portal banner -->
    <div class="card" style="border-color:{C['borderStrong']}; display:flex; justify-content:space-between; align-items:center; padding:9px 12px; margin-bottom:9px;">
      <div style="display:flex; align-items:center; gap:9px;">
        <div style="width:28px; height:28px; border-radius:14px; background:rgba(129,199,132,0.18); display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']};">
          {get_icon('admin', 16, C['sageGreenSolid'], 2)}
        </div>
        <div>
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:11.5px; font-weight:800;">Admin Control Console</span>
            <span style="background:{C['sageGreenSolid']}; color:#FFF; font-size:7.5px; font-weight:800; padding:1px 5px; border-radius:5px;">ADMIN</span>
          </div>
          <div style="font-size:9.5px; color:{C['midSlate']};">Manage users, audit logs &amp; AMR heatmaps</div>
        </div>
      </div>
      <span style="color:{C['sageGreenSolid']}; font-size:13px; font-weight:800;">›</span>
    </div>

    <!-- Today's Intake Schedule Card (Fills Down Gracefully) -->
    <div class="card" style="padding:10px 12px; margin-bottom:0; background:rgba(215,204,200,0.18);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:7px;">
        <span style="font-size:9.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px;">TODAY'S DOSAGE SCHEDULE</span>
        <span style="font-size:9px; font-weight:700; color:{C['sageGreenSolid']};">Day 5 of 7</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:5px; font-size:10.5px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span>08:00 AM · Amoxicillin 500mg</span>
          <span style="color:{C['sageGreenSolid']}; font-weight:800; font-size:10px;">✓ Taken 08:05 AM</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span>02:00 PM · Amoxicillin 500mg</span>
          <span style="color:{C['warningAmberSolid']}; font-weight:700; font-size:10px;">Scheduled (After lunch)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span>08:00 PM · Amoxicillin + Paracetamol</span>
          <span style="color:{C['midSlate']}; font-weight:600; font-size:10px;">Pending</span>
        </div>
      </div>
    </div>
    '''
    render_screen("05_home_dashboard_morning.png", wrap_screen(content, active_tab='home', show_admin=True))

# ─────────────────────────────────────────────────────────────────────────────
# 6. Home Dashboard Evening (Filled Down, Evening Doses & Symptoms)
# ─────────────────────────────────────────────────────────────────────────────
def screen_06():
    content = f'''
    <!-- Top greeting header -->
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
      <div>
        <div style="display:flex; align-items:center; gap:5px; font-size:12px; color:{C['midSlate']}; font-weight:600; margin-bottom:2px;">
          <span>🌙</span> Good evening,
        </div>
        <div style="font-size:22px; font-weight:800; color:{C['textColor']}; letter-spacing:-0.4px;">Dr. Alex Sharma</div>
      </div>
      <div style="width:42px; height:42px; border-radius:21px; background:rgba(129,199,132,0.2); border:2px solid {C['sageGreen']}; display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']};">
        {get_icon('stethoscope', 22, C['sageGreenSolid'], 2)}
      </div>
    </div>

    <!-- Stats row -->
    <div class="card" style="display:flex; justify-content:space-around; align-items:center; padding:9px 12px; margin-bottom:9px;">
      <div style="text-align:center;"><div style="font-size:18px; font-weight:800;">3</div><div style="font-size:9.5px; font-weight:600; color:{C['midSlate']}; text-transform:uppercase;">Active</div></div>
      <div style="width:1px; height:24px; background:{C['border']};"></div>
      <div style="text-align:center;"><div style="font-size:18px; font-weight:800; color:{C['sageGreenSolid']};">2</div><div style="font-size:9.5px; font-weight:600; color:{C['midSlate']}; text-transform:uppercase;">Taken today</div></div>
      <div style="width:1px; height:24px; background:{C['border']};"></div>
      <div style="text-align:center;"><div style="font-size:18px; font-weight:800; color:{C['sageGreenSolid']};">100%</div><div style="font-size:9.5px; font-weight:600; color:{C['midSlate']}; text-transform:uppercase;">Adherence</div></div>
    </div>

    <!-- Upcoming evening dose hero card -->
    <div class="card" style="border-color:{C['borderStrong']}; padding:13px; margin-bottom:9px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span style="background:rgba(230,182,85,0.2); border:1px solid rgba(230,182,85,0.45); color:{C['warningAmberSolid']}; font-size:9px; font-weight:800; padding:2px 7px; border-radius:10px;">FINAL DAILY DOSE</span>
        <span style="background:rgba(129,199,132,0.18); border:1px solid rgba(129,199,132,0.4); color:{C['sageGreenSolid']}; font-size:9px; font-weight:800; padding:2px 7px; border-radius:10px;">TONIGHT</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:24px; font-weight:800; letter-spacing:-0.5px; line-height:1;">08:00 PM</div>
          <div style="font-size:12px; font-weight:600; color:{C['midSlate']}; margin:3px 0 8px 0;">Amoxicillin 500mg · 1 capsule</div>
          <div style="display:inline-flex; align-items:center; gap:5px; background:{C['sageGreenSolid']}; color:#FFF; font-size:11px; font-weight:700; padding:4px 11px; border-radius:9px;">
            <span>✓</span> Log Evening Dose
          </div>
        </div>
        <div style="width:46px; height:46px; border-radius:23px; background:rgba(230,182,85,0.2); border:1.5px solid rgba(230,182,85,0.45); display:flex; align-items:center; justify-content:center; color:{C['warningAmberSolid']};">
          {get_icon('meds', 22, C['warningAmberSolid'], 2)}
        </div>
      </div>
    </div>

    <!-- Row: Adherence Ring & Quick Scan -->
    <div style="display:flex; gap:9px; margin-bottom:9px;">
      <div class="card" style="flex:1; margin-bottom:0; text-align:center; padding:10px;">
        <div style="font-size:9px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">ADHERENCE</div>
        <div style="width:54px; height:54px; border-radius:27px; border:5px solid rgba(129,199,132,0.22); margin:0 auto 4px auto; display:flex; align-items:center; justify-content:center;">
          <div style="width:40px; height:40px; border-radius:20px; border:2.5px solid {C['sageGreenSolid']}; display:flex; align-items:center; justify-content:center; font-size:12.5px; font-weight:800; color:{C['sageGreenSolid']};">100%</div>
        </div>
        <div style="font-size:10px; font-weight:700; color:{C['sageGreenSolid']};">Full compliance</div>
      </div>
      <div style="flex:0.85; background:{C['mutedAccentSolid']}; border-radius:16px; padding:12px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 3px 10px rgba(32,117,108,0.2);">
        <div>
          <div style="color:#FFF; margin-bottom:4px;">{get_icon('scan', 20, '#FFF', 2)}</div>
          <div style="font-size:15.5px; font-weight:800; color:#FFF; line-height:1.15;">Quick<br/>Scan</div>
        </div>
        <div style="width:26px; height:26px; border-radius:13px; background:rgba(255,255,255,0.22); display:flex; align-items:center; justify-content:center; color:#FFF; font-size:13px;">→</div>
      </div>
    </div>

    <!-- Row: My Meds & Family -->
    <div style="display:flex; gap:9px; margin-bottom:9px;">
      <div class="card" style="flex:1; margin-bottom:0; padding:10px;">
        <div style="width:26px; height:26px; border-radius:8px; background:rgba(215,204,200,0.4); display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']}; margin-bottom:6px;">
          {get_icon('journal', 15, C['sageGreenSolid'], 2)}
        </div>
        <div style="font-size:12.5px; font-weight:800; line-height:1.2; margin-bottom:2px;">My Medications</div>
        <div style="font-size:10px; font-weight:700; color:{C['sageGreenSolid']};">3 active courses</div>
      </div>
      <div class="card" style="flex:0.9; margin-bottom:0; padding:10px; display:flex; flex-direction:column; justify-content:space-between;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:9px; font-weight:800; color:{C['midSlate']}; letter-spacing:0.5px;">FAMILY</span>
          <span style="width:6px; height:6px; border-radius:3px; background:{C['sageGreenSolid']};"></span>
        </div>
        <div style="margin:2px 0;">
          <div style="font-size:9.5px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.18); padding:2px 6px; border-radius:7px; display:inline-block;">✓ Synced</div>
        </div>
        <div style="font-size:10px; color:{C['midSlate']}; font-weight:600;">Sunita &amp; Aarav OK</div>
      </div>
    </div>

    <!-- AI Consultant Shortcut -->
    <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; margin-bottom:9px;">
      <div>
        <div style="display:flex; align-items:center; gap:5px; margin-bottom:2px;">
          <span style="color:{C['sageGreenSolid']}; font-size:11px;">✨</span>
          <span style="font-size:12.5px; font-weight:800;">AI Consultant</span>
        </div>
        <div style="font-size:10px; color:{C['midSlate']}; font-weight:500;">Ask about your medications or scan an image</div>
      </div>
      <div style="width:28px; height:28px; border-radius:14px; background:rgba(165,214,167,0.35); display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']};">
        {get_icon('ai', 16, C['sageGreenSolid'], 2)}
      </div>
    </div>

    <!-- Admin portal banner -->
    <div class="card" style="border-color:{C['borderStrong']}; display:flex; justify-content:space-between; align-items:center; padding:9px 12px; margin-bottom:9px;">
      <div style="display:flex; align-items:center; gap:9px;">
        <div style="width:28px; height:28px; border-radius:14px; background:rgba(129,199,132,0.18); display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']};">
          {get_icon('admin', 16, C['sageGreenSolid'], 2)}
        </div>
        <div>
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:11.5px; font-weight:800;">Admin Control Console</span>
            <span style="background:{C['sageGreenSolid']}; color:#FFF; font-size:7.5px; font-weight:800; padding:1px 5px; border-radius:5px;">ADMIN</span>
          </div>
          <div style="font-size:9.5px; color:{C['midSlate']};">Manage users, audit logs &amp; AMR heatmaps</div>
        </div>
      </div>
      <span style="color:{C['sageGreenSolid']}; font-size:13px; font-weight:800;">›</span>
    </div>

    <!-- Evening Adherence & Recovery Card (Fills Down Gracefully) -->
    <div class="card" style="padding:10px 12px; margin-bottom:0; background:rgba(77,182,172,0.12); border-color:rgba(77,182,172,0.35);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
        <span style="font-size:9.5px; font-weight:800; color:{C['mutedAccentSolid']}; text-transform:uppercase;">EVENING CLINICAL CHECK-IN</span>
        <span style="font-size:9px; font-weight:800; color:{C['sageGreenSolid']};">75% Recovered</span>
      </div>
      <div style="font-size:10.5px; color:{C['midSlate']}; line-height:1.35;">
        Day 5 of 7 antibiotic course almost complete. Finish remaining 2 days to ensure zero residual bacterial resistance mutation.
      </div>
    </div>
    '''
    render_screen("06_home_dashboard_evening.png", wrap_screen(content, active_tab='home', show_admin=True))

# ─────────────────────────────────────────────────────────────────────────────
# 7. OCR Camera Viewfinder (Pristine High-Fidelity)
# ─────────────────────────────────────────────────────────────────────────────
def screen_07():
    content = f'''
    <div style="position:absolute; inset:0; background:#0B1012; display:flex; flex-direction:column; justify-content:space-between; padding:44px 16px 20px 16px;">
      <!-- Top Mode Selector -->
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px; z-index:10;">
        <div style="display:flex; background:rgba(255,255,255,0.15); border-radius:24px; padding:3px; backdrop-filter:blur(10px);">
          <div style="padding:7px 16px; border-radius:20px; font-size:11.5px; font-weight:700; color:rgba(255,255,255,0.65); display:flex; align-items:center; gap:6px;">
            {get_icon('pill', 14, 'rgba(255,255,255,0.65)')} Medicine Strip
          </div>
          <div style="padding:7px 18px; border-radius:20px; font-size:11.5px; font-weight:800; background:{C['sageGreenSolid']}; color:#FFF; display:flex; align-items:center; gap:6px; box-shadow:0 2px 8px rgba(0,0,0,0.3);">
            {get_icon('fileText', 14, '#FFF')} Prescription
          </div>
        </div>

        <div style="background:rgba(46,125,50,0.35); border:1px solid {C['sageGreen']}; border-radius:12px; padding:4px 12px; display:flex; align-items:center; gap:6px;">
          <span style="font-size:11px;">✨</span>
          <span style="font-size:10.5px; font-weight:800; color:#FFF; letter-spacing:0.3px;">AI Handwriting Recognition: ACTIVE</span>
        </div>
      </div>

      <!-- Real Camera Viewfinder with Prescription Document Inside -->
      <div style="position:relative; width:330px; height:420px; margin:0 auto; display:flex; align-items:center; justify-content:center;">
        <!-- Bracket Corners -->
        <div style="position:absolute; top:0; left:0; width:28px; height:28px; border-top:3.5px solid {C['sageGreen']}; border-left:3.5px solid {C['sageGreen']}; border-top-left-radius:8px;"></div>
        <div style="position:absolute; top:0; right:0; width:28px; height:28px; border-top:3.5px solid {C['sageGreen']}; border-right:3.5px solid {C['sageGreen']}; border-top-right-radius:8px;"></div>
        <div style="position:absolute; bottom:0; left:0; width:28px; height:28px; border-bottom:3.5px solid {C['sageGreen']}; border-left:3.5px solid {C['sageGreen']}; border-bottom-left-radius:8px;"></div>
        <div style="position:absolute; bottom:0; right:0; width:28px; height:28px; border-bottom:3.5px solid {C['sageGreen']}; border-right:3.5px solid {C['sageGreen']}; border-bottom-right-radius:8px;"></div>

        <!-- Scanned Document Simulation Inside Viewfinder -->
        <div style="width:280px; height:370px; background:#FDFBF7; border-radius:6px; box-shadow:0 8px 30px rgba(0,0,0,0.6); padding:16px 14px; display:flex; flex-direction:column; justify-content:space-between; font-family:sans-serif; position:relative; overflow:hidden;">
          <!-- Rx Header -->
          <div>
            <div style="display:flex; justify-content:space-between; border-bottom:1.5px solid #37474F; padding-bottom:6px; margin-bottom:8px;">
              <div>
                <div style="font-size:11px; font-weight:800; color:#1B5E20;">APEX HEALTH CLINIC</div>
                <div style="font-size:8px; color:#546E7A;">Dr. R. K. Mehta (MD, General Medicine)</div>
              </div>
              <div style="font-size:8px; color:#546E7A; text-align:right;">MCI-84920<br/>Date: 2026-10-08</div>
            </div>

            <div style="font-size:8.5px; color:#37474F; margin-bottom:8px;">
              <span style="font-weight:700;">Patient:</span> Dr. Alex Sharma (38/M) · <span style="font-weight:700;">Wt:</span> 74kg
            </div>

            <!-- OCR Highlight Box 1 -->
            <div style="border:1.5px solid #2E7D32; background:rgba(46,125,50,0.12); border-radius:4px; padding:4px 6px; margin-bottom:8px; position:relative;">
              <div style="position:absolute; top:-7px; right:4px; background:#2E7D32; color:#FFF; font-size:7px; font-weight:800; padding:0 4px; border-radius:3px;">98% CONFIDENCE</div>
              <div style="font-size:10.5px; font-weight:800; color:#1B5E20;">Rx 1. Tab. Amoxicillin 500mg</div>
              <div style="font-size:8.5px; color:#37474F;">Sig: 1 cap TID (08-14-20) x 7 days after meals</div>
            </div>

            <!-- OCR Highlight Box 2 -->
            <div style="border:1.5px solid #2E7D32; background:rgba(46,125,50,0.12); border-radius:4px; padding:4px 6px; position:relative;">
              <div style="position:absolute; top:-7px; right:4px; background:#2E7D32; color:#FFF; font-size:7px; font-weight:800; padding:0 4px; border-radius:3px;">99% CONFIDENCE</div>
              <div style="font-size:10.5px; font-weight:800; color:#1B5E20;">Rx 2. Tab. Paracetamol 650mg</div>
              <div style="font-size:8.5px; color:#37474F;">Sig: 1 tab SOS for fever x 3 days</div>
            </div>
          </div>

          <!-- Doc Footer -->
          <div style="border-top:1px dashed #B0BEC5; padding-top:6px; display:flex; justify-content:space-between; align-items:flex-end;">
            <div style="font-size:7.5px; color:#78909C;">Diagnosis: Acute Bacterial Pharyngitis</div>
            <div style="font-size:8px; font-style:italic; color:#1B5E20; font-weight:700;">Dr. Mehta [Sign]</div>
          </div>

          <!-- Laser Scan Beam -->
          <div style="position:absolute; top:45%; left:0; right:0; height:2.5px; background:{C['sageGreen']}; box-shadow:0 0 12px 3px rgba(129,199,132,0.9);"></div>
        </div>

        <!-- Tag below viewfinder -->
        <div style="position:absolute; bottom:-30px; background:rgba(0,0,0,0.7); border:1px solid rgba(255,255,255,0.2); border-radius:12px; padding:4px 12px; font-size:10.5px; font-weight:700; color:#FFF;">
          Prescription detected · Hold still to capture
        </div>
      </div>

      <!-- Bottom Camera Controls -->
      <div style="display:flex; justify-content:space-around; align-items:center; padding:10px 10px 4px 10px; z-index:10;">
        <div style="width:44px; height:44px; border-radius:22px; background:rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; color:#FFF;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" stroke-width="2"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <!-- Shutter Button -->
        <div style="width:72px; height:72px; border-radius:36px; border:3px solid {C['sageGreen']}; padding:4px; display:flex; align-items:center; justify-content:center;">
          <div style="width:100%; height:100%; border-radius:50%; background:#FFFFFF; display:flex; align-items:center; justify-content:center; box-shadow:0 0 16px rgba(129,199,132,0.6);">
            <div style="width:24px; height:24px; border-radius:12px; background:{C['sageGreenSolid']};"></div>
          </div>
        </div>
        <div style="width:44px; height:44px; border-radius:22px; background:rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; color:#FFF;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
        </div>
      </div>
    </div>
    '''
    render_screen("07_ocr_camera_viewfinder.png", wrap_screen(content, bg='#0B1012', is_dark=True, active_tab='scan', show_admin=True))

# ─────────────────────────────────────────────────────────────────────────────
# 8. OCR Clinical Verification (Full Height Layout)
# ─────────────────────────────────────────────────────────────────────────────
def screen_08():
    content = f'''
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:9px;">
      <div style="display:flex; align-items:center; gap:10px;">
        <div style="width:32px; height:32px; border-radius:10px; background:{C['surface']}; border:1px solid {C['border']}; display:flex; align-items:center; justify-content:center; color:{C['textColor']};">
          {get_icon('chevronLeft', 18, C['textColor'])}
        </div>
        <div>
          <div style="font-size:18px; font-weight:800; color:{C['textColor']};">Verify Prescription</div>
          <div style="font-size:10.5px; color:{C['midSlate']};">OCR &amp; Gemini AI clinical review</div>
        </div>
      </div>
      <div style="background:rgba(129,199,132,0.2); border:1px solid rgba(129,199,132,0.5); border-radius:8px; padding:3px 8px; font-size:10px; font-weight:800; color:{C['sageGreenSolid']};">
        ✓ 98.4% Match
      </div>
    </div>

    <!-- Success banner -->
    <div style="background:rgba(129,199,132,0.18); border:1px solid rgba(129,199,132,0.45); border-radius:12px; padding:8px 11px; margin-bottom:8px; display:flex; align-items:center; gap:8px;">
      <div style="color:{C['sageGreenSolid']};">{get_icon('checkCircle', 16, C['sageGreenSolid'], 2.5)}</div>
      <div style="font-size:10.5px; font-weight:700; color:{C['sageGreenSolid']}; line-height:1.3;">
        2 medications extracted successfully. Review clinical details before saving to database.
      </div>
    </div>

    <!-- Patient Details Card -->
    <div class="card" style="padding:11px; margin-bottom:8px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span style="font-size:9.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.6px;">PATIENT DETAILS</span>
        <span style="font-size:9px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.18); padding:2px 6px; border-radius:6px;">Profile Matched</span>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:11px;">
        <div>
          <div style="font-size:9px; color:{C['midSlate']};">Patient Name</div>
          <div style="font-weight:800; color:{C['textColor']};">Dr. Alex Sharma</div>
        </div>
        <div>
          <div style="font-size:9px; color:{C['midSlate']};">Age / Gender</div>
          <div style="font-weight:700; color:{C['textColor']};">38 yrs · Male</div>
        </div>
        <div>
          <div style="font-size:9px; color:{C['midSlate']};">Weight &amp; Height</div>
          <div style="font-weight:700; color:{C['textColor']};">74.0 kg · 178 cm</div>
        </div>
        <div>
          <div style="font-size:9px; color:{C['midSlate']};">Diagnosis</div>
          <div style="font-weight:800; color:{C['sageGreenSolid']};">Bacterial Pharyngitis</div>
        </div>
      </div>
    </div>

    <!-- Prescribing Authority Card -->
    <div class="card" style="padding:11px; margin-bottom:8px;">
      <div style="font-size:9.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:6px;">PRESCRIBING AUTHORITY</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:11px;">
        <div>
          <div style="font-size:9px; color:{C['midSlate']};">Doctor Name</div>
          <div style="font-weight:800; color:{C['textColor']};">Dr. R. K. Mehta (MD)</div>
        </div>
        <div>
          <div style="font-size:9px; color:{C['midSlate']};">Registration No</div>
          <div style="font-weight:700; font-family:'JetBrains Mono'; color:{C['textColor']};">MCI-84920</div>
        </div>
        <div>
          <div style="font-size:9px; color:{C['midSlate']};">Prescription Date</div>
          <div style="font-weight:700; color:{C['textColor']};">2026-10-08</div>
        </div>
        <div>
          <div style="font-size:9px; color:{C['midSlate']};">Validity Status</div>
          <div style="font-weight:800; color:{C['sageGreenSolid']};">Valid (2 days ago)</div>
        </div>
      </div>
    </div>

    <!-- Identified Drugs Summary Card -->
    <div class="card" style="border-color:{C['borderStrong']}; padding:11px; margin-bottom:8px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span style="font-size:9.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.6px;">IDENTIFIED MEDICATIONS (2)</span>
        <span class="badge-access">WHO AWaRe Verified</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:5px;">
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(215,204,200,0.2); padding:5px 8px; border-radius:7px;">
          <div style="font-size:11px; font-weight:700;">1. Amoxicillin 500mg (1 cap TID · 7d)</div>
          <span class="badge-access" style="font-size:8.5px;">Access Tier</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(215,204,200,0.2); padding:5px 8px; border-radius:7px;">
          <div style="font-size:11px; font-weight:700;">2. Paracetamol 650mg (1 tab SOS · 3d)</div>
          <span style="background:rgba(77,182,172,0.2); color:{C['mutedAccentSolid']}; font-size:8.5px; font-weight:800; padding:2px 6px; border-radius:6px;">Symptomatic</span>
        </div>
      </div>
    </div>

    <!-- Extracted Dosage Instructions & Rules (Fills Down Authentically) -->
    <div class="card" style="padding:10px 12px; margin-bottom:8px; background:rgba(215,204,200,0.18);">
      <div style="font-size:9.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">DOSAGE REGIMEN &amp; MEAL RULES</div>
      <div style="font-size:10px; color:{C['midSlate']}; line-height:1.35;">
        • <strong>Amoxicillin 500mg:</strong> Take every 8 hours after food (08:00, 14:00, 20:00). Maintain adequate hydration.<br/>
        • <strong>Paracetamol 650mg:</strong> Take as needed for fever above 100°F. Space at least 6 hours apart.
      </div>
    </div>

    <!-- Clinical Advisory Note -->
    <div class="card" style="padding:9px 11px; margin-bottom:10px; background:rgba(129,199,132,0.1); border-color:rgba(129,199,132,0.35);">
      <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
        <div style="color:{C['sageGreenSolid']};">{get_icon('shield', 13, C['sageGreenSolid'])}</div>
        <div style="font-size:10px; font-weight:800; color:{C['sageGreenSolid']};">Clinical Cross-Check Complete</div>
      </div>
      <div style="font-size:9.5px; color:{C['midSlate']}; line-height:1.3;">
        No adverse contraindications found with patient health history (No Known Drug Allergies). Recommended course length aligns with stewardship guidelines.
      </div>
    </div>

    <!-- Action Buttons Pinned at Bottom -->
    <div style="display:flex; flex-direction:column; gap:7px; margin-top:auto;">
      <div class="btn-primary" style="gap:8px; height:44px;">
        <span>Confirm &amp; Proceed to Medication Setup</span>
        <span>{get_icon('arrowRight', 16, '#FFF', 2)}</span>
      </div>
      <div style="height:36px; border:1px solid {C['border']}; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:11.5px; font-weight:700; color:{C['midSlate']}; background:{C['surface']};">
        Retake / Upload Another Image
      </div>
    </div>
    '''
    render_screen("08_ocr_clinical_verification.png", wrap_screen(content))

# ─────────────────────────────────────────────────────────────────────────────
# 9. OCR Medication Table (Structured Parsed Courses)
# ─────────────────────────────────────────────────────────────────────────────
def screen_09():
    content = f'''
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
      <div style="width:32px; height:32px; border-radius:10px; background:{C['surface']}; border:1px solid {C['border']}; display:flex; align-items:center; justify-content:center; color:{C['textColor']};">
        {get_icon('chevronLeft', 18, C['textColor'])}
      </div>
      <div>
        <div style="font-size:18px; font-weight:800; color:{C['textColor']};">Extracted Medications</div>
        <div style="font-size:10.5px; color:{C['midSlate']};">Review dosage, frequency &amp; durations</div>
      </div>
    </div>

    <!-- Medicine Card 1: Amoxicillin -->
    <div class="card" style="border-color:{C['borderStrong']}; padding:12px; margin-bottom:9px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
        <div>
          <div style="font-size:15px; font-weight:800; color:{C['textColor']};">Amoxicillin 500mg</div>
          <div style="font-size:10.5px; color:{C['midSlate']};">Broad-Spectrum Penicillin Antibiotic</div>
        </div>
        <span class="badge-access">AWaRe · Access</span>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin:6px 0;">
        <div style="background:rgba(215,204,200,0.22); border-radius:8px; padding:6px 8px;">
          <div style="font-size:8.5px; font-weight:700; color:{C['midSlate']}; text-transform:uppercase;">DOSAGE</div>
          <div style="font-size:11.5px; font-weight:800; color:{C['textColor']};">1 capsule</div>
        </div>
        <div style="background:rgba(215,204,200,0.22); border-radius:8px; padding:6px 8px;">
          <div style="font-size:8.5px; font-weight:700; color:{C['midSlate']}; text-transform:uppercase;">FREQUENCY</div>
          <div style="font-size:11.5px; font-weight:800; color:{C['textColor']};">3× daily (TID)</div>
        </div>
        <div style="background:rgba(215,204,200,0.22); border-radius:8px; padding:6px 8px;">
          <div style="font-size:8.5px; font-weight:700; color:{C['midSlate']}; text-transform:uppercase;">DURATION</div>
          <div style="font-size:11.5px; font-weight:800; color:{C['textColor']};">7 days (21 caps)</div>
        </div>
        <div style="background:rgba(215,204,200,0.22); border-radius:8px; padding:6px 8px;">
          <div style="font-size:8.5px; font-weight:700; color:{C['midSlate']}; text-transform:uppercase;">TIMING</div>
          <div style="font-size:11.5px; font-weight:800; color:{C['textColor']};">After food</div>
        </div>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed {C['border']}; padding-top:6px; margin-top:4px;">
        <span style="font-size:9.5px; font-style:italic; color:{C['midSlate']};">"Complete entire 7-day course without interruption."</span>
        <div style="display:flex; gap:6px;">
          <span style="font-size:10px; font-weight:700; color:{C['midSlate']}; background:rgba(215,204,200,0.3); padding:2px 7px; border-radius:6px;">Edit</span>
          <span style="font-size:10px; font-weight:800; color:#FFF; background:{C['sageGreenSolid']}; padding:2px 7px; border-radius:6px;">✓ Verified</span>
        </div>
      </div>
    </div>

    <!-- Medicine Card 2: Paracetamol -->
    <div class="card" style="padding:12px; margin-bottom:9px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
        <div>
          <div style="font-size:15px; font-weight:800; color:{C['textColor']};">Paracetamol 650mg</div>
          <div style="font-size:10.5px; color:{C['midSlate']};">Analgesic &amp; Antipyretic</div>
        </div>
        <span style="background:rgba(77,182,172,0.2); color:{C['mutedAccentSolid']}; font-size:9.5px; font-weight:800; padding:2px 7px; border-radius:8px;">OTC / Symptomatic</span>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin:6px 0;">
        <div style="background:rgba(215,204,200,0.22); border-radius:8px; padding:6px 8px;">
          <div style="font-size:8.5px; font-weight:700; color:{C['midSlate']}; text-transform:uppercase;">DOSAGE</div>
          <div style="font-size:11.5px; font-weight:800; color:{C['textColor']};">1 tablet</div>
        </div>
        <div style="background:rgba(215,204,200,0.22); border-radius:8px; padding:6px 8px;">
          <div style="font-size:8.5px; font-weight:700; color:{C['midSlate']}; text-transform:uppercase;">FREQUENCY</div>
          <div style="font-size:11.5px; font-weight:800; color:{C['textColor']};">As needed (SOS)</div>
        </div>
        <div style="background:rgba(215,204,200,0.22); border-radius:8px; padding:6px 8px;">
          <div style="font-size:8.5px; font-weight:700; color:{C['midSlate']}; text-transform:uppercase;">DURATION</div>
          <div style="font-size:11.5px; font-weight:800; color:{C['textColor']};">3 days</div>
        </div>
        <div style="background:rgba(215,204,200,0.22); border-radius:8px; padding:6px 8px;">
          <div style="font-size:8.5px; font-weight:700; color:{C['midSlate']}; text-transform:uppercase;">CONDITION</div>
          <div style="font-size:11.5px; font-weight:800; color:{C['textColor']};">If fever &gt; 100°F</div>
        </div>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:6px; border-top:1px dashed {C['border']}; padding-top:6px; margin-top:4px;">
        <span style="font-size:10px; font-weight:700; color:{C['midSlate']}; background:rgba(215,204,200,0.3); padding:2px 7px; border-radius:6px;">Edit</span>
        <span style="font-size:10px; font-weight:800; color:#FFF; background:{C['sageGreenSolid']}; padding:2px 7px; border-radius:6px;">✓ Verified</span>
      </div>
    </div>

    <!-- Daily Dosage Schedule Preview Card (Fills Down Authentically) -->
    <div class="card" style="padding:10px 12px; margin-bottom:9px; background:rgba(215,204,200,0.18);">
      <div style="font-size:9.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:5px;">DAILY INTAKE TIMINGS PREVIEW</div>
      <div style="display:flex; justify-content:space-between; font-size:10.5px;">
        <div><strong>Morning:</strong> 08:00 AM</div>
        <div><strong>Afternoon:</strong> 02:00 PM</div>
        <div><strong>Night:</strong> 08:00 PM</div>
      </div>
    </div>

    <!-- Adherence Advisory Callout -->
    <div class="card" style="padding:9px 11px; margin-bottom:12px; background:rgba(230,182,85,0.14); border-color:rgba(230,182,85,0.4);">
      <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
        <span style="font-size:11px;">⚠️</span>
        <span style="font-size:10px; font-weight:800; color:{C['warningAmberSolid']};">Antibiotic Course Adherence Rule</span>
      </div>
      <div style="font-size:9.5px; color:{C['midSlate']}; line-height:1.3;">
        Even if pharyngitis symptoms improve after 48 hours, finish the complete 7-day Amoxicillin course to prevent bacterial recurrence and resistance development.
      </div>
    </div>

    <!-- Action Button Pinned at Bottom -->
    <div style="margin-top:auto;">
      <div class="btn-primary" style="gap:8px; height:46px;">
        <span>Save 2 Medications to Tracker</span>
        <span>{get_icon('check', 16, '#FFF', 2.5)}</span>
      </div>
    </div>
    '''
    render_screen("09_ocr_medication_table.png", wrap_screen(content))

# ─────────────────────────────────────────────────────────────────────────────
# 10. Medicine Detail Access Tier (Full Height Layout)
# ─────────────────────────────────────────────────────────────────────────────
def screen_10():
    content = f'''
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <div style="display:flex; align-items:center; gap:10px;">
        <div style="width:32px; height:32px; border-radius:10px; background:{C['surface']}; border:1px solid {C['border']}; display:flex; align-items:center; justify-content:center; color:{C['textColor']};">
          {get_icon('chevronLeft', 18, C['textColor'])}
        </div>
        <div>
          <div style="font-size:18px; font-weight:800; color:{C['textColor']};">Medicine Detail</div>
          <div style="font-size:10.5px; color:{C['midSlate']};">Clinical monograph &amp; dosing</div>
        </div>
      </div>
    </div>

    <!-- Drug Hero Card -->
    <div class="card" style="padding:14px; text-align:center; margin-bottom:8px;">
      <div style="width:52px; height:52px; border-radius:26px; background:rgba(129,199,132,0.22); border:1.5px solid rgba(129,199,132,0.45); display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']}; margin:0 auto 8px auto;">
        {get_icon('pill', 26, C['sageGreenSolid'], 2)}
      </div>
      <div style="font-size:20px; font-weight:800; color:{C['textColor']};">Amoxicillin 500mg</div>
      <div style="font-size:11.5px; color:{C['midSlate']}; margin-bottom:8px;">Broad-Spectrum Penicillin Antibiotic</div>
      <div style="display:inline-block;">
        <span class="badge-access" style="font-size:10.5px; padding:3px 10px;">AWaRe · Access Tier</span>
      </div>
    </div>

    <!-- WHO Antibiotic Stewardship Card -->
    <div class="card" style="padding:11px; margin-bottom:8px; background:rgba(129,199,132,0.1); border-color:rgba(129,199,132,0.35);">
      <div style="display:flex; align-items:center; gap:6px; margin-bottom:3px;">
        <div style="color:{C['sageGreenSolid']};">{get_icon('shield', 14, C['sageGreenSolid'])}</div>
        <div style="font-size:11px; font-weight:800; color:{C['sageGreenSolid']};">WHO Antibiotic Stewardship</div>
      </div>
      <div style="font-size:10px; color:{C['midSlate']}; line-height:1.35;">
        Access group antibiotics have a wide range of activity against common pathogens and demonstrate lower resistance potential. Recommended as first-line therapy.
      </div>
    </div>

    <!-- Common Indications & Safety -->
    <div class="card" style="padding:11px; margin-bottom:8px;">
      <div style="font-size:9.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:3px;">COMMON INDICATIONS</div>
      <div style="font-size:11.5px; font-weight:700; color:{C['textColor']}; margin-bottom:6px;">Pharyngitis, Sinusitis, Otitis Media, Lower Respiratory Infections</div>
      <div style="font-size:9.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:3px;">SAFETY &amp; CONTRAINDICATIONS</div>
      <div style="font-size:10.5px; color:{C['midSlate']}; line-height:1.3;">
        Contraindicated in patients with severe penicillin allergy. Take with water after meals to prevent mild GI upset.
      </div>
    </div>

    <!-- Drug-Drug Interactions Check Card -->
    <div class="card" style="padding:10px 12px; margin-bottom:8px; background:rgba(215,204,200,0.18);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
        <span style="font-size:9.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase;">PROFILE INTERACTIONS CHECK</span>
        <span style="font-size:9px; font-weight:800; color:{C['sageGreenSolid']};">0 Conflicts Flagged</span>
      </div>
      <div style="font-size:10px; color:{C['midSlate']}; line-height:1.3;">
        Compatible with patient's chronic profile. Maintain 2-hour interval if co-administering multivalent cations (calcium/iron).
      </div>
    </div>

    <!-- Pharmacokinetics & Clearance Card -->
    <div class="card" style="padding:10px 12px; margin-bottom:8px;">
      <div style="font-size:9.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:3px;">PHARMACOKINETICS &amp; CLEARANCE</div>
      <div style="font-size:10px; color:{C['midSlate']}; line-height:1.35;">
        Peak plasma: 1–2 hours · Half-life: ~1.0 hour · Renal excretion: ~60% unchanged. Standard adult dosing window optimal.
      </div>
    </div>

    <!-- Schedule Setup Card -->
    <div class="card" style="padding:11px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="font-size:12px; font-weight:800;">Schedule Setup</div>
        <div style="font-size:10.5px; color:{C['midSlate']};">3 doses daily · 08:00, 14:00, 20:00</div>
      </div>
      <span style="background:{C['sageGreenSolid']}; color:#FFF; font-size:10px; font-weight:800; padding:3px 8px; border-radius:8px;">7 Days</span>
    </div>

    <!-- Action Button Pinned at Bottom -->
    <div>
      <div class="btn-primary" style="gap:8px; height:46px;">
        <span>Add to Medication Tracker</span>
        <span>{get_icon('plus', 16, '#FFF', 2.5)}</span>
      </div>
    </div>
    '''
    render_screen("10_medicine_detail_access_tier.png", wrap_screen(content))

# ─────────────────────────────────────────────────────────────────────────────
# Master Execution Pipeline
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("="*60)
    print("Rendering Screens 01 to 10 (Improvised High-Fidelity)...")
    print("="*60)
    screen_01()
    screen_02()
    screen_03()
    screen_04()
    screen_05()
    screen_06()
    screen_07()
    screen_08()
    screen_09()
    screen_10()
    print("Screens 01 to 10 completed successfully!")
