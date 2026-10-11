#!/usr/bin/env python3
"""
MedSentry Screen Renderer (High-Fidelity 19:9 FHD+ 1080x2280)
Renders authentic, pixel-perfect screens directly mirroring the current
React Native Expo application and Design System v2: Organic & Balanced.
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

# Core Design System Tokens
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

# SVG Lucide Icons
ICONS = {
    'home': '''<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>''',
    'scan': '''<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M5 12h14"/></svg>''',
    'meds': '''<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>''',
    'family': '''<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>''',
    'ai': '''<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6V2H8"/><path d="m8 18-4 4V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z"/><path d="M2 12h2"/><path d="M9 11v2"/><path d="M15 11v2"/><path d="M20 12h2"/></svg>''',
    'journal': '''<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/><path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/></svg>''',
    'profile': '''<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></svg>''',
    'admin': '''<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>''',
    'clock': '''<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>''',
    'check': '''<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>''',
    'plus': '''<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>''',
    'sparkles': '''<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>''',
    'chevronRight': '''<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>''',
    'arrowRight': '''<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>''',
    'search': '''<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>''',
    'shield': '''<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>''',
    'copy': '''<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>''',
    'camera': '''<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>''',
    'sun': '''<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>''',
    'moon': '''<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>''',
    'trash': '''<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>''',
    'alert': '''<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>''',
    'stethoscope': '''<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>''',
}

def render_status_bar(is_dark=False, time_str="9:41"):
    text_col = "#FFFFFF" if is_dark else C['textColor']
    icon_col = "#FFFFFF" if is_dark else C['textColor']
    return f'''
    <div style="height:68px; display:flex; justify-content:space-between; align-items:center; padding:0 36px; z-index:99; position:relative;">
      <div style="font-size:24px; font-weight:700; color:{text_col}; letter-spacing:-0.4px;">{time_str}</div>
      <div style="display:flex; align-items:center; gap:16px; color:{icon_col};">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <rect x="2" y="16" width="3" height="6" rx="1"/>
          <rect x="7" y="12" width="3" height="10" rx="1"/>
          <rect x="12" y="8" width="3" height="14" rx="1"/>
          <rect x="17" y="4" width="3" height="18" rx="1"/>
        </svg>
        <span style="font-size:16px; font-weight:800; border:1.8px solid {icon_col}; border-radius:6px; padding:2px 5px; line-height:1;">5G</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
          <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
          <line x1="12" y1="20" x2="12.01" y2="20" stroke-width="3"/>
        </svg>
        <div style="display:flex; align-items:center; gap:3px;">
          <div style="width:34px; height:18px; border:2.2px solid {icon_col}; border-radius:5px; padding:2px; display:flex;">
            <div style="width:90%; height:100%; background:{icon_col}; border-radius:2px;"></div>
          </div>
          <div style="width:3px; height:8px; background:{icon_col}; border-radius:0 2px 2px 0;"></div>
        </div>
      </div>
    </div>
    '''

def render_bottom_nav(active='home', show_admin=False):
    tabs = [
        ('home', 'Home', ICONS['home']),
        ('scan', 'Scan', ICONS['scan']),
        ('meds', 'Meds', ICONS['meds']),
        ('family', 'Family', ICONS['family']),
        ('ai', 'AI', ICONS['ai']),
        ('journal', 'Journal', ICONS['journal']),
        ('profile', 'Profile', ICONS['profile']),
    ]
    if show_admin:
        tabs.append(('admin', 'Admin', ICONS['admin']))
    
    html = f'''
    <div style="position:absolute; bottom:0; left:0; right:0; height:140px; background:{C['surface']}; border-top:1.5px solid {C['border']}; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 -4px 18px rgba(141,110,99,0.08); z-index:90;">
      <div style="display:flex; justify-content:space-around; align-items:center; padding-top:12px; padding-left:10px; padding-right:10px;">
    '''
    for key, label, icon in tabs:
        is_active = (key == active)
        icon_col = C['sageGreenSolid'] if is_active else C['midSlate']
        label_col = C['sageGreenSolid'] if is_active else C['midSlate']
        font_wt = "800" if is_active else "600"
        pill_style = f"background:rgba(129,199,132,0.18); border:1.2px solid rgba(129,199,132,0.4);" if is_active else "border:1.2px solid transparent;"
        html += f'''
        <div style="position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; width:64px; height:68px; border-radius:16px; {pill_style}">
          <div style="color:{icon_col}; transform:scale(1.15);">{icon}</div>
          <div style="font-size:12px; font-weight:{font_wt}; color:{label_col}; margin-top:5px; letter-spacing:0.1px;">{label}</div>
        </div>
        '''
    html += f'''
      </div>
      <div style="display:flex; justify-content:center; padding-bottom:12px;">
        <div style="width:160px; height:5px; background:rgba(84,110,122,0.35); border-radius:3px;"></div>
      </div>
    </div>
    '''
    return html

def wrap_page(content, bg=None, is_dark=False, time_str="9:41", active_tab=None, show_admin=False):
    bg_col = bg or C['bg']
    nav_html = render_bottom_nav(active_tab, show_admin) if active_tab else f'''
    <div style="position:absolute; bottom:0; left:0; right:0; height:40px; display:flex; justify-content:center; align-items:center; z-index:90;">
      <div style="width:160px; height:5px; background:rgba(84,110,122,0.35); border-radius:3px;"></div>
    </div>
    '''
    return f'''<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
        * {{ box-sizing: border-box; margin: 0; padding: 0; user-select: none; }}
        body {{
          width: 1080px;
          height: 2280px;
          background: {bg_col};
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          color: {C['textColor']};
          overflow: hidden;
          position: relative;
        }}
        ::-webkit-scrollbar {{ display: none; }}
      </style>
    </head>
    <body>
      {render_status_bar(is_dark, time_str)}
      <div style="position:absolute; top:68px; left:0; right:0; bottom:{140 if active_tab else 40}px; overflow-y:auto; padding:24px 36px 40px 36px;">
        {content}
      </div>
      {nav_html}
    </body>
    </html>
    '''

def run_render(name, html_str):
    out_path = os.path.join(OUTPUT_DIR, name)
    with tempfile.NamedTemporaryFile(suffix='.html', mode='w', delete=False) as tf:
        tf.write(html_str)
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
        print(f"✓ Rendered: {name} ({sz} bytes)")
    finally:
        if os.path.exists(t_name):
            os.remove(t_name)

print("Starting generation of 30 High-Fidelity App Working Screenshots...")
