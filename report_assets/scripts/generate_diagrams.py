import os, subprocess, tempfile

out_dir = '/home/subhash/projects/MedSentry/report_assets/diagrams'
os.makedirs(out_dir, exist_ok=True)

# 1. System Architecture Diagram HTML
arch_html = '''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 2400px;
    height: 1350px;
    background: #0B0F19;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #F3F4F6;
    padding: 60px 80px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-bottom: 2px solid #1F2937;
    padding-bottom: 24px;
    margin-bottom: 40px;
  }
  .title-wrap h1 {
    font-size: 48px;
    font-weight: 800;
    color: #FFFFFF;
    letter-spacing: -0.5px;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .title-wrap h1 span {
    color: #52B788;
  }
  .subtitle {
    font-size: 22px;
    color: #9CA3AF;
    margin-top: 8px;
  }
  .badge-tag {
    background: rgba(45, 106, 79, 0.25);
    border: 1.5px solid #2D6A4F;
    color: #52B788;
    padding: 8px 20px;
    border-radius: 30px;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .main-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 36px;
    flex: 1;
  }
  .col-card {
    background: #111827;
    border: 1.5px solid #1F2937;
    border-radius: 24px;
    padding: 36px 30px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    position: relative;
  }
  .col-card.accent-client { border-top: 6px solid #38BDF8; }
  .col-card.accent-edge { border-top: 6px solid #A855F7; }
  .col-card.accent-db { border-top: 6px solid #10B981; }
  .col-card.accent-ai { border-top: 6px solid #F59E0B; }
  
  .card-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 28px;
  }
  .card-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
  }
  .icon-client { background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); }
  .icon-edge { background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); }
  .icon-db { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); }
  .icon-ai { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); }

  .card-title {
    font-size: 26px;
    font-weight: 800;
    color: #F3F4F6;
  }
  .card-sub {
    font-size: 15px;
    color: #9CA3AF;
  }
  .block-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
  }
  .node-box {
    background: #1F2937;
    border: 1px solid #374151;
    border-radius: 16px;
    padding: 20px 22px;
  }
  .node-title {
    font-size: 19px;
    font-weight: 700;
    color: #FFFFFF;
    margin-bottom: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .node-desc {
    font-size: 14.5px;
    color: #9CA3AF;
    line-height: 1.45;
  }
  .pill-tech {
    font-size: 12px;
    padding: 3px 10px;
    border-radius: 12px;
    background: #374151;
    color: #E5E7EB;
    font-weight: 600;
  }
  .footer-bar {
    margin-top: 36px;
    background: #111827;
    border: 1px solid #1F2937;
    border-radius: 20px;
    padding: 22px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
    color: #9CA3AF;
  }
  .flow-indicator {
    display: flex;
    align-items: center;
    gap: 16px;
    color: #E5E7EB;
    font-weight: 600;
  }
  .flow-arrow {
    color: #52B788;
    font-size: 20px;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="title-wrap">
      <h1>MedSentry <span>System Architecture</span></h1>
      <div class="subtitle">Distributed Multi-Tier mHealth & Antimicrobial Resistance (AMR) Surveillance Platform</div>
    </div>
    <div class="badge-tag">Production Verified Architecture</div>
  </div>

  <div class="main-grid">
    <!-- Col 1: Client Layer -->
    <div class="col-card accent-client">
      <div class="card-header">
        <div class="card-icon icon-client">📱</div>
        <div>
          <div class="card-title">Client Application</div>
          <div class="card-sub">React Native & Expo SDK 57</div>
        </div>
      </div>
      <div class="block-list">
        <div class="node-box">
          <div class="node-title">Hybrid OCR Engine <span class="pill-tech">ML Kit</span></div>
          <div class="node-desc">On-device text recognition, 2D spatial coordinate line clustering, and GS1 DataMatrix 2D barcode scanner.</div>
        </div>
        <div class="node-box">
          <div class="node-title">UI Design System <span class="pill-tech">Custom Tokens</span></div>
          <div class="node-desc">Warm Cream & Sage Green WCAG AA accessible theme, Reanimated v3 micro-interactions, Lucide icons.</div>
        </div>
        <div class="node-box">
          <div class="node-title">Local Session Cache <span class="pill-tech">AsyncStorage</span></div>
          <div class="node-desc">Offline adherence cache, push notifications schedule, auto-refresh JWT session token persistence.</div>
        </div>
        <div class="node-box">
          <div class="node-title">Family Circle UI <span class="pill-tech">RBAC Client</span></div>
          <div class="node-desc">Dependent profile management, proxy dose logging with audit notice, shared medicine cabinet inventory.</div>
        </div>
      </div>
    </div>

    <!-- Col 2: Serverless Edge Functions -->
    <div class="col-card accent-edge">
      <div class="card-header">
        <div class="card-icon icon-edge">⚡</div>
        <div>
          <div class="card-title">Serverless Edge Layer</div>
          <div class="card-sub">Deno Runtime / TypeScript</div>
        </div>
      </div>
      <div class="block-list">
        <div class="node-box">
          <div class="node-title">ai-router Function <span class="pill-tech">Multi-Model</span></div>
          <div class="node-desc">Dispatches suitability, symptom_to_care, visual_id, and prescription_ocr requests with latency telemetry.</div>
        </div>
        <div class="node-box">
          <div class="node-title">Allergy Pre-Check <span class="pill-tech">Deterministic</span></div>
          <div class="node-desc">Pre-flight cross-referencing user profiles against drug catalog to inject high-priority warnings before LLM generation.</div>
        </div>
        <div class="node-box">
          <div class="node-title">3-Tier Guardrails <span class="pill-tech">Safety Engine</span></div>
          <div class="node-desc">Deterministic refusal filters blocking pediatric dosage calculations, lethal overdose queries, and severe self-diagnosis.</div>
        </div>
        <div class="node-box">
          <div class="node-title">admin-api Function <span class="pill-tech">Service Role</span></div>
          <div class="node-desc">Privileged GoTrue administration, atomic user deactivation, multi-table teardown, and audit logging.</div>
        </div>
      </div>
    </div>

    <!-- Col 3: AI Provider Layer -->
    <div class="col-card accent-ai">
      <div class="card-header">
        <div class="card-icon icon-ai">🤖</div>
        <div>
          <div class="card-title">AI & LLM Services</div>
          <div class="card-sub">Multi-Provider Orchestration</div>
        </div>
      </div>
      <div class="block-list">
        <div class="node-box">
          <div class="node-title">Google Gemini 1.5 Flash <span class="pill-tech">Multimodal</span></div>
          <div class="node-desc">Multimodal vision OCR for cursive doctor prescriptions, blister packaging visual ID, and clinical schema parsing.</div>
        </div>
        <div class="node-box">
          <div class="node-title">Groq Llama 3.3 70B <span class="pill-tech">Ultra Fast</span></div>
          <div class="node-desc">Sub-second conversational health assistant for routine medication Q&A and drug interaction explanations.</div>
        </div>
        <div class="node-box">
          <div class="node-title">DeepSeek / OpenRouter <span class="pill-tech">Fallback Tier</span></div>
          <div class="node-desc">Secondary redundant provider fallback guaranteeing 99.9% availability during cloud provider outages.</div>
        </div>
        <div class="node-box">
          <div class="node-title">API Usage Tracking <span class="pill-tech">api_usage_logs</span></div>
          <div class="node-desc">Per-request token estimations, latency milliseconds, provider outcomes, and quota tracking stored in PostgreSQL.</div>
        </div>
      </div>
    </div>

    <!-- Col 4: Database & Public Health -->
    <div class="col-card accent-db">
      <div class="card-header">
        <div class="card-icon icon-db">🗄️</div>
        <div>
          <div class="card-title">Database & AMR Engine</div>
          <div class="card-sub">Supabase PostgreSQL 15</div>
        </div>
      </div>
      <div class="block-list">
        <div class="node-box">
          <div class="node-title">pg_trgm Fuzzy Search <span class="pill-tech">GIN Index</span></div>
          <div class="node-desc">PostgreSQL trigram similarity extension & fuzzy_search_drug RPC absorbing OCR typographical errors.</div>
        </div>
        <div class="node-box">
          <div class="node-title">Row-Level Security <span class="pill-tech">100% RLS</span></div>
          <div class="node-desc">check_caregiver_access & check_circle_read_access security definers with caregiver_consent_revoked gate.</div>
        </div>
        <div class="node-box">
          <div class="node-title">Automated Triggers <span class="pill-tech">trg_evaluate</span></div>
          <div class="node-desc">Automatic streak calculation and badge unlocks (user_badges) upon dose logs insertion.</div>
        </div>
        <div class="node-box">
          <div class="node-title">AMR Heatmap RPC <span class="pill-tech">K ≥ 5 Privacy</span></div>
          <div class="node-desc">Differential privacy aggregation (get_amr_heatmap) mapping community antibiotic misuse spikes (2.5x baseline).</div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer-bar">
    <div class="flow-indicator">
      <span>Client (JWT Bearer)</span>
      <span class="flow-arrow">➔</span>
      <span>Edge Function Gateway</span>
      <span class="flow-arrow">➔</span>
      <span>Deterministic Allergy Pre-Check</span>
      <span class="flow-arrow">➔</span>
      <span>Gemini / Groq LLMs</span>
      <span class="flow-arrow">➔</span>
      <span>PostgreSQL 15 Triggers & RLS</span>
    </div>
    <div>MedSentry Platform Architecture · WHO AWaRe Antibiotic Governance</div>
  </div>
</body>
</html>'''

# 2. Application Modules Diagram HTML
modules_html = '''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 2400px;
    height: 1350px;
    background: #0B0F19;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #F3F4F6;
    padding: 60px 80px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-bottom: 2px solid #1F2937;
    padding-bottom: 24px;
    margin-bottom: 40px;
  }
  .title-wrap h1 {
    font-size: 48px;
    font-weight: 800;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .title-wrap h1 span { color: #52B788; }
  .subtitle { font-size: 22px; color: #9CA3AF; margin-top: 8px; }
  .badge-tag {
    background: rgba(82, 183, 136, 0.2);
    border: 1.5px solid #52B788;
    color: #52B788;
    padding: 8px 20px;
    border-radius: 30px;
    font-size: 18px;
    font-weight: 700;
  }
  .grid-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 24px;
    flex: 1;
  }
  .module-card {
    background: #111827;
    border: 1.5px solid #1F2937;
    border-radius: 20px;
    padding: 24px 28px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
  }
  .mod-top {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 12px;
  }
  .mod-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: #1F2937;
    border: 1px solid #374151;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }
  .mod-title {
    font-size: 21px;
    font-weight: 800;
    color: #FFFFFF;
  }
  .mod-desc {
    font-size: 14.5px;
    color: #9CA3AF;
    line-height: 1.45;
    margin-bottom: 14px;
  }
  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .tag-item {
    font-size: 12px;
    font-weight: 600;
    background: #1F2937;
    color: #D1D5DB;
    padding: 4px 10px;
    border-radius: 8px;
    border: 1px solid #374151;
  }
  .tag-item.primary {
    background: rgba(45, 106, 79, 0.25);
    border-color: #2D6A4F;
    color: #52B788;
  }
  .footer-bar {
    margin-top: 30px;
    padding: 16px 30px;
    background: #111827;
    border: 1px solid #1F2937;
    border-radius: 16px;
    display: flex;
    justify-content: space-between;
    font-size: 15px;
    color: #9CA3AF;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="title-wrap">
      <h1>MedSentry <span>Application Modules</span></h1>
      <div class="subtitle">Complete Decomposition of Functional Capabilities & Medical Management Subsystems</div>
    </div>
    <div class="badge-tag">9 Integrated Modules</div>
  </div>

  <div class="grid-container">
    <!-- M1 -->
    <div class="module-card">
      <div>
        <div class="mod-top">
          <div class="mod-icon">🔐</div>
          <div class="mod-title">1. Authentication & Onboarding</div>
        </div>
        <div class="mod-desc">Secured GoTrue email/password & Google OAuth authentication, verification emails via Resend API, and clinical profile onboarding.</div>
      </div>
      <div class="tag-list">
        <span class="tag-item primary">Supabase GoTrue</span>
        <span class="tag-item">Resend Email API</span>
        <span class="tag-item">Auto-Refresh JWT</span>
      </div>
    </div>

    <!-- M2 -->
    <div class="module-card">
      <div>
        <div class="mod-top">
          <div class="mod-icon">📷</div>
          <div class="mod-title">2. Smart OCR & Barcode Scanner</div>
        </div>
        <div class="mod-desc">Hybrid 2-Tier OCR combining on-device Google ML Kit with Gemini 1.5 Flash Vision. 2D spatial clustering & GS1 DataMatrix 2D parser.</div>
      </div>
      <div class="tag-list">
        <span class="tag-item primary">Google ML Kit</span>
        <span class="tag-item primary">Gemini Vision</span>
        <span class="tag-item">Spatial Layout Clustering</span>
      </div>
    </div>

    <!-- M3 -->
    <div class="module-card">
      <div>
        <div class="mod-top">
          <div class="mod-icon">💊</div>
          <div class="mod-title">3. Medication Tracker & Catalog</div>
        </div>
        <div class="mod-desc">Active prescription tracking with dose schedules, remaining pill calculations, low-stock warnings, and 752-drug reference database.</div>
      </div>
      <div class="tag-list">
        <span class="tag-item primary">WHO AWaRe Tiers</span>
        <span class="tag-item">752 Catalog Drugs</span>
        <span class="tag-item">Low-Stock Warnings</span>
      </div>
    </div>

    <!-- M4 -->
    <div class="module-card">
      <div>
        <div class="mod-top">
          <div class="mod-icon">🎯</div>
          <div class="mod-title">4. Adherence Engine & Badges</div>
        </div>
        <div class="mod-desc">Interactive dose logging (taken, skipped, snoozed), adherence ring calculations, and PostgreSQL automated triggers for streak badges.</div>
      </div>
      <div class="tag-list">
        <span class="tag-item primary">Database Triggers</span>
        <span class="tag-item">Streak Gamification</span>
        <span class="tag-item">100% Adherence Ring</span>
      </div>
    </div>

    <!-- M5 -->
    <div class="module-card">
      <div>
        <div class="mod-top">
          <div class="mod-icon">🤖</div>
          <div class="mod-title">5. AI Health Consultant & Chatbot</div>
        </div>
        <div class="mod-desc">Multi-model AI router providing suitability checks, visual pill ID, and conversational guidance with deterministic allergy pre-checks.</div>
      </div>
      <div class="tag-list">
        <span class="tag-item primary">Groq Llama 3.3</span>
        <span class="tag-item">Allergy Pre-Check</span>
        <span class="tag-item">3-Tier Guardrails</span>
      </div>
    </div>

    <!-- M6 -->
    <div class="module-card">
      <div>
        <div class="mod-top">
          <div class="mod-icon">👨‍👩‍👧‍👦</div>
          <div class="mod-title">6. Family Circles & Caregivers</div>
        </div>
        <div class="mod-desc">Multi-role circles (Owner, Caregiver, Viewer) via 6-character invite codes, dependent profiles, proxy dose logging, and audit trail logging.</div>
      </div>
      <div class="tag-list">
        <span class="tag-item primary">RBAC Security</span>
        <span class="tag-item">Proxy Dose Logging</span>
        <span class="tag-item">Self-Sovereignty</span>
      </div>
    </div>

    <!-- M7 -->
    <div class="module-card">
      <div>
        <div class="mod-top">
          <div class="mod-icon">🩺</div>
          <div class="mod-title">7. Medicine Cabinet Inventory</div>
        </div>
        <div class="mod-desc">Household shared OTC inventory tracker with quantity management, batch tracking, and automated 30-day near-expiry alerts.</div>
      </div>
      <div class="tag-list">
        <span class="tag-item primary">Shared Inventory</span>
        <span class="tag-item">Expiry Warnings</span>
        <span class="tag-item">Batch Number Logs</span>
      </div>
    </div>

    <!-- M8 -->
    <div class="module-card">
      <div>
        <div class="mod-top">
          <div class="mod-icon">📔</div>
          <div class="mod-title">8. Symptom Journal & Correlation</div>
        </div>
        <div class="mod-desc">Longitudinal symptom journal with 1–10 severity ratings, body system tags, onset duration, and direct active medication linkage.</div>
      </div>
      <div class="tag-list">
        <span class="tag-item primary">1–10 Severity</span>
        <span class="tag-item">Drug-Side Effect Link</span>
        <span class="tag-item">Body System Tags</span>
      </div>
    </div>

    <!-- M9 -->
    <div class="module-card">
      <div>
        <div class="mod-top">
          <div class="mod-icon">📊</div>
          <div class="mod-title">9. Admin Portal & AMR Heatmap</div>
        </div>
        <div class="mod-desc">Executive administration portal, atomic user deactivation, audit viewer, and regional AMR misuse telemetry with K ≥ 5 privacy.</div>
      </div>
      <div class="tag-list">
        <span class="tag-item primary">K ≥ 5 Privacy</span>
        <span class="tag-item">AMR Misuse Spikes</span>
        <span class="tag-item">Audit Trail Viewer</span>
      </div>
    </div>
  </div>

  <div class="footer-bar">
    <div>MedSentry Architectural Blueprint · Functional Decomposition</div>
    <div>Compliance: WHO AWaRe Guidelines · Differential Privacy Guarantees</div>
  </div>
</body>
</html>'''

# 3. OCR & AI Clinical Workflow Diagram HTML
workflow_html = '''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 2400px;
    height: 1350px;
    background: #0B0F19;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #F3F4F6;
    padding: 60px 80px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-bottom: 2px solid #1F2937;
    padding-bottom: 24px;
    margin-bottom: 40px;
  }
  .title-wrap h1 {
    font-size: 48px;
    font-weight: 800;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .title-wrap h1 span { color: #52B788; }
  .subtitle { font-size: 22px; color: #9CA3AF; margin-top: 8px; }
  .badge-tag {
    background: rgba(82, 183, 136, 0.2);
    border: 1.5px solid #52B788;
    color: #52B788;
    padding: 8px 20px;
    border-radius: 30px;
    font-size: 18px;
    font-weight: 700;
  }
  .pipeline-container {
    display: flex;
    align-items: stretch;
    gap: 24px;
    flex: 1;
  }
  .step-card {
    flex: 1;
    background: #111827;
    border: 1.5px solid #1F2937;
    border-radius: 20px;
    padding: 30px 24px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4);
    position: relative;
  }
  .step-num {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #2D6A4F;
    color: #FFFFFF;
    font-size: 20px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
  }
  .step-title {
    font-size: 23px;
    font-weight: 800;
    color: #FFFFFF;
    margin-bottom: 12px;
  }
  .step-desc {
    font-size: 14.5px;
    color: #9CA3AF;
    line-height: 1.5;
    margin-bottom: 20px;
  }
  .detail-box {
    background: #1F2937;
    border: 1px solid #374151;
    border-radius: 14px;
    padding: 16px 18px;
    margin-bottom: 12px;
  }
  .detail-label {
    font-size: 12px;
    font-weight: 700;
    color: #52B788;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  .detail-val {
    font-size: 13.5px;
    color: #E5E7EB;
    font-weight: 500;
  }
  .arrow-sep {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #52B788;
    font-size: 32px;
  }
  .footer-bar {
    margin-top: 36px;
    padding: 18px 36px;
    background: #111827;
    border: 1px solid #1F2937;
    border-radius: 16px;
    display: flex;
    justify-content: space-between;
    font-size: 15px;
    color: #9CA3AF;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="title-wrap">
      <h1>MedSentry <span>OCR & Clinical Decision Pipeline</span></h1>
      <div class="subtitle">End-to-End Processing Flow from Camera Stream to Verified Database Adherence Tracking</div>
    </div>
    <div class="badge-tag">Hybrid 2-Tier Vision Pipeline</div>
  </div>

  <div class="pipeline-container">
    <!-- Step 1 -->
    <div class="step-card">
      <div>
        <div class="step-num">1</div>
        <div class="step-title">Hardware Capture & Barcode Parsing</div>
        <div class="step-desc">High-speed camera sensor stream identifies prescription documents, blister packs, and GS1 DataMatrix barcodes.</div>
        <div class="detail-box">
          <div class="detail-label">2D Barcode Auto-Scan</div>
          <div class="detail-val">Decodes GTIN (01), Expiry YYMMDD (17), and Batch Number (10) automatically.</div>
        </div>
      </div>
      <div class="detail-box" style="margin-bottom: 0;">
        <div class="detail-label">Primary Technology</div>
        <div class="detail-val">expo-camera & react-native-mlkit-ocr</div>
      </div>
    </div>

    <div class="arrow-sep">➔</div>

    <!-- Step 2 -->
    <div class="step-card">
      <div>
        <div class="step-num">2</div>
        <div class="step-title">2D Spatial Layout Reconstruction</div>
        <div class="step-desc">Extracts bounding coordinates and clusters text lines sharing vertical bands (Δy ≤ 65% line height).</div>
        <div class="detail-box">
          <div class="detail-label">Physical Row Clustering</div>
          <div class="detail-val">Prevents multi-column table cells from splitting across disconnected text blocks.</div>
        </div>
      </div>
      <div class="detail-box" style="margin-bottom: 0;">
        <div class="detail-label">Spatial Heuristics</div>
        <div class="detail-val">X-Coordinate sorting & multi-line grouping</div>
      </div>
    </div>

    <div class="arrow-sep">➔</div>

    <!-- Step 3 -->
    <div class="step-card">
      <div>
        <div class="step-num">3</div>
        <div class="step-title">AI Vision Routing & Multimodal OCR</div>
        <div class="step-desc">Determines image complexity: Routes cursive handwritten prescriptions to Gemini 1.5 Flash Vision.</div>
        <div class="detail-box">
          <div class="detail-label">Multimodal Extraction</div>
          <div class="detail-val">Extracts structured JSON: Doctor reg, patient demographics, clinical doses, frequencies.</div>
        </div>
      </div>
      <div class="detail-box" style="margin-bottom: 0;">
        <div class="detail-label">Serverless Edge Function</div>
        <div class="detail-val">ai-router with deterministic safety filters</div>
      </div>
    </div>

    <div class="arrow-sep">➔</div>

    <!-- Step 4 -->
    <div class="step-card">
      <div>
        <div class="step-num">4</div>
        <div class="step-title">Trigram GIN & Levenshtein Matching</div>
        <div class="step-desc">Matches noisy OCR text against the 752-drug reference database to absorb spelling errors and optical glitches.</div>
        <div class="detail-box">
          <div class="detail-label">Database Fuzzy RPC</div>
          <div class="detail-val">fuzzy_search_drug (pg_trgm GIN) + Client-side Levenshtein (≥ 70% match threshold).</div>
        </div>
      </div>
      <div class="detail-box" style="margin-bottom: 0;">
        <div class="detail-label">Classification</div>
        <div class="detail-val">WHO AWaRe tier badge & interaction lookup</div>
      </div>
    </div>

    <div class="arrow-sep">➔</div>

    <!-- Step 5 -->
    <div class="step-card">
      <div>
        <div class="step-num">5</div>
        <div class="step-title">Clinical Verification & Adherence Commit</div>
        <div class="step-desc">Presents extracted courses in an interactive review screen before atomic commit to Supabase PostgreSQL.</div>
        <div class="detail-box">
          <div class="detail-label">Interactive UI</div>
          <div class="detail-val">VerifyPrescriptionScreen allows instant editing, dose adjustment, and dependent mapping.</div>
        </div>
      </div>
      <div class="detail-box" style="margin-bottom: 0;">
        <div class="detail-label">Database Commit</div>
        <div class="detail-val">medication_courses & local Push Notifications</div>
      </div>
    </div>
  </div>

  <div class="footer-bar">
    <div>MedSentry OCR & AI Clinical Pipeline Flowchart</div>
    <div>Zero-Mistake Clinical Verification Protocol · 100% Data Integrity Guardrails</div>
  </div>
</body>
</html>'''

# 4. Database ER & Security Model Diagram HTML
er_html = '''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 2400px;
    height: 1350px;
    background: #0B0F19;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #F3F4F6;
    padding: 60px 80px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-bottom: 2px solid #1F2937;
    padding-bottom: 24px;
    margin-bottom: 40px;
  }
  .title-wrap h1 {
    font-size: 48px;
    font-weight: 800;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .title-wrap h1 span { color: #52B788; }
  .subtitle { font-size: 22px; color: #9CA3AF; margin-top: 8px; }
  .badge-tag {
    background: rgba(82, 183, 136, 0.2);
    border: 1.5px solid #52B788;
    color: #52B788;
    padding: 8px 20px;
    border-radius: 30px;
    font-size: 18px;
    font-weight: 700;
  }
  .schema-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 28px;
    flex: 1;
  }
  .table-card {
    background: #111827;
    border: 1.5px solid #1F2937;
    border-radius: 18px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
  }
  .table-header {
    background: #1F2937;
    padding: 14px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #374151;
  }
  .table-name {
    font-family: 'JetBrains Mono', monospace;
    font-size: 17px;
    font-weight: 700;
    color: #F3F4F6;
  }
  .rls-badge {
    font-size: 10.5px;
    font-weight: 800;
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid #10B981;
    color: #34D399;
    padding: 2px 8px;
    border-radius: 12px;
  }
  .column-list {
    padding: 14px 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
  }
  .col-row {
    display: flex;
    justify-content: space-between;
    color: #D1D5DB;
  }
  .col-pk { color: #F59E0B; font-weight: 700; }
  .col-fk { color: #38BDF8; font-weight: 600; }
  .col-type { color: #6B7280; font-size: 11.5px; }
  .footer-bar {
    margin-top: 30px;
    padding: 16px 36px;
    background: #111827;
    border: 1px solid #1F2937;
    border-radius: 16px;
    display: flex;
    justify-content: space-between;
    font-size: 15px;
    color: #9CA3AF;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="title-wrap">
      <h1>MedSentry <span>Database Schema & Security Model</span></h1>
      <div class="subtitle">PostgreSQL 15 Relational Structure, Row-Level Security (RLS) & Differential Privacy Views</div>
    </div>
    <div class="badge-tag">100% RLS Enforcement</div>
  </div>

  <div class="schema-grid">
    <!-- T1 -->
    <div class="table-card">
      <div class="table-header">
        <span class="table-name">profiles</span>
        <span class="rls-badge">RLS ENABLED</span>
      </div>
      <div class="column-list">
        <div class="col-row"><span class="col-pk">🔑 id (UUID)</span><span class="col-type">auth.users FK</span></div>
        <div class="col-row"><span>full_name</span><span class="col-type">TEXT</span></div>
        <div class="col-row"><span>age, weight_kg, height</span><span class="col-type">NUMERIC</span></div>
        <div class="col-row"><span>known_conditions</span><span class="col-type">TEXT[]</span></div>
        <div class="col-row"><span>allergies</span><span class="col-type">TEXT[]</span></div>
        <div class="col-row"><span style="color:#EF4444;">caregiver_consent_revoked</span><span class="col-type">BOOLEAN</span></div>
        <div class="col-row"><span>region, is_admin</span><span class="col-type">TEXT / BOOL</span></div>
      </div>
    </div>

    <!-- T2 -->
    <div class="table-card">
      <div class="table-header">
        <span class="table-name">medication_courses</span>
        <span class="rls-badge">RLS ENABLED</span>
      </div>
      <div class="column-list">
        <div class="col-row"><span class="col-pk">🔑 id (UUID)</span><span class="col-type">PRIMARY KEY</span></div>
        <div class="col-row"><span class="col-fk">user_id (UUID)</span><span class="col-type">profiles FK</span></div>
        <div class="col-row"><span class="col-fk">drug_id (UUID)</span><span class="col-type">drugs FK</span></div>
        <div class="col-row"><span>custom_name</span><span class="col-type">TEXT</span></div>
        <div class="col-row"><span>dosage_amount, frequency</span><span class="col-type">TEXT / TEXT[]</span></div>
        <div class="col-row"><span>days_remaining</span><span class="col-type">INTEGER</span></div>
        <div class="col-row"><span>necessity_flag, status</span><span class="col-type">ENUM</span></div>
      </div>
    </div>

    <!-- T3 -->
    <div class="table-card">
      <div class="table-header">
        <span class="table-name">dose_logs</span>
        <span class="rls-badge">RLS ENABLED</span>
      </div>
      <div class="column-list">
        <div class="col-row"><span class="col-pk">🔑 id (UUID)</span><span class="col-type">PRIMARY KEY</span></div>
        <div class="col-row"><span class="col-fk">course_id (UUID)</span><span class="col-type">courses FK</span></div>
        <div class="col-row"><span>taken_at</span><span class="col-type">TIMESTAMPTZ</span></div>
        <div class="col-row"><span>status ('taken'|'missed')</span><span class="col-type">TEXT</span></div>
        <div class="col-row" style="color:#52B788;"><span>⚡ trg_evaluate_badges</span><span class="col-type">TRIGGER</span></div>
        <div class="col-row" style="color:#52B788;"><span>⚡ trg_track_misuse</span><span class="col-type">TRIGGER</span></div>
      </div>
    </div>

    <!-- T4 -->
    <div class="table-card">
      <div class="table-header">
        <span class="table-name">drugs (Catalog)</span>
        <span class="rls-badge">READ ONLY</span>
      </div>
      <div class="column-list">
        <div class="col-row"><span class="col-pk">🔑 id (UUID)</span><span class="col-type">PRIMARY KEY</span></div>
        <div class="col-row"><span>name</span><span class="col-type">TEXT (GIN TRGM)</span></div>
        <div class="col-row"><span>category</span><span class="col-type">TEXT</span></div>
        <div class="col-row"><span style="color:#52B788;">aware_class</span><span class="col-type">WHO ENUM</span></div>
        <div class="col-row"><span>common_uses</span><span class="col-type">TEXT</span></div>
        <div class="col-row"><span>side_effects</span><span class="col-type">TEXT</span></div>
        <div class="col-row"><span>interaction_notes</span><span class="col-type">TEXT</span></div>
      </div>
    </div>

    <!-- T5 -->
    <div class="table-card">
      <div class="table-header">
        <span class="table-name">family_groups</span>
        <span class="rls-badge">RLS ENABLED</span>
      </div>
      <div class="column-list">
        <div class="col-row"><span class="col-pk">🔑 id (UUID)</span><span class="col-type">PRIMARY KEY</span></div>
        <div class="col-row"><span class="col-fk">owner_id (UUID)</span><span class="col-type">profiles FK</span></div>
        <div class="col-row"><span>name</span><span class="col-type">TEXT</span></div>
        <div class="col-row"><span style="color:#F59E0B;">invite_code (6-char)</span><span class="col-type">TEXT UNIQUE</span></div>
        <div class="col-row"><span>created_at</span><span class="col-type">TIMESTAMPTZ</span></div>
      </div>
    </div>

    <!-- T6 -->
    <div class="table-card">
      <div class="table-header">
        <span class="table-name">family_members</span>
        <span class="rls-badge">RLS ENABLED</span>
      </div>
      <div class="column-list">
        <div class="col-row"><span class="col-pk">🔑 id (UUID)</span><span class="col-type">PRIMARY KEY</span></div>
        <div class="col-row"><span class="col-fk">group_id (UUID)</span><span class="col-type">groups FK</span></div>
        <div class="col-row"><span class="col-fk">member_id (UUID)</span><span class="col-type">profiles FK</span></div>
        <div class="col-row"><span style="color:#38BDF8;">role ('owner'|'caregiver'|'viewer')</span><span class="col-type">TEXT</span></div>
        <div class="col-row"><span>is_linked_dependent</span><span class="col-type">BOOLEAN</span></div>
      </div>
    </div>

    <!-- T7 -->
    <div class="table-card">
      <div class="table-header">
        <span class="table-name">caregiver_audit_log</span>
        <span class="rls-badge">APPEND ONLY</span>
      </div>
      <div class="column-list">
        <div class="col-row"><span class="col-pk">🔑 id (UUID)</span><span class="col-type">PRIMARY KEY</span></div>
        <div class="col-row"><span class="col-fk">caregiver_id (UUID)</span><span class="col-type">profiles FK</span></div>
        <div class="col-row"><span class="col-fk">target_member_id</span><span class="col-type">profiles FK</span></div>
        <div class="col-row"><span>action</span><span class="col-type">TEXT</span></div>
        <div class="col-row"><span>details (payload)</span><span class="col-type">JSONB</span></div>
        <div class="col-row"><span>created_at</span><span class="col-type">TIMESTAMPTZ</span></div>
      </div>
    </div>

    <!-- T8 -->
    <div class="table-card">
      <div class="table-header">
        <span class="table-name">misuse_events</span>
        <span class="rls-badge">K ≥ 5 SECURED</span>
      </div>
      <div class="column-list">
        <div class="col-row"><span class="col-pk">🔑 id (UUID)</span><span class="col-type">PRIMARY KEY</span></div>
        <div class="col-row"><span>region (De-identified)</span><span class="col-type">TEXT</span></div>
        <div class="col-row"><span>drug_category</span><span class="col-type">TEXT</span></div>
        <div class="col-row"><span>event_type</span><span class="col-type">TEXT</span></div>
        <div class="col-row"><span style="color:#34D399;">get_amr_heatmap()</span><span class="col-type">RPC VIEW (K ≥ 5)</span></div>
      </div>
    </div>
  </div>

  <div class="footer-bar">
    <div>Supabase Cloud PostgreSQL 15 · Row Level Security (RLS) Policy Architecture</div>
    <div>Zero Cross-User Data Leakage · Self-Sovereignty Sovereign Privacy Guard</div>
  </div>
</body>
</html>'''

diagrams = [
    ('01_system_architecture_diagram.png', arch_html),
    ('02_application_modules_diagram.png', modules_html),
    ('03_ocr_ai_workflow_pipeline.png', workflow_html),
    ('04_database_er_security_model.png', er_html),
]

for filename, html_code in diagrams:
    with tempfile.NamedTemporaryFile('w', suffix='.html', delete=False) as f:
        f.write(html_code)
        tmp_path = f.name
    
    out_file = os.path.join(out_dir, filename)
    cmd = [
        '/usr/bin/brave',
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--window-size=2400,1350',
        f'--screenshot={out_file}',
        f'file://{tmp_path}'
    ]
    subprocess.run(cmd, check=True)
    print(f'Generated diagram: {filename} (2400x1350) successfully!')

print('🎉 All 4 architectural and module diagrams generated successfully!')
