#!/usr/bin/env python3
"""
MedSentry Master Screen Renderer (All 30 Authentic Screens)
Exact 19:9 FHD+ (1080x2280 px) via 412x870 dp native scaling (scale=2.62136).
Directly matches React Native Design System v2: Organic & Balanced.
"""

import os
import subprocess
import base64
import tempfile
import sys

BASE_DIR = '/home/subhash/projects/MedSentry'
OUTPUT_DIR = os.path.join(BASE_DIR, 'report_assets/app_screenshots')
LOGO_PATH = os.path.join(BASE_DIR, 'mobile-app/assets/logo.png')

os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(LOGO_PATH, 'rb') as f:
    LOGO_B64 = base64.b64encode(f.read()).decode('utf-8')

# Design Tokens
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

# Lucide Icons SVGs (24x24 standard viewBox)
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
        'sparkles': '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>',
        'cabinet': '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
        'copy': '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
        'alertTriangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
        'trash': '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
        'sun': '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
        'moon': '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
        'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        'mail': '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
        'lock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
        'eye': '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
        'camera': '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
        'shield': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
        'heart': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
        'send': '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
        'fileText': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><polyline points="14 2 14 8 20 8"/>',
        'dna': '<path d="m8 8 8 8"/><path d="m8 16 8-8"/><path d="m19 11-1-1"/><path d="m14 6-1-1"/><path d="m5 13 1 1"/><path d="m10 18 1 1"/>',
        'leaf': '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
        'pill': '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>',
        'phone': '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
        'cross': '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
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

    w = f"{100 / len(tabs):.1f}%"
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

def wrap_screen(content, bg=None, is_dark=False, time_str="9:41", active_tab=None, show_admin=False, top_bar=None):
    bg_col = bg or C['bg']
    bottom_h = 62 if active_tab else 16
    nav_html = render_tab_bar(active_tab, show_admin) if active_tab else f'''
    <div style="position:absolute; bottom:6px; left:0; right:0; display:flex; justify-content:center; align-items:center;">
      <div style="width:110px; height:4px; background:rgba(84,110,122,0.3); border-radius:2px;"></div>
    </div>
    '''
    top_bar_html = top_bar if top_bar else render_status_bar(is_dark, time_str)
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
      padding: 12px 16px;
      overflow: hidden;
    }}
    .card {{
      background: {C['surface']};
      border-radius: 16px;
      border: 1px solid {C['border']};
      padding: 14px;
      margin-bottom: 12px;
      box-shadow: 0 2px 8px rgba(141,110,99,0.06);
    }}
    .btn-primary {{
      background: {C['sageGreenSolid']};
      color: #FFFFFF;
      font-weight: 800;
      font-size: 14px;
      border-radius: 14px;
      height: 48px;
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

print("Starting Master Render of 30 Authentic Native Screens...")
