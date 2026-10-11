#!/usr/bin/env python3
"""
MedSentry Screen Renderer - Screens 11 to 30 (Improvised High-Fidelity)
Exact 19:9 FHD+ (1080x2280 px) via 412x870 dp native scaling.
Directly mirrors React Native Expo components & Design System v2.
Zero empty space, authentic components, realistic clinical data, vivid blurred modals.
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
        'shield': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
        'fileText': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><polyline points="14 2 14 8 20 8"/>',
        'pill': '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>',
        'heart': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
        'leaf': '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
        'dna': '<path d="m2 15 6 6"/><path d="m4.5 12.5 6 6"/><path d="m7 10 6 6"/><path d="m9.5 7.5 6 6"/><path d="m12 5 6 6"/><path d="m14.5 2.5 6 6"/><path d="M20 9a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-3a2 2 0 0 0-2 2v1"/><path d="M4 15a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2v-1"/>',
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
# 11. Medicine Detail Batch Info (Ciprofloxacin 500mg, GS1 DataMatrix)
# ─────────────────────────────────────────────────────────────────────────────
def screen_11():
    content = f'''
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:7px;">
      <div style="width:34px; height:34px; border-radius:10px; background:{C['surface']}; border:1px solid {C['border']}; display:flex; align-items:center; justify-content:center; color:{C['textColor']};">
        {get_icon('chevronLeft', 18, C['textColor'])}
      </div>
      <div>
        <div style="font-size:18px; font-weight:800; color:{C['textColor']};">Medicine Detail</div>
        <div style="font-size:10px; color:{C['midSlate']};">GS1 DataMatrix &amp; clinical monograph</div>
      </div>
    </div>

    <!-- Drug Hero Card -->
    <div class="card" style="padding:10px; margin-bottom:6px; text-align:center;">
      <div style="width:44px; height:44px; border-radius:22px; background:rgba(230,182,85,0.18); border:1.5px solid rgba(230,182,85,0.45); display:flex; align-items:center; justify-content:center; color:{C['warningAmberSolid']}; margin:0 auto 4px auto;">
        {get_icon('pill', 22, C['warningAmberSolid'], 2)}
      </div>
      <div style="font-size:17px; font-weight:800; color:{C['textColor']}; margin-bottom:1px;">Ciprofloxacin 500mg</div>
      <div style="font-size:10.5px; color:{C['midSlate']}; margin-bottom:5px;">Fluoroquinolone Antibacterial Agent</div>
      <div>
        <span class="badge-watch" style="font-size:9.5px; padding:2px 8px;">AWaRe · Watch Tier</span>
      </div>
    </div>

    <!-- GS1 Barcode & Batch Details Card -->
    <div class="card" style="border-color:rgba(230,182,85,0.45); padding:9px 11px; margin-bottom:6px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
        <span style="font-size:9px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px;">GS1 DATAMATRIX VERIFICATION</span>
        <span style="font-size:8.5px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.2); padding:1px 5px; border-radius:5px;">✓ AUTHENTIC</span>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px; font-size:10px;">
        <div>
          <div style="font-size:8px; color:{C['midSlate']};">Batch Number</div>
          <div style="font-weight:800; font-family:'JetBrains Mono'; color:{C['textColor']};">CIP-2024-91B</div>
        </div>
        <div>
          <div style="font-size:8px; color:{C['midSlate']};">Expiry Date</div>
          <div style="font-weight:800; color:{C['sageGreenSolid']};">Nov 2026 (Valid)</div>
        </div>
        <div>
          <div style="font-size:8px; color:{C['midSlate']};">Global GTIN</div>
          <div style="font-weight:700; font-family:'JetBrains Mono'; color:{C['textColor']};">08901083002319</div>
        </div>
        <div>
          <div style="font-size:8px; color:{C['midSlate']};">Manufacturer</div>
          <div style="font-weight:700; color:{C['textColor']};">Cipla Healthcare Ltd</div>
        </div>
      </div>
    </div>

    <!-- Pharmacokinetics & Renal Elimination Card -->
    <div class="card" style="padding:9px 11px; margin-bottom:6px;">
      <div style="font-size:9px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:5px;">PHARMACOKINETICS &amp; CLEARANCE</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px; font-size:10px;">
        <div style="background:rgba(215,204,200,0.18); border-radius:7px; padding:5px 7px;">
          <div style="font-size:8px; color:{C['midSlate']};">Bioavailability</div>
          <div style="font-weight:700; color:{C['textColor']};">70–80% Rapid Oral</div>
        </div>
        <div style="background:rgba(215,204,200,0.18); border-radius:7px; padding:5px 7px;">
          <div style="font-size:8px; color:{C['midSlate']};">Elimination Half-Life</div>
          <div style="font-weight:700; color:{C['textColor']};">t½ ≈ 4.0 Hours</div>
        </div>
        <div style="background:rgba(215,204,200,0.18); border-radius:7px; padding:5px 7px;">
          <div style="font-size:8px; color:{C['midSlate']};">Primary Clearance</div>
          <div style="font-weight:700; color:{C['textColor']};">Renal (40-50% Unchanged)</div>
        </div>
        <div style="background:rgba(215,204,200,0.18); border-radius:7px; padding:5px 7px;">
          <div style="font-size:8px; color:{C['midSlate']};">Hepatic Interaction</div>
          <div style="font-weight:700; color:{C['warningAmberSolid']};">CYP1A2 Moderate Inhibitor</div>
        </div>
      </div>
    </div>

    <!-- WHO Watch Tier Stewardship Warning -->
    <div class="card" style="background:rgba(230,182,85,0.12); border-color:rgba(230,182,85,0.45); padding:8px 11px; margin-bottom:6px;">
      <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
        <div style="color:{C['warningAmberSolid']};">{get_icon('alertTriangle', 13, C['warningAmberSolid'])}</div>
        <div style="font-size:10.5px; font-weight:800; color:{C['warningAmberSolid']};">WHO Watch Tier Protocol</div>
      </div>
      <div style="font-size:9.5px; color:{C['midSlate']}; line-height:1.35;">
        Watch group antibiotics carry higher resistance potential. Recommended only for specific, culture-confirmed infections. Complete full prescribed course to prevent resistant strains.
      </div>
    </div>

    <!-- Active Course Schedule Card -->
    <div class="card" style="padding:8px 11px; margin-bottom:6px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:11px; font-weight:800; color:{C['textColor']};">Active Course Schedule</div>
          <div style="font-size:9.5px; color:{C['midSlate']};">1 tablet · 2× daily (08:00 AM, 08:00 PM)</div>
        </div>
        <div style="background:{C['warningAmberSolid']}; color:#FFF; font-size:9px; font-weight:800; padding:2px 7px; border-radius:5px;">Day 2 / 10</div>
      </div>
    </div>

    <!-- Food, Mineral & Drug Interaction Advisory Card -->
    <div class="card" style="background:rgba(77,182,172,0.12); border-color:rgba(77,182,172,0.35); padding:7px 11px; margin-bottom:5px;">
      <div style="font-size:9px; font-weight:800; color:{C['mutedAccentSolid']}; text-transform:uppercase; margin-bottom:2px;">FOOD &amp; MINERAL INTERACTION ADVISORY</div>
      <div style="font-size:9px; color:{C['midSlate']}; line-height:1.35;">
        Space antacids, calcium, iron, and dairy supplements at least <b>2 hours apart</b> to prevent divalent cation chelation and reduced absorption.
      </div>
    </div>

    <!-- Storage & Hydration Guidelines Card -->
    <div class="card" style="padding:7px 11px; margin-bottom:5px; background:rgba(215,204,200,0.18);">
      <div style="font-size:9px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; margin-bottom:2px;">STORAGE &amp; CLINICAL HYDRATION</div>
      <div style="font-size:9px; color:{C['textColor']}; line-height:1.35;">
        Store below 25°C in original moisture-proof blister. Maintain generous daily fluid intake (2.5L/day) to prevent crystalluria.
      </div>
    </div>

    <!-- Adverse Effects & Black Box Warnings Card -->
    <div class="card" style="padding:7px 11px; margin-bottom:5px; border-left:3px solid {C['dangerClaySolid']};">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
        <span style="font-size:8.5px; font-weight:800; color:{C['dangerClaySolid']}; text-transform:uppercase;">ADVERSE REACTIONS &amp; BOXED WARNING</span>
        <span style="font-size:7.5px; font-weight:800; color:{C['dangerClaySolid']}; background:rgba(201,123,99,0.15); padding:1px 5px; border-radius:4px;">CDSCO / FDA</span>
      </div>
      <div style="font-size:8.5px; color:{C['textColor']}; line-height:1.35; margin-bottom:3px;">
        <b>Tendinitis Warning:</b> Discontinue immediately if pain, swelling, or inflammation in Achilles tendon occurs. Avoid strenuous exercise.
      </div>
      <div style="display:flex; justify-content:space-between; font-size:8px; color:{C['midSlate']};">
        <span>Nausea: 5.2% · Dizziness: 2.1%</span>
        <span>Phototoxicity: Apply SPF 50+</span>
      </div>
    </div>

    <!-- Clinical Discontinuation Triggers Card -->
    <div class="card" style="padding:6px 11px; margin-bottom:7px; background:rgba(129,199,132,0.1); border-color:rgba(129,199,132,0.35);">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:9px; font-weight:800; color:{C['sageGreenSolid']};">Safety Monitoring Status: Active</div>
          <div style="font-size:8px; color:{C['midSlate']};">Zero hypersensitivity or QT prolongation risk detected</div>
        </div>
        <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.25); padding:1px 5px; border-radius:4px;">CLEARED</span>
      </div>
    </div>

    <!-- Dual Action Buttons -->
    <div style="display:flex; flex-direction:column; gap:5px; margin-top:4px;">
      <div class="btn-primary" style="gap:8px; height:42px;">
        <span>Update Batch &amp; Schedule Course</span>
        <span>{get_icon('check', 16, '#FFF', 2)}</span>
      </div>
      <div style="height:36px; border:1px solid {C['border']}; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:{C['midSlate']}; background:{C['surface']};">
        Report Suspected Quality Issue
      </div>
    </div>
    '''
    render_screen("11_medicine_detail_batch_info.png", wrap_screen(content))

# ─────────────────────────────────────────────────────────────────────────────
# 12. Medications Adherence List (Direct mirror of MyMedicationsScreen.tsx)
# ─────────────────────────────────────────────────────────────────────────────
def screen_12():
    content = f'''
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
      <div>
        <div style="font-size:20px; font-weight:800; color:{C['textColor']};">My Medications</div>
        <div style="font-size:10px; color:{C['midSlate']};">Active prescriptions &amp; dosing</div>
      </div>
      <div style="background:rgba(129,199,132,0.2); border:1px solid rgba(129,199,132,0.45); border-radius:12px; padding:3px 9px; font-size:9.5px; font-weight:800; color:{C['sageGreenSolid']};">
        3 Active Courses
      </div>
    </div>

    <!-- Search Bar -->
    <div style="display:flex; align-items:center; height:34px; background:{C['surface']}; border-radius:12px; border:1px solid {C['border']}; padding:0 11px; gap:8px; margin-bottom:6px;">
      <div style="color:{C['midSlate']};">{get_icon('search', 14, C['midSlate'])}</div>
      <div style="font-size:11px; color:{C['midSlate']};">Search medications or conditions...</div>
    </div>

    <!-- Next Scheduled Dose Alert Banner -->
    <div class="card" style="padding:7px 11px; margin-bottom:6px; background:rgba(129,199,132,0.12); border-color:rgba(129,199,132,0.35); display:flex; justify-content:space-between; align-items:center;">
      <div style="display:flex; align-items:center; gap:7px;">
        <span style="font-size:14px;">⏰</span>
        <div>
          <div style="font-size:10.5px; font-weight:800; color:{C['sageGreenSolid']};">Next Dose in 1h 35m (20:00 PM)</div>
          <div style="font-size:8.5px; color:{C['midSlate']};">Ciprofloxacin 500mg (1 tab) · Take with water after dinner</div>
        </div>
      </div>
      <span style="font-size:8.5px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.25); padding:2px 5px; border-radius:4px;">Scheduled</span>
    </div>

    <!-- Filter chips -->
    <div style="display:flex; gap:5px; margin-bottom:6px;">
      <div style="background:{C['sageGreenSolid']}; color:#FFF; font-size:9.5px; font-weight:800; padding:2px 9px; border-radius:10px;">All (3)</div>
      <div style="background:{C['surface']}; border:1px solid {C['border']}; color:{C['midSlate']}; font-size:9.5px; font-weight:700; padding:2px 9px; border-radius:10px;">Antibiotics (2)</div>
      <div style="background:{C['surface']}; border:1px solid {C['border']}; color:{C['midSlate']}; font-size:9.5px; font-weight:700; padding:2px 9px; border-radius:10px;">Symptomatic (1)</div>
    </div>

    <!-- Medication Cards List -->
    <div style="display:flex; flex-direction:column; gap:5px; margin-bottom:6px;">
      <!-- Course Card 1: Amoxicillin -->
      <div class="card" style="padding:0; overflow:hidden; position:relative; margin-bottom:0; display:flex;">
        <div style="width:5px; background:{C['sageGreenSolid']};"></div>
        <div style="flex:1; padding:8px 10px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:3px;">
            <div style="display:flex; align-items:center; gap:5px;">
              <span style="font-size:13.5px; font-weight:800; color:{C['textColor']};">Amoxicillin 500mg</span>
              <span class="badge-access" style="font-size:8px; padding:1px 5px;">Access</span>
            </div>
            <span style="color:{C['midSlate']}; font-size:10px; font-weight:800;">✕</span>
          </div>

          <div style="display:flex; gap:5px; margin-bottom:3px;">
            <div style="display:flex; align-items:center; gap:3px; background:rgba(215,204,200,0.22); border-radius:5px; padding:1px 5px; font-size:9px; color:{C['midSlate']}; font-weight:700;">
              {get_icon('clock', 10, C['sageGreenSolid'])}
              <span>08:00 · 14:00 · 20:00 (3× daily)</span>
            </div>
            <div style="display:flex; align-items:center; gap:3px; background:rgba(215,204,200,0.22); border-radius:5px; padding:1px 5px; font-size:9px; color:{C['midSlate']}; font-weight:700;">
              {get_icon('pill', 10, C['sageGreenSolid'])}
              <span>1 cap</span>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; font-size:9px; margin-bottom:2px;">
            <span style="color:{C['midSlate']};">Course progress (Day 5 of 7)</span>
            <span style="font-weight:800; color:{C['sageGreenSolid']};">5 days left</span>
          </div>
          <div style="height:4px; background:rgba(215,204,200,0.35); border-radius:2px; overflow:hidden; margin-bottom:5px;">
            <div style="width:71%; height:100%; background:{C['sageGreenSolid']}; border-radius:2px;"></div>
          </div>

          <div style="background:{C['sageGreenSolid']}; border-radius:7px; height:28px; display:flex; align-items:center; justify-content:center; gap:5px; color:#FFF; font-size:10.5px; font-weight:800;">
            {get_icon('check', 12, '#FFF', 2.5)}
            <span>Log Dose Taken</span>
          </div>
        </div>
      </div>

      <!-- Course Card 2: Ciprofloxacin -->
      <div class="card" style="padding:0; overflow:hidden; position:relative; margin-bottom:0; display:flex;">
        <div style="width:5px; background:{C['warningAmberSolid']};"></div>
        <div style="flex:1; padding:8px 10px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:3px;">
            <div style="display:flex; align-items:center; gap:5px;">
              <span style="font-size:13.5px; font-weight:800; color:{C['textColor']};">Ciprofloxacin 500mg</span>
              <span class="badge-watch" style="font-size:8px; padding:1px 5px;">Watch</span>
            </div>
            <span style="color:{C['midSlate']}; font-size:10px; font-weight:800;">✕</span>
          </div>

          <div style="display:flex; gap:5px; margin-bottom:3px;">
            <div style="display:flex; align-items:center; gap:3px; background:rgba(215,204,200,0.22); border-radius:5px; padding:1px 5px; font-size:9px; color:{C['midSlate']}; font-weight:700;">
              {get_icon('clock', 10, C['warningAmberSolid'])}
              <span>08:00 · 20:00 (2× daily)</span>
            </div>
            <div style="display:flex; align-items:center; gap:3px; background:rgba(215,204,200,0.22); border-radius:5px; padding:1px 5px; font-size:9px; color:{C['midSlate']}; font-weight:700;">
              {get_icon('pill', 10, C['warningAmberSolid'])}
              <span>1 tab</span>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; font-size:9px; margin-bottom:2px;">
            <span style="color:{C['midSlate']};">Course progress (Day 2 of 10)</span>
            <span style="font-weight:800; color:{C['warningAmberSolid']};">8 days left</span>
          </div>
          <div style="height:4px; background:rgba(215,204,200,0.35); border-radius:2px; overflow:hidden; margin-bottom:5px;">
            <div style="width:20%; height:100%; background:{C['warningAmberSolid']}; border-radius:2px;"></div>
          </div>

          <div style="background:{C['sageGreenSolid']}; border-radius:7px; height:28px; display:flex; align-items:center; justify-content:center; gap:5px; color:#FFF; font-size:10.5px; font-weight:800;">
            {get_icon('check', 12, '#FFF', 2.5)}
            <span>Log Dose Taken</span>
          </div>
        </div>
      </div>

      <!-- Course Card 3: Paracetamol -->
      <div class="card" style="padding:0; overflow:hidden; position:relative; margin-bottom:0; display:flex;">
        <div style="width:5px; background:{C['mutedAccentSolid']};"></div>
        <div style="flex:1; padding:8px 10px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:3px;">
            <div style="display:flex; align-items:center; gap:5px;">
              <span style="font-size:13.5px; font-weight:800; color:{C['textColor']};">Paracetamol 650mg</span>
              <span style="background:rgba(77,182,172,0.2); color:{C['mutedAccentSolid']}; font-size:8px; font-weight:800; padding:1px 5px; border-radius:4px;">Symptomatic</span>
            </div>
            <span style="color:{C['midSlate']}; font-size:10px; font-weight:800;">✕</span>
          </div>

          <div style="display:flex; gap:5px; margin-bottom:3px;">
            <div style="display:flex; align-items:center; gap:3px; background:rgba(215,204,200,0.22); border-radius:5px; padding:1px 5px; font-size:9px; color:{C['midSlate']}; font-weight:700;">
              {get_icon('clock', 10, C['mutedAccentSolid'])}
              <span>As needed (SOS for fever)</span>
            </div>
            <div style="display:flex; align-items:center; gap:3px; background:rgba(215,204,200,0.22); border-radius:5px; padding:1px 5px; font-size:9px; color:{C['midSlate']}; font-weight:700;">
              {get_icon('pill', 10, C['mutedAccentSolid'])}
              <span>1 tab</span>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; font-size:9px; margin-bottom:2px;">
            <span style="color:{C['midSlate']};">Course remaining</span>
            <span style="font-weight:800; color:{C['mutedAccentSolid']};">3 days</span>
          </div>
          <div style="height:4px; background:rgba(215,204,200,0.35); border-radius:2px; overflow:hidden; margin-bottom:5px;">
            <div style="width:40%; height:100%; background:{C['mutedAccentSolid']}; border-radius:2px;"></div>
          </div>

          <div style="background:{C['sageGreenSolid']}; border-radius:7px; height:28px; display:flex; align-items:center; justify-content:center; gap:5px; color:#FFF; font-size:10.5px; font-weight:800;">
            {get_icon('check', 12, '#FFF', 2.5)}
            <span>Log Dose Taken</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 7-Day Adherence Scorecard Card -->
    <div class="card" style="padding:8px 11px; margin-bottom:5px; background:rgba(129,199,132,0.1); border-color:rgba(129,199,132,0.35);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
        <span style="font-size:9px; font-weight:800; color:{C['sageGreenSolid']}; text-transform:uppercase;">7-DAY ADHERENCE SCORECARD</span>
        <span style="font-size:9.5px; font-weight:800; color:{C['sageGreenSolid']};">96.4% · 14/15 Doses</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:8.5px; color:{C['midSlate']};">
        <div style="text-align:center;"><div style="width:14px; height:14px; border-radius:7px; background:{C['sageGreenSolid']}; color:#FFF; font-size:8px; display:flex; align-items:center; justify-content:center; margin:0 auto 2px auto;">✓</div>Mon</div>
        <div style="text-align:center;"><div style="width:14px; height:14px; border-radius:7px; background:{C['sageGreenSolid']}; color:#FFF; font-size:8px; display:flex; align-items:center; justify-content:center; margin:0 auto 2px auto;">✓</div>Tue</div>
        <div style="text-align:center;"><div style="width:14px; height:14px; border-radius:7px; background:{C['sageGreenSolid']}; color:#FFF; font-size:8px; display:flex; align-items:center; justify-content:center; margin:0 auto 2px auto;">✓</div>Wed</div>
        <div style="text-align:center;"><div style="width:14px; height:14px; border-radius:7px; background:{C['sageGreenSolid']}; color:#FFF; font-size:8px; display:flex; align-items:center; justify-content:center; margin:0 auto 2px auto;">✓</div>Thu</div>
        <div style="text-align:center;"><div style="width:14px; height:14px; border-radius:7px; background:{C['sageGreenSolid']}; color:#FFF; font-size:8px; display:flex; align-items:center; justify-content:center; margin:0 auto 2px auto;">✓</div>Fri</div>
        <div style="text-align:center;"><div style="width:14px; height:14px; border-radius:7px; background:{C['sageGreenSolid']}; color:#FFF; font-size:8px; display:flex; align-items:center; justify-content:center; margin:0 auto 2px auto;">✓</div>Sat</div>
        <div style="text-align:center;"><div style="width:14px; height:14px; border-radius:7px; background:rgba(230,182,85,0.4); color:{C['warningAmberSolid']}; font-size:8px; display:flex; align-items:center; justify-content:center; margin:0 auto 2px auto;">⏰</div>Sun</div>
      </div>
    </div>

    <!-- Archival Course History Preview Card -->
    <div class="card" style="padding:6px 11px; margin-bottom:4px; background:rgba(215,204,200,0.18); display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="font-size:9.5px; font-weight:800; color:{C['textColor']};">Archival Course History (5 Completed)</div>
        <div style="font-size:8px; color:{C['midSlate']};">100% antibiotic completion · Zero early stops</div>
      </div>
      <span style="font-size:9.5px; font-weight:800; color:{C['sageGreenSolid']};">View Archive ›</span>
    </div>

    <!-- Caregiver Sync Status Strip -->
    <div class="card" style="padding:6px 10px; margin-bottom:4px; background:rgba(77,182,172,0.1); border-color:rgba(77,182,172,0.3); display:flex; justify-content:space-between; align-items:center;">
      <div style="font-size:8.5px; color:{C['textColor']};">
        <b>Caregiver Link Active:</b> The Sharma Family (3 linked devices)
      </div>
      <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']};">LIVE SYNC</span>
    </div>

    <!-- WHO Antimicrobial Stewardship Benchmark Card -->
    <div class="card" style="padding:6px 10px; margin-bottom:4px; background:rgba(129,199,132,0.12); border-color:rgba(129,199,132,0.35);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
        <span style="font-size:8.5px; font-weight:800; color:{C['sageGreenSolid']}; text-transform:uppercase;">WHO STEWARDSHIP BENCHMARK</span>
        <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.25); padding:1px 5px; border-radius:4px;">OPTIMAL</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:8.5px; color:{C['textColor']};">
        <span>Access Tier Utilization: <b>67%</b> (Target ≥60%)</span>
        <span style="color:{C['midSlate']};">Reserve Tier: <b>0%</b></span>
      </div>
    </div>

    <!-- Pharmacy Dispensing & Auto-Refill Card -->
    <div class="card" style="padding:6px 10px; margin-bottom:6px; background:rgba(215,204,200,0.18);">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:9px; font-weight:800; color:{C['textColor']};">Apollo Pharmacy Refill Dispatch</div>
          <div style="font-size:8px; color:{C['midSlate']};">Rx #AP-8841 verified · Next refill auto-queued for Oct 22</div>
        </div>
        <span style="font-size:8px; font-weight:800; color:{C['mutedAccentSolid']};">VERIFIED</span>
      </div>
    </div>

    <!-- Add Medication Button -->
    <div style="background:{C['surface']}; border:1.5px dashed {C['sageGreenSolid']}; border-radius:12px; height:36px; display:flex; align-items:center; justify-content:center; gap:6px; color:{C['sageGreenSolid']}; font-size:11.5px; font-weight:800; margin-top:2px;">
      <span>+ Add Another Medication</span>
    </div>
    '''
    render_screen("12_medications_adherence_list.png", wrap_screen(content, active_tab='meds', show_admin=True))

# ─────────────────────────────────────────────────────────────────────────────
# 13. Medications Multiple Courses (Course History & Stewardship Archive)
# ─────────────────────────────────────────────────────────────────────────────
def screen_13():
    content = f'''
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
      <div>
        <div style="font-size:20px; font-weight:800; color:{C['textColor']};">Course History</div>
        <div style="font-size:10px; color:{C['midSlate']};">Stewardship archive &amp; adherence records</div>
      </div>
      <div style="background:rgba(129,199,132,0.2); border-radius:10px; padding:3px 8px; font-size:9.5px; font-weight:800; color:{C['sageGreenSolid']};">
        96.4% Overall
      </div>
    </div>

    <!-- Segmented Control Tabs -->
    <div style="display:flex; background:rgba(215,204,200,0.3); border-radius:12px; padding:3px; margin-bottom:6px;">
      <div style="flex:1; text-align:center; padding:5px; font-size:11px; font-weight:700; color:{C['midSlate']};">Active (3)</div>
      <div style="flex:1; text-align:center; padding:5px; font-size:11px; font-weight:800; background:#FFF; border-radius:9px; color:{C['textColor']}; box-shadow:0 1px 4px rgba(0,0,0,0.06);">
        Completed &amp; Past (7)
      </div>
    </div>

    <!-- Summary Adherence Hero Card -->
    <div class="card" style="border-color:{C['borderStrong']}; padding:7px 11px; margin-bottom:5px; background:rgba(129,199,132,0.12); display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="font-size:11px; font-weight:800; color:{C['sageGreenSolid']};">Antibiotic Completion Rate: 100%</div>
        <div style="font-size:9px; color:{C['midSlate']};">Zero early stops on prescribed antimicrobial regimens</div>
      </div>
      <div style="font-size:15px;">🛡️</div>
    </div>

    <!-- Monthly Adherence Trend Histogram Card (Proper flex formatting without overlap) -->
    <div class="card" style="padding:7px 11px; margin-bottom:5px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span style="font-size:9px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase;">6-MONTH COURSE FREQUENCY</span>
        <span style="font-size:8.5px; font-weight:800; color:{C['sageGreenSolid']};">All Regimens Completed</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:flex-end; height:32px; padding:0 6px;">
        <div style="display:flex; flex-direction:column; align-items:center; gap:2px;"><div style="width:18px; height:18px; background:{C['sageGreenSolid']}; border-radius:3px;"></div><span style="font-size:8px; color:{C['midSlate']};">Apr</span></div>
        <div style="display:flex; flex-direction:column; align-items:center; gap:2px;"><div style="width:18px; height:24px; background:{C['sageGreenSolid']}; border-radius:3px;"></div><span style="font-size:8px; color:{C['midSlate']};">May</span></div>
        <div style="display:flex; flex-direction:column; align-items:center; gap:2px;"><div style="width:18px; height:4px; background:rgba(215,204,200,0.5); border-radius:2px;"></div><span style="font-size:8px; color:{C['midSlate']};">Jun</span></div>
        <div style="display:flex; flex-direction:column; align-items:center; gap:2px;"><div style="width:18px; height:14px; background:{C['mutedAccentSolid']}; border-radius:3px;"></div><span style="font-size:8px; color:{C['midSlate']};">Jul</span></div>
        <div style="display:flex; flex-direction:column; align-items:center; gap:2px;"><div style="width:18px; height:22px; background:{C['sageGreenSolid']}; border-radius:3px;"></div><span style="font-size:8px; color:{C['midSlate']};">Aug</span></div>
        <div style="display:flex; flex-direction:column; align-items:center; gap:2px;"><div style="width:18px; height:16px; background:{C['warningAmberSolid']}; border-radius:3px;"></div><span style="font-size:8px; color:{C['midSlate']};">Sep</span></div>
      </div>
    </div>

    <!-- Past Courses List -->
    <div style="display:flex; flex-direction:column; gap:4px; margin-bottom:5px;">
      <!-- Past Course 1: Azithromycin -->
      <div class="card" style="padding:6px 10px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1px;">
          <div style="font-size:12px; font-weight:800; color:{C['textColor']};">Azithromycin 500mg</div>
          <span class="badge-watch" style="font-size:8px; padding:1px 5px;">Watch Tier</span>
        </div>
        <div style="font-size:9px; color:{C['midSlate']}; margin-bottom:1px;">Completed Sep 18, 2026 · 3-Day Course (3/3 Doses)</div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:8.5px;">
          <span style="color:{C['sageGreenSolid']}; font-weight:800;">✓ 100% Adherence Confirmed</span>
          <span style="color:{C['midSlate']}; font-weight:600;">Dr. R. K. Mehta</span>
        </div>
      </div>

      <!-- Past Course 2: Augmentin -->
      <div class="card" style="padding:6px 10px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1px;">
          <div style="font-size:12px; font-weight:800; color:{C['textColor']};">Augmentin 625mg</div>
          <span class="badge-access" style="font-size:8px; padding:1px 5px;">Access Tier</span>
        </div>
        <div style="font-size:9px; color:{C['midSlate']}; margin-bottom:1px;">Completed Aug 04, 2026 · 5-Day Course (10/10 Doses)</div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:8.5px;">
          <span style="color:{C['sageGreenSolid']}; font-weight:800;">✓ 100% Adherence Confirmed</span>
          <span style="color:{C['midSlate']}; font-weight:600;">Apex Clinic</span>
        </div>
      </div>

      <!-- Past Course 3: Cefixime -->
      <div class="card" style="padding:6px 10px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1px;">
          <div style="font-size:12px; font-weight:800; color:{C['textColor']};">Cefixime 200mg</div>
          <span class="badge-watch" style="font-size:8px; padding:1px 5px;">Watch Tier</span>
        </div>
        <div style="font-size:9px; color:{C['midSlate']}; margin-bottom:1px;">Completed May 20, 2026 · 7-Day Course (14/14 Doses)</div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:8.5px;">
          <span style="color:{C['sageGreenSolid']}; font-weight:800;">✓ 100% Adherence Confirmed</span>
          <span style="color:{C['midSlate']}; font-weight:600;">City Hospital</span>
        </div>
      </div>

      <!-- Past Course 4: Cefuroxime -->
      <div class="card" style="padding:6px 10px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1px;">
          <div style="font-size:12px; font-weight:800; color:{C['textColor']};">Cefuroxime Axetil 500mg</div>
          <span class="badge-access" style="font-size:8px; padding:1px 5px;">Access Tier</span>
        </div>
        <div style="font-size:9px; color:{C['midSlate']}; margin-bottom:1px;">Completed Feb 12, 2026 · 5-Day Course (10/10 Doses)</div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:8.5px;">
          <span style="color:{C['sageGreenSolid']}; font-weight:800;">✓ 100% Adherence Confirmed</span>
          <span style="color:{C['midSlate']}; font-weight:600;">Dr. Alex Sharma</span>
        </div>
      </div>

      <!-- Past Course 5: Ibuprofen -->
      <div class="card" style="padding:5px 10px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1px;">
          <div style="font-size:11.5px; font-weight:800; color:{C['textColor']};">Ibuprofen 400mg</div>
          <span style="background:rgba(215,204,200,0.3); color:{C['midSlate']}; font-size:7.5px; font-weight:800; padding:1px 5px; border-radius:4px;">OTC Discontinued</span>
        </div>
        <div style="font-size:8.5px; color:{C['midSlate']}; margin-bottom:1px;">Stopped Jul 12, 2026 · Symptom resolved after 2 days</div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:8px;">
          <span style="color:{C['midSlate']}; font-weight:700;">Safe Early Stop (PRN Analgesic)</span>
          <span style="color:{C['midSlate']}; font-weight:600;">Self-managed</span>
        </div>
      </div>

      <!-- Past Course 6: Amoxicillin-Clavulanic Acid -->
      <div class="card" style="padding:5px 10px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1px;">
          <div style="font-size:11.5px; font-weight:800; color:{C['textColor']};">Amox-Clav 625mg</div>
          <span class="badge-access" style="font-size:7.5px; padding:1px 5px;">Access Tier</span>
        </div>
        <div style="font-size:8.5px; color:{C['midSlate']}; margin-bottom:1px;">Completed Dec 10, 2025 · 5-Day Course (10/10 Doses)</div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:8px;">
          <span style="color:{C['sageGreenSolid']}; font-weight:800;">✓ 100% Adherence Confirmed</span>
          <span style="color:{C['midSlate']}; font-weight:600;">Dr. Alex Sharma</span>
        </div>
      </div>

      <!-- Past Course 7: Metronidazole -->
      <div class="card" style="padding:5px 10px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1px;">
          <div style="font-size:11.5px; font-weight:800; color:{C['textColor']};">Metronidazole 400mg</div>
          <span class="badge-access" style="font-size:7.5px; padding:1px 5px;">Access Tier</span>
        </div>
        <div style="font-size:8.5px; color:{C['midSlate']}; margin-bottom:1px;">Completed Oct 14, 2025 · 7-Day Course (14/14 Doses)</div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:8px;">
          <span style="color:{C['sageGreenSolid']}; font-weight:800;">✓ 100% Adherence Confirmed</span>
          <span style="color:{C['midSlate']}; font-weight:600;">City Hospital</span>
        </div>
      </div>
    </div>

    <!-- Antimicrobial Stewardship Certificate Banner -->
    <div class="card" style="padding:6px 11px; margin-bottom:4px; background:rgba(215,204,200,0.18);">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:9.5px; font-weight:800; color:{C['textColor']};">WHO AWaRe Compliance Index: 100%</div>
          <div style="font-size:8px; color:{C['midSlate']};">Zero AMR risk flags · Stewardship Score: Tier A (#MS-STW-2026)</div>
        </div>
        <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.25); padding:1px 5px; border-radius:4px;">CERTIFIED</span>
      </div>
    </div>

    <!-- Stewardship Resistance Risk Audit Card -->
    <div class="card" style="padding:6px 10px; margin-bottom:6px; background:rgba(129,199,132,0.1); border-color:rgba(129,199,132,0.35);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
        <span style="font-size:8.5px; font-weight:800; color:{C['sageGreenSolid']}; text-transform:uppercase;">PHARMACO-EPIDEMIOLOGICAL EXPOSURE</span>
        <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']};">LOW RISK</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:8px; color:{C['midSlate']}; font-family:'JetBrains Mono';">
        <span>Cumulative Exposure: 14.2 DDD</span>
        <span>Mutant Selection Index: &lt;0.05</span>
        <span>Seal: SHA-256 Valid</span>
      </div>
    </div>

    <!-- Export Button -->
    <div class="btn-primary" style="height:40px; gap:8px; margin-top:3px;">
      <span>Export Clinical Compliance Report</span>
      <span>{get_icon('fileText', 15, '#FFF', 2)}</span>
    </div>
    '''
    render_screen("13_medications_multiple_courses.png", wrap_screen(content, active_tab='meds', show_admin=True))

# ─────────────────────────────────────────────────────────────────────────────
# 14. Family Circle Hub (Full layout filling viewport)
# ─────────────────────────────────────────────────────────────────────────────
def screen_14():
    content = f'''
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
      <div>
        <div style="font-size:9.5px; font-weight:700; color:{C['sageGreenSolid']}; text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; gap:4px; margin-bottom:1px;">
          <span style="width:6px; height:6px; border-radius:3px; background:{C['sageGreenSolid']};"></span> ACTIVE CIRCLE
        </div>
        <div style="font-size:20px; font-weight:800; color:{C['textColor']};">The Sharma Family</div>
      </div>
      <div style="background:{C['surface']}; border:1px solid {C['border']}; border-radius:12px; padding:3px 8px; text-align:right;">
        <div style="display:flex; align-items:center; justify-content:flex-end; gap:3px;">
          <span style="font-size:8px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase;">INVITE CODE</span>
          {get_icon('copy', 10, C['sageGreenSolid'])}
        </div>
        <div style="font-size:11px; font-weight:800; font-family:'JetBrains Mono'; color:{C['sageGreenSolid']};">8K2M9P</div>
      </div>
    </div>

    <!-- Medicine Cabinet card directly from FamilyCircleScreen.tsx -->
    <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:8px 11px; margin-bottom:5px;">
      <div style="display:flex; align-items:center; gap:9px;">
        <div style="width:34px; height:34px; border-radius:10px; background:rgba(129,199,132,0.2); display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']}; flex-shrink:0;">
          {get_icon('cabinet', 17, C['sageGreenSolid'], 2)}
        </div>
        <div>
          <div style="display:flex; align-items:center; gap:5px;">
            <div style="font-size:12.5px; font-weight:800; color:{C['textColor']};">Medicine Cabinet</div>
            <span style="background:rgba(129,199,132,0.2); color:{C['sageGreenSolid']}; font-size:8.5px; font-weight:800; padding:1px 5px; border-radius:4px;">Shared Stock</span>
          </div>
          <div style="font-size:9px; color:{C['midSlate']};">6 household items · 1 low stock · 1 expired</div>
        </div>
      </div>
      <div style="font-size:15px; font-weight:800; color:{C['midSlate']};">›</div>
    </div>

    <!-- Household Adherence Stats Card -->
    <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:7px 11px; margin-bottom:5px;">
      <div>
        <div style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px;">HOUSEHOLD ADHERENCE</div>
        <div style="font-size:10.5px; font-weight:700; color:{C['textColor']}; margin-top:1px;">All 3 members taking medication on time</div>
      </div>
      <div style="font-size:19px; font-weight:800; color:{C['sageGreenSolid']};">96%</div>
    </div>

    <!-- Family Members Header -->
    <div style="font-size:9.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:3px;">
      MEMBERS &amp; INDIVIDUAL ADHERENCE
    </div>

    <!-- Member 1: Dr. Alex Sharma -->
    <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:6px 9px; margin-bottom:4px;">
      <div style="display:flex; align-items:center; gap:7px;">
        <div style="width:28px; height:28px; border-radius:14px; background:rgba(129,199,132,0.25); display:flex; align-items:center; justify-content:center; font-size:10.5px; font-weight:800; color:{C['sageGreenSolid']};">AS</div>
        <div>
          <div style="font-size:11.5px; font-weight:800; color:{C['textColor']};">Dr. Alex Sharma (You)</div>
          <div style="font-size:8.5px; color:{C['midSlate']};">Circle Owner · 96% Adherence (14/15 doses)</div>
        </div>
      </div>
      <div style="background:rgba(129,199,132,0.2); color:{C['sageGreenSolid']}; font-size:8px; font-weight:800; padding:1px 5px; border-radius:4px;">👑 OWNER</div>
    </div>

    <!-- Member 2: Sunita Sharma -->
    <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:6px 9px; margin-bottom:4px;">
      <div style="display:flex; align-items:center; gap:7px;">
        <div style="width:28px; height:28px; border-radius:14px; background:rgba(77,182,172,0.25); display:flex; align-items:center; justify-content:center; font-size:10.5px; font-weight:800; color:{C['mutedAccentSolid']};">SS</div>
        <div>
          <div style="font-size:11.5px; font-weight:800; color:{C['textColor']};">Sunita Sharma (Mother)</div>
          <div style="font-size:8.5px; color:{C['midSlate']};">Senior Care Oversight · 98% Adherence (2 active meds)</div>
        </div>
      </div>
      <div style="background:rgba(230,182,85,0.2); color:{C['warningAmberSolid']}; font-size:8px; font-weight:800; padding:1px 5px; border-radius:4px;">DEPENDENT</div>
    </div>

    <!-- Member 3: Aarav Sharma -->
    <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:5px 9px; margin-bottom:3px;">
      <div style="display:flex; align-items:center; gap:7px;">
        <div style="width:26px; height:26px; border-radius:13px; background:rgba(230,182,85,0.25); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; color:{C['warningAmberSolid']};">AS</div>
        <div>
          <div style="font-size:11px; font-weight:800; color:{C['textColor']};">Aarav Sharma (Son)</div>
          <div style="font-size:8px; color:{C['midSlate']};">Pediatric Profile · 94% Adherence (1 active med)</div>
        </div>
      </div>
      <div style="background:rgba(230,182,85,0.2); color:{C['warningAmberSolid']}; font-size:7.5px; font-weight:800; padding:1px 5px; border-radius:4px;">DEPENDENT</div>
    </div>

    <!-- Member 4: Ramesh Sharma (Father) -->
    <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:5px 9px; margin-bottom:4px;">
      <div style="display:flex; align-items:center; gap:7px;">
        <div style="width:26px; height:26px; border-radius:13px; background:rgba(215,204,200,0.4); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; color:{C['midSlate']};">RS</div>
        <div>
          <div style="font-size:11px; font-weight:800; color:{C['textColor']};">Ramesh Sharma (Father)</div>
          <div style="font-size:8px; color:{C['midSlate']};">Geriatric Memory Care · 100% Adherence (3 meds)</div>
        </div>
      </div>
      <div style="background:rgba(230,182,85,0.2); color:{C['warningAmberSolid']}; font-size:7.5px; font-weight:800; padding:1px 5px; border-radius:4px;">DEPENDENT</div>
    </div>

    <!-- Upcoming Household Doses Timeline Card -->
    <div class="card" style="padding:6px 11px; margin-bottom:4px;">
      <div style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px;">UPCOMING HOUSEHOLD DOSES</div>
      <div style="display:flex; justify-content:space-between; font-size:9px; padding-bottom:2px; border-bottom:1px solid {C['border']};">
        <span><b>20:00 PM</b> · Sunita Sharma</span>
        <span style="color:{C['midSlate']};">Amlodipine 5mg (Bedtime)</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:9px; padding-top:2px;">
        <span><b>20:00 PM</b> · Dr. Alex Sharma</span>
        <span style="color:{C['midSlate']};">Ciprofloxacin 500mg (Dose 4/20)</span>
      </div>
    </div>

    <!-- Caregiver Emergency Escalation Protocol Card -->
    <div class="card" style="padding:6px 10px; margin-bottom:4px; background:rgba(215,204,200,0.18);">
      <div style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; margin-bottom:1px;">EMERGENCY ESCALATION DISPATCH</div>
      <div style="font-size:8.5px; color:{C['textColor']}; line-height:1.35;">
        Automated SMS &amp; WhatsApp notification alerts active for Dr. Alex Sharma (+91 98765 43210) if dependent dose delayed &gt;<b>45m</b>.
      </div>
    </div>

    <!-- Real-time Caregiver Sync Status Card -->
    <div class="card" style="background:rgba(129,199,132,0.12); border-color:rgba(129,199,132,0.35); padding:6px 11px; margin-bottom:4px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1px;">
        <span style="font-size:8.5px; font-weight:800; color:{C['sageGreenSolid']}; text-transform:uppercase;">REAL-TIME CAREGIVER SYNC</span>
        <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.25); padding:1px 5px; border-radius:4px;">CONNECTED</span>
      </div>
      <div style="font-size:8.5px; color:{C['textColor']};">Supabase Realtime active · 4 devices linked · Escalation dispatch ready</div>
    </div>

    <!-- Caregiver Proxy Audit Trail Strip -->
    <div class="card" style="padding:5px 10px; margin-bottom:5px; background:rgba(77,182,172,0.1); border-color:rgba(77,182,172,0.3);">
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:8px; color:{C['midSlate']};">
        <span><b>Proxy Audit:</b> Metformin 500mg logged (08:15 AM)</span>
        <span style="color:{C['sageGreenSolid']}; font-weight:800;">✓ Biometric Verified</span>
      </div>
    </div>

    <!-- Action Buttons -->
    <div style="display:flex; flex-direction:column; gap:4px; margin-top:2px;">
      <div class="btn-primary" style="gap:8px; height:38px;">
        <span>Manage Caregiver Oversight &amp; Sync</span>
        <span>{get_icon('chevronRight', 15, '#FFF', 2)}</span>
      </div>
      <div style="height:34px; border:1px solid {C['border']}; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:{C['midSlate']}; background:{C['surface']};">
        + Invite Another Family Member
      </div>
    </div>
    '''
    render_screen("14_family_circle_hub.png", wrap_screen(content, active_tab='family', show_admin=True))

# ─────────────────────────────────────────────────────────────────────────────
# 15. Family Circle Members (Senior Care Dependent Profile)
# ─────────────────────────────────────────────────────────────────────────────
def screen_15():
    content = f'''
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
      <div style="width:34px; height:34px; border-radius:10px; background:{C['surface']}; border:1px solid {C['border']}; display:flex; align-items:center; justify-content:center; color:{C['textColor']};">
        {get_icon('chevronLeft', 18, C['textColor'])}
      </div>
      <div>
        <div style="font-size:18px; font-weight:800; color:{C['textColor']};">Member Profile</div>
        <div style="font-size:10px; color:{C['midSlate']};">Senior Caregiver Oversight</div>
      </div>
    </div>

    <!-- Member Hero Card -->
    <div class="card" style="display:flex; align-items:center; gap:10px; padding:9px 11px; margin-bottom:5px;">
      <div style="width:42px; height:42px; border-radius:21px; background:rgba(77,182,172,0.25); border:2px solid {C['mutedAccent']}; display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:800; color:{C['mutedAccentSolid']}; flex-shrink:0;">
        SS
      </div>
      <div>
        <div style="font-size:15px; font-weight:800; color:{C['textColor']};">Sunita Sharma</div>
        <div style="font-size:9.5px; color:{C['midSlate']};">Age: 68 · Blood: B+ Positive · Mother</div>
        <div style="margin-top:2px;">
          <span style="background:rgba(230,182,85,0.2); color:{C['warningAmberSolid']}; font-size:8px; font-weight:800; padding:1px 5px; border-radius:4px;">Linked Dependent</span>
        </div>
      </div>
    </div>

    <!-- Adherence & Caregiver Stats -->
    <div class="card" style="display:flex; justify-content:space-around; align-items:center; padding:6px; margin-bottom:5px;">
      <div style="text-align:center;"><div style="font-size:14px; font-weight:800; color:{C['sageGreenSolid']};">98%</div><div style="font-size:8px; color:{C['midSlate']};">30d Adherence</div></div>
      <div style="width:1px; height:18px; background:{C['border']};"></div>
      <div style="text-align:center;"><div style="font-size:14px; font-weight:800;">2</div><div style="font-size:8px; color:{C['midSlate']};">Active Meds</div></div>
      <div style="width:1px; height:18px; background:{C['border']};"></div>
      <div style="text-align:center;"><div style="font-size:14px; font-weight:800; color:{C['sageGreenSolid']};">0</div><div style="font-size:8px; color:{C['midSlate']};">Missed (7d)</div></div>
    </div>

    <!-- Active Medications for Sunita -->
    <div style="font-size:9.5px; font-weight:800; color:{C['textColor']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:3px;">
      ACTIVE MEDICATIONS (2)
    </div>

    <!-- Sunita Med 1 -->
    <div class="card" style="padding:6px 10px; margin-bottom:4px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <div style="font-size:12px; font-weight:800; color:{C['textColor']};">Metformin 500mg</div>
          <div style="font-size:8.5px; color:{C['midSlate']};">1 tablet · Daily with breakfast (08:00 AM)</div>
        </div>
        <span style="background:rgba(129,199,132,0.2); color:{C['sageGreenSolid']}; font-size:8px; font-weight:800; padding:1px 5px; border-radius:4px;">Taken Today</span>
      </div>
    </div>

    <!-- Sunita Med 2 -->
    <div class="card" style="padding:5px 10px; margin-bottom:3px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <div style="font-size:11.5px; font-weight:800; color:{C['textColor']};">Amlodipine 5mg</div>
          <div style="font-size:8px; color:{C['midSlate']};">1 tablet · Daily at bedtime (21:00 PM)</div>
        </div>
        <span style="background:rgba(230,182,85,0.2); color:{C['warningAmberSolid']}; font-size:7.5px; font-weight:800; padding:1px 5px; border-radius:4px;">Tonight</span>
      </div>
    </div>

    <!-- Sunita Med 3 -->
    <div class="card" style="padding:5px 10px; margin-bottom:4px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <div style="font-size:11.5px; font-weight:800; color:{C['textColor']};">Atorvastatin 20mg</div>
          <div style="font-size:8px; color:{C['midSlate']};">1 tablet · Daily at bedtime (21:00 PM) · Statin</div>
        </div>
        <span style="background:rgba(129,199,132,0.2); color:{C['sageGreenSolid']}; font-size:7.5px; font-weight:800; padding:1px 5px; border-radius:4px;">Taken Today</span>
      </div>
    </div>

    <!-- Clinical Vitals & Glycemic History Card -->
    <div class="card" style="padding:6px 10px; margin-bottom:4px; background:rgba(215,204,200,0.18);">
      <div style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; margin-bottom:1px;">RECENT VITALS &amp; GLYCEMIC LOG</div>
      <div style="display:flex; justify-content:space-between; font-size:8.5px; color:{C['textColor']};">
        <span>Fasting Sugar: <b style="color:{C['sageGreenSolid']};">114 mg/dL</b></span>
        <span>Blood Pressure: <b style="color:{C['sageGreenSolid']};">128/82</b></span>
        <span>SpO2: <b style="color:{C['sageGreenSolid']};">98%</b></span>
      </div>
    </div>

    <!-- Senior Care Chronic Regimen Notes Card -->
    <div class="card" style="padding:6px 10px; margin-bottom:4px; background:rgba(77,182,172,0.1); border-color:rgba(77,182,172,0.35);">
      <div style="font-size:8.5px; font-weight:800; color:{C['mutedAccentSolid']}; text-transform:uppercase; margin-bottom:1px;">GERIATRIC REGIMEN OVERSIGHT</div>
      <div style="font-size:8.5px; color:{C['textColor']}; line-height:1.35;">
        HbA1c 6.4% (Controlled) · eGFR 82 mL/min (Optimal). Blood pressure target &lt;130/80 maintained. Attending Geriatrician: <b>Dr. R. K. Mehta</b>.
      </div>
    </div>

    <!-- Geriatric Fall-Risk & Mobility Assessment Card -->
    <div class="card" style="padding:6px 10px; margin-bottom:4px; background:rgba(215,204,200,0.18);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1px;">
        <span style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase;">FALL-RISK &amp; MOBILITY INDEX</span>
        <span style="font-size:7.5px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.2); padding:1px 5px; border-radius:4px;">OPTIMAL</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:8px; color:{C['textColor']};">
        <span>Orthostatic BP: <b>122/78 mmHg</b></span>
        <span>Mobility: <b>28/30 Independent</b></span>
        <span style="color:{C['midSlate']};">SOS Beacon: Active</span>
      </div>
    </div>

    <!-- Circle Care Activity Log -->
    <div class="card" style="padding:6px 10px; margin-bottom:4px;">
      <div style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px;">RECENT CARE ACTIONS &amp; PHARMACY SYNC</div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:8.5px; padding-bottom:2px; border-bottom:1px solid {C['border']};">
        <span>08:15 AM · Metformin 500mg logged</span>
        <span style="font-weight:800; color:{C['sageGreenSolid']};">✓ Confirmed</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:8.5px; padding-top:2px;">
        <span>Apollo Pharmacy Refill · Next due in 12 days</span>
        <span style="font-weight:700; color:{C['mutedAccentSolid']};">Auto-Sync</span>
      </div>
    </div>

    <!-- Caregiver Self-Sovereignty & Escalation Status -->
    <div class="card" style="padding:5px 10px; margin-bottom:5px; background:rgba(129,199,132,0.12); border-color:rgba(129,199,132,0.35);">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:9px; font-weight:800; color:{C['sageGreenSolid']};">Caregiver Consent: Active</div>
          <div style="font-size:7.5px; color:{C['midSlate']};">Proxy dose logging permitted · Push alert if delayed &gt;45m</div>
        </div>
        <span style="font-size:7.5px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.25); padding:1px 5px; border-radius:4px;">GRANTED</span>
      </div>
    </div>

    <div style="display:flex; flex-direction:column; gap:4px; margin-top:2px;">
      <div class="btn-primary" style="height:38px; gap:8px;">
        <span>Log Dose on Behalf of Sunita</span>
        <span>{get_icon('check', 15, '#FFF', 2)}</span>
      </div>
      <div style="height:33px; border:1px solid {C['border']}; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:10.5px; font-weight:700; color:{C['midSlate']}; background:{C['surface']};">
        Edit Caregiver Permissions
      </div>
    </div>
    '''
    render_screen("15_family_circle_members.png", wrap_screen(content, active_tab='family', show_admin=True))

# ─────────────────────────────────────────────────────────────────────────────
# 16. Family Cabinet Inventory
# ─────────────────────────────────────────────────────────────────────────────
def screen_16():
    content = f'''
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
      <div style="display:flex; align-items:center; gap:8px;">
        <div style="width:34px; height:34px; border-radius:10px; background:{C['surface']}; border:1px solid {C['border']}; display:flex; align-items:center; justify-content:center; color:{C['textColor']};">
          {get_icon('chevronLeft', 18, C['textColor'])}
        </div>
        <div>
          <div style="font-size:18px; font-weight:800; color:{C['textColor']};">Medicine Cabinet</div>
          <div style="font-size:10px; color:{C['midSlate']};">Shared household inventory</div>
        </div>
      </div>
      <div style="background:{C['sageGreenSolid']}; color:#FFF; font-size:9.5px; font-weight:800; padding:3px 9px; border-radius:10px;">
        + Add Item
      </div>
    </div>

    <!-- Quick stats strip -->
    <div class="card" style="display:flex; justify-content:space-around; align-items:center; padding:6px 12px; margin-bottom:5px;">
      <div style="text-align:center;"><div style="font-size:14px; font-weight:800;">6</div><div style="font-size:8px; color:{C['midSlate']};">Total Items</div></div>
      <div style="width:1px; height:18px; background:{C['border']};"></div>
      <div style="text-align:center;"><div style="font-size:14px; font-weight:800; color:{C['warningAmberSolid']};">1</div><div style="font-size:8px; color:{C['midSlate']};">Low Stock</div></div>
      <div style="width:1px; height:18px; background:{C['border']};"></div>
      <div style="text-align:center;"><div style="font-size:14px; font-weight:800; color:{C['dangerClaySolid']};">1</div><div style="font-size:8px; color:{C['midSlate']};">Expired</div></div>
    </div>

    <!-- 6 Cabinet Items -->
    <div style="display:flex; flex-direction:column; gap:4px; margin-bottom:5px;">
      <!-- Cabinet Item 1: Amoxicillin -->
      <div class="card" style="border-left:3.5px solid {C['sageGreenSolid']}; padding:5px 9px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size:12px; font-weight:800; color:{C['textColor']};">Amoxicillin 500mg</div>
          <span style="background:rgba(129,199,132,0.2); color:{C['sageGreenSolid']}; font-size:7.5px; font-weight:800; padding:1px 4px; border-radius:3px;">Normal Stock</span>
        </div>
        <div style="font-size:9px; color:{C['midSlate']}; margin:1px 0;">Stock: 14 capsules · Shelf B2 (Dry storage)</div>
        <div style="display:flex; justify-content:space-between; font-size:8px; color:{C['midSlate']};">
          <span>Expires: Aug 2027</span>
          <span style="font-family:'JetBrains Mono';">Batch: AMX-2024-88A</span>
        </div>
      </div>

      <!-- Cabinet Item 2: Paracetamol -->
      <div class="card" style="border-left:3.5px solid {C['sageGreenSolid']}; padding:5px 9px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size:12px; font-weight:800; color:{C['textColor']};">Paracetamol 650mg</div>
          <span style="background:rgba(129,199,132,0.2); color:{C['sageGreenSolid']}; font-size:7.5px; font-weight:800; padding:1px 4px; border-radius:3px;">Normal Stock</span>
        </div>
        <div style="font-size:9px; color:{C['midSlate']}; margin:1px 0;">Stock: 20 tablets · Shelf A1 (First Aid Kit)</div>
        <div style="display:flex; justify-content:space-between; font-size:8px; color:{C['midSlate']};">
          <span>Expires: Dec 2026</span>
          <span style="font-family:'JetBrains Mono';">Batch: PCM-2024-12</span>
        </div>
      </div>

      <!-- Cabinet Item 3: Cetirizine -->
      <div class="card" style="border-left:3.5px solid {C['warningAmberSolid']}; padding:5px 9px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size:12px; font-weight:800; color:{C['textColor']};">Cetirizine 10mg</div>
          <span style="background:rgba(230,182,85,0.2); color:{C['warningAmberSolid']}; font-size:7.5px; font-weight:800; padding:1px 4px; border-radius:3px;">Low Stock</span>
        </div>
        <div style="font-size:9px; color:{C['warningAmberSolid']}; font-weight:700; margin:1px 0;">Stock: 3 tablets left · Refill Recommended</div>
        <div style="display:flex; justify-content:space-between; font-size:8px; color:{C['midSlate']};">
          <span>Expires: Nov 2026</span>
          <span>Shelf A2</span>
        </div>
      </div>

      <!-- Cabinet Item 4: ORS -->
      <div class="card" style="border-left:3.5px solid {C['sageGreenSolid']}; padding:5px 9px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size:12px; font-weight:800; color:{C['textColor']};">ORS Hydration Salts</div>
          <span style="background:rgba(129,199,132,0.2); color:{C['sageGreenSolid']}; font-size:7.5px; font-weight:800; padding:1px 4px; border-radius:3px;">Normal Stock</span>
        </div>
        <div style="font-size:9px; color:{C['midSlate']}; margin:1px 0;">Stock: 6 sachets · Shelf B1 (First Aid Kit)</div>
        <div style="display:flex; justify-content:space-between; font-size:8px; color:{C['midSlate']};">
          <span>Expires: Jan 2028</span>
          <span style="font-family:'JetBrains Mono';">WHO Formula</span>
        </div>
      </div>

      <!-- Cabinet Item 5: Azithromycin -->
      <div class="card" style="border-left:3.5px solid {C['warningAmberSolid']}; padding:5px 9px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size:12px; font-weight:800; color:{C['textColor']};">Azithromycin 250mg (Susp)</div>
          <span class="badge-watch" style="font-size:7.5px; padding:1px 4px;">Watch Tier</span>
        </div>
        <div style="font-size:9px; color:{C['midSlate']}; margin:1px 0;">Stock: 1 bottle · Shelf B2 (Cool storage)</div>
        <div style="display:flex; justify-content:space-between; font-size:8px; color:{C['midSlate']};">
          <span>Expires: Jun 2027</span>
          <span style="font-family:'JetBrains Mono';">Batch: AZM-2024-04</span>
        </div>
      </div>

      <!-- Cabinet Item 6: Benylin -->
      <div class="card" style="border-left:3.5px solid {C['dangerClaySolid']}; padding:5px 9px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size:12px; font-weight:800; color:{C['textColor']};">Benylin Cough Syrup</div>
          <span style="background:rgba(201,123,99,0.2); color:{C['dangerClaySolid']}; font-size:7.5px; font-weight:800; padding:1px 4px; border-radius:3px;">Expired</span>
        </div>
        <div style="font-size:9px; color:{C['dangerClaySolid']}; font-weight:700; margin:1px 0;">Expired on: Oct 2025 · Dispose Safely</div>
        <div style="display:flex; justify-content:space-between; font-size:8px; color:{C['midSlate']};">
          <span>Stock: 1 bottle (80ml)</span>
          <span>Shelf C1</span>
        </div>
      </div>

      <!-- Cabinet Item 7: Montelukast -->
      <div class="card" style="border-left:3.5px solid {C['sageGreenSolid']}; padding:5px 9px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size:11.5px; font-weight:800; color:{C['textColor']};">Montelukast 10mg</div>
          <span style="background:rgba(129,199,132,0.2); color:{C['sageGreenSolid']}; font-size:7.5px; font-weight:800; padding:1px 4px; border-radius:3px;">Normal Stock</span>
        </div>
        <div style="font-size:8.5px; color:{C['midSlate']}; margin:1px 0;">Stock: 14 tablets · Shelf A2 (Respiratory)</div>
        <div style="display:flex; justify-content:space-between; font-size:8px; color:{C['midSlate']};">
          <span>Expires: Sep 2027</span>
          <span style="font-family:'JetBrains Mono';">Batch: MLK-2024-05</span>
        </div>
      </div>

      <!-- Cabinet Item 8: Betadine Ointment -->
      <div class="card" style="border-left:3.5px solid {C['sageGreenSolid']}; padding:5px 9px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size:11.5px; font-weight:800; color:{C['textColor']};">Betadine 5% Ointment</div>
          <span style="background:rgba(129,199,132,0.2); color:{C['sageGreenSolid']}; font-size:7.5px; font-weight:800; padding:1px 4px; border-radius:3px;">Normal Stock</span>
        </div>
        <div style="font-size:8.5px; color:{C['midSlate']}; margin:1px 0;">Stock: 1 tube (20g) · Shelf B1 (Topical First Aid)</div>
        <div style="display:flex; justify-content:space-between; font-size:8px; color:{C['midSlate']};">
          <span>Expires: Jan 2028</span>
          <span style="font-family:'JetBrains Mono';">Batch: BTD-2024-19</span>
        </div>
      </div>
    </div>

    <!-- Household Diagnostics & Medical Devices Card -->
    <div class="card" style="padding:6px 10px; margin-bottom:4px;">
      <div style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px;">HOUSEHOLD MEDICAL DIAGNOSTICS</div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:8.5px; padding-bottom:2px; border-bottom:1px solid {C['border']};">
        <span>Omron Evolv BP Monitor (Bluetooth LE)</span>
        <span style="color:{C['sageGreenSolid']}; font-weight:800;">✓ Synced (88% Batt)</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:8.5px; padding-top:2px;">
        <span>Accu-Chek Instant Glucometer</span>
        <span style="color:{C['mutedAccentSolid']}; font-weight:700;">42 Strips Remaining</span>
      </div>
    </div>

    <!-- Cabinet Environmental Telemetry Card -->
    <div class="card" style="padding:5px 10px; margin-bottom:4px; background:rgba(215,204,200,0.18);">
      <div style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; margin-bottom:1px;">SMART SENSOR TELEMETRY &amp; TEMPERATURE</div>
      <div style="display:flex; justify-content:space-between; font-size:8px; color:{C['textColor']};">
        <span>Temp: <b style="color:{C['sageGreenSolid']};">21.4°C</b></span>
        <span>Humidity: <b style="color:{C['sageGreenSolid']};">42% RH</b></span>
        <span>Storage: <b style="color:{C['sageGreenSolid']};">Controlled (Optimal)</b></span>
      </div>
    </div>

    <!-- First Aid Consumables Status Strip -->
    <div class="card" style="padding:5px 10px; margin-bottom:4px; background:rgba(77,182,172,0.1); border-color:rgba(77,182,172,0.3);">
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:8px; color:{C['midSlate']};">
        <span><b>Consumables:</b> Sterile Gauze (Adequate) · 70% IPA (50 Swabs)</span>
        <span style="color:{C['sageGreenSolid']}; font-weight:800;">STOCKED</span>
      </div>
    </div>

    <!-- Expired Take-Back Advisory -->
    <div class="card" style="padding:5px 10px; margin-bottom:0; background:rgba(201,123,99,0.12); border-color:rgba(201,123,99,0.35); margin-top:2px;">
      <div style="font-size:8.5px; font-weight:800; color:{C['dangerClaySolid']}; margin-bottom:1px;">PHARMACY DROP-OFF TAKE-BACK ADVISORY</div>
      <div style="font-size:8px; color:{C['midSlate']}; line-height:1.35;">
        Deposit expired Benylin syrup at authorized pharmacy disposal bins. Never dispose in municipal drainage to avoid ecological contamination.
      </div>
    </div>
    '''
    render_screen("16_family_cabinet_inventory.png", wrap_screen(content, active_tab='family', show_admin=True))

# ─────────────────────────────────────────────────────────────────────────────
# 17. Symptom Journal Overview
# ─────────────────────────────────────────────────────────────────────────────
def screen_17():
    content = f'''
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
      <div>
        <div style="font-size:20px; font-weight:800; color:{C['textColor']};">Symptom Journal</div>
        <div style="font-size:10px; color:{C['midSlate']};">Track adverse effects &amp; clinical recovery timeline</div>
      </div>
      <div style="background:{C['sageGreenSolid']}; color:#FFF; font-size:10px; font-weight:800; padding:4px 11px; border-radius:10px; display:flex; align-items:center; gap:4px; box-shadow:0 2px 6px rgba(46,125,50,0.2);">
        <span>+</span><span>Log Symptom</span>
      </div>
    </div>

    <!-- Active Course Correlation Banner -->
    <div class="card" style="border-color:{C['borderStrong']}; background:rgba(129,199,132,0.12); padding:8px 11px; margin-bottom:5px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:11.5px; font-weight:800; color:{C['sageGreenSolid']};">Active Course: Amoxicillin 500mg</div>
          <div style="font-size:9px; color:{C['midSlate']};">Day 5 of 7 · Correlating symptoms with 8-hourly post-prandial intake</div>
        </div>
        <span class="badge-access" style="font-size:8.5px; padding:1px 6px;">Access Tier</span>
      </div>
    </div>

    <!-- 6 Clinical Timeline Entries -->
    <div style="display:flex; flex-direction:column; gap:4px; margin-bottom:5px;">
      <!-- Entry 1 -->
      <div class="card" style="padding:6px 9px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1px;">
          <div style="font-size:11.5px; font-weight:800; color:{C['textColor']};">Mild Stomach Cramp / Nausea</div>
          <span style="background:rgba(230,182,85,0.2); color:{C['warningAmberSolid']}; font-size:8px; font-weight:800; padding:1px 5px; border-radius:4px;">4 / 10 · Moderate</span>
        </div>
        <div style="font-size:8.5px; color:{C['midSlate']}; margin-bottom:2px;">Today, 08:30 AM · 30 min after morning dose (Day 5)</div>
        <div style="font-size:9px; color:{C['textColor']}; line-height:1.3; background:rgba(215,204,200,0.18); padding:3px 6px; border-radius:5px;">
          "Mild cramp 30 mins after pill. Resolved after drinking warm ginger tea. No vomiting."
        </div>
      </div>

      <!-- Entry 2 -->
      <div class="card" style="padding:6px 9px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1px;">
          <div style="font-size:11.5px; font-weight:800; color:{C['textColor']};">Mild Tension Headache</div>
          <span style="background:rgba(129,199,132,0.2); color:{C['sageGreenSolid']}; font-size:8px; font-weight:800; padding:1px 5px; border-radius:4px;">2 / 10 · Mild</span>
        </div>
        <div style="font-size:8.5px; color:{C['midSlate']}; margin-bottom:2px;">Yesterday, 09:15 PM · General / Fatigue (Day 4)</div>
        <div style="font-size:9px; color:{C['textColor']}; line-height:1.3; background:rgba(215,204,200,0.18); padding:3px 6px; border-radius:5px;">
          "Eased quickly after 500mL hydration and resting. No photophobia."
        </div>
      </div>

      <!-- Entry 3 -->
      <div class="card" style="padding:6px 9px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1px;">
          <div style="font-size:11.5px; font-weight:800; color:{C['textColor']};">Post-Prandial Lethargy</div>
          <span style="background:rgba(129,199,132,0.2); color:{C['sageGreenSolid']}; font-size:8px; font-weight:800; padding:1px 5px; border-radius:4px;">2 / 10 · Mild</span>
        </div>
        <div style="font-size:8.5px; color:{C['midSlate']}; margin-bottom:2px;">2 days ago, 03:30 PM · Post-Dose Observation (Day 3)</div>
        <div style="font-size:9px; color:{C['textColor']}; line-height:1.3; background:rgba(215,204,200,0.18); padding:3px 6px; border-radius:5px;">
          "Slight fatigue 1h post-lunch dose. Spontaneously resolved by 17:00 PM."
        </div>
      </div>

      <!-- Entry 4 -->
      <div class="card" style="padding:6px 9px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1px;">
          <div style="font-size:11.5px; font-weight:800; color:{C['textColor']};">Swallowing Discomfort Easing</div>
          <span style="background:rgba(129,199,132,0.2); color:{C['sageGreenSolid']}; font-size:8px; font-weight:800; padding:1px 5px; border-radius:4px;">3 / 10 · Improving</span>
        </div>
        <div style="font-size:8.5px; color:{C['midSlate']}; margin-bottom:2px;">3 days ago, 08:00 AM · Tonsillar Recovery (Day 2)</div>
        <div style="font-size:9px; color:{C['textColor']}; line-height:1.3; background:rgba(215,204,200,0.18); padding:3px 6px; border-radius:5px;">
          "Solid foods significantly easier to swallow. Pharyngeal erythema reducing."
        </div>
      </div>

      <!-- Entry 5 -->
      <div class="card" style="padding:6px 9px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1px;">
          <div style="font-size:11.5px; font-weight:800; color:{C['textColor']};">Throat Soreness &amp; Dysphagia</div>
          <span style="background:rgba(201,123,99,0.2); color:{C['dangerClaySolid']}; font-size:8px; font-weight:800; padding:1px 5px; border-radius:4px;">7 / 10 · High</span>
        </div>
        <div style="font-size:8.5px; color:{C['midSlate']}; margin-bottom:2px;">4 days ago, 02:00 PM · Primary Diagnosis (Day 1)</div>
        <div style="font-size:9px; color:{C['textColor']}; line-height:1.3; background:rgba(215,204,200,0.18); padding:3px 6px; border-radius:5px;">
          "Severe throat pain prior to starting antibiotic therapy. Culture verified streptococcal."
        </div>
      </div>

      <!-- Entry 6 -->
      <div class="card" style="padding:6px 9px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1px;">
          <div style="font-size:11.5px; font-weight:800; color:{C['textColor']};">Fever Spike (101.2°F)</div>
          <span style="background:rgba(201,123,99,0.2); color:{C['dangerClaySolid']}; font-size:8px; font-weight:800; padding:1px 5px; border-radius:4px;">8 / 10 · Severe</span>
        </div>
        <div style="font-size:8.5px; color:{C['midSlate']}; margin-bottom:2px;">5 days ago, 10:00 AM · Baseline Pre-Therapy</div>
        <div style="font-size:9px; color:{C['textColor']}; line-height:1.3; background:rgba(215,204,200,0.18); padding:3px 6px; border-radius:5px;">
          "High fever prior to course initiation. Fully resolved by Day 2 post first 3 doses."
        </div>
      </div>
    </div>

    <!-- Clinical Pharmacodynamic & Safety Correlation Card -->
    <div class="card" style="padding:7px 10px; margin-bottom:5px; background:rgba(215,204,200,0.18);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
        <span style="font-size:9px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase;">PHARMACODYNAMIC SAFETY CORRELATION</span>
        <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.2); padding:1px 5px; border-radius:4px;">PASS</span>
      </div>
      <div style="font-size:9px; color:{C['textColor']}; line-height:1.35;">
        Zero hypersensitivity rash, urticaria or anaphylactoid signs. GI discomfort is transient and post-prandial. Full bacterial eradication trajectory on target for Day 7 completion.
      </div>
    </div>

    <!-- Vitals & Biomarkers Association Strip -->
    <div class="card" style="padding:6px 10px; margin-bottom:5px; background:rgba(77,182,172,0.1); border-color:rgba(77,182,172,0.35); display:flex; justify-content:space-between; align-items:center;">
      <div style="text-align:center;"><div style="font-size:11px; font-weight:800; color:{C['mutedAccentSolid']};">98.4°F</div><div style="font-size:7.5px; color:{C['midSlate']};">Temp (Afebrile)</div></div>
      <div style="width:1px; height:18px; background:{C['border']};"></div>
      <div style="text-align:center;"><div style="font-size:11px; font-weight:800; color:{C['sageGreenSolid']};">99%</div><div style="font-size:7.5px; color:{C['midSlate']};">SpO2 (Normal)</div></div>
      <div style="width:1px; height:18px; background:{C['border']};"></div>
      <div style="text-align:center;"><div style="font-size:11px; font-weight:800; color:{C['sageGreenSolid']};">72 bpm</div><div style="font-size:7.5px; color:{C['midSlate']};">Pulse Rate</div></div>
      <div style="width:1px; height:18px; background:{C['border']};"></div>
      <div style="text-align:center;"><div style="font-size:11px; font-weight:800; color:{C['sageGreenSolid']};">6 / 6</div><div style="font-size:7.5px; color:{C['midSlate']};">Doses Left</div></div>
    </div>

    <!-- Trend Insight Card -->
    <div class="card" style="background:rgba(129,199,132,0.12); border-color:rgba(129,199,132,0.35); padding:7px 11px; margin-bottom:0;">
      <div style="display:flex; align-items:center; gap:6px; margin-bottom:1px;">
        <span style="font-size:12px;">📈</span>
        <span style="font-size:10.5px; font-weight:800; color:{C['sageGreenSolid']};">Recovery Trend: 82% Clinical Improvement</span>
      </div>
      <div style="font-size:9px; color:{C['midSlate']};">Primary pharyngeal inflammation resolved. Maintain adherence for remaining 2 days to avert AMR relapse.</div>
    </div>
    '''
    render_screen("17_symptom_journal_overview.png", wrap_screen(content, active_tab='journal', show_admin=True))

# ─────────────────────────────────────────────────────────────────────────────
# 18. Symptom Journal Logging Modal (Vivid blurred parent background)
# ─────────────────────────────────────────────────────────────────────────────
def screen_18():
    parent_bg = f'''
    <div style="padding:12px 16px; filter:blur(4px); opacity:0.85; pointer-events:none; height:100%; display:flex; flex-direction:column;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <div>
          <div style="font-size:20px; font-weight:800; color:{C['textColor']};">Symptom Journal</div>
          <div style="font-size:11px; color:{C['midSlate']};">Track adverse effects &amp; recovery</div>
        </div>
      </div>
      <div class="card" style="border-color:{C['borderStrong']}; background:rgba(129,199,132,0.15); padding:10px 12px; margin-bottom:9px;">
        <div style="font-size:11.5px; font-weight:800; color:{C['sageGreenSolid']};">Active Course: Amoxicillin 500mg</div>
      </div>
      <div class="card" style="padding:11px 13px; margin-bottom:8px;">
        <div style="font-size:13.5px; font-weight:800;">Stomach Cramp / Nausea</div>
      </div>
      <div class="card" style="padding:11px 13px; margin-bottom:8px;">
        <div style="font-size:13.5px; font-weight:800;">Mild Headache</div>
      </div>
      <div class="card" style="padding:11px 13px;">
        <div style="font-size:13.5px; font-weight:800;">Throat Soreness</div>
      </div>
    </div>
    '''

    content = f'''
    <div style="position:relative; width:100%; height:100%;">
      {parent_bg}
      <!-- Edge-to-Edge Modal Backdrop -->
      <div style="position:absolute; inset:0; background:rgba(25,20,16,0.42); display:flex; flex-direction:column; justify-content:flex-end;">
        <!-- Bottom Modal Sheet -->
        <div style="background:{C['surfaceElevated']}; border-top-left-radius:24px; border-top-right-radius:24px; padding:18px 18px 24px 18px; box-shadow:0 -8px 32px rgba(0,0,0,0.35);">
          <!-- Drag Handle -->
          <div style="width:40px; height:4px; background:{C['border']}; border-radius:2px; margin:0 auto 14px auto;"></div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <div>
              <div style="font-size:17px; font-weight:800; color:{C['textColor']};">Log New Symptom</div>
              <div style="font-size:11px; color:{C['midSlate']};">Record symptoms &amp; link to active medications</div>
            </div>
            <div style="width:28px; height:28px; border-radius:14px; background:rgba(215,204,200,0.3); display:flex; align-items:center; justify-content:center; color:{C['midSlate']}; font-weight:800;">✕</div>
          </div>

          <div style="font-size:10px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">SYMPTOM DESCRIPTION</div>
          <div style="height:42px; background:rgba(215,204,200,0.22); border:1px solid {C['border']}; border-radius:12px; padding:0 12px; display:flex; align-items:center; font-size:12.5px; font-weight:600; color:{C['textColor']}; margin-bottom:12px;">
            Mild stomach cramps after morning antibiotic dose
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-size:10px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px;">SEVERITY SCALE (1 - 10)</span>
            <span style="font-size:11.5px; font-weight:800; color:{C['warningAmberSolid']};">4 / 10 · Moderate</span>
          </div>
          <!-- Styled slider track -->
          <div style="height:24px; display:flex; align-items:center; position:relative; margin-bottom:12px;">
            <div style="width:100%; height:6px; background:rgba(215,204,200,0.4); border-radius:3px;">
              <div style="width:40%; height:100%; background:{C['warningAmberSolid']}; border-radius:3px;"></div>
            </div>
            <div style="position:absolute; left:38%; width:18px; height:18px; border-radius:9px; background:#FFF; border:3px solid {C['warningAmberSolid']}; box-shadow:0 2px 6px rgba(0,0,0,0.2);"></div>
          </div>

          <div style="font-size:10px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">LINK TO MEDICATION COURSE</div>
          <div style="height:42px; background:rgba(129,199,132,0.15); border:1.5px solid {C['sageGreenSolid']}; border-radius:12px; padding:0 12px; display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:14px;">💊</span>
              <span style="font-size:12.5px; font-weight:800; color:{C['sageGreenSolid']};">Amoxicillin 500mg</span>
            </div>
            <span style="font-size:11px; color:{C['sageGreenSolid']}; font-weight:700;">Active Course ›</span>
          </div>

          <div style="font-size:10px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">BODY SYSTEM TAGS</div>
          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:16px;">
            <div style="background:{C['sageGreenSolid']}; color:#FFF; font-size:10.5px; font-weight:800; padding:4px 10px; border-radius:8px;">✓ Stomach &amp; Digestive</div>
            <div style="background:rgba(215,204,200,0.25); border:1px solid {C['border']}; font-size:10.5px; font-weight:700; color:{C['midSlate']}; padding:4px 10px; border-radius:8px;">Skin &amp; Rash</div>
            <div style="background:rgba(215,204,200,0.25); border:1px solid {C['border']}; font-size:10.5px; font-weight:700; color:{C['midSlate']}; padding:4px 10px; border-radius:8px;">Respiratory</div>
            <div style="background:rgba(215,204,200,0.25); border:1px solid {C['border']}; font-size:10.5px; font-weight:700; color:{C['midSlate']}; padding:4px 10px; border-radius:8px;">Head / Neurological</div>
          </div>

          <div class="btn-primary" style="height:46px;">Save Symptom Entry</div>
        </div>
      </div>
    </div>
    '''
    render_screen("18_symptom_journal_logging_modal.png", wrap_screen(content, active_tab='journal', show_admin=True, no_padding=True))

# ─────────────────────────────────────────────────────────────────────────────
# 19. AI Consultant Image Scan (Blister strip multimodal recognition)
# ─────────────────────────────────────────────────────────────────────────────
def screen_19():
    content = f'''
    <!-- Top Segmented Tabs -->
    <div style="display:flex; background:rgba(215,204,200,0.3); border-radius:12px; padding:3px; margin-bottom:6px;">
      <div style="flex:1; text-align:center; padding:6px; font-size:12px; font-weight:800; background:#FFF; border-radius:9px; color:{C['sageGreenSolid']}; box-shadow:0 1px 4px rgba(0,0,0,0.06);">
        📷 Image Scan
      </div>
      <div style="flex:1; text-align:center; padding:6px; font-size:12px; font-weight:700; color:{C['midSlate']};">
        💬 AI Chat
      </div>
    </div>

    <!-- Upload Hero Card -->
    <div class="card" style="border:2px dashed {C['sageGreen']}; background:rgba(129,199,132,0.08); padding:8px 12px; margin-bottom:5px; text-align:center;">
      <div style="width:34px; height:34px; border-radius:17px; background:rgba(129,199,132,0.2); display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']}; margin:0 auto 3px auto;">
        {get_icon('scan', 18, C['sageGreenSolid'], 2)}
      </div>
      <div style="font-size:13.5px; font-weight:800; color:{C['textColor']};">Prescription &amp; Blister Pack Scan</div>
      <div style="font-size:9.5px; color:{C['midSlate']}; margin-top:1px;">Gemini 1.5 Pro multimodal clinical recognition engine</div>
    </div>

    <!-- Scanned Sample Analysis Card -->
    <div class="card" style="border-color:{C['borderStrong']}; padding:9px 11px; margin-bottom:5px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
        <span style="font-size:9.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase;">EXTRACTED DRUG METADATA</span>
        <span class="badge-access">Access Tier Verified</span>
      </div>

      <div style="display:flex; gap:9px; align-items:center; margin-bottom:5px;">
        <div style="width:40px; height:40px; border-radius:11px; background:rgba(129,199,132,0.2); border:1px solid rgba(129,199,132,0.4); display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']}; flex-shrink:0;">
          {get_icon('meds', 20, C['sageGreenSolid'], 2)}
        </div>
        <div>
          <div style="font-size:14px; font-weight:800; color:{C['textColor']};">Amoxicillin 500mg</div>
          <div style="font-size:9.5px; color:{C['midSlate']};">Penicillin Antibiotic · Oral Hard Capsule</div>
          <div style="font-size:8.5px; font-weight:700; color:{C['sageGreenSolid']}; margin-top:1px;">✓ Batch: AMX-2024-88A (Exp: Aug 2027)</div>
        </div>
      </div>

      <div style="background:rgba(215,204,200,0.18); border-radius:7px; padding:5px 8px; margin-bottom:5px;">
        <div style="font-size:8px; font-weight:800; color:{C['midSlate']}; margin-bottom:1px;">CLINICAL INDICATION</div>
        <div style="font-size:9.5px; color:{C['textColor']}; line-height:1.35;">
          Bactericidal beta-lactam indicated for susceptible upper respiratory tract infections. Active against S. pneumoniae &amp; H. influenzae.
        </div>
      </div>

      <div style="display:flex; gap:5px;">
        <div style="flex:1; background:rgba(129,199,132,0.15); border:1px solid rgba(129,199,132,0.4); border-radius:6px; padding:3px; font-size:8.5px; font-weight:700; color:{C['sageGreenSolid']}; text-align:center;">
          ✓ No Allergy Conflict
        </div>
        <div style="flex:1; background:rgba(77,182,172,0.15); border:1px solid rgba(77,182,172,0.4); border-radius:6px; padding:3px; font-size:8.5px; font-weight:700; color:{C['mutedAccentSolid']}; text-align:center;">
          ✓ Safe with Meals
        </div>
      </div>
    </div>

    <!-- Vision AI Extraction Diagnostics Card -->
    <div class="card" style="padding:8px 11px; margin-bottom:5px; background:rgba(77,182,172,0.1); border-color:rgba(77,182,172,0.35);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <span style="font-size:9px; font-weight:800; color:{C['mutedAccentSolid']}; text-transform:uppercase;">AI VISION EXTRACTION DIAGNOSTICS</span>
        <span style="font-size:8.5px; font-weight:800; color:{C['sageGreenSolid']};">99.1% Confidence</span>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; font-size:9px;">
        <div><span style="color:{C['midSlate']};">Detected INN:</span> <b style="color:{C['textColor']};">Amoxicillin</b></div>
        <div><span style="color:{C['midSlate']};">Strength:</span> <b style="color:{C['textColor']};">500 mg</b></div>
        <div><span style="color:{C['midSlate']};">Form Factor:</span> <b style="color:{C['textColor']};">Capsule</b></div>
        <div><span style="color:{C['midSlate']};">BBox:</span> <b style="font-family:'JetBrains Mono'; color:{C['textColor']};">[142, 88, 720, 310]</b></div>
      </div>
    </div>

    <!-- Patient-Specific Safety & Contraindications Card -->
    <div class="card" style="padding:8px 11px; margin-bottom:5px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
        <span style="font-size:9px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase;">SAFETY &amp; CONTRAINDICATION CROSS-CHECK</span>
        <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.2); padding:1px 5px; border-radius:4px;">Clear</span>
      </div>
      <div style="font-size:9px; color:{C['textColor']}; line-height:1.35; margin-bottom:3px;">
        Cross-checked with active cabinet medications (<b>Paracetamol 650mg</b>, <b>Metformin 500mg</b>). Zero pharmacokinetic drug-drug interactions detected.
      </div>
      <div style="display:flex; justify-content:space-between; font-size:8px; color:{C['midSlate']}; font-family:'JetBrains Mono';">
        <span>Renal Clearance: eGFR &gt;90 mL/min (Optimal)</span>
        <span style="color:{C['sageGreenSolid']}; font-weight:700;">NKDA Verified</span>
      </div>
    </div>

    <!-- Pharmacokinetic Absorption & Clearance Profile Card -->
    <div class="card" style="padding:6px 10px; margin-bottom:4px; background:rgba(215,204,200,0.18);">
      <div style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; margin-bottom:2px;">PHARMACOKINETIC CLEARANCE PROFILE</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; font-size:8.5px;">
        <div><span style="color:{C['midSlate']};">Peak Plasma Cmax:</span> <b>1.5 - 2.0h</b></div>
        <div><span style="color:{C['midSlate']};">Protein Binding:</span> <b>~20% (Low)</b></div>
        <div><span style="color:{C['midSlate']};">Elimination t½:</span> <b>60 - 90 min</b></div>
        <div><span style="color:{C['midSlate']};">Urinary Excretion:</span> <b>&gt;70% intact</b></div>
      </div>
    </div>

    <!-- Clinical Administration & Probiotic Timing Card -->
    <div class="card" style="padding:6px 10px; margin-bottom:4px; background:rgba(129,199,132,0.1); border-color:rgba(129,199,132,0.35);">
      <div style="font-size:8.5px; font-weight:800; color:{C['sageGreenSolid']}; text-transform:uppercase; margin-bottom:2px;">ADMINISTRATION &amp; PROBIOTIC TIMING</div>
      <div style="font-size:8.5px; color:{C['textColor']}; line-height:1.35;">
        Take with 250mL water. Space active probiotics (S. boulardii) <b>2 hours apart</b> to preserve gut microbiome during course.
      </div>
    </div>

    <!-- Recent Multimodal Scans History -->
    <div class="card" style="padding:6px 11px; margin-bottom:4px;">
      <div style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:3px;">RECENT MULTIMODAL SCANS</div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:8.5px; padding-bottom:2px; border-bottom:1px solid {C['border']};">
        <div>
          <span style="font-weight:800; color:{C['textColor']};">Ciprofloxacin 500mg</span>
          <span style="font-size:7.5px; color:{C['midSlate']};"> · Blister (Oct 08)</span>
        </div>
        <span class="badge-watch" style="font-size:7px;">Watch</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:8.5px; padding-top:2px;">
        <div>
          <span style="font-weight:800; color:{C['textColor']};">Augmentin 625mg</span>
          <span style="font-size:7.5px; color:{C['midSlate']};"> · Rx Paper (Aug 01)</span>
        </div>
        <span class="badge-access" style="font-size:7px;">Access</span>
      </div>
    </div>

    <!-- Action Buttons -->
    <div style="display:flex; flex-direction:column; gap:4px; margin-top:2px;">
      <div class="btn-primary" style="gap:8px; height:38px;">
        <span>Ask AI Consultant About This Drug</span>
        <span>{get_icon('chevronRight', 16, '#FFF', 2)}</span>
      </div>
      <div style="height:33px; border:1px solid {C['border']}; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:10.5px; font-weight:700; color:{C['midSlate']}; background:{C['surface']};">
        Add to Active Medication Tracker
      </div>
    </div>
    '''
    render_screen("19_ai_consultant_image_scan.png", wrap_screen(content, active_tab='ai', show_admin=True))

# ─────────────────────────────────────────────────────────────────────────────
# 20. AI Chatbot Conversation (Rich dialogue spanning full viewport)
# ─────────────────────────────────────────────────────────────────────────────
def screen_20():
    content = f'''
    <!-- Top Segmented Tabs -->
    <div style="display:flex; background:rgba(215,204,200,0.3); border-radius:12px; padding:3px; margin-bottom:5px;">
      <div style="flex:1; text-align:center; padding:5px; font-size:11.5px; font-weight:700; color:{C['midSlate']};">
        📷 Image Scan
      </div>
      <div style="flex:1; text-align:center; padding:5px; font-size:11.5px; font-weight:800; background:#FFF; border-radius:9px; color:{C['sageGreenSolid']}; box-shadow:0 1px 4px rgba(0,0,0,0.06);">
        💬 AI Chat
      </div>
    </div>

    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px; padding:0 2px;">
      <span style="font-size:9.5px; font-weight:700; color:{C['midSlate']};">Gemini 1.5 Pro Clinical Assistant</span>
      <span style="font-size:8.5px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.2); padding:1px 6px; border-radius:5px;">Patient: Dr. Alex Sharma</span>
    </div>

    <!-- Chat Message Container (Fills edge-to-edge) -->
    <div style="display:flex; flex-direction:column; gap:4px; margin-bottom:4px;">
      <!-- Turn 1 -->
      <div style="align-self:flex-end; max-width:85%; background:{C['sageGreenSolid']}; color:#FFF; border-radius:12px 12px 3px 12px; padding:6px 10px; font-size:10.5px; line-height:1.3; box-shadow:0 1px 4px rgba(46,125,50,0.2);">
        Can I take Amoxicillin at the same time as my daily multivitamin?
      </div>
      <div style="align-self:flex-start; max-width:88%; background:{C['surface']}; border:1px solid {C['border']}; border-left:3px solid {C['sageGreenSolid']}; border-radius:12px 12px 12px 3px; padding:6px 9px; font-size:9.5px; line-height:1.35; color:{C['textColor']}; box-shadow:0 1px 4px rgba(141,110,99,0.05);">
        Yes, Dr. Sharma. Amoxicillin can be taken with standard multivitamins. If minerals include high-dose iron, zinc, or magnesium, space them at least 2 hours apart to ensure optimal gastrointestinal absorption.
      </div>

      <!-- Turn 2 -->
      <div style="align-self:flex-end; max-width:85%; background:{C['sageGreenSolid']}; color:#FFF; border-radius:12px 12px 3px 12px; padding:6px 10px; font-size:10.5px; line-height:1.3; box-shadow:0 1px 4px rgba(46,125,50,0.2);">
        What should I do if I missed my 2:00 PM afternoon dose?
      </div>
      <div style="align-self:flex-start; max-width:88%; background:{C['surface']}; border:1px solid {C['border']}; border-left:3px solid {C['sageGreenSolid']}; border-radius:12px 12px 12px 3px; padding:6px 9px; font-size:9.5px; line-height:1.35; color:{C['textColor']}; box-shadow:0 1px 4px rgba(141,110,99,0.05);">
        If within 2–3 hours, take it as soon as remembered. If close to your 20:00 PM evening dose, skip the missed dose and resume your regular schedule. Never double up doses.
      </div>

      <!-- Turn 3 -->
      <div style="align-self:flex-end; max-width:85%; background:{C['sageGreenSolid']}; color:#FFF; border-radius:12px 12px 3px 12px; padding:6px 10px; font-size:10.5px; line-height:1.3; box-shadow:0 1px 4px rgba(46,125,50,0.2);">
        Should I take probiotics or yogurt while taking this?
      </div>
      <div style="align-self:flex-start; max-width:88%; background:{C['surface']}; border:1px solid {C['border']}; border-left:3px solid {C['sageGreenSolid']}; border-radius:12px 12px 12px 3px; padding:6px 9px; font-size:9.5px; line-height:1.35; color:{C['textColor']}; box-shadow:0 1px 4px rgba(141,110,99,0.05);">
        Yes, probiotics preserve gut microbiome balance. Space probiotic intake at least 2 to 3 hours away from Amoxicillin so the antibiotic does not neutralize the active flora.
      </div>

      <!-- Turn 4: AMR Stewardship Crucial Question -->
      <div style="align-self:flex-end; max-width:85%; background:{C['sageGreenSolid']}; color:#FFF; border-radius:12px 12px 3px 12px; padding:5px 9px; font-size:10px; line-height:1.3; box-shadow:0 1px 4px rgba(46,125,50,0.2);">
        I feel completely recovered now on Day 5. Can I stop early?
      </div>
      <div style="align-self:flex-start; max-width:88%; background:{C['surface']}; border:1px solid {C['border']}; border-left:3px solid {C['dangerClaySolid']}; border-radius:12px 12px 12px 3px; padding:5px 8px; font-size:9px; line-height:1.3; color:{C['textColor']}; box-shadow:0 1px 4px rgba(141,110,99,0.05);">
        <b style="color:{C['dangerClaySolid']};">No, please complete the full 7-day course.</b> Premature cessation leaves sub-inhibitory bacterial reservoirs and triggers AMR mutant selection pressure.
      </div>

      <!-- Turn 5 -->
      <div style="align-self:flex-end; max-width:85%; background:{C['sageGreenSolid']}; color:#FFF; border-radius:12px 12px 3px 12px; padding:5px 9px; font-size:10px; line-height:1.3; box-shadow:0 1px 4px rgba(46,125,50,0.2);">
        Can I drink tea, coffee, or milk right after taking Amoxicillin?
      </div>
      <div style="align-self:flex-start; max-width:88%; background:{C['surface']}; border:1px solid {C['border']}; border-left:3px solid {C['sageGreenSolid']}; border-radius:12px 12px 12px 3px; padding:5px 8px; font-size:9px; line-height:1.3; color:{C['textColor']}; box-shadow:0 1px 4px rgba(141,110,99,0.05);">
        Yes, milk or tea does not reduce Amoxicillin bioavailability, unlike fluoroquinolones. Avoid excessively scalding liquids immediately after swallowing capsules.
      </div>

      <!-- Turn 6 -->
      <div style="align-self:flex-end; max-width:85%; background:{C['sageGreenSolid']}; color:#FFF; border-radius:12px 12px 3px 12px; padding:5px 9px; font-size:10px; line-height:1.3; box-shadow:0 1px 4px rgba(46,125,50,0.2);">
        What signs of an allergic reaction should I monitor?
      </div>
      <div style="align-self:flex-start; max-width:88%; background:{C['surface']}; border:1px solid {C['border']}; border-left:3px solid {C['warningAmberSolid']}; border-radius:12px 12px 12px 3px; padding:5px 8px; font-size:9px; line-height:1.3; color:{C['textColor']}; box-shadow:0 1px 4px rgba(141,110,99,0.05);">
        Watch for sudden urticaria/hives, lip or facial swelling, or wheezing. If rash appears, stop immediately and contact Dr. R. K. Mehta.
      </div>

      <!-- Clinical Stewardship Proactive Card -->
      <div class="card" style="background:rgba(129,199,132,0.12); border-color:rgba(129,199,132,0.35); padding:5px 8px; margin-bottom:0;">
        <div style="display:flex; align-items:center; gap:5px; margin-bottom:1px;">
          <span style="font-size:10px;">🛡️</span>
          <span style="font-size:9px; font-weight:800; color:{C['sageGreenSolid']};">Antimicrobial Stewardship Active</span>
        </div>
        <div style="font-size:8px; color:{C['midSlate']};">5 of 7 days completed (6 doses remaining). Scheduled next at 20:00 PM. Adherence: 96.4%.</div>
      </div>
    </div>

    <!-- Pinned Bottom Controls -->
    <div style="margin-top:2px; display:flex; flex-direction:column; gap:3px;">
      <!-- Clinical Safeguards disclaimer -->
      <div style="font-size:7.5px; color:{C['midSlate']}; text-align:center;">
        🔒 Clinical intelligence verified against WHO AWaRe &amp; CDSCO National Formulary
      </div>

      <!-- Suggested Quick Prompts -->
      <div style="display:flex; gap:4px; overflow:hidden;">
        <div style="background:{C['surface']}; border:1px solid {C['border']}; padding:3px 7px; border-radius:8px; font-size:8.5px; font-weight:700; color:{C['midSlate']}; white-space:nowrap;">Take with food?</div>
        <div style="background:{C['surface']}; border:1px solid {C['border']}; padding:3px 7px; border-radius:8px; font-size:8.5px; font-weight:700; color:{C['midSlate']}; white-space:nowrap;">Side effects</div>
        <div style="background:{C['surface']}; border:1px solid {C['border']}; padding:3px 7px; border-radius:8px; font-size:8.5px; font-weight:700; color:{C['midSlate']}; white-space:nowrap;">Alcohol interaction</div>
      </div>

      <!-- Pinned Bottom Input Bar -->
      <div style="display:flex; align-items:center; background:{C['surface']}; border:1.5px solid {C['border']}; border-radius:14px; padding:3px 5px 3px 10px; box-shadow:0 2px 8px rgba(141,110,99,0.08);">
        <div style="flex:1; font-size:10.5px; color:{C['midSlate']};">Ask a question about your medication...</div>
        <div style="width:30px; height:30px; border-radius:9px; background:{C['sageGreenSolid']}; display:flex; align-items:center; justify-content:center; color:#FFF;">
          {get_icon('arrowRight', 15, '#FFF', 2)}
        </div>
      </div>
    </div>
    '''
    render_screen("20_ai_chatbot_conversation.png", wrap_screen(content, active_tab='ai', show_admin=True))

# ─────────────────────────────────────────────────────────────────────────────
# 21. Profile Settings Sovereignty (Direct mirror of ProfileSettingsScreen.tsx)
# ─────────────────────────────────────────────────────────────────────────────
def screen_21():
    content = f'''
    <div style="margin-bottom:5px;">
      <div style="font-size:20px; font-weight:800; color:{C['textColor']};">Profile &amp; Settings</div>
      <div style="font-size:10px; color:{C['midSlate']};">Account governance &amp; clinical data sovereignty</div>
    </div>

    <!-- User Profile Hero Card matching ProfileSettingsScreen.tsx -->
    <div class="card" style="display:flex; align-items:center; gap:10px; padding:8px 11px; margin-bottom:5px;">
      <div style="width:42px; height:42px; border-radius:21px; background:rgba(129,199,132,0.2); border:2px solid {C['sageGreen']}; display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']}; flex-shrink:0;">
        {get_icon('stethoscope', 20, C['sageGreenSolid'], 2)}
      </div>
      <div>
        <div style="font-size:14.5px; font-weight:800; color:{C['textColor']};">Dr. Alex Sharma</div>
        <div style="font-size:9.5px; color:{C['midSlate']}; font-family:'JetBrains Mono';">alex.sharma@medsentry.health</div>
        <div style="margin-top:1px; display:inline-flex; align-items:center; gap:4px; background:rgba(129,199,132,0.2); color:{C['sageGreenSolid']}; font-size:8px; font-weight:800; padding:1px 5px; border-radius:4px;">
          ✓ Superadmin &amp; Primary Caregiver
        </div>
      </div>
    </div>

    <!-- Quick Health Stats Strip matching ProfileSettingsScreen.tsx -->
    <div class="card" style="display:flex; justify-content:space-around; align-items:center; padding:5px; margin-bottom:5px;">
      <div style="text-align:center;"><div style="font-size:12.5px; font-weight:800; color:{C['sageGreenSolid']};">38 yrs</div><div style="font-size:7.5px; color:{C['midSlate']};">Age</div></div>
      <div style="width:1px; height:15px; background:{C['border']};"></div>
      <div style="text-align:center;"><div style="font-size:12.5px; font-weight:800; color:{C['sageGreenSolid']};">74 kg</div><div style="font-size:7.5px; color:{C['midSlate']};">Weight</div></div>
      <div style="width:1px; height:15px; background:{C['border']};"></div>
      <div style="text-align:center;"><div style="font-size:12.5px; font-weight:800; color:{C['sageGreenSolid']};">178 cm</div><div style="font-size:7.5px; color:{C['midSlate']};">Height</div></div>
      <div style="width:1px; height:15px; background:{C['border']};"></div>
      <div style="text-align:center;"><div style="font-size:12.5px; font-weight:800; color:{C['warningAmberSolid']};">NKDA</div><div style="font-size:7.5px; color:{C['midSlate']};">Allergies</div></div>
    </div>

    <!-- Clinical Profile & Known Conditions Card -->
    <div class="card" style="padding:7px 10px; margin-bottom:5px;">
      <div style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:3px;">CLINICAL PROFILE &amp; DIAGNOSES</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:3px; font-size:9px;">
        <div><span style="color:{C['midSlate']};">Physician:</span> <b style="color:{C['textColor']};">Dr. R. K. Mehta</b></div>
        <div><span style="color:{C['midSlate']};">Blood Group:</span> <b style="color:{C['dangerClaySolid']};">B+ Positive</b></div>
        <div><span style="color:{C['midSlate']};">Conditions:</span> <b style="color:{C['textColor']};">Mild Asthma</b></div>
        <div><span style="color:{C['midSlate']};">Emergency:</span> <b style="color:{C['textColor']};">Sunita (Mother)</b></div>
      </div>
    </div>

    <!-- Admin System Console Banner matching ProfileSettingsScreen.tsx -->
    <div class="card" style="background:rgba(201,123,99,0.12); border-color:rgba(201,123,99,0.4); padding:6px 10px; margin-bottom:5px; display:flex; justify-content:space-between; align-items:center;">
      <div style="display:flex; align-items:center; gap:7px;">
        <span style="font-size:13px;">🔐</span>
        <div>
          <div style="font-size:10.5px; font-weight:800; color:{C['dangerClaySolid']};">Admin Control Panel</div>
          <div style="font-size:8px; color:{C['midSlate']};">Manage accounts, inspect audit trails &amp; AMR heatmaps</div>
        </div>
      </div>
      <span style="font-size:11px; font-weight:800; color:{C['dangerClaySolid']};">›</span>
    </div>

    <!-- Clinical Data Sovereignty Card -->
    <div class="card" style="border-color:{C['borderStrong']}; padding:7px 10px; margin-bottom:5px;">
      <div style="font-size:8.5px; font-weight:800; color:{C['sageGreenSolid']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:3px; display:flex; align-items:center; gap:4px;">
        {get_icon('shield', 10, C['sageGreenSolid'])} Clinical Data Sovereignty
      </div>
      <div style="display:flex; flex-direction:column; gap:3px;">
        <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:2px; border-bottom:1px solid {C['border']};">
          <span style="font-size:10px; font-weight:700;">Encrypted Health Vault</span>
          <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.2); padding:1px 5px; border-radius:4px;">AES-256 Active</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:2px; border-bottom:1px solid {C['border']};">
          <span style="font-size:10px; font-weight:700;">Row-Level Security (RLS)</span>
          <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.2); padding:1px 5px; border-radius:4px;">Enforced</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:10px; font-weight:700;">Caregiver Circle Access Policy</span>
          <span style="font-size:9px; font-weight:800; color:{C['mutedAccentSolid']};">The Sharma Family ›</span>
        </div>
      </div>
    </div>

    <!-- Biometric App Lock & Session Security Card -->
    <div class="card" style="padding:7px 10px; margin-bottom:5px; background:rgba(77,182,172,0.1); border-color:rgba(77,182,172,0.35);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
        <span style="font-size:8.5px; font-weight:800; color:{C['mutedAccentSolid']}; text-transform:uppercase;">BIOMETRIC &amp; SESSION SECURITY</span>
        <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.2); padding:1px 5px; border-radius:4px;">ENABLED</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:9px;">
        <span style="color:{C['textColor']};">Biometric Lock: <b>Fingerprint / Face ID</b></span>
        <span style="color:{C['midSlate']}; font-family:'JetBrains Mono';">Auto-lock: 5 min</span>
      </div>
    </div>

    <!-- FHIR & Clinical Records Export Card -->
    <div class="card" style="padding:7px 10px; margin-bottom:5px; background:rgba(215,204,200,0.18);">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:9.5px; font-weight:800;">FHIR R4 &amp; PDF Dossier Export</div>
          <div style="font-size:7.5px; color:{C['midSlate']};">Cryptographically sealed interoperable health passport</div>
        </div>
        <div style="background:{C['sageGreenSolid']}; color:#FFF; font-size:8px; font-weight:800; padding:2px 6px; border-radius:5px;">
          Export ›
        </div>
      </div>
    </div>

    <!-- App Preferences & Push Notifications -->
    <div class="card" style="padding:7px 10px; margin-bottom:5px;">
      <div style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:3px;">PREFERENCES &amp; ALERTS</div>
      <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:2px; border-bottom:1px solid {C['border']};">
        <div>
          <div style="font-size:10px; font-weight:700;">Audible Dose Reminders</div>
          <div style="font-size:7.5px; color:{C['midSlate']};">Push notification alert at scheduled intake</div>
        </div>
        <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.2); padding:1px 5px; border-radius:4px;">ON</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; padding-top:2px;">
        <div>
          <div style="font-size:10px; font-weight:700;">Emergency Caregiver Escalation</div>
          <div style="font-size:7.5px; color:{C['midSlate']};">Dispatch alert if dependent dose is missed &gt;45m</div>
        </div>
        <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.2); padding:1px 5px; border-radius:4px;">ACTIVE</span>
      </div>
    </div>

    <!-- Storage & Offline Cache -->
    <div class="card" style="padding:5px 10px; margin-bottom:4px; background:rgba(215,204,200,0.18);">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:9px; font-weight:800;">Offline SQLite Cache</div>
          <div style="font-size:7.5px; color:{C['midSlate']};">Local database ready · 100% offline capable</div>
        </div>
        <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']};">3.2 MB</span>
      </div>
    </div>

    <!-- Cryptographic Privacy Shield Card -->
    <div class="card" style="padding:5px 10px; margin-bottom:4px; background:rgba(129,199,132,0.1); border-color:rgba(129,199,132,0.35);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1px;">
        <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']}; text-transform:uppercase;">DIFFERENTIAL PRIVACY SHIELD</span>
        <span style="font-size:7.5px; font-weight:800; color:{C['sageGreenSolid']};">ε = 0.5 ACTIVE</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:7.5px; color:{C['midSlate']}; font-family:'JetBrains Mono';">
        <span>Key: Ed25519 Hardware Enclave</span>
        <span>Residency: India West (MeitY)</span>
      </div>
    </div>

    <!-- National Digital Health & ABHA Card -->
    <div class="card" style="padding:5px 10px; margin-bottom:4px; background:rgba(77,182,172,0.1); border-color:rgba(77,182,172,0.3);">
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:8px;">
        <span><b>ABHA ID:</b> 91-4821-9920-1412 (Linked)</span>
        <span style="color:{C['sageGreenSolid']}; font-weight:800;">✓ Health Connect</span>
      </div>
    </div>

    <!-- App Version & Sign out -->
    <div style="display:flex; justify-content:space-between; align-items:center; padding:1px 3px; margin-top:2px;">
      <div style="font-size:8.5px; color:{C['midSlate']}; font-weight:600;">MedSentry v2.4.0 · Build 2026.10</div>
      <div style="font-size:9.5px; font-weight:800; color:{C['dangerClaySolid']};">Sign Out</div>
    </div>
    '''
    render_screen("21_profile_settings_sovereignty.png", wrap_screen(content, active_tab='profile', show_admin=True))

# ─────────────────────────────────────────────────────────────────────────────
# 22. Profile Clinical BMI
# ─────────────────────────────────────────────────────────────────────────────
def screen_22():
    content = f'''
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
      <div style="width:34px; height:34px; border-radius:10px; background:{C['surface']}; border:1px solid {C['border']}; display:flex; align-items:center; justify-content:center; color:{C['textColor']};">
        {get_icon('chevronLeft', 18, C['textColor'])}
      </div>
      <div>
        <div style="font-size:18px; font-weight:800; color:{C['textColor']};">Clinical Vitals &amp; BMI</div>
        <div style="font-size:10px; color:{C['midSlate']};">Weight-adjusted dosing &amp; renal clearance</div>
      </div>
    </div>

    <!-- BMI Hero Card -->
    <div class="card" style="padding:9px 12px; margin-bottom:5px; text-align:center;">
      <div style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:1px;">BODY MASS INDEX (BMI)</div>
      <div style="font-size:26px; font-weight:800; color:{C['sageGreenSolid']}; line-height:1; margin-bottom:2px;">23.4</div>
      <div style="display:inline-block; margin-bottom:6px;">
        <span class="badge-access" style="font-size:9px; padding:2px 7px;">Normal / Healthy Weight</span>
      </div>

      <!-- Color Gauge Bar -->
      <div style="height:6px; background:linear-gradient(to right, #42A5F5 18%, #81C784 18%, #81C784 48%, #FFB74D 48%, #FFB74D 75%, #E57373 75%); border-radius:3px; position:relative; margin-bottom:4px;">
        <!-- Needle Marker for 23.4 (around 38%) -->
        <div style="position:absolute; left:38%; top:-3px; width:4px; height:12px; background:{C['textColor']}; border-radius:2px; box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:7.5px; font-weight:700; color:{C['midSlate']};">
        <span>Under (&lt;18.5)</span>
        <span>Normal (18.5–24.9)</span>
        <span>Over (25–29.9)</span>
        <span>Obese (&gt;30)</span>
      </div>
    </div>

    <!-- Vitals Measurement Grid -->
    <div class="card" style="padding:7px 10px; margin-bottom:5px;">
      <div style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">PHYSIOLOGICAL MEASUREMENTS</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px;">
        <div style="background:rgba(215,204,200,0.22); border-radius:7px; padding:4px 7px;">
          <div style="font-size:7.5px; color:{C['midSlate']};">Weight</div>
          <div style="font-size:12px; font-weight:800; color:{C['textColor']};">74.0 kg</div>
        </div>
        <div style="background:rgba(215,204,200,0.22); border-radius:7px; padding:4px 7px;">
          <div style="font-size:7.5px; color:{C['midSlate']};">Height</div>
          <div style="font-size:12px; font-weight:800; color:{C['textColor']};">178 cm</div>
        </div>
        <div style="background:rgba(215,204,200,0.22); border-radius:7px; padding:4px 7px;">
          <div style="font-size:7.5px; color:{C['midSlate']};">Blood Pressure</div>
          <div style="font-size:12px; font-weight:800; color:{C['textColor']};">118 / 78 <span style="font-size:8px; color:{C['midSlate']}; font-weight:600;">mmHg</span></div>
        </div>
        <div style="background:rgba(215,204,200,0.22); border-radius:7px; padding:4px 7px;">
          <div style="font-size:7.5px; color:{C['midSlate']};">Resting Pulse</div>
          <div style="font-size:12px; font-weight:800; color:{C['textColor']};">72 <span style="font-size:8px; color:{C['midSlate']}; font-weight:600;">bpm</span></div>
        </div>
      </div>
    </div>

    <!-- Target Clinical Vitals Window Card -->
    <div class="card" style="padding:7px 10px; margin-bottom:5px; background:rgba(129,199,132,0.12); border-color:rgba(129,199,132,0.35);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
        <span style="font-size:8.5px; font-weight:800; color:{C['sageGreenSolid']}; text-transform:uppercase;">TARGET CLINICAL VITALS WINDOW</span>
        <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.25); padding:1px 5px; border-radius:4px;">OPTIMAL</span>
      </div>
      <div style="font-size:9px; color:{C['textColor']}; line-height:1.3;">
        Target BP: &lt;120/80 mmHg · Target HR: 60–80 bpm · BMI Target: 18.5–24.9 kg/m².<br/>
        All clinical parameters currently within recommended therapeutic range.
      </div>
    </div>

    <!-- Renal Clearance Calculator Card -->
    <div class="card" style="padding:7px 10px; margin-bottom:5px; background:rgba(77,182,172,0.1); border-color:rgba(77,182,172,0.35);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
        <span style="font-size:8.5px; font-weight:800; color:{C['mutedAccentSolid']}; text-transform:uppercase;">RENAL FUNCTION &amp; CLEARANCE CALCULATOR</span>
        <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.2); padding:1px 5px; border-radius:4px;">Stage 1 Normal</span>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:3px; font-size:9px; margin-bottom:3px;">
        <div><span style="color:{C['midSlate']};">Est. eGFR:</span> <b style="color:{C['textColor']};">&gt;90 mL/min/1.73m²</b></div>
        <div><span style="color:{C['midSlate']};">Creatinine CrCl:</span> <b style="color:{C['textColor']};">112 mL/min</b></div>
      </div>
      <div style="font-size:8.5px; color:{C['textColor']}; line-height:1.3;">
        Optimal glomerular clearance. Zero dosage attenuation or interval elongation required for beta-lactams and fluoroquinolones.
      </div>
    </div>

    <!-- Serum Biomarkers Correlation Card -->
    <div class="card" style="padding:7px 10px; margin-bottom:5px; background:rgba(215,204,200,0.18);">
      <div style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:3px;">SERUM BIOMARKERS &amp; LAB CORRELATION</div>
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:3px; font-size:8.5px;">
        <div><span style="color:{C['midSlate']};">Creatinine:</span> <b style="color:{C['sageGreenSolid']};">0.9 mg/dL</b></div>
        <div><span style="color:{C['midSlate']};">Fasting Gluc:</span> <b style="color:{C['textColor']};">94 mg/dL</b></div>
        <div><span style="color:{C['midSlate']};">ALT / AST:</span> <b style="color:{C['textColor']};">22/26 U/L</b></div>
      </div>
    </div>

    <!-- Connected IoT Device Card -->
    <div class="card" style="padding:6px 10px; margin-bottom:5px; background:rgba(215,204,200,0.18);">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:9.5px; font-weight:800;">Omron Evolv Wireless Blood Pressure</div>
          <div style="font-size:7.5px; color:{C['midSlate']};">Bluetooth LE connected · Last synced Today 08:30 AM</div>
        </div>
        <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']};">✓ Synced</span>
      </div>
    </div>

    <!-- Historical Vitals Trend -->
    <div class="card" style="padding:7px 10px; margin-bottom:6px;">
      <div style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:3px;">HISTORICAL VITALS TREND</div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:9px; padding-bottom:2px; border-bottom:1px solid {C['border']};">
        <span style="font-weight:700;">Oct 10 (Today)</span>
        <span style="color:{C['midSlate']};">74.0 kg · 118/78 mmHg</span>
        <span style="font-weight:800; color:{C['sageGreenSolid']};">BMI 23.4</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:8.5px; padding-top:2px; border-bottom:1px solid {C['border']};">
        <span style="font-weight:700;">Sep 25, 2026</span>
        <span style="color:{C['midSlate']};">74.2 kg · 120/80 mmHg</span>
        <span style="font-weight:800; color:{C['sageGreenSolid']};">BMI 23.4</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:8.5px; padding-top:2px;">
        <span style="font-weight:700;">Aug 18, 2026</span>
        <span style="color:{C['midSlate']};">74.5 kg · 122/82 mmHg</span>
        <span style="font-weight:800; color:{C['sageGreenSolid']};">BMI 23.5</span>
      </div>
    </div>

    <!-- Pharmacokinetic Body Surface Area (BSA) & Distribution Volume Card -->
    <div class="card" style="padding:6px 10px; margin-bottom:4px; background:rgba(215,204,200,0.18);">
      <div style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; margin-bottom:2px;">BODY COMPOSITION &amp; DISTRIBUTION KINETICS</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:3px; font-size:8px;">
        <div><span style="color:{C['midSlate']};">Body Surface Area (BSA):</span> <b>1.91 m²</b></div>
        <div><span style="color:{C['midSlate']};">Total Body Water (TBW):</span> <b>43.8 L</b></div>
        <div><span style="color:{C['midSlate']};">Lean Body Mass:</span> <b>60.2 kg</b></div>
        <div><span style="color:{C['midSlate']};">Distribution Volume (Vd):</span> <b>Normal</b></div>
      </div>
    </div>

    <!-- Clinical Dosing Clearance Safety Strip -->
    <div class="card" style="padding:5px 10px; margin-bottom:4px; background:rgba(129,199,132,0.12); border-color:rgba(129,199,132,0.35);">
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:8px;">
        <span style="color:{C['textColor']};"><b>Dosing Safety:</b> Standard adult posology approved for all classes</span>
        <span style="color:{C['sageGreenSolid']}; font-weight:800;">✓ VALIDATED</span>
      </div>
    </div>

    <div class="btn-primary" style="height:40px; gap:8px; margin-top:2px;">
      <span>Update Vitals Record</span>
      <span>{get_icon('check', 16, '#FFF', 2)}</span>
    </div>
    '''
    render_screen("22_profile_clinical_bmi.png", wrap_screen(content, active_tab='profile', show_admin=True))

# ─────────────────────────────────────────────────────────────────────────────
# 23. Profile Avatar Selector (Vivid blurred parent background + rich modal)
# ─────────────────────────────────────────────────────────────────────────────
def screen_23():
    parent_bg = f'''
    <div style="padding:12px 16px; filter:blur(4px); opacity:0.85; pointer-events:none; height:100%; display:flex; flex-direction:column;">
      <div style="margin-bottom:10px;">
        <div style="font-size:20px; font-weight:800; color:{C['textColor']};">Profile &amp; Settings</div>
      </div>
      <div class="card" style="display:flex; align-items:center; gap:12px; padding:12px; margin-bottom:8px;">
        <div style="width:50px; height:50px; border-radius:25px; background:rgba(129,199,132,0.2); border:2px solid {C['sageGreen']}; display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']};">
          {get_icon('stethoscope', 26, C['sageGreenSolid'])}
        </div>
        <div>
          <div style="font-size:16.5px; font-weight:800;">Dr. Alex Sharma</div>
          <div style="font-size:11px; color:{C['midSlate']};">alex.sharma@medsentry.health</div>
        </div>
      </div>
      <div class="card" style="height:80px; margin-bottom:8px;"></div>
      <div class="card" style="height:120px;"></div>
    </div>
    '''

    content = f'''
    <div style="position:relative; width:100%; height:100%;">
      {parent_bg}
      <!-- Edge-to-Edge Modal Backdrop -->
      <div style="position:absolute; inset:0; background:rgba(25,20,16,0.42); display:flex; flex-direction:column; justify-content:flex-end;">
        <!-- Bottom Modal Sheet -->
        <div style="background:{C['surfaceElevated']}; border-top-left-radius:24px; border-top-right-radius:24px; padding:18px 18px 24px 18px; box-shadow:0 -8px 32px rgba(0,0,0,0.35);">
          <!-- Drag Handle -->
          <div style="width:40px; height:4px; background:{C['border']}; border-radius:2px; margin:0 auto 14px auto;"></div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <div>
              <div style="font-size:17px; font-weight:800; color:{C['textColor']};">Select Clinical Avatar</div>
              <div style="font-size:11px; color:{C['midSlate']};">Choose a profile emblem for your account</div>
            </div>
            <div style="width:28px; height:28px; border-radius:14px; background:rgba(215,204,200,0.3); display:flex; align-items:center; justify-content:center; color:{C['midSlate']}; font-weight:800;">✕</div>
          </div>

          <!-- 6 Avatar Grid Options -->
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:12px;">
            <!-- 1. Clinician (Selected) -->
            <div style="background:rgba(129,199,132,0.2); border:2px solid {C['sageGreenSolid']}; border-radius:14px; padding:12px 6px; text-align:center; position:relative;">
              <div style="position:absolute; top:-6px; right:-6px; width:18px; height:18px; border-radius:9px; background:{C['sageGreenSolid']}; color:#FFF; display:flex; align-items:center; justify-content:center; font-size:10px;">✓</div>
              <div style="color:{C['sageGreenSolid']}; display:flex; justify-content:center; margin-bottom:4px;">{get_icon('stethoscope', 28, C['sageGreenSolid'], 2)}</div>
              <div style="font-size:11px; font-weight:800; color:{C['sageGreenSolid']};">Clinician</div>
            </div>

            <!-- 2. Capsule -->
            <div style="background:{C['surface']}; border:1px solid {C['border']}; border-radius:14px; padding:12px 6px; text-align:center;">
              <div style="color:{C['midSlate']}; display:flex; justify-content:center; margin-bottom:4px;">{get_icon('pill', 28, C['midSlate'], 2)}</div>
              <div style="font-size:11px; font-weight:700; color:{C['textColor']};">Capsule</div>
            </div>

            <!-- 3. Genome / DNA -->
            <div style="background:{C['surface']}; border:1px solid {C['border']}; border-radius:14px; padding:12px 6px; text-align:center;">
              <div style="color:{C['midSlate']}; display:flex; justify-content:center; margin-bottom:4px;">{get_icon('dna', 28, C['midSlate'], 2)}</div>
              <div style="font-size:11px; font-weight:700; color:{C['textColor']};">Genome</div>
            </div>

            <!-- 4. Guardian Shield -->
            <div style="background:{C['surface']}; border:1px solid {C['border']}; border-radius:14px; padding:12px 6px; text-align:center;">
              <div style="color:{C['midSlate']}; display:flex; justify-content:center; margin-bottom:4px;">{get_icon('shield', 28, C['midSlate'], 2)}</div>
              <div style="font-size:11px; font-weight:700; color:{C['textColor']};">Guardian</div>
            </div>

            <!-- 5. Herbal Leaf -->
            <div style="background:{C['surface']}; border:1px solid {C['border']}; border-radius:14px; padding:12px 6px; text-align:center;">
              <div style="color:{C['midSlate']}; display:flex; justify-content:center; margin-bottom:4px;">{get_icon('leaf', 28, C['midSlate'], 2)}</div>
              <div style="font-size:11px; font-weight:700; color:{C['textColor']};">Herbal</div>
            </div>

            <!-- 6. Wellness Heart -->
            <div style="background:{C['surface']}; border:1px solid {C['border']}; border-radius:14px; padding:12px 6px; text-align:center;">
              <div style="color:{C['midSlate']}; display:flex; justify-content:center; margin-bottom:4px;">{get_icon('heart', 28, C['midSlate'], 2)}</div>
              <div style="font-size:11px; font-weight:700; color:{C['textColor']};">Wellness</div>
            </div>
          </div>

          <!-- Color Accent Rings -->
          <div style="font-size:9.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">ACCENT RING COLOR</div>
          <div style="display:flex; gap:8px; margin-bottom:12px;">
            <div style="width:24px; height:24px; border-radius:12px; background:{C['sageGreenSolid']}; border:2px solid #FFF; box-shadow:0 0 0 2px {C['sageGreenSolid']};"></div>
            <div style="width:24px; height:24px; border-radius:12px; background:{C['mutedAccentSolid']};"></div>
            <div style="width:24px; height:24px; border-radius:12px; background:{C['warningAmberSolid']};"></div>
            <div style="width:24px; height:24px; border-radius:12px; background:{C['dangerClaySolid']};"></div>
          </div>

          <div style="height:38px; border:1px dashed {C['border']}; border-radius:12px; display:flex; align-items:center; justify-content:center; gap:6px; font-size:11.5px; font-weight:700; color:{C['midSlate']}; margin-bottom:12px;">
            <span>📷 Upload Custom Photo from Gallery</span>
          </div>

          <div class="btn-primary" style="height:46px;">Confirm Selection</div>
        </div>
      </div>
    </div>
    '''
    render_screen("23_profile_avatar_selector.png", wrap_screen(content, active_tab='profile', show_admin=True, no_padding=True))

# ─────────────────────────────────────────────────────────────────────────────
# 24. Profile Medical ID Card (High contrast offline emergency card)
# ─────────────────────────────────────────────────────────────────────────────
def screen_24():
    content = f'''
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
      <div style="width:34px; height:34px; border-radius:10px; background:{C['surface']}; border:1px solid {C['border']}; display:flex; align-items:center; justify-content:center; color:{C['textColor']};">
        {get_icon('chevronLeft', 18, C['textColor'])}
      </div>
      <div>
        <div style="font-size:18px; font-weight:800; color:{C['textColor']};">Emergency Medical ID</div>
        <div style="font-size:10px; color:{C['midSlate']};">Offline accessible clinical credentials</div>
      </div>
    </div>

    <!-- Sleek High-Contrast Medical ID Card -->
    <div style="background:#1B2428; border-radius:15px; padding:11px 13px; color:#FFF; box-shadow:0 8px 24px rgba(0,0,0,0.25); border:1px solid rgba(255,255,255,0.1); margin-bottom:5px; position:relative; overflow:hidden;">
      <!-- Subtle top decorative bar -->
      <div style="position:absolute; top:0; left:0; right:0; height:3px; background:linear-gradient(to right, #E53935, #81C784);"></div>

      <!-- Card Header -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
        <div style="display:flex; align-items:center; gap:7px;">
          <div style="width:24px; height:24px; border-radius:6px; background:#E53935; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:800; color:#FFF;">+</div>
          <div>
            <div style="font-size:10.5px; font-weight:800; letter-spacing:0.8px;">EMERGENCY MEDICAL ID</div>
            <div style="font-size:7px; color:#90A4AE; letter-spacing:0.5px;">MEDSENTRY CLINICAL VAULT</div>
          </div>
        </div>
        <!-- QR Code simulation -->
        <div style="width:32px; height:32px; background:#FFF; border-radius:4px; padding:2px; display:grid; grid-template-columns:repeat(4, 1fr); gap:1px;">
          <div style="background:#000;"></div><div style="background:#000;"></div><div style="background:#000;"></div><div></div>
          <div style="background:#000;"></div><div></div><div style="background:#000;"></div><div style="background:#000;"></div>
          <div style="background:#000;"></div><div style="background:#000;"></div><div></div><div style="background:#000;"></div>
          <div></div><div style="background:#000;"></div><div style="background:#000;"></div><div style="background:#000;"></div>
        </div>
      </div>

      <!-- Patient Bio -->
      <div style="margin-bottom:6px;">
        <div style="font-size:15px; font-weight:800;">Dr. Alex Sharma</div>
        <div style="font-size:9.5px; color:#B0BEC5; margin-top:1px;">Age: 38 · Sex: Male · Blood: <span style="color:#FF8A80; font-weight:800;">B+ Positive</span></div>
      </div>

      <!-- Critical Info Grid -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; background:rgba(255,255,255,0.06); border-radius:7px; padding:6px 8px; margin-bottom:5px;">
        <div>
          <div style="font-size:7px; color:#90A4AE; text-transform:uppercase;">ALLERGIES</div>
          <div style="font-size:9.5px; font-weight:700; color:#81C784;">NKDA (No Allergies)</div>
        </div>
        <div>
          <div style="font-size:7px; color:#90A4AE; text-transform:uppercase;">CONDITIONS</div>
          <div style="font-size:9.5px; font-weight:700;">Mild Asthmatic</div>
        </div>
        <div>
          <div style="font-size:7px; color:#90A4AE; text-transform:uppercase;">EMERGENCY CONTACT</div>
          <div style="font-size:9px; font-weight:700;">Sunita Sharma (Mother)</div>
        </div>
        <div>
          <div style="font-size:7px; color:#90A4AE; text-transform:uppercase;">PHONE</div>
          <div style="font-size:9px; font-weight:700; font-family:'JetBrains Mono';">+91 98765 43210</div>
        </div>
      </div>

      <!-- Active Meds In Emergency -->
      <div>
        <div style="font-size:7px; color:#90A4AE; text-transform:uppercase; margin-bottom:1px;">CURRENT ACTIVE MEDICATIONS</div>
        <div style="font-size:9px; color:#ECEFF1; font-weight:600; line-height:1.3;">
          • Amoxicillin 500mg (3x daily · Day 5/7) · Next: 20:00 PM<br/>
          • Paracetamol 650mg (SOS for fever / pain)
        </div>
      </div>
    </div>

    <!-- Paramedic ICE Clinical Directives & Asthma Protocol Card -->
    <div class="card" style="padding:7px 10px; margin-bottom:5px; background:rgba(201,123,99,0.12); border-color:rgba(201,123,99,0.4);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
        <span style="font-size:8.5px; font-weight:800; color:{C['dangerClaySolid']}; text-transform:uppercase;">PARAMEDIC ICE ASTHMA PROTOCOL</span>
        <span style="font-size:8px; font-weight:800; color:{C['dangerClaySolid']}; background:rgba(201,123,99,0.25); padding:1px 5px; border-radius:4px;">PRIORITY</span>
      </div>
      <div style="font-size:8.5px; color:{C['textColor']}; line-height:1.3;">
        In acute bronchospasm: Salbutamol 100mcg MDI via spacer (2–4 puffs). Zero penicillin hypersensitivity recorded.
      </div>
    </div>

    <!-- Blood Transfusion & Cross-Match Directives Card -->
    <div class="card" style="padding:7px 10px; margin-bottom:5px; background:rgba(215,204,200,0.18);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
        <span style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase;">BLOOD TRANSFUSION DIRECTIVES</span>
        <span style="font-size:8px; font-weight:800; color:{C['dangerClaySolid']};">B Rh-Positive</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:8.5px; color:{C['textColor']};">
        <span>Compatible: <b>B+, B-, O+, O-</b></span>
        <span style="color:{C['midSlate']};">Screening: <b>Antibody Neg</b></span>
      </div>
    </div>

    <!-- Designated Trauma Centre & Physician Card -->
    <div class="card" style="padding:7px 10px; margin-bottom:5px;">
      <div style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px;">DESIGNATED TRAUMA CENTRE &amp; PHYSICIAN</div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:9.5px; margin-bottom:1px;">
        <span style="font-weight:700; color:{C['textColor']};">Apex Superspeciality Hospital</span>
        <span style="font-weight:800; color:{C['dangerClaySolid']};">Level 1 Trauma</span>
      </div>
      <div style="font-size:8.5px; color:{C['midSlate']};">Attending: Dr. R. K. Mehta · Hotline: +91 22 2570 0001 / Dial 108</div>
    </div>

    <!-- Organ Donor & Advance Directives Card -->
    <div class="card" style="padding:6px 10px; margin-bottom:5px; background:rgba(129,199,132,0.12); border-color:rgba(129,199,132,0.35);">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:9px; font-weight:800; color:{C['sageGreenSolid']};">Registered Organ Donor &amp; Directives</div>
          <div style="font-size:8px; color:{C['midSlate']};">NOTTO #IND-OD-2024-991 · Full resuscitation protocols active</div>
        </div>
        <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.25); padding:1px 5px; border-radius:4px;">VERIFIED</span>
      </div>
    </div>

    <!-- First Responder Paramedic Protocol & NFC Health Pass -->
    <div class="card" style="padding:6px 10px; margin-bottom:4px; background:rgba(215,204,200,0.18);">
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:8.5px;">
        <span style="color:{C['sageGreenSolid']}; font-weight:800;">✓ NFC Health Pass Active</span>
        <span style="color:{C['midSlate']}; font-family:'JetBrains Mono';">ID: MED-ICE-8841 (SHA-256 Valid)</span>
      </div>
    </div>

    <!-- Secondary ICE & Hospital Escalation Card -->
    <div class="card" style="padding:6px 10px; margin-bottom:4px; background:rgba(77,182,172,0.1); border-color:rgba(77,182,172,0.35);">
      <div style="font-size:8px; font-weight:800; color:{C['mutedAccentSolid']}; text-transform:uppercase; margin-bottom:2px;">SECONDARY ICE &amp; SURGICAL SAFETY</div>
      <div style="display:flex; justify-content:space-between; font-size:8px; color:{C['textColor']};">
        <span>Alt ICE: <b>Rajesh Sharma (+91 98110 55443)</b></span>
        <span style="color:{C['sageGreenSolid']}; font-weight:800;">3T MRI SAFE</span>
      </div>
    </div>

    <!-- Emergency Medication Protocol Strip -->
    <div class="card" style="padding:5px 10px; margin-bottom:4px; background:rgba(201,123,99,0.12); border-color:rgba(201,123,99,0.35);">
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:8px;">
        <span style="color:{C['dangerClaySolid']}; font-weight:700;">Standing Order: In bronchospasm give Salbutamol 100mcg via spacer</span>
        <span style="color:{C['dangerClaySolid']}; font-weight:800;">STAT</span>
      </div>
    </div>

    <!-- Wallet / Action Buttons -->
    <div style="display:flex; flex-direction:column; gap:4px; margin-top:2px;">
      <div style="height:36px; background:#000; border-radius:12px; display:flex; align-items:center; justify-content:center; gap:8px; color:#FFF; font-size:11px; font-weight:700; box-shadow:0 3px 10px rgba(0,0,0,0.2);">
        <span>📱 Add to Google Wallet</span>
      </div>
      <div class="btn-primary" style="height:36px; gap:8px;">
        <span>Share Emergency Medical ID</span>
        <span>{get_icon('chevronRight', 16, '#FFF', 2)}</span>
      </div>
    </div>
    '''
    render_screen("24_profile_medical_id_card.png", wrap_screen(content, active_tab='profile', show_admin=True))

# ─────────────────────────────────────────────────────────────────────────────
# 25. Admin Control Centre (Direct mirror of AdminHomeScreen.tsx, full screen)
# ─────────────────────────────────────────────────────────────────────────────
def screen_25():
    content = f'''
    <!-- Admin Header -->
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:5px;">
      <div>
        <div style="display:inline-flex; align-items:center; gap:4px; background:rgba(201,123,99,0.18); border:1px solid rgba(201,123,99,0.45); border-radius:7px; padding:1px 6px; margin-bottom:1px;">
          <span style="font-size:8.5px; font-weight:800; color:{C['dangerClaySolid']};">🔐 ADMIN PANEL</span>
        </div>
        <div style="font-size:19px; font-weight:800; color:{C['textColor']};">Control Centre</div>
        <div style="font-size:9.5px; color:{C['midSlate']};">MedSentry clinical governance dashboard</div>
      </div>
    </div>

    <!-- Stat Strip (4 Tiles) directly matching AdminHomeScreen.tsx -->
    <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:5px; margin-bottom:5px;">
      <div class="card" style="padding:5px 3px; text-align:center; margin-bottom:0;">
        <div style="font-size:14px; font-weight:800; color:{C['mutedAccentSolid']};">142</div>
        <div style="font-size:8px; font-weight:700; color:{C['midSlate']};">Users</div>
      </div>
      <div class="card" style="padding:5px 3px; text-align:center; margin-bottom:0;">
        <div style="font-size:14px; font-weight:800; color:{C['sageGreenSolid']};">38</div>
        <div style="font-size:8px; font-weight:700; color:{C['midSlate']};">Circles</div>
      </div>
      <div class="card" style="padding:5px 3px; text-align:center; margin-bottom:0;">
        <div style="font-size:14px; font-weight:800; color:{C['warningAmberSolid']};">2,840</div>
        <div style="font-size:8px; font-weight:700; color:{C['midSlate']};">AI Calls</div>
      </div>
      <div class="card" style="padding:5px 3px; text-align:center; margin-bottom:0;">
        <div style="font-size:14px; font-weight:800; color:{C['dangerClaySolid']};">186</div>
        <div style="font-size:8px; font-weight:700; color:{C['midSlate']};">Audits</div>
      </div>
    </div>

    <!-- Navigation Section Grid (4 cards in 2x2) -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px; margin-bottom:5px;">
      <div class="card" style="padding:6px; margin-bottom:0;">
        <div style="color:{C['mutedAccentSolid']}; margin-bottom:1px;">{get_icon('user', 14, C['mutedAccentSolid'], 2)}</div>
        <div style="font-size:11px; font-weight:800; color:{C['mutedAccentSolid']};">Users</div>
        <div style="font-size:8px; color:{C['midSlate']};">View &amp; manage accounts ›</div>
      </div>
      <div class="card" style="padding:6px; margin-bottom:0;">
        <div style="color:{C['sageGreenSolid']}; margin-bottom:1px;">{get_icon('ai', 14, C['sageGreenSolid'], 2)}</div>
        <div style="font-size:11px; font-weight:800; color:{C['sageGreenSolid']};">API Usage</div>
        <div style="font-size:8px; color:{C['midSlate']};">Provider telemetry &amp; logs ›</div>
      </div>
      <div class="card" style="padding:6px; margin-bottom:0;">
        <div style="color:{C['warningAmberSolid']}; margin-bottom:1px;">{get_icon('journal', 14, C['warningAmberSolid'], 2)}</div>
        <div style="font-size:11px; font-weight:800; color:{C['warningAmberSolid']};">Audit Log</div>
        <div style="font-size:8px; color:{C['midSlate']};">Admin &amp; caregiver events ›</div>
      </div>
      <div class="card" style="padding:6px; margin-bottom:0;">
        <div style="color:{C['dangerClaySolid']}; margin-bottom:1px;">{get_icon('alertTriangle', 14, C['dangerClaySolid'], 2)}</div>
        <div style="font-size:11px; font-weight:800; color:{C['dangerClaySolid']};">Heatmap</div>
        <div style="font-size:8px; color:{C['midSlate']};">AMR misuse by region ›</div>
      </div>
    </div>

    <!-- System SLA & Live Telemetry Card -->
    <div class="card" style="padding:6px 9px; margin-bottom:5px; background:rgba(129,199,132,0.12); border-color:rgba(129,199,132,0.35);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
        <span style="font-size:8.5px; font-weight:800; color:{C['sageGreenSolid']}; text-transform:uppercase;">SYSTEM SLA &amp; WEBSOCKET CLUSTER</span>
        <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.25); padding:1px 5px; border-radius:4px;">99.98% SLA</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:8.5px; color:{C['textColor']};">
        <span>Active Sockets: <b>48 Nodes</b></span>
        <span>RLS Policies: <b>100% Passing</b></span>
        <span>P95 Latency: <b>14ms</b></span>
      </div>
    </div>

    <!-- Registered Users List Preview (3 rows) -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
      <span style="font-size:9px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px;">REGISTERED USERS</span>
      <span style="font-size:8.5px; font-weight:800; color:{C['sageGreenSolid']};">Manage all ›</span>
    </div>
    <div class="card" style="padding:6px 9px; margin-bottom:5px;">
      <!-- Row 1 -->
      <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:3px; border-bottom:1px solid {C['border']};">
        <div style="display:flex; align-items:center; gap:6px;">
          <div style="width:20px; height:20px; border-radius:10px; background:rgba(201,123,99,0.2); font-size:9px; font-weight:800; color:{C['dangerClaySolid']}; display:flex; align-items:center; justify-content:center;">AS</div>
          <div>
            <div style="font-size:10.5px; font-weight:800;">Dr. Alex Sharma</div>
            <div style="font-size:7.5px; color:{C['midSlate']}; font-family:'JetBrains Mono';">usr_8f29c41...</div>
          </div>
        </div>
        <div style="display:flex; gap:3px;">
          <span style="background:rgba(201,123,99,0.2); color:{C['dangerClaySolid']}; font-size:7.5px; font-weight:800; padding:1px 4px; border-radius:3px;">Admin</span>
          <span style="background:rgba(129,199,132,0.2); color:{C['sageGreenSolid']}; font-size:7.5px; font-weight:800; padding:1px 4px; border-radius:3px;">Owner</span>
        </div>
      </div>
      <!-- Row 2 -->
      <div style="display:flex; justify-content:space-between; align-items:center; padding:3px 0; border-bottom:1px solid {C['border']};">
        <div style="display:flex; align-items:center; gap:6px;">
          <div style="width:20px; height:20px; border-radius:10px; background:rgba(201,123,99,0.2); font-size:9px; font-weight:800; color:{C['dangerClaySolid']}; display:flex; align-items:center; justify-content:center;">RM</div>
          <div>
            <div style="font-size:10.5px; font-weight:800;">Dr. R. K. Mehta</div>
            <div style="font-size:7.5px; color:{C['midSlate']}; font-family:'JetBrains Mono';">usr_3e51a99...</div>
          </div>
        </div>
        <span style="background:rgba(201,123,99,0.2); color:{C['dangerClaySolid']}; font-size:7.5px; font-weight:800; padding:1px 4px; border-radius:3px;">Admin</span>
      </div>
      <!-- Row 3 -->
      <div style="display:flex; justify-content:space-between; align-items:center; padding-top:3px;">
        <div style="display:flex; align-items:center; gap:6px;">
          <div style="width:20px; height:20px; border-radius:10px; background:rgba(129,199,132,0.2); font-size:9px; font-weight:800; color:{C['sageGreenSolid']}; display:flex; align-items:center; justify-content:center;">SS</div>
          <div>
            <div style="font-size:10.5px; font-weight:800;">Sunita Sharma</div>
            <div style="font-size:7.5px; color:{C['midSlate']}; font-family:'JetBrains Mono';">usr_4d10b77...</div>
          </div>
        </div>
        <span style="background:rgba(215,204,200,0.3); color:{C['midSlate']}; font-size:7.5px; font-weight:800; padding:1px 4px; border-radius:3px;">Standard</span>
      </div>
    </div>

    <!-- Recent Audit Events Card matching AdminHomeScreen.tsx lines 329-350 -->
    <div style="font-size:9px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px;">RECENT AUDIT TRAIL</div>
    <div class="card" style="padding:6px 9px; margin-bottom:5px;">
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:9px; padding-bottom:2px; border-bottom:1px solid {C['border']};">
        <div><b style="color:{C['sageGreenSolid']}; font-family:'JetBrains Mono'; font-size:8px;">AUTH_LOGIN</b> <span style="color:{C['textColor']};">Dr. Alex Sharma (Session valid)</span></div>
        <span style="font-size:7.5px; color:{C['midSlate']};">09:41 AM</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:9px; padding:2px 0; border-bottom:1px solid {C['border']};">
        <div><b style="color:{C['mutedAccentSolid']}; font-family:'JetBrains Mono'; font-size:8px;">OCR_PARSE</b> <span style="color:{C['textColor']};">Rx paper · Amoxicillin 500mg</span></div>
        <span style="font-size:7.5px; color:{C['midSlate']};">09:12 AM</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:9px; padding-top:2px;">
        <div><b style="color:{C['warningAmberSolid']}; font-family:'JetBrains Mono'; font-size:8px;">RPC_AMR</b> <span style="color:{C['textColor']};">Heatmap query (Western Zone)</span></div>
        <span style="font-size:7.5px; color:{C['midSlate']};">08:45 AM</span>
      </div>
    </div>

    <!-- API Usage Breakdown directly matching AdminHomeScreen.tsx apiHeroRow -->
    <div style="font-size:9px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px;">API USAGE · LAST 30 DAYS</div>
    <div class="card" style="padding:6px 9px; margin-bottom:5px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
        <span style="font-size:10px; font-weight:700;">Google Gemini (Multimodal)</span>
        <span style="font-size:9px; font-weight:800; color:{C['mutedAccentSolid']};">1,890 (66%)</span>
      </div>
      <div style="height:4px; background:rgba(215,204,200,0.35); border-radius:2px; overflow:hidden; margin-bottom:4px;">
        <div style="width:66%; height:100%; background:{C['mutedAccentSolid']}; border-radius:2px;"></div>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
        <span style="font-size:10px; font-weight:700;">Groq LLaMA 3.3 (Chatbot)</span>
        <span style="font-size:9px; font-weight:800; color:{C['sageGreenSolid']};">740 (26%)</span>
      </div>
      <div style="height:4px; background:rgba(215,204,200,0.35); border-radius:2px; overflow:hidden; margin-bottom:4px;">
        <div style="width:26%; height:100%; background:{C['sageGreenSolid']}; border-radius:2px;"></div>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:10px; font-weight:700;">Supabase Edge Functions</span>
        <span style="font-size:9px; font-weight:800; color:{C['warningAmberSolid']};">210 (8%)</span>
      </div>
    </div>

    <!-- Dataset Sync Status -->
    <div class="card" style="padding:5px 9px; margin-bottom:4px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="font-size:9.5px; font-weight:800; font-family:'JetBrains Mono';">pharma_az_db</div>
        <div style="font-size:7.5px; color:{C['midSlate']};">Last synced: Oct 10, 2026, 17:30 · 4,210 drugs indexed</div>
      </div>
      <div style="background:rgba(129,199,132,0.2); color:{C['sageGreenSolid']}; font-size:7.5px; font-weight:800; padding:2px 6px; border-radius:4px;">
        ✓ SYNCED
      </div>
    </div>

    <!-- Infrastructure & Database Connection Pool Card -->
    <div class="card" style="padding:5px 9px; margin-bottom:4px; background:rgba(77,182,172,0.1); border-color:rgba(77,182,172,0.35);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1px;">
        <span style="font-size:8px; font-weight:800; color:{C['mutedAccentSolid']}; text-transform:uppercase;">DATABASE POOL &amp; EDGE HEALTH</span>
        <span style="font-size:7.5px; font-weight:800; color:{C['sageGreenSolid']};">32 / 100 POOL</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:7.5px; color:{C['textColor']};">
        <span>PgBouncer: <b>4.8ms P95</b></span>
        <span>TLS 1.3: <b>Active</b></span>
        <span>Edge Cache: <b>94.2%</b></span>
      </div>
    </div>

    <!-- Formulary & AMR Taxonomy Feed Card -->
    <div class="card" style="padding:5px 9px; margin-bottom:0; background:rgba(215,204,200,0.18);">
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:7.5px; color:{C['midSlate']}; font-family:'JetBrains Mono';">
        <span>CDSCO v2026.3: 12,480 monographs</span>
        <span style="color:{C['sageGreenSolid']}; font-weight:700;">Merkle #84,912</span>
      </div>
    </div>
    '''
    render_screen("25_admin_control_centre.png", wrap_screen(content, active_tab='admin', show_admin=True))

# ─────────────────────────────────────────────────────────────────────────────
# 26. Admin User Management (Direct mirror of UserManagementScreen.tsx)
# ─────────────────────────────────────────────────────────────────────────────
def screen_26():
    content = f'''
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
      <div style="width:34px; height:34px; border-radius:10px; background:{C['surface']}; border:1px solid {C['border']}; display:flex; align-items:center; justify-content:center; color:{C['textColor']};">
        {get_icon('chevronLeft', 18, C['textColor'])}
      </div>
      <div>
        <div style="font-size:18px; font-weight:800; color:{C['textColor']};">User Accounts</div>
        <div style="font-size:10px; color:{C['midSlate']};">Roles, permissions &amp; access governance</div>
      </div>
    </div>

    <!-- Search Input -->
    <div style="display:flex; align-items:center; height:34px; background:{C['surface']}; border-radius:11px; border:1px solid {C['border']}; padding:0 11px; gap:7px; margin-bottom:5px;">
      <div style="color:{C['midSlate']};">{get_icon('search', 14, C['midSlate'])}</div>
      <div style="font-size:11px; color:{C['midSlate']};">Search users by name, email or UID...</div>
    </div>

    <!-- Filter chips -->
    <div style="display:flex; gap:5px; margin-bottom:5px;">
      <div style="background:{C['sageGreenSolid']}; color:#FFF; font-size:9.5px; font-weight:800; padding:2px 9px; border-radius:11px;">All (142)</div>
      <div style="background:{C['surface']}; border:1px solid {C['border']}; color:{C['midSlate']}; font-size:9.5px; font-weight:700; padding:2px 9px; border-radius:11px;">Admins (4)</div>
      <div style="background:{C['surface']}; border:1px solid {C['border']}; color:{C['midSlate']}; font-size:9.5px; font-weight:700; padding:2px 9px; border-radius:11px;">Caregivers (38)</div>
      <div style="background:{C['surface']}; border:1px solid {C['border']}; color:{C['midSlate']}; font-size:9.5px; font-weight:700; padding:2px 9px; border-radius:11px;">Pharmacists (12)</div>
    </div>

    <!-- Users List Card (10 rows with rich status lines) -->
    <div class="card" style="padding:6px 9px; margin-bottom:5px; display:flex; flex-direction:column; gap:4px;">
      <!-- User 1 -->
      <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:3px; border-bottom:1px solid {C['border']};">
        <div style="display:flex; align-items:center; gap:6px;">
          <div style="width:20px; height:20px; border-radius:10px; background:rgba(201,123,99,0.2); font-size:8.5px; font-weight:800; color:{C['dangerClaySolid']}; display:flex; align-items:center; justify-content:center;">AS</div>
          <div>
            <div style="font-size:10px; font-weight:800;">Dr. Alex Sharma</div>
            <div style="font-size:7px; color:{C['midSlate']};">alex.sharma@medsentry.health · Active 4m ago</div>
          </div>
        </div>
        <div style="text-align:right;">
          <span style="background:rgba(201,123,99,0.18); color:{C['dangerClaySolid']}; font-size:7px; font-weight:800; padding:1px 4px; border-radius:3px;">Superadmin</span>
          <div style="font-size:6.5px; color:{C['sageGreenSolid']}; font-weight:700;">2FA TOTP</div>
        </div>
      </div>

      <!-- User 2 -->
      <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:3px; border-bottom:1px solid {C['border']};">
        <div style="display:flex; align-items:center; gap:6px;">
          <div style="width:20px; height:20px; border-radius:10px; background:rgba(201,123,99,0.2); font-size:8.5px; font-weight:800; color:{C['dangerClaySolid']}; display:flex; align-items:center; justify-content:center;">RM</div>
          <div>
            <div style="font-size:10px; font-weight:800;">Dr. Rajesh K. Mehta</div>
            <div style="font-size:7px; color:{C['midSlate']};">dr.mehta@aiims.edu · AIIMS New Delhi</div>
          </div>
        </div>
        <div style="text-align:right;">
          <span style="background:rgba(201,123,99,0.18); color:{C['dangerClaySolid']}; font-size:7px; font-weight:800; padding:1px 4px; border-radius:3px;">Clinical Lead</span>
          <div style="font-size:6.5px; color:{C['sageGreenSolid']}; font-weight:700;">AMR Lead</div>
        </div>
      </div>

      <!-- User 3 -->
      <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:3px; border-bottom:1px solid {C['border']};">
        <div style="display:flex; align-items:center; gap:6px;">
          <div style="width:20px; height:20px; border-radius:10px; background:rgba(129,199,132,0.2); font-size:8.5px; font-weight:800; color:{C['sageGreenSolid']}; display:flex; align-items:center; justify-content:center;">SS</div>
          <div>
            <div style="font-size:10px; font-weight:800;">Sunita Sharma</div>
            <div style="font-size:7px; color:{C['midSlate']};">sunita.sharma@carecircle.org · The Sharma Family</div>
          </div>
        </div>
        <span style="background:rgba(129,199,132,0.2); color:{C['sageGreenSolid']}; font-size:7px; font-weight:800; padding:1px 4px; border-radius:3px;">Caregiver</span>
      </div>

      <!-- User 4 -->
      <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:3px; border-bottom:1px solid {C['border']};">
        <div style="display:flex; align-items:center; gap:6px;">
          <div style="width:20px; height:20px; border-radius:10px; background:rgba(215,204,200,0.3); font-size:8.5px; font-weight:800; color:{C['midSlate']}; display:flex; align-items:center; justify-content:center;">AS</div>
          <div>
            <div style="font-size:10px; font-weight:800;">Aarav Sharma</div>
            <div style="font-size:7px; color:{C['midSlate']};">aarav.s@family.org · Pediatric Profile</div>
          </div>
        </div>
        <span style="background:rgba(215,204,200,0.3); color:{C['midSlate']}; font-size:7px; font-weight:800; padding:1px 4px; border-radius:3px;">Dependent</span>
      </div>

      <!-- User 5 -->
      <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:3px; border-bottom:1px solid {C['border']};">
        <div style="display:flex; align-items:center; gap:6px;">
          <div style="width:20px; height:20px; border-radius:10px; background:rgba(129,199,132,0.2); font-size:8.5px; font-weight:800; color:{C['sageGreenSolid']}; display:flex; align-items:center; justify-content:center;">PP</div>
          <div>
            <div style="font-size:10px; font-weight:800;">Priya Patel</div>
            <div style="font-size:7px; color:{C['midSlate']};">priya.p@health.org · Patel Household Circle</div>
          </div>
        </div>
        <span style="background:rgba(129,199,132,0.2); color:{C['sageGreenSolid']}; font-size:7px; font-weight:800; padding:1px 4px; border-radius:3px;">Caregiver</span>
      </div>

      <!-- User 6 -->
      <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:3px; border-bottom:1px solid {C['border']};">
        <div style="display:flex; align-items:center; gap:6px;">
          <div style="width:20px; height:20px; border-radius:10px; background:rgba(77,182,172,0.2); font-size:8.5px; font-weight:800; color:{C['mutedAccentSolid']}; display:flex; align-items:center; justify-content:center;">AR</div>
          <div>
            <div style="font-size:10px; font-weight:800;">Dr. Ananya Rao</div>
            <div style="font-size:7px; color:{C['midSlate']};">ananya.rao@apollo.in · Apollo Dispensary</div>
          </div>
        </div>
        <span style="background:rgba(77,182,172,0.2); color:{C['mutedAccentSolid']}; font-size:7px; font-weight:800; padding:1px 4px; border-radius:3px;">Pharmacist</span>
      </div>

      <!-- User 7 -->
      <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:3px; border-bottom:1px solid {C['border']};">
        <div style="display:flex; align-items:center; gap:6px;">
          <div style="width:20px; height:20px; border-radius:10px; background:rgba(129,199,132,0.2); font-size:8.5px; font-weight:800; color:{C['sageGreenSolid']}; display:flex; align-items:center; justify-content:center;">RK</div>
          <div>
            <div style="font-size:10px; font-weight:800;">Rajesh Kumar</div>
            <div style="font-size:7px; color:{C['midSlate']};">rajesh.k@caregivers.org · Geriatric Proxy</div>
          </div>
        </div>
        <span style="background:rgba(129,199,132,0.2); color:{C['sageGreenSolid']}; font-size:7px; font-weight:800; padding:1px 4px; border-radius:3px;">Caregiver</span>
      </div>

      <!-- User 8 -->
      <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:3px; border-bottom:1px solid {C['border']};">
        <div style="display:flex; align-items:center; gap:6px;">
          <div style="width:20px; height:20px; border-radius:10px; background:rgba(77,182,172,0.2); font-size:8.5px; font-weight:800; color:{C['mutedAccentSolid']}; display:flex; align-items:center; justify-content:center;">VS</div>
          <div>
            <div style="font-size:10px; font-weight:800;">Vikram Sen</div>
            <div style="font-size:7px; color:{C['midSlate']};">vikram.sen@citypharma.in · City Pharma</div>
          </div>
        </div>
        <span style="background:rgba(77,182,172,0.2); color:{C['mutedAccentSolid']}; font-size:7px; font-weight:800; padding:1px 4px; border-radius:3px;">Pharmacist</span>
      </div>

      <!-- User 9 -->
      <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:3px; border-bottom:1px solid {C['border']};">
        <div style="display:flex; align-items:center; gap:6px;">
          <div style="width:20px; height:20px; border-radius:10px; background:rgba(230,182,85,0.2); font-size:8.5px; font-weight:800; color:{C['warningAmberSolid']}; display:flex; align-items:center; justify-content:center;">NG</div>
          <div>
            <div style="font-size:10px; font-weight:800;">Neha Gupta</div>
            <div style="font-size:7px; color:{C['midSlate']};">neha.g@carecircle.org · Gupta Care Circle</div>
          </div>
        </div>
        <span style="background:rgba(129,199,132,0.2); color:{C['sageGreenSolid']}; font-size:7px; font-weight:800; padding:1px 4px; border-radius:3px;">Caregiver</span>
      </div>

      <!-- User 10 -->
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:6px;">
          <div style="width:20px; height:20px; border-radius:10px; background:rgba(201,123,99,0.2); font-size:8.5px; font-weight:800; color:{C['dangerClaySolid']}; display:flex; align-items:center; justify-content:center;">KI</div>
          <div>
            <div style="font-size:10px; font-weight:800;">Dr. K. S. Iyer</div>
            <div style="font-size:7px; color:{C['midSlate']};">ks.iyer@aiims.gov.in · Epidemiologist Lead</div>
          </div>
        </div>
        <span style="background:rgba(201,123,99,0.18); color:{C['dangerClaySolid']}; font-size:7px; font-weight:800; padding:1px 4px; border-radius:3px;">Clinical Lead</span>
      </div>
    </div>

    <!-- Role Allocation & License Quotas Card -->
    <div class="card" style="padding:6px 9px; margin-bottom:5px; background:rgba(77,182,172,0.1); border-color:rgba(77,182,172,0.35);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
        <span style="font-size:8.5px; font-weight:800; color:{C['mutedAccentSolid']}; text-transform:uppercase;">ROLE ALLOCATION &amp; LICENSE SEATS</span>
        <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']};">54 / 85 Seats (63.5%)</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:8px; color:{C['textColor']};">
        <span>Superadmins: <b>2/5</b></span>
        <span>Clinicians: <b>2/10</b></span>
        <span>Pharmacists: <b>12/20</b></span>
        <span>Caregivers: <b>38/50</b></span>
      </div>
    </div>

    <!-- Pending Invitations & Care Circle Onboarding Queue Card -->
    <div class="card" style="padding:6px 9px; margin-bottom:5px; background:rgba(230,182,85,0.12); border-color:rgba(230,182,85,0.4);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
        <span style="font-size:8.5px; font-weight:800; color:{C['warningAmberSolid']}; text-transform:uppercase;">PENDING USER INVITATION QUEUE</span>
        <span style="font-size:8px; font-weight:800; color:{C['warningAmberSolid']}; background:rgba(230,182,85,0.25); padding:1px 5px; border-radius:4px;">2 PENDING</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:8px; padding-bottom:1px; border-bottom:1px solid rgba(230,182,85,0.3);">
        <span>dr.priya.sharma@apollo.org (Pediatric Lead)</span>
        <span style="color:{C['midSlate']};">Invited 2h ago</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:8px; padding-top:1px;">
        <span>dr.anil.kapoor@fortis.org (AMR Surveillance)</span>
        <span style="color:{C['midSlate']};">Invited 1d ago</span>
      </div>
    </div>

    <!-- Care Circles Governance Summary Card -->
    <div class="card" style="padding:6px 9px; margin-bottom:5px; background:rgba(129,199,132,0.12); border-color:rgba(129,199,132,0.35);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1px;">
        <span style="font-size:8.5px; font-weight:800; color:{C['sageGreenSolid']}; text-transform:uppercase;">CARE CIRCLES GOVERNANCE</span>
        <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']};">38 Active Circles</span>
      </div>
      <div style="font-size:8px; color:{C['textColor']};">
        Total Managed Members: 142 · Avg 3.7 / Circle · Household Cabinet Sync: Enforced
      </div>
    </div>

    <!-- Access Control Policy & Governance Matrix Card -->
    <div class="card" style="padding:6px 9px; margin-bottom:5px; background:rgba(215,204,200,0.18);">
      <div style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px;">ACCESS CONTROL &amp; SECURITY MATRIX</div>
      <div style="display:flex; flex-direction:column; gap:2px; font-size:8px;">
        <div style="display:flex; justify-content:space-between;">
          <span style="color:{C['textColor']};">Patient Data Isolation:</span>
          <b style="color:{C['sageGreenSolid']};">PostgreSQL RLS Active</b>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span style="color:{C['textColor']};">Elevated Admin Auth:</span>
          <b style="color:{C['dangerClaySolid']};">MFA / TOTP Enforced</b>
        </div>
      </div>
    </div>

    <!-- Identity & Session Telemetry Strip -->
    <div class="card" style="padding:4px 9px; margin-bottom:5px; background:rgba(129,199,132,0.1); border-color:rgba(129,199,132,0.35);">
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:7.5px; color:{C['midSlate']}; font-family:'JetBrains Mono';">
        <span>Supabase Auth JWT: 142 Sessions Valid</span>
        <span style="color:{C['sageGreenSolid']}; font-weight:800;">0 COMPROMISED</span>
      </div>
    </div>

    <div class="btn-primary" style="height:38px; gap:8px; margin-bottom:4px;">
      <span>+ Invite / Register New Account</span>
      <span>{get_icon('chevronRight', 16, '#FFF', 2)}</span>
    </div>

    <div style="height:34px; border:1px solid {C['border']}; background:{C['surface']}; border-radius:11px; display:flex; align-items:center; justify-content:center; gap:6px; font-size:10px; font-weight:700; color:{C['textColor']};">
      <span>Export User Directory &amp; RBAC Matrix (CSV)</span>
      <span>{get_icon('fileText', 13, C['midSlate'])}</span>
    </div>
    '''
    render_screen("26_admin_user_management.png", wrap_screen(content, active_tab='admin', show_admin=True))

# ─────────────────────────────────────────────────────────────────────────────
# 27. Admin User Account Modal (Vivid blurred parent background + rich modal)
# ─────────────────────────────────────────────────────────────────────────────
def screen_27():
    parent_bg = f'''
    <div style="padding:10px 14px; filter:blur(4px); opacity:0.85; pointer-events:none; height:100%; display:flex; flex-direction:column; gap:5px;">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:4px;">
        <div style="width:34px; height:34px; border-radius:10px; background:{C['surface']};"></div>
        <div>
          <div style="font-size:18px; font-weight:800; color:{C['textColor']};">User Accounts</div>
          <div style="font-size:10px; color:{C['midSlate']};">Roles, permissions &amp; access governance</div>
        </div>
      </div>
      <div style="height:34px; background:{C['surface']}; border-radius:11px;"></div>
      <div style="display:flex; gap:5px;">
        <div style="width:50px; height:20px; border-radius:10px; background:{C['sageGreenSolid']};"></div>
        <div style="width:60px; height:20px; border-radius:10px; background:{C['surface']};"></div>
      </div>
      <div class="card" style="padding:8px; display:flex; flex-direction:column; gap:6px;">
        <div style="display:flex; justify-content:space-between;"><span style="font-size:10px; font-weight:800;">Dr. Alex Sharma</span><span style="font-size:8px; color:{C['dangerClaySolid']};">Superadmin</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="font-size:10px; font-weight:800;">Dr. Rajesh K. Mehta</span><span style="font-size:8px; color:{C['dangerClaySolid']};">Clinical Lead</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="font-size:10px; font-weight:800;">Sunita Sharma</span><span style="font-size:8px; color:{C['sageGreenSolid']};">Caregiver</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="font-size:10px; font-weight:800;">Aarav Sharma</span><span style="font-size:8px; color:{C['midSlate']};">Dependent</span></div>
      </div>
      <div class="card" style="height:48px; background:rgba(230,182,85,0.12);"></div>
      <div class="card" style="height:40px; background:rgba(77,182,172,0.1);"></div>
    </div>
    '''

    content = f'''
    <div style="position:relative; width:100%; height:100%;">
      {parent_bg}
      <!-- Edge-to-Edge Modal Backdrop -->
      <div style="position:absolute; inset:0; background:rgba(25,20,16,0.48); display:flex; flex-direction:column; justify-content:flex-end;">
        <!-- Bottom Modal Sheet -->
        <div style="background:{C['surfaceElevated']}; border-top-left-radius:24px; border-top-right-radius:24px; padding:16px 18px 22px 18px; box-shadow:0 -8px 32px rgba(0,0,0,0.35);">
          <!-- Drag Handle -->
          <div style="width:40px; height:4px; background:{C['border']}; border-radius:2px; margin:0 auto 12px auto;"></div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div>
              <div style="font-size:17px; font-weight:800; color:{C['textColor']};">Manage Account Roles</div>
              <div style="font-size:10.5px; color:{C['midSlate']};">Dr. Alex Sharma (alex.sharma@medsentry.health)</div>
            </div>
            <div style="width:28px; height:28px; border-radius:14px; background:rgba(215,204,200,0.3); display:flex; align-items:center; justify-content:center; color:{C['midSlate']}; font-weight:800;">✕</div>
          </div>

          <div style="font-size:9.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:5px;">ROLE LEVEL</div>
          <div style="display:flex; gap:8px; margin-bottom:10px;">
            <div style="flex:1; background:rgba(215,204,200,0.25); border:1px solid {C['border']}; border-radius:10px; padding:7px; text-align:center; font-size:11px; font-weight:700; color:{C['midSlate']};">
              Standard User
            </div>
            <div style="flex:1; background:rgba(201,123,99,0.18); border:2px solid {C['dangerClaySolid']}; border-radius:10px; padding:7px; text-align:center; font-size:11px; font-weight:800; color:{C['dangerClaySolid']};">
              ✓ Superadmin
            </div>
          </div>

          <div style="font-size:9.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:5px;">ADMINISTRATIVE PERMISSIONS</div>
          <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:10px;">
            <div style="display:flex; align-items:center; gap:8px; font-size:11px; font-weight:600; color:{C['textColor']};">
              <span style="color:{C['sageGreenSolid']}; font-weight:800;">✓</span> Manage Family Circles &amp; Caregiver Sync
            </div>
            <div style="display:flex; align-items:center; gap:8px; font-size:11px; font-weight:600; color:{C['textColor']};">
              <span style="color:{C['sageGreenSolid']}; font-weight:800;">✓</span> Access AMR Misuse Heatmap Surveillance
            </div>
            <div style="display:flex; align-items:center; gap:8px; font-size:11px; font-weight:600; color:{C['textColor']};">
              <span style="color:{C['sageGreenSolid']}; font-weight:800;">✓</span> View System Telemetry &amp; API Usage Logs
            </div>
            <div style="display:flex; align-items:center; gap:8px; font-size:11px; font-weight:600; color:{C['textColor']};">
              <span style="color:{C['sageGreenSolid']}; font-weight:800;">✓</span> Trigger Automated Database Dataset Refresh
            </div>
          </div>

          <!-- Elevated Security & Session Control Card -->
          <div class="card" style="padding:6px 10px; margin-bottom:10px; background:rgba(129,199,132,0.12); border-color:rgba(129,199,132,0.35);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
              <span style="font-size:8.5px; font-weight:800; color:{C['sageGreenSolid']}; text-transform:uppercase;">ELEVATED SECURITY STATUS</span>
              <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.25); padding:1px 5px; border-radius:4px;">MFA ENFORCED</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:8px; color:{C['midSlate']}; font-family:'JetBrains Mono';">
              <span>TOTP Authenticator: Active</span>
              <span>Last Challenge: 09:41 AM (IP: 192.168.1.42)</span>
            </div>
          </div>

          <div class="btn-primary" style="height:42px; margin-bottom:7px;">Save Role Changes</div>
          <div style="height:36px; border:1px solid rgba(201,123,99,0.4); border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:11.5px; font-weight:700; color:{C['dangerClaySolid']};">
            Revoke Access / Suspend Account
          </div>
        </div>
      </div>
    </div>
    '''
    render_screen("27_admin_user_account_modal.png", wrap_screen(content, active_tab='admin', show_admin=True, no_padding=True))

# ─────────────────────────────────────────────────────────────────────────────
# 28. Admin Audit Log Viewer (Direct mirror of AuditLogViewerScreen.tsx)
# ─────────────────────────────────────────────────────────────────────────────
def screen_28():
    content = f'''
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
      <div style="width:34px; height:34px; border-radius:10px; background:{C['surface']}; border:1px solid {C['border']}; display:flex; align-items:center; justify-content:center; color:{C['textColor']};">
        {get_icon('chevronLeft', 18, C['textColor'])}
      </div>
      <div>
        <div style="font-size:18px; font-weight:800; color:{C['textColor']};">Audit Log Viewer</div>
        <div style="font-size:10px; color:{C['midSlate']};">Immutable security &amp; clinical event stream</div>
      </div>
    </div>

    <!-- Filter chips -->
    <div style="display:flex; gap:5px; margin-bottom:5px; overflow:hidden;">
      <div style="background:{C['sageGreenSolid']}; color:#FFF; font-size:9px; font-weight:800; padding:2px 9px; border-radius:11px;">All (28)</div>
      <div style="background:{C['surface']}; border:1px solid {C['border']}; color:{C['midSlate']}; font-size:9px; font-weight:700; padding:2px 9px; border-radius:11px;">Auth</div>
      <div style="background:{C['surface']}; border:1px solid {C['border']}; color:{C['midSlate']}; font-size:9px; font-weight:700; padding:2px 9px; border-radius:11px;">OCR Scans</div>
      <div style="background:{C['surface']}; border:1px solid {C['border']}; color:{C['midSlate']}; font-size:9px; font-weight:700; padding:2px 9px; border-radius:11px;">RLS Access</div>
      <div style="background:{C['surface']}; border:1px solid {C['border']}; color:{C['midSlate']}; font-size:9px; font-weight:700; padding:2px 9px; border-radius:11px;">AMR RPC</div>
    </div>

    <!-- Event Stream Items (10 rich cards) -->
    <div style="display:flex; flex-direction:column; gap:3px; margin-bottom:5px;">
      <!-- Event 1 -->
      <div class="card" style="padding:5px 8px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:9px; font-weight:800; font-family:'JetBrains Mono'; color:{C['sageGreenSolid']};">USER_AUTH_LOGIN</span>
          <span style="font-size:7.5px; color:{C['midSlate']};">Today 09:41 AM</span>
        </div>
        <div style="font-size:9.5px; color:{C['textColor']}; font-weight:600;">alex.sharma authenticated via Supabase Auth (Session valid)</div>
        <div style="font-size:7px; color:{C['midSlate']}; font-family:'JetBrains Mono';">IP: 192.168.1.42 · Device: Pixel 7 Pro (Android 14)</div>
      </div>

      <!-- Event 2 -->
      <div class="card" style="padding:5px 8px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:9px; font-weight:800; font-family:'JetBrains Mono'; color:{C['mutedAccentSolid']};">OCR_PRESCRIPTION_EXTRACT</span>
          <span style="font-size:7.5px; color:{C['midSlate']};">Today 09:12 AM</span>
        </div>
        <div style="font-size:9.5px; color:{C['textColor']}; font-weight:600;">Gemini 1.5 Pro parsed Rx: Amoxicillin 500mg, Paracetamol 650mg</div>
        <div style="font-size:7px; color:{C['midSlate']}; font-family:'JetBrains Mono';">Confidence: 99.1% · Tokens: 420 · Latency: 580ms</div>
      </div>

      <!-- Event 3 -->
      <div class="card" style="padding:5px 8px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:9px; font-weight:800; font-family:'JetBrains Mono'; color:{C['sageGreenSolid']};">MEDICATION_DOSE_LOGGED</span>
          <span style="font-size:7.5px; color:{C['midSlate']};">Today 08:35 AM</span>
        </div>
        <div style="font-size:9.5px; color:{C['textColor']}; font-weight:600;">Amoxicillin 500mg (1 cap) dose logged for Dr. Alex Sharma</div>
        <div style="font-size:7px; color:{C['midSlate']}; font-family:'JetBrains Mono';">Course: Day 5 of 7 · RLS verification: PASS</div>
      </div>

      <!-- Event 4 -->
      <div class="card" style="padding:5px 8px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:9px; font-weight:800; font-family:'JetBrains Mono'; color:{C['warningAmberSolid']};">CAREGIVER_SYNC</span>
          <span style="font-size:7.5px; color:{C['midSlate']};">Today 08:15 AM</span>
        </div>
        <div style="font-size:9.5px; color:{C['textColor']}; font-weight:600;">Sunita Sharma Metformin dose synchronized to The Sharma Family circle</div>
        <div style="font-size:7px; color:{C['midSlate']}; font-family:'JetBrains Mono';">Caregiver ID: usr_8f29c41 · Push dispatch: OK</div>
      </div>

      <!-- Event 5 -->
      <div class="card" style="padding:5px 8px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:9px; font-weight:800; font-family:'JetBrains Mono'; color:{C['sageGreenSolid']};">DB_DATASET_SYNC</span>
          <span style="font-size:7.5px; color:{C['midSlate']};">Yesterday 17:30 PM</span>
        </div>
        <div style="font-size:9.5px; color:{C['textColor']}; font-weight:600;">pharma_az_db automated sync completed (4,210 drugs indexed)</div>
        <div style="font-size:7px; color:{C['midSlate']}; font-family:'JetBrains Mono';">Table: drugs · RLS Policies: Validated</div>
      </div>

      <!-- Event 6 -->
      <div class="card" style="padding:5px 8px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:9px; font-weight:800; font-family:'JetBrains Mono'; color:{C['dangerClaySolid']};">AMR_SURVEILLANCE_QUERY</span>
          <span style="font-size:7.5px; color:{C['midSlate']};">Yesterday 14:15 PM</span>
        </div>
        <div style="font-size:9.5px; color:{C['textColor']}; font-weight:600;">RPC: get_amr_misuse_clusters executed for Western Zone (MH, GJ)</div>
        <div style="font-size:7px; color:{C['midSlate']}; font-family:'JetBrains Mono';">Clusters: 8 Elevated · Latency: 95ms · Status: 200 OK</div>
      </div>

      <!-- Event 7 -->
      <div class="card" style="padding:5px 8px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:9px; font-weight:800; font-family:'JetBrains Mono'; color:{C['mutedAccentSolid']};">EMERGENCY_ID_ACCESSED</span>
          <span style="font-size:7.5px; color:{C['midSlate']};">Yesterday 11:02 AM</span>
        </div>
        <div style="font-size:9.5px; color:{C['textColor']}; font-weight:600;">Paramedic triage NFC pass verified for Dr. Alex Sharma</div>
        <div style="font-size:7px; color:{C['midSlate']}; font-family:'JetBrains Mono';">Pass: MED-ICE-8841 · Local SHA-256 Seal: Valid</div>
      </div>

      <!-- Event 8 -->
      <div class="card" style="padding:5px 8px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:9px; font-weight:800; font-family:'JetBrains Mono'; color:{C['dangerClaySolid']};">SECURITY_MFA_CHALLENGE</span>
          <span style="font-size:7.5px; color:{C['midSlate']};">Yesterday 09:30 AM</span>
        </div>
        <div style="font-size:9.5px; color:{C['textColor']}; font-weight:600;">Dr. R. K. Mehta verified via TOTP authenticator (Status: SUCCESS)</div>
        <div style="font-size:7px; color:{C['midSlate']}; font-family:'JetBrains Mono';">Method: TOTP 6-digit token · Admin Console: OK</div>
      </div>

      <!-- Event 9 -->
      <div class="card" style="padding:5px 8px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:9px; font-weight:800; font-family:'JetBrains Mono'; color:{C['warningAmberSolid']};">WHO_AWARE_RESTRICTION_FLAGGED</span>
          <span style="font-size:7.5px; color:{C['midSlate']};">Yesterday 08:15 AM</span>
        </div>
        <div style="font-size:9.5px; color:{C['textColor']}; font-weight:600;">Ciprofloxacin 500mg Watch-tier flagged for lack of sensitivity assay</div>
        <div style="font-size:7px; color:{C['midSlate']}; font-family:'JetBrains Mono';">Prescriber: Apollo West · Advisory issued: OK</div>
      </div>

      <!-- Event 10 -->
      <div class="card" style="padding:5px 8px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:9px; font-weight:800; font-family:'JetBrains Mono'; color:{C['dangerClaySolid']};">CAREGIVER_ESCALATION_DISPATCHED</span>
          <span style="font-size:7.5px; color:{C['midSlate']};">Oct 08, 20:45 PM</span>
        </div>
        <div style="font-size:9.5px; color:{C['textColor']}; font-weight:600;">Missed dose push notification escalated to primary caregiver Sunita</div>
        <div style="font-size:7px; color:{C['midSlate']}; font-family:'JetBrains Mono';">Dose: Evening Amoxicillin (+45m) · Resolved: TAKEN</div>
      </div>

      <!-- Event 11 -->
      <div class="card" style="padding:5px 8px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:9px; font-weight:800; font-family:'JetBrains Mono'; color:{C['warningAmberSolid']};">API_RATE_LIMIT_WARNING</span>
          <span style="font-size:7.5px; color:{C['midSlate']};">Oct 08, 18:20 PM</span>
        </div>
        <div style="font-size:9.5px; color:{C['textColor']}; font-weight:600;">Groq API throughput reached 82% threshold (24,600 / 30,000 TPM)</div>
        <div style="font-size:7px; color:{C['midSlate']}; font-family:'JetBrains Mono';">Router: Edge Gateway auto-failover to Gemini 1.5 Flash standby: OK</div>
      </div>

      <!-- Event 12 -->
      <div class="card" style="padding:5px 8px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:9px; font-weight:800; font-family:'JetBrains Mono'; color:{C['mutedAccentSolid']};">FHIR_BUNDLE_EXPORT</span>
          <span style="font-size:7.5px; color:{C['midSlate']};">Oct 08, 15:10 PM</span>
        </div>
        <div style="font-size:9.5px; color:{C['textColor']}; font-weight:600;">LOINC/SNOMED CT structured FHIR R4 immunization &amp; Rx bundle generated</div>
        <div style="font-size:7px; color:{C['midSlate']}; font-family:'JetBrains Mono';">Format: JSON · Cryptographic SHA-256 seal: e8b9...c014</div>
      </div>

      <!-- Event 13 -->
      <div class="card" style="padding:5px 8px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:9px; font-weight:800; font-family:'JetBrains Mono'; color:{C['sageGreenSolid']};">K_ANONYMITY_SUPPRESSION</span>
          <span style="font-size:7.5px; color:{C['midSlate']};">Oct 08, 11:45 AM</span>
        </div>
        <div style="font-size:9.5px; color:{C['textColor']}; font-weight:600;">AMR dataset k-anonymity (k=5) suppression applied to rural district cluster</div>
        <div style="font-size:7px; color:{C['midSlate']}; font-family:'JetBrains Mono';">Suppressed cells: 3 · Differential Privacy: ε = 0.5 verified</div>
      </div>

      <!-- Event 14 -->
      <div class="card" style="padding:5px 8px; margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:9px; font-weight:800; font-family:'JetBrains Mono'; color:{C['textColor']};">DB_MIGRATION_VALIDATION</span>
          <span style="font-size:7.5px; color:{C['midSlate']};">Oct 07, 23:14 PM</span>
        </div>
        <div style="font-size:9.5px; color:{C['textColor']}; font-weight:600;">PostgreSQL 15 RLS schema migration 008_dosage_audit_trails verified</div>
        <div style="font-size:7px; color:{C['midSlate']}; font-family:'JetBrains Mono';">Rollback test: PASS · Schema integrity checks: 100% OK</div>
      </div>
    </div>

    <!-- Cryptographic Ledger Integrity Seal Card -->
    <div class="card" style="padding:6px 10px; margin-bottom:6px; background:rgba(129,199,132,0.12); border-color:rgba(129,199,132,0.35);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1px;">
        <span style="font-size:8.5px; font-weight:800; color:{C['sageGreenSolid']}; text-transform:uppercase;">CRYPTOGRAPHIC LEDGER INTEGRITY SEAL</span>
        <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.25); padding:1px 5px; border-radius:4px;">VERIFIED</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:8px; color:{C['midSlate']}; font-family:'JetBrains Mono';">
        <span>Merkle Root: 0x9f4a...e318</span>
        <span>SHA-256: 0 Tampered</span>
        <span>Block: #48,192</span>
      </div>
    </div>

    <!-- Export Action -->
    <div class="btn-primary" style="height:40px; gap:8px; margin-top:3px;">
      <span>Export Immutable Audit Log (CSV)</span>
      <span>{get_icon('fileText', 16, '#FFF', 2)}</span>
    </div>
    '''
    render_screen("28_admin_audit_log_viewer.png", wrap_screen(content, active_tab='admin', show_admin=True))

# ─────────────────────────────────────────────────────────────────────────────
# 29. Admin API Usage Metrics (Full screen layout)
# ─────────────────────────────────────────────────────────────────────────────
def screen_29():
    content = f'''
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
      <div style="width:34px; height:34px; border-radius:10px; background:{C['surface']}; border:1px solid {C['border']}; display:flex; align-items:center; justify-content:center; color:{C['textColor']};">
        {get_icon('chevronLeft', 18, C['textColor'])}
      </div>
      <div>
        <div style="font-size:18px; font-weight:800; color:{C['textColor']};">API Usage Metrics</div>
        <div style="font-size:10px; color:{C['midSlate']};">Telemetry for Gemini AI, Groq &amp; Supabase</div>
      </div>
    </div>

    <!-- 3 Stat Metrics -->
    <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:5px; margin-bottom:5px;">
      <div class="card" style="padding:5px 3px; text-align:center; margin-bottom:0;">
        <div style="font-size:15px; font-weight:800; color:{C['mutedAccentSolid']};">2,840</div>
        <div style="font-size:7.5px; color:{C['midSlate']};">Total Calls</div>
      </div>
      <div class="card" style="padding:5px 3px; text-align:center; margin-bottom:0;">
        <div style="font-size:15px; font-weight:800; color:{C['sageGreenSolid']};">420 ms</div>
        <div style="font-size:7.5px; color:{C['midSlate']};">Avg Latency</div>
      </div>
      <div class="card" style="padding:5px 3px; text-align:center; margin-bottom:0;">
        <div style="font-size:15px; font-weight:800; color:{C['sageGreenSolid']};">99.8%</div>
        <div style="font-size:7.5px; color:{C['midSlate']};">Success Rate</div>
      </div>
    </div>

    <!-- Provider Breakdown Card -->
    <div class="card" style="padding:7px 10px; margin-bottom:5px;">
      <div style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">PROVIDER CALL BREAKDOWN (LAST 30 DAYS)</div>

      <!-- Gemini -->
      <div style="margin-bottom:4px;">
        <div style="display:flex; justify-content:space-between; font-size:9.5px; margin-bottom:1px;">
          <span style="font-weight:700; color:{C['textColor']};">Google Gemini 1.5 Pro (Multimodal OCR)</span>
          <span style="font-weight:800; color:{C['mutedAccentSolid']};">1,890 calls (66%)</span>
        </div>
        <div style="height:4px; background:rgba(215,204,200,0.35); border-radius:2px; overflow:hidden;">
          <div style="width:66%; height:100%; background:{C['mutedAccentSolid']}; border-radius:2px;"></div>
        </div>
        <div style="font-size:7px; color:{C['midSlate']}; margin-top:1px;">Avg latency: 580ms · Used for Rx parsing &amp; Blister OCR</div>
      </div>

      <!-- Groq -->
      <div style="margin-bottom:4px;">
        <div style="display:flex; justify-content:space-between; font-size:9.5px; margin-bottom:1px;">
          <span style="font-weight:700; color:{C['textColor']};">Groq LLaMA 3.3 70B (Fast Chatbot)</span>
          <span style="font-weight:800; color:{C['sageGreenSolid']};">740 calls (26%)</span>
        </div>
        <div style="height:4px; background:rgba(215,204,200,0.35); border-radius:2px; overflow:hidden;">
          <div style="width:26%; height:100%; background:{C['sageGreenSolid']}; border-radius:2px;"></div>
        </div>
        <div style="font-size:7px; color:{C['midSlate']}; margin-top:1px;">Avg latency: 190ms · Used for AI Consultant chat</div>
      </div>

      <!-- Supabase Edge Functions -->
      <div>
        <div style="display:flex; justify-content:space-between; font-size:9.5px; margin-bottom:1px;">
          <span style="font-weight:700; color:{C['textColor']};">Supabase Edge Functions (Admin RPCs)</span>
          <span style="font-weight:800; color:{C['warningAmberSolid']};">210 calls (8%)</span>
        </div>
        <div style="height:4px; background:rgba(215,204,200,0.35); border-radius:2px; overflow:hidden;">
          <div style="width:8%; height:100%; background:{C['warningAmberSolid']}; border-radius:2px;"></div>
        </div>
        <div style="font-size:7px; color:{C['midSlate']}; margin-top:1px;">Avg latency: 120ms · Used for RLS audits &amp; syncs</div>
      </div>
    </div>

    <!-- Rate Limiting & Gateway Telemetry Card -->
    <div class="card" style="padding:6px 10px; margin-bottom:5px; background:rgba(77,182,172,0.1); border-color:rgba(77,182,172,0.35);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
        <span style="font-size:8.5px; font-weight:800; color:{C['mutedAccentSolid']}; text-transform:uppercase;">RATE LIMITING &amp; GATEWAY QUOTA</span>
        <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']};">0 THROTTLED</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:8.5px; color:{C['textColor']};">
        <span>Groq TPM: <b>6,000 / 30,000 (20%)</b></span>
        <span>Gemini RPM: <b>42 / 360 (11.6%)</b></span>
      </div>
    </div>

    <!-- Budget & Cost Quota Card -->
    <div class="card" style="padding:6px 10px; margin-bottom:5px; background:rgba(129,199,132,0.12); border-color:rgba(129,199,132,0.35);">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:9.5px; font-weight:800; color:{C['sageGreenSolid']};">Monthly AI Compute Budget</div>
          <div style="font-size:8px; color:{C['midSlate']};">$14.20 consumed of $100.00 quota (14.2%)</div>
        </div>
        <div style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']}; background:rgba(129,199,132,0.25); padding:1px 6px; border-radius:4px;">Healthy</div>
      </div>
    </div>

    <!-- Endpoint Latency & Cache Distribution Card -->
    <div class="card" style="padding:6px 10px; margin-bottom:5px; background:rgba(215,204,200,0.18);">
      <div style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px;">ENDPOINT LATENCY &amp; CACHE HIT RATIO</div>
      <div style="display:flex; flex-direction:column; gap:2px; font-size:8.5px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-family:'JetBrains Mono'; color:{C['textColor']};">/ocr/extract</span>
          <span><b style="color:{C['sageGreenSolid']};">580ms</b> · 88.4% Cache</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-family:'JetBrains Mono'; color:{C['textColor']};">/chat/consult</span>
          <span><b style="color:{C['sageGreenSolid']};">190ms</b> · 92.1% Cache</span>
        </div>
      </div>
    </div>

    <!-- Regional Edge Function Latency Matrix Card -->
    <div class="card" style="padding:6px 10px; margin-bottom:5px; background:rgba(77,182,172,0.1); border-color:rgba(77,182,172,0.35);">
      <div style="font-size:8.5px; font-weight:800; color:{C['mutedAccentSolid']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:3px;">REGIONAL EDGE LATENCY &amp; P95 SLA</div>
      <div style="display:flex; flex-direction:column; gap:2px; font-size:8px;">
        <div style="display:flex; justify-content:space-between;">
          <span><b>bom1 (Mumbai Primary Edge):</b> ai-router 28ms · auth-rpc 18ms</span>
          <b style="color:{C['sageGreenSolid']};">99.98% SLA</b>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span><b>del1 (New Delhi Standby):</b> amr-heatmap 42ms · ocr-proxy 35ms</span>
          <b style="color:{C['sageGreenSolid']};">99.95% SLA</b>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span><b>blr1 (Bengaluru Edge):</b> fhir-export 54ms · audit-stream 22ms</span>
          <b style="color:{C['sageGreenSolid']};">99.99% SLA</b>
        </div>
      </div>
    </div>

    <!-- Circuit Breaker & V8 Worker Pool Telemetry Card -->
    <div class="card" style="padding:6px 10px; margin-bottom:5px; background:rgba(215,204,200,0.18);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
        <span style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase;">V8 ISOLATE POOL &amp; CIRCUIT BREAKERS</span>
        <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']};">ALL CLOSED / NORMAL</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:8px; color:{C['textColor']};">
        <span>Active Isolates: <b>64 / 128 (50%)</b></span>
        <span>Heap Memory: <b>412 MB / 1,024 MB</b></span>
        <span>GC Pauses: <b>&lt; 2.1ms</b></span>
      </div>
    </div>

    <!-- AI Token Ingestion & Generation Telemetry Card -->
    <div class="card" style="padding:6px 10px; margin-bottom:5px; background:rgba(129,199,132,0.12); border-color:rgba(129,199,132,0.35);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
        <span style="font-size:8.5px; font-weight:800; color:{C['sageGreenSolid']}; text-transform:uppercase;">AI TOKEN CONSUMPTION &amp; COMPUTE</span>
        <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']};">1.73M TOKENS</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:8px; color:{C['textColor']}; margin-bottom:1px;">
        <span>Gemini Multimodal: <b>842k In · 215k Out</b></span>
        <span>Groq LLaMA: <b>495k In · 182k Out</b></span>
      </div>
      <div style="font-size:7px; color:{C['midSlate']};">Blended token efficiency: 94.2% · Cache-deduplicated savings: -$38.20 / mo</div>
    </div>

    <!-- Error Distribution & Retry Health Card -->
    <div class="card" style="padding:6px 10px; margin-bottom:5px; background:rgba(215,204,200,0.18);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
        <span style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase;">ERROR RATE &amp; BACKOFF RECOVERY</span>
        <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']};">0 UNRESOLVED</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:8px; color:{C['textColor']};">
        <span>4xx Client Errors: <b>4 (0.14%)</b></span>
        <span>5xx Upstream: <b>1 (0.03%)</b></span>
        <span>Auto-Retried: <b>5 / 5 Recovered</b></span>
      </div>
    </div>

    <!-- 7-Day Request Volume Trend Card -->
    <div class="card" style="padding:5px 10px; margin-bottom:5px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
        <span style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase;">7-DAY CALL VOLUME HISTOGRAM</span>
        <span style="font-size:8px; font-weight:800; color:{C['mutedAccentSolid']};">2,840 Calls (Past 7d)</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:flex-end; height:32px; padding:0 4px 1px 4px;">
        <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
          <div style="width:24px; height:18px; background:{C['mutedAccentSolid']}; border-radius:3px;"></div>
          <span style="font-size:6.5px; color:{C['midSlate']};">Mon</span>
        </div>
        <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
          <div style="width:24px; height:21px; background:{C['mutedAccentSolid']}; border-radius:3px;"></div>
          <span style="font-size:6.5px; color:{C['midSlate']};">Tue</span>
        </div>
        <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
          <div style="width:24px; height:19px; background:{C['mutedAccentSolid']}; border-radius:3px;"></div>
          <span style="font-size:6.5px; color:{C['midSlate']};">Wed</span>
        </div>
        <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
          <div style="width:24px; height:24px; background:{C['sageGreenSolid']}; border-radius:3px;"></div>
          <span style="font-size:6.5px; color:{C['midSlate']};">Thu</span>
        </div>
        <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
          <div style="width:24px; height:26px; background:{C['sageGreenSolid']}; border-radius:3px;"></div>
          <span style="font-size:6.5px; color:{C['midSlate']};">Fri</span>
        </div>
        <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
          <div style="width:24px; height:20px; background:{C['mutedAccentSolid']}; border-radius:3px;"></div>
          <span style="font-size:6.5px; color:{C['midSlate']};">Sat</span>
        </div>
        <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
          <div style="width:24px; height:17px; background:{C['mutedAccentSolid']}; border-radius:3px;"></div>
          <span style="font-size:6.5px; color:{C['midSlate']};">Sun</span>
        </div>
      </div>
    </div>

    <!-- Quick Administrative Diagnostics & Actions Card -->
    <div class="card" style="padding:5px 10px; margin-bottom:5px;">
      <div style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:3px;">ADMIN ACTIONS</div>
      <div style="display:flex; gap:5px;">
        <div style="flex:1; background:rgba(215,204,200,0.25); border:1px solid {C['border']}; border-radius:6px; padding:4px 2px; text-align:center; font-size:8px; font-weight:700; color:{C['textColor']};">
          Flush Cache
        </div>
        <div style="flex:1; background:rgba(215,204,200,0.25); border:1px solid {C['border']}; border-radius:6px; padding:4px 2px; text-align:center; font-size:8px; font-weight:700; color:{C['textColor']};">
          Health Check
        </div>
        <div style="flex:1; background:rgba(129,199,132,0.2); border:1px solid rgba(129,199,132,0.4); border-radius:6px; padding:4px 2px; text-align:center; font-size:8px; font-weight:800; color:{C['sageGreenSolid']};">
          Sync Pharma DB
        </div>
      </div>
    </div>

    <div class="btn-primary" style="height:38px; gap:8px; margin-bottom:4px;">
      <span>Export Telemetry &amp; Cost Analysis</span>
      <span>{get_icon('fileText', 16, '#FFF', 2)}</span>
    </div>

    <div style="height:34px; border:1px solid {C['border']}; background:{C['surface']}; border-radius:11px; display:flex; align-items:center; justify-content:center; gap:6px; font-size:10px; font-weight:700; color:{C['textColor']};">
      <span>Download Prometheus / Grafana OpenMetrics</span>
      <span>{get_icon('externalLink', 13, C['midSlate'])}</span>
    </div>
    '''
    render_screen("29_admin_api_usage_metrics.png", wrap_screen(content, active_tab='admin', show_admin=True))

# ─────────────────────────────────────────────────────────────────────────────
# 30. Admin AMR Heatmap Surveillance (10 rows, completely filling viewport)
# ─────────────────────────────────────────────────────────────────────────────
def screen_30():
    content = f'''
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:5px;">
      <div>
        <div style="font-size:19px; font-weight:800; color:{C['textColor']};">AMR Misuse Surveillance</div>
        <div style="font-size:10px; color:{C['midSlate']};">WHO AWaRe distribution &amp; resistance epidemiological risks</div>
      </div>
      <div style="background:rgba(230,182,85,0.2); color:{C['warningAmberSolid']}; font-size:9.5px; font-weight:800; padding:2px 7px; border-radius:7px;">
        Surveillance Active
      </div>
    </div>

    <!-- Global AWaRe Progress bar -->
    <div class="card" style="padding:8px 10px; margin-bottom:5px;">
      <div style="font-size:8.5px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:3px;">GLOBAL AWARE FORMULARY DISTRIBUTION</div>
      <div style="height:8px; border-radius:4px; overflow:hidden; display:flex; margin-bottom:3px;">
        <div style="width:68%; background:{C['sageGreenSolid']};" title="Access"></div>
        <div style="width:24%; background:{C['warningAmberSolid']};" title="Watch"></div>
        <div style="width:8%; background:{C['dangerClaySolid']};" title="Reserve"></div>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:8.5px; font-weight:700;">
        <span style="color:{C['sageGreenSolid']};">● Access: 68%</span>
        <span style="color:{C['warningAmberSolid']};">● Watch: 24%</span>
        <span style="color:{C['dangerClaySolid']};">● Reserve: 8%</span>
      </div>
    </div>

    <!-- Search filter bar directly from MisuseHeatmapScreen.tsx -->
    <div style="display:flex; align-items:center; height:32px; background:{C['surface']}; border-radius:9px; border:1px solid {C['border']}; padding:0 9px; gap:7px; margin-bottom:4px;">
      <div style="color:{C['midSlate']};">{get_icon('search', 13, C['midSlate'])}</div>
      <div style="font-size:10.5px; color:{C['midSlate']};">Filter by region (e.g. Maharashtra, Delhi)...</div>
    </div>

    <!-- Event Filter Chips directly from MisuseHeatmapScreen.tsx -->
    <div style="display:flex; gap:4px; margin-bottom:4px;">
      <div style="background:{C['sageGreenSolid']}; color:#FFF; font-size:9px; font-weight:800; padding:2px 7px; border-radius:9px;">All</div>
      <div style="background:{C['surface']}; border:1px solid {C['border']}; color:{C['midSlate']}; font-size:9px; font-weight:700; padding:2px 7px; border-radius:9px;">Unprescribed</div>
      <div style="background:{C['surface']}; border:1px solid {C['border']}; color:{C['midSlate']}; font-size:9px; font-weight:700; padding:2px 7px; border-radius:9px;">Early Stop</div>
      <div style="background:{C['surface']}; border:1px solid {C['border']}; color:{C['midSlate']}; font-size:9px; font-weight:700; padding:2px 7px; border-radius:9px;">Unnecessary</div>
    </div>

    <!-- Heatmap Regional Rows (10 rows filling list) -->
    <div style="display:flex; flex-direction:column; gap:3px; margin-bottom:5px;">
      <div class="card" style="padding:4px 8px; margin-bottom:0; display:flex; justify-content:space-between; align-items:center; border-left:3.5px solid {C['dangerClaySolid']};">
        <div>
          <div style="font-size:10.5px; font-weight:800;">Maharashtra (Mumbai Urban)</div>
          <div style="font-size:8px; color:{C['midSlate']};">Antibiotics · Early Stop</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11.5px; font-weight:800; color:{C['dangerClaySolid']};">42</div>
          <span style="background:rgba(201,123,99,0.2); color:{C['dangerClaySolid']}; font-size:7px; font-weight:800; padding:1px 3px; border-radius:3px;">⚠ HIGH</span>
        </div>
      </div>

      <div class="card" style="padding:4px 8px; margin-bottom:0; display:flex; justify-content:space-between; align-items:center; border-left:3.5px solid {C['dangerClaySolid']};">
        <div>
          <div style="font-size:10.5px; font-weight:800;">Delhi (Central NCR)</div>
          <div style="font-size:8px; color:{C['midSlate']};">Antibiotics · Unprescribed</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11.5px; font-weight:800; color:{C['dangerClaySolid']};">38</div>
          <span style="background:rgba(201,123,99,0.2); color:{C['dangerClaySolid']}; font-size:7px; font-weight:800; padding:1px 3px; border-radius:3px;">⚠ HIGH</span>
        </div>
      </div>

      <div class="card" style="padding:4px 8px; margin-bottom:0; display:flex; justify-content:space-between; align-items:center; border-left:3.5px solid {C['dangerClaySolid']};">
        <div>
          <div style="font-size:10.5px; font-weight:800;">Karnataka (Bangalore Urban)</div>
          <div style="font-size:8px; color:{C['midSlate']};">Antibiotics · Unnecessary Use</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11.5px; font-weight:800; color:{C['dangerClaySolid']};">29</div>
          <span style="background:rgba(201,123,99,0.2); color:{C['dangerClaySolid']}; font-size:7px; font-weight:800; padding:1px 3px; border-radius:3px;">⚠ HIGH</span>
        </div>
      </div>

      <div class="card" style="padding:4px 8px; margin-bottom:0; display:flex; justify-content:space-between; align-items:center; border-left:3.5px solid {C['warningAmberSolid']};">
        <div>
          <div style="font-size:10.5px; font-weight:800;">Tamil Nadu (Chennai North)</div>
          <div style="font-size:8px; color:{C['midSlate']};">Antibiotics · Early Stop</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11.5px; font-weight:800; color:{C['warningAmberSolid']};">24</div>
          <span style="background:rgba(230,182,85,0.2); color:{C['warningAmberSolid']}; font-size:7px; font-weight:800; padding:1px 3px; border-radius:3px;">ELEVATED</span>
        </div>
      </div>

      <div class="card" style="padding:4px 8px; margin-bottom:0; display:flex; justify-content:space-between; align-items:center; border-left:3.5px solid {C['warningAmberSolid']};">
        <div>
          <div style="font-size:10.5px; font-weight:800;">Uttar Pradesh (Lucknow Metro)</div>
          <div style="font-size:8px; color:{C['midSlate']};">Antibiotics · Unprescribed</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11.5px; font-weight:800; color:{C['warningAmberSolid']};">21</div>
          <span style="background:rgba(230,182,85,0.2); color:{C['warningAmberSolid']}; font-size:7px; font-weight:800; padding:1px 3px; border-radius:3px;">ELEVATED</span>
        </div>
      </div>

      <div class="card" style="padding:4px 8px; margin-bottom:0; display:flex; justify-content:space-between; align-items:center; border-left:3.5px solid {C['warningAmberSolid']};">
        <div>
          <div style="font-size:10.5px; font-weight:800;">West Bengal (Kolkata East)</div>
          <div style="font-size:8px; color:{C['midSlate']};">Antibiotics · Early Stop</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11.5px; font-weight:800; color:{C['warningAmberSolid']};">18</div>
          <span style="background:rgba(230,182,85,0.2); color:{C['warningAmberSolid']}; font-size:7px; font-weight:800; padding:1px 3px; border-radius:3px;">ELEVATED</span>
        </div>
      </div>

      <div class="card" style="padding:4px 8px; margin-bottom:0; display:flex; justify-content:space-between; align-items:center; border-left:3.5px solid {C['warningAmberSolid']};">
        <div>
          <div style="font-size:10.5px; font-weight:800;">Telangana (Hyderabad Cyberabad)</div>
          <div style="font-size:8px; color:{C['midSlate']};">Antibiotics · Unprescribed</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11.5px; font-weight:800; color:{C['warningAmberSolid']};">16</div>
          <span style="background:rgba(230,182,85,0.2); color:{C['warningAmberSolid']}; font-size:7px; font-weight:800; padding:1px 3px; border-radius:3px;">ELEVATED</span>
        </div>
      </div>

      <div class="card" style="padding:4px 8px; margin-bottom:0; display:flex; justify-content:space-between; align-items:center; border-left:3.5px solid {C['warningAmberSolid']};">
        <div>
          <div style="font-size:10.5px; font-weight:800;">Gujarat (Ahmedabad Central)</div>
          <div style="font-size:8px; color:{C['midSlate']};">Antibiotics · Early Stop</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11.5px; font-weight:800; color:{C['warningAmberSolid']};">14</div>
          <span style="background:rgba(230,182,85,0.2); color:{C['warningAmberSolid']}; font-size:7px; font-weight:800; padding:1px 3px; border-radius:3px;">ELEVATED</span>
        </div>
      </div>

      <div class="card" style="padding:4px 8px; margin-bottom:0; display:flex; justify-content:space-between; align-items:center; border-left:3.5px solid {C['warningAmberSolid']};">
        <div>
          <div style="font-size:10.5px; font-weight:800;">Kerala (Kochi Metro)</div>
          <div style="font-size:8px; color:{C['midSlate']};">Antibiotics · Early Stop</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11.5px; font-weight:800; color:{C['warningAmberSolid']};">12</div>
          <span style="background:rgba(230,182,85,0.2); color:{C['warningAmberSolid']}; font-size:7px; font-weight:800; padding:1px 3px; border-radius:3px;">ELEVATED</span>
        </div>
      </div>

      <div class="card" style="padding:4px 8px; margin-bottom:0; display:flex; justify-content:space-between; align-items:center; border-left:3.5px solid {C['warningAmberSolid']};">
        <div>
          <div style="font-size:10.5px; font-weight:800;">Rajasthan (Jaipur Central)</div>
          <div style="font-size:8px; color:{C['midSlate']};">Antibiotics · Unprescribed</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11.5px; font-weight:800; color:{C['warningAmberSolid']};">11</div>
          <span style="background:rgba(230,182,85,0.2); color:{C['warningAmberSolid']}; font-size:7px; font-weight:800; padding:1px 3px; border-radius:3px;">ELEVATED</span>
        </div>
      </div>
    </div>

    <!-- National Antimicrobial Stewardship Index Summary Card -->
    <div class="card" style="padding:6px 9px; margin-bottom:6px; background:rgba(129,199,132,0.12); border-color:rgba(129,199,132,0.35);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1px;">
        <span style="font-size:8.5px; font-weight:800; color:{C['sageGreenSolid']}; text-transform:uppercase;">NATIONAL STEWARDSHIP INDEX</span>
        <span style="font-size:8px; font-weight:800; color:{C['sageGreenSolid']};">78.4 / 100</span>
      </div>
      <div style="font-size:8px; color:{C['midSlate']};">30-Day Reduction: <b>-6.2% Misuse Events</b> · Active Clinical Interventions: <b>14 Apex Facilities</b></div>
    </div>

    <div class="btn-primary" style="height:40px; gap:8px;">
      <span>Generate Antimicrobial Resistance Report</span>
      <span>{get_icon('fileText', 15, '#FFF', 2)}</span>
    </div>
    '''
    render_screen("30_admin_amr_heatmap_surveillance.png", wrap_screen(content, active_tab='admin', show_admin=True))

# ─────────────────────────────────────────────────────────────────────────────
# Master Execution Pipeline
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("="*60)
    print("Rendering Screens 11 to 30 (Improvised High-Fidelity)...")
    print("="*60)
    screen_11()
    screen_12()
    screen_13()
    screen_14()
    screen_15()
    screen_16()
    screen_17()
    screen_18()
    screen_19()
    screen_20()
    screen_21()
    screen_22()
    screen_23()
    screen_24()
    screen_25()
    screen_26()
    screen_27()
    screen_28()
    screen_29()
    screen_30()
    print("Screens 11 to 30 completed successfully!")
