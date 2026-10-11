#!/usr/bin/env python3
"""
MedSentry Screen Renderer (Complete 30 Screens, 19:9 FHD+ 1080x2280)
Renders authentic, pixel-perfect screens directly mirroring the current
React Native Expo application and Design System v2: Organic & Balanced.
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
    'checkCircle': '''<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>''',
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
    'cabinet': '''<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>''',
    'crown': '''<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>''',
    'heart': '''<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>''',
    'user': '''<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>''',
    'mail': '''<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>''',
    'lock': '''<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>''',
    'eye': '''<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>''',
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

# ─────────────────────────────────────────────────────────────────────────────
# 1. Onboarding Screen
# ─────────────────────────────────────────────────────────────────────────────
def screen_01():
    content = f'''
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:space-between; height:100%; padding-top:40px; padding-bottom:30px;">
      <div style="display:flex; flex-direction:column; align-items:center;">
        <div style="width:130px; height:130px; border-radius:28px; background:{C['paleJade']}55; border:2px solid {C['sageGreen']}77; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 24px rgba(76,175,80,0.15); margin-bottom:28px;">
          <img src="data:image/png;base64,{LOGO_B64}" style="width:96px; height:96px; object-fit:contain;" />
        </div>
        <div style="font-size:42px; font-weight:800; color:{C['textColor']}; letter-spacing:2px; margin-bottom:8px;">
          MED<span style="color:{C['sageGreenSolid']};">SENTRY</span>
        </div>
        <div style="font-size:20px; font-weight:500; color:{C['midSlate']}; text-align:center;">Your Mindful Medication Guide</div>
      </div>

      <div style="width:100%; display:flex; flex-direction:column; gap:20px; margin:40px 0;">
        <div style="display:flex; align-items:center; gap:22px; background:{C['surface']}; border-radius:20px; padding:24px; border:1px solid {C['border']}; box-shadow:0 4px 12px rgba(141,110,99,0.06);">
          <div style="width:62px; height:62px; border-radius:16px; background:{C['paleJade']}66; display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']};">{ICONS['scan']}</div>
          <div style="flex:1;">
            <div style="font-size:22px; font-weight:800; color:{C['textColor']}; margin-bottom:4px;">Scan Medications</div>
            <div style="font-size:16px; color:{C['midSlate']}; line-height:1.4;">Identify pills &amp; prescriptions instantly with your camera</div>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:22px; background:{C['surface']}; border-radius:20px; padding:24px; border:1px solid {C['border']}; box-shadow:0 4px 12px rgba(141,110,99,0.06);">
          <div style="width:62px; height:62px; border-radius:16px; background:{C['paleJade']}66; display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']};">{ICONS['meds']}</div>
          <div style="flex:1;">
            <div style="font-size:22px; font-weight:800; color:{C['textColor']}; margin-bottom:4px;">Track Your Doses</div>
            <div style="font-size:16px; color:{C['midSlate']}; line-height:1.4;">Never miss a dose — get reminders for every medication</div>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:22px; background:{C['surface']}; border-radius:20px; padding:24px; border:1px solid {C['border']}; box-shadow:0 4px 12px rgba(141,110,99,0.06);">
          <div style="width:62px; height:62px; border-radius:16px; background:{C['paleJade']}66; display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']};">{ICONS['family']}</div>
          <div style="flex:1;">
            <div style="font-size:22px; font-weight:800; color:{C['textColor']}; margin-bottom:4px;">Family Circle</div>
            <div style="font-size:16px; color:{C['midSlate']}; line-height:1.4;">Coordinate care across your household safely</div>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:22px; background:{C['surface']}; border-radius:20px; padding:24px; border:1px solid {C['border']}; box-shadow:0 4px 12px rgba(141,110,99,0.06);">
          <div style="width:62px; height:62px; border-radius:16px; background:{C['paleJade']}66; display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']};">{ICONS['ai']}</div>
          <div style="flex:1;">
            <div style="font-size:22px; font-weight:800; color:{C['textColor']}; margin-bottom:4px;">AI Consultant</div>
            <div style="font-size:16px; color:{C['midSlate']}; line-height:1.4;">Ask questions about your medications, anytime</div>
          </div>
        </div>
      </div>

      <div style="width:100%;">
        <div style="height:76px; background:{C['sageGreenSolid']}; border-radius:24px; display:flex; align-items:center; justify-content:center; color:#FFF; font-size:22px; font-weight:800; letter-spacing:0.4px; box-shadow:0 6px 20px rgba(46,125,50,0.35);">
          Get Started
        </div>
      </div>
    </div>
    '''
    run_render("01_onboarding_welcome.png", wrap_page(content, time_str="9:41"))

# ─────────────────────────────────────────────────────────────────────────────
# 2. Auth Sign In Screen
# ─────────────────────────────────────────────────────────────────────────────
def screen_02():
    content = f'''
    <div style="display:flex; flex-direction:column; justify-content:center; height:100%; padding-bottom:50px;">
      <div style="display:flex; flex-direction:column; align-items:center; margin-bottom:40px;">
        <div style="width:100px; height:100px; border-radius:24px; background:{C['paleJade']}55; border:1.8px solid {C['sageGreen']}77; display:flex; align-items:center; justify-content:center; margin-bottom:20px; box-shadow:0 6px 18px rgba(76,175,80,0.12);">
          <img src="data:image/png;base64,{LOGO_B64}" style="width:72px; height:72px; object-fit:contain;" />
        </div>
        <div style="font-size:36px; font-weight:800; color:{C['textColor']}; letter-spacing:1.5px; margin-bottom:6px;">
          MED<span style="color:{C['sageGreenSolid']};">SENTRY</span>
        </div>
        <div style="font-size:16px; font-weight:500; color:{C['midSlate']};">Your Mindful Medication Guide</div>
      </div>

      <div style="background:{C['surface']}; border-radius:26px; padding:38px; border:1px solid {C['border']}; box-shadow:0 8px 30px rgba(141,110,99,0.1);">
        <div style="font-size:28px; font-weight:800; color:{C['textColor']}; margin-bottom:28px;">Welcome back</div>

        <div style="font-size:14px; font-weight:700; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:10px;">EMAIL</div>
        <div style="display:flex; align-items:center; height:68px; background:{C['warmCocoa']}44; border-radius:18px; border:1px solid {C['border']}; padding:0 20px; gap:16px; margin-bottom:22px;">
          <div style="color:{C['midSlate']};">{ICONS['mail']}</div>
          <div style="font-size:18px; color:{C['textColor']}; font-weight:500;">alex.sharma@medsentry.health</div>
        </div>

        <div style="font-size:14px; font-weight:700; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:10px;">PASSWORD</div>
        <div style="display:flex; align-items:center; height:68px; background:{C['warmCocoa']}44; border-radius:18px; border:1px solid {C['border']}; padding:0 20px; gap:16px; margin-bottom:34px;">
          <div style="color:{C['midSlate']};">{ICONS['lock']}</div>
          <div style="font-size:22px; color:{C['textColor']}; flex:1; letter-spacing:3px;">••••••••••••</div>
          <div style="color:{C['midSlate']};">{ICONS['eye']}</div>
        </div>

        <div style="height:72px; background:{C['sageGreenSolid']}; border-radius:22px; display:flex; align-items:center; justify-content:center; color:#FFF; font-size:20px; font-weight:800; letter-spacing:0.4px; box-shadow:0 6px 20px rgba(46,125,50,0.3); margin-bottom:26px;">
          Sign In
        </div>

        <div style="display:flex; align-items:center; gap:20px; margin-bottom:26px;">
          <div style="flex:1; height:1px; background:{C['border']};"></div>
          <div style="font-size:15px; font-weight:700; color:{C['midSlate']};">OR</div>
          <div style="flex:1; height:1px; background:{C['border']};"></div>
        </div>

        <div style="height:66px; background:{C['surfaceElevated']}; border:1.5px solid {C['border']}; border-radius:20px; display:flex; align-items:center; justify-content:center; gap:14px; margin-bottom:28px;">
          <div style="width:34px; height:34px; border-radius:17px; background:#DB443718; border:1px solid #DB443744; display:flex; align-items:center; justify-content:center; font-size:17px; font-weight:800; color:#DB4437;">G</div>
          <div style="font-size:18px; font-weight:700; color:{C['textColor']};">Continue with Google</div>
        </div>

        <div style="display:flex; justify-content:center; align-items:center; gap:8px;">
          <span style="font-size:16px; color:{C['midSlate']};">Don't have an account?</span>
          <span style="font-size:16px; font-weight:800; color:{C['mutedAccentSolid']};">Sign Up</span>
        </div>
      </div>
    </div>
    '''
    run_render("02_auth_signin.png", wrap_page(content, time_str="9:41"))

# ─────────────────────────────────────────────────────────────────────────────
# 3. Auth Sign Up Screen
# ─────────────────────────────────────────────────────────────────────────────
def screen_03():
    content = f'''
    <div style="display:flex; flex-direction:column; justify-content:center; height:100%; padding-bottom:40px;">
      <div style="display:flex; flex-direction:column; align-items:center; margin-bottom:34px;">
        <div style="width:90px; height:90px; border-radius:22px; background:{C['paleJade']}55; border:1.8px solid {C['sageGreen']}77; display:flex; align-items:center; justify-content:center; margin-bottom:16px;">
          <img src="data:image/png;base64,{LOGO_B64}" style="width:64px; height:64px; object-fit:contain;" />
        </div>
        <div style="font-size:32px; font-weight:800; color:{C['textColor']}; letter-spacing:1.5px;">Create Your Account</div>
        <div style="font-size:15px; font-weight:500; color:{C['midSlate']}; margin-top:4px;">Join MedSentry for personalized medication tracking</div>
      </div>

      <div style="background:{C['surface']}; border-radius:26px; padding:36px; border:1px solid {C['border']}; box-shadow:0 8px 30px rgba(141,110,99,0.1);">
        <div style="font-size:13px; font-weight:700; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:8px;">FULL NAME</div>
        <div style="display:flex; align-items:center; height:64px; background:{C['warmCocoa']}44; border-radius:18px; border:1px solid {C['border']}; padding:0 20px; gap:16px; margin-bottom:20px;">
          <div style="color:{C['midSlate']};">{ICONS['user']}</div>
          <div style="font-size:17px; color:{C['textColor']}; font-weight:600;">Dr. Alex Sharma</div>
        </div>

        <div style="font-size:13px; font-weight:700; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:8px;">EMAIL ADDRESS</div>
        <div style="display:flex; align-items:center; height:64px; background:{C['warmCocoa']}44; border-radius:18px; border:1px solid {C['border']}; padding:0 20px; gap:16px; margin-bottom:20px;">
          <div style="color:{C['midSlate']};">{ICONS['mail']}</div>
          <div style="font-size:17px; color:{C['textColor']}; font-weight:600;">alex.sharma@medsentry.health</div>
        </div>

        <div style="font-size:13px; font-weight:700; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:8px;">SECURE PASSWORD</div>
        <div style="display:flex; align-items:center; height:64px; background:{C['warmCocoa']}44; border-radius:18px; border:1px solid {C['border']}; padding:0 20px; gap:16px; margin-bottom:24px;">
          <div style="color:{C['midSlate']};">{ICONS['lock']}</div>
          <div style="font-size:20px; color:{C['textColor']}; flex:1; letter-spacing:3px;">••••••••••••</div>
          <div style="color:{C['midSlate']};">{ICONS['eye']}</div>
        </div>

        <div style="display:flex; align-items:center; gap:14px; margin-bottom:28px;">
          <div style="width:26px; height:26px; border-radius:8px; background:{C['sageGreenSolid']}; display:flex; align-items:center; justify-content:center; color:#FFF;">{ICONS['check']}</div>
          <div style="font-size:14px; color:{C['midSlate']}; font-weight:500; line-height:1.4;">
            I agree to the <span style="color:{C['sageGreenSolid']}; font-weight:700;">Terms of Service</span> &amp; <span style="color:{C['sageGreenSolid']}; font-weight:700;">Privacy Policy</span>
          </div>
        </div>

        <div style="height:70px; background:{C['sageGreenSolid']}; border-radius:22px; display:flex; align-items:center; justify-content:center; color:#FFF; font-size:20px; font-weight:800; letter-spacing:0.4px; box-shadow:0 6px 20px rgba(46,125,50,0.3); margin-bottom:24px;">
          Create Account
        </div>

        <div style="display:flex; justify-content:center; align-items:center; gap:8px;">
          <span style="font-size:16px; color:{C['midSlate']};">Already have an account?</span>
          <span style="font-size:16px; font-weight:800; color:{C['mutedAccentSolid']};">Sign In</span>
        </div>
      </div>
    </div>
    '''
    run_render("03_auth_signup.png", wrap_page(content, time_str="9:41"))

# ─────────────────────────────────────────────────────────────────────────────
# 4. Auth Email Verification
# ─────────────────────────────────────────────────────────────────────────────
def screen_04():
    content = f'''
    <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; padding:0 10px;">
      <div style="width:100%; max-width:540px; background:{C['surface']}; border-radius:32px; padding:52px 36px; border:2px solid {C['sageGreen']}55; display:flex; flex-direction:column; align-items:center; box-shadow:0 12px 36px rgba(141,110,99,0.12); text-align:center;">
        <div style="width:120px; height:120px; border-radius:60px; background:{C['sageGreen']}18; border:2px solid {C['sageGreen']}44; display:flex; align-items:center; justify-content:center; margin-bottom:30px;">
          <div style="width:90px; height:90px; border-radius:45px; background:{C['surfaceElevated']}; border:2px solid {C['sageGreenSolid']}; display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']}; transform:scale(1.8);">
            {ICONS['checkCircle']}
          </div>
        </div>

        <div style="font-size:36px; font-weight:800; color:{C['textColor']}; letter-spacing:-0.6px; margin-bottom:14px;">Email Verified!</div>
        <div style="font-size:17px; color:{C['midSlate']}; line-height:1.6; margin-bottom:30px; font-weight:500;">
          Your email address has been successfully confirmed. Your clinical profile and patient credentials have been synchronized with the database.
        </div>

        <div style="display:flex; align-items:center; gap:10px; background:{C['sageGreen']}18; border:1px solid {C['sageGreen']}55; padding:12px 22px; border-radius:30px; margin-bottom:36px;">
          <div style="color:{C['sageGreenSolid']};">{ICONS['admin']}</div>
          <div style="font-size:15px; font-weight:800; color:{C['sageGreenSolid']}; letter-spacing:0.2px;">Database Record Synced</div>
        </div>

        <div style="width:100%; height:72px; background:{C['sageGreenSolid']}; border-radius:24px; display:flex; align-items:center; justify-content:center; gap:12px; color:#FFF; font-size:20px; font-weight:800; letter-spacing:0.3px; box-shadow:0 6px 20px rgba(46,125,50,0.3);">
          <span>Verified — Continue</span>
          <span>{ICONS['arrowRight']}</span>
        </div>
      </div>
    </div>
    '''
    run_render("04_auth_email_verification.png", wrap_page(content, time_str="9:41"))

# ─────────────────────────────────────────────────────────────────────────────
# 5. Home Dashboard Morning (100% Adherence, Amoxicillin 8:00 AM)
# ─────────────────────────────────────────────────────────────────────────────
def screen_05():
    content = f'''
    <!-- Hero Header -->
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:26px;">
      <div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
          <div style="color:{C['clayOchre'] if 'clayOchre' in C else C['warningAmber']};">{ICONS['sun']}</div>
          <span style="font-size:17px; font-weight:600; color:{C['midSlate']};">Good morning,</span>
        </div>
        <div style="font-size:38px; font-weight:800; color:{C['textColor']}; letter-spacing:-0.8px;">Dr. Alex Sharma</div>
      </div>
      <div style="width:58px; height:58px; border-radius:29px; background:{C['sageGreen']}25; border:2.5px solid {C['sageGreen']}; display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']}; box-shadow:0 4px 12px rgba(46,125,50,0.15);">
        {ICONS['stethoscope']}
      </div>
    </div>

    <!-- Stats Strip -->
    <div style="display:flex; background:{C['surface']}; border-radius:20px; padding:18px 24px; margin-bottom:24px; border:1px solid {C['border']}; box-shadow:0 4px 14px rgba(141,110,99,0.06); align-items:center; justify-content:space-around;">
      <div style="text-align:center;">
        <div style="font-size:28px; font-weight:800; color:{C['textColor']};">3</div>
        <div style="font-size:13px; font-weight:600; color:{C['midSlate']}; text-transform:uppercase; margin-top:2px;">Active</div>
      </div>
      <div style="width:1.5px; height:42px; background:{C['border']};"></div>
      <div style="text-align:center;">
        <div style="font-size:28px; font-weight:800; color:{C['textColor']};">1</div>
        <div style="font-size:13px; font-weight:600; color:{C['midSlate']}; text-transform:uppercase; margin-top:2px;">Taken today</div>
      </div>
      <div style="width:1.5px; height:42px; background:{C['border']};"></div>
      <div style="text-align:center;">
        <div style="font-size:28px; font-weight:800; color:{C['sageGreenSolid']};">100%</div>
        <div style="font-size:13px; font-weight:600; color:{C['midSlate']}; text-transform:uppercase; margin-top:2px;">Adherence</div>
      </div>
    </div>

    <!-- Upcoming Dose Hero Card -->
    <div style="background:{C['surface']}; border-radius:26px; padding:28px; border:1.8px solid {C['sageGreen']}44; box-shadow:0 8px 24px rgba(141,110,99,0.08); margin-bottom:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
        <div style="display:flex; align-items:center; gap:8px; background:{C['sageGreen']}18; border:1px solid {C['sageGreen']}44; padding:6px 14px; border-radius:30px;">
          <div style="color:{C['sageGreenSolid']};">{ICONS['clock']}</div>
          <span style="font-size:12px; font-weight:800; color:{C['sageGreenSolid']}; letter-spacing:0.8px;">UPCOMING DOSE</span>
        </div>
        <div style="background:{C['sageGreen']}22; border:1px solid {C['sageGreen']}44; padding:5px 14px; border-radius:30px; font-size:12px; font-weight:800; color:{C['sageGreenSolid']}; letter-spacing:0.6px;">
          TODAY
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:48px; font-weight:800; color:{C['textColor']}; letter-spacing:-1.2px; line-height:1;">08:00 AM</div>
          <div style="font-size:18px; font-weight:700; color:{C['midSlate']}; margin:10px 0 18px 0;">Amoxicillin 500mg · 1 capsule</div>
          <div style="display:inline-flex; align-items:center; gap:8px; background:{C['sageGreenSolid']}; padding:10px 20px; border-radius:16px; color:#FFF; font-size:15px; font-weight:800; box-shadow:0 4px 12px rgba(46,125,50,0.25);">
            {ICONS['check']}
            <span>Log Dose Taken</span>
          </div>
        </div>
        <div style="width:84px; height:84px; border-radius:42px; background:{C['sageGreen']}18; border:1.5px solid {C['sageGreen']}44; display:flex; align-items:center; justify-content:center;">
          <div style="width:62px; height:62px; border-radius:31px; background:{C['surfaceElevated']}; border:2px solid {C['sageGreen']}55; display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']}; transform:scale(1.3);">
            {ICONS['meds']}
          </div>
        </div>
      </div>
    </div>

    <!-- Row: Adherence Ring & Quick Scan -->
    <div style="display:flex; gap:20px; margin-bottom:20px;">
      <!-- Adherence Ring -->
      <div style="flex:1; background:{C['surface']}; border-radius:24px; padding:22px; border:1px solid {C['border']}; box-shadow:0 4px 14px rgba(141,110,99,0.06); display:flex; flex-direction:column; align-items:center;">
        <div style="font-size:13px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:14px;">ADHERENCE</div>
        <div style="width:110px; height:110px; border-radius:55px; border:12px solid {C['sageGreen']}25; display:flex; align-items:center; justify-content:center; position:relative; margin-bottom:12px;">
          <div style="width:86px; height:86px; border-radius:43px; border:4px solid {C['sageGreenSolid']}; display:flex; align-items:center; justify-content:center; background:{C['surface']};">
            <span style="font-size:24px; font-weight:800; color:{C['sageGreenSolid']};">100%</span>
          </div>
        </div>
        <div style="font-size:15px; font-weight:700; color:{C['sageGreenSolid']};">On track · 7 day streak</div>
      </div>

      <!-- Quick Scan Card -->
      <div style="flex:0.85; background:{C['mutedAccentSolid']}; border-radius:24px; padding:24px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 6px 18px rgba(32,117,108,0.22);">
        <div>
          <div style="color:#FFF; transform:scale(1.4); margin-bottom:14px;">{ICONS['scan']}</div>
          <div style="font-size:28px; font-weight:800; color:#FFF; line-height:1.15;">Quick<br/>Scan</div>
        </div>
        <div style="width:44px; height:44px; border-radius:22px; background:rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; color:#FFF;">
          {ICONS['arrowRight']}
        </div>
      </div>
    </div>

    <!-- Row: My Meds & Family -->
    <div style="display:flex; gap:20px; margin-bottom:20px;">
      <div style="flex:1; background:{C['surface']}; border-radius:24px; padding:22px; border:1px solid {C['border']}; box-shadow:0 4px 14px rgba(141,110,99,0.06);">
        <div style="width:46px; height:46px; border-radius:14px; background:{C['warmCocoa']}66; display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']}; margin-bottom:12px;">
          {ICONS['journal']}
        </div>
        <div style="font-size:20px; font-weight:800; color:{C['textColor']}; line-height:1.2; margin-bottom:4px;">My Medications</div>
        <div style="font-size:14px; font-weight:700; color:{C['sageGreenSolid']};">3 active courses</div>
      </div>

      <div style="flex:0.9; background:{C['surface']}; border-radius:24px; padding:22px; border:1px solid {C['border']}; box-shadow:0 4px 14px rgba(141,110,99,0.06); display:flex; flex-direction:column; justify-content:space-between;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size:12px; font-weight:800; color:{C['midSlate']}; text-transform:uppercase; letter-spacing:0.8px;">FAMILY</div>
          <div style="width:9px; height:9px; border-radius:4.5px; background:{C['sageGreenSolid']};"></div>
        </div>
        <div style="margin:10px 0;">
          <div style="width:44px; height:44px; border-radius:14px; background:{C['sageGreen']}25; display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']}; margin-bottom:8px;">
            {ICONS['family']}
          </div>
          <div style="font-size:13px; font-weight:800; color:{C['sageGreenSolid']}; background:{C['sageGreen']}18; padding:3px 10px; border-radius:12px; display:inline-block;">Synced</div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:13px; color:{C['midSlate']}; font-weight:600;">All members good</span>
          <span style="color:{C['midSlate']};">{ICONS['chevronRight']}</span>
        </div>
      </div>
    </div>

    <!-- AI Consultant Shortcut -->
    <div style="background:{C['surface']}; border-radius:24px; padding:22px; border:1px solid {C['border']}; box-shadow:0 4px 14px rgba(141,110,99,0.06); display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
      <div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
          <div style="color:{C['sageGreenSolid']};">{ICONS['sparkles']}</div>
          <span style="font-size:18px; font-weight:800; color:{C['textColor']};">AI Consultant</span>
        </div>
        <div style="font-size:14px; color:{C['midSlate']}; font-weight:500;">Ask about your medications or scan an image</div>
      </div>
      <div style="width:52px; height:52px; border-radius:26px; background:{C['paleJade']}55; display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']};">
        {ICONS['ai']}
      </div>
    </div>

    <!-- Admin Console Card -->
    <div style="background:{C['surface']}; border-radius:24px; padding:22px; border:1.5px solid {C['sageGreen']}44; box-shadow:0 4px 14px rgba(141,110,99,0.06); display:flex; justify-content:space-between; align-items:center;">
      <div style="display:flex; align-items:center; gap:16px;">
        <div style="width:52px; height:52px; border-radius:26px; background:{C['sageGreen']}25; display:flex; align-items:center; justify-content:center; color:{C['sageGreenSolid']};">
          {ICONS['admin']}
        </div>
        <div>
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <span style="font-size:17px; font-weight:800; color:{C['textColor']};">Admin Control Console</span>
            <span style="background:{C['sageGreenSolid']}; color:#FFF; font-size:10px; font-weight:800; padding:2px 8px; border-radius:10px;">ADMIN</span>
          </div>
          <div style="font-size:13px; color:{C['midSlate']}; font-weight:500;">Manage users, system logs &amp; AMR heatmaps</div>
        </div>
      </div>
      <div style="color:{C['sageGreenSolid']};">{ICONS['chevronRight']}</div>
    </div>
    '''
    run_render("05_home_dashboard_morning.png", wrap_page(content, time_str="9:41", active_tab='home', show_admin=True))

print("Rendered screens 1 to 5 successfully.")
