import os, subprocess, tempfile

out_dir = '/home/subhash/projects/MedSentry/report_assets/diagrams'
os.makedirs(out_dir, exist_ok=True)

# -----------------------------------------------------------------------------
# 1. SYSTEM ARCHITECTURE DIAGRAM (2400x1350) - ULTRA DENSE, ZERO VOID
# -----------------------------------------------------------------------------
arch_html = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>MedSentry Multi-Tier System Architecture</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 2400px;
    height: 1350px;
    background: #080D1A;
    font-family: 'Google Sans Flex', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #F1F5F9;
    padding: 30px 44px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #1E293B;
    padding-bottom: 14px;
    margin-bottom: 14px;
  }
  .title-group {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .brand-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: linear-gradient(135deg, #10B981, #059669);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
  }
  .title-group h1 {
    font-size: 33px;
    font-weight: 800;
    color: #FFFFFF;
    letter-spacing: -0.5px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .title-group h1 span { color: #10B981; font-weight: 700; }
  .subtitle { font-size: 14px; color: #94A3B8; margin-top: 2px; font-weight: 500; }
  .header-badges { display: flex; align-items: center; gap: 10px; }
  .badge {
    padding: 6px 14px;
    border-radius: 30px;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .badge-emerald { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34D399; }
  .badge-cyan { background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.4); color: #22D3EE; }
  .badge-purple { background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.4); color: #A78BFA; }

  /* Main Architectural Canvas */
  .arch-canvas {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
  }

  /* Tier Row */
  .tier-row {
    background: #0E1626;
    border: 1.5px solid #1E293B;
    border-radius: 15px;
    padding: 14px 18px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  }
  .tier-row.tier-client { border-left: 6px solid #38BDF8; flex: 1.15; }
  .tier-row.tier-edge { border-left: 6px solid #8B5CF6; flex: 1; }
  .tier-row.tier-ai { border-left: 6px solid #F59E0B; }
  .tier-row.tier-db { border-left: 6px solid #10B981; }

  .tier-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .tier-title-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .tier-tag {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    padding: 3px 8px;
    border-radius: 5px;
  }
  .tag-client { background: rgba(56, 189, 248, 0.2); color: #38BDF8; }
  .tag-edge { background: rgba(139, 92, 246, 0.2); color: #A78BFA; }
  .tag-ai { background: rgba(245, 158, 11, 0.2); color: #FBBF24; }
  .tag-backend { background: rgba(16, 185, 129, 0.2); color: #34D399; }

  .tier-name { font-size: 16px; font-weight: 800; color: #FFFFFF; }
  .tier-tech { font-size: 12px; color: #94A3B8; }

  /* Connector Strip between Tiers */
  .connector-strip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 18px;
    padding: 1px 0;
  }
  .connector-line {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 10.5px;
    font-weight: 700;
    padding: 3px 12px;
    border-radius: 16px;
    background: #111C30;
    border: 1px solid #1E293B;
  }
  .con-http { color: #38BDF8; border-color: rgba(56, 189, 248, 0.3); }
  .con-wss { color: #34D399; border-color: rgba(16, 185, 129, 0.3); }
  .con-jwt { color: #F59E0B; border-color: rgba(245, 158, 11, 0.3); }
  .con-arrow { color: #94A3B8; font-size: 11px; }

  /* Components Grid */
  .components-grid { display: grid; gap: 12px; flex: 1; }
  .grid-3 { grid-template-columns: repeat(3, 1fr); }
  .grid-4 { grid-template-columns: repeat(4, 1fr); }

  .comp-box {
    background: #131F35;
    border: 1px solid #24324D;
    border-radius: 12px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex: 1;
  }
  .comp-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }
  .comp-title {
    font-size: 13.5px;
    font-weight: 800;
    color: #F8FAFC;
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .comp-badge {
    font-size: 9px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    background: #1E293B;
    color: #CBD5E1;
  }
  .comp-desc {
    font-size: 10.5px;
    color: #94A3B8;
    line-height: 1.4;
    margin-bottom: 6px;
  }
  .comp-bullets {
    display: flex;
    flex-direction: column;
    gap: 3.5px;
    margin-bottom: 8px;
    font-size: 10px;
    color: #CBD5E1;
  }
  .comp-bullets div { display: flex; align-items: center; gap: 6px; }
  .comp-bullets span.dot { width: 4.5px; height: 4.5px; border-radius: 50%; background: #38BDF8; }

  .comp-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .pill {
    font-size: 8.5px;
    font-weight: 600;
    padding: 2px 5px;
    border-radius: 4px;
    background: #1A2740;
    color: #E2E8F0;
    border: 1px solid #2B3D5F;
  }
  .pill-green { background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.35); color: #34D399; }
  .pill-blue { background: rgba(56, 189, 248, 0.15); border-color: rgba(56, 189, 248, 0.35); color: #38BDF8; }
  .pill-purple { background: rgba(139, 92, 246, 0.15); border-color: rgba(139, 92, 246, 0.35); color: #A78BFA; }
  .pill-amber { background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.35); color: #FBBF24; }
  .pill-rose { background: rgba(244, 63, 94, 0.15); border-color: rgba(244, 63, 94, 0.35); color: #FB7185; }

  /* Bottom Split (AI & DB) */
  .bottom-split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    flex: 1.45;
  }

  /* Footer */
  .footer {
    border-top: 2px solid #1E293B;
    padding-top: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: #64748B;
  }
  .footer-left {
    display: flex;
    align-items: center;
    gap: 14px;
    color: #94A3B8;
    font-weight: 600;
  }
  .footer-dot { width: 6px; height: 6px; border-radius: 50%; background: #10B981; }
</style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="title-group">
      <div class="brand-icon">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M12 8v8"/><path d="M8 12h8"/>
        </svg>
      </div>
      <div>
        <h1>MedSentry <span>Multi-Tier System Architecture</span></h1>
        <div class="subtitle">Distributed Edge-to-Cloud Healthcare Infrastructure · Mobile Vision, AI Guardrails & AMR Surveillance</div>
      </div>
    </div>
    <div class="header-badges">
      <div class="badge badge-emerald">
        <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#10B981;"></span>
        Production Verified (Expo SDK 52)
      </div>
      <div class="badge badge-cyan">Supabase Postgres 15</div>
      <div class="badge badge-purple">WHO AWaRe Compliant</div>
    </div>
  </div>

  <!-- Main Canvas -->
  <div class="arch-canvas">

    <!-- TIER 1: CLIENT PRESENTATION & MOBILE EDGE -->
    <div class="tier-row tier-client">
      <div class="tier-header">
        <div class="tier-title-wrap">
          <span class="tier-tag tag-client">Tier 1 · Mobile Client Layer</span>
          <span class="tier-name">React Native / Expo Mobile Application</span>
          <span class="tier-tech">(TypeScript, Android Native Engine, iOS Core)</span>
        </div>
        <div style="font-size:11px; color:#38BDF8; font-weight:700;">On-Device Execution & Hardware Sensors</div>
      </div>
      <div class="components-grid grid-4">
        <!-- 1.1 -->
        <div class="comp-box">
          <div class="comp-top">
            <span class="comp-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              Mobile UI & Navigation
            </span>
            <span class="comp-badge">Presentation</span>
          </div>
          <div class="comp-desc">Warm Cream & Sage Green WCAG AA design system with Reanimated v3 animations.</div>
          <div class="comp-bullets">
            <div><span class="dot"></span> Adherence Streak Ring (SVG Animation)</div>
            <div><span class="dot"></span> Medical ID Pass & ABHA Credential</div>
            <div><span class="dot"></span> Admin Telemetry & Heatmap Dashboard</div>
          </div>
          <div class="comp-pills">
            <span class="pill pill-blue">Home Dashboard</span>
            <span class="pill pill-blue">Medical ID</span>
            <span class="pill pill-blue">Admin Hub</span>
          </div>
        </div>
        <!-- 1.2 -->
        <div class="comp-box">
          <div class="comp-top">
            <span class="comp-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              Edge Vision & Sensors
            </span>
            <span class="comp-badge">Hardware</span>
          </div>
          <div class="comp-desc">Hardware camera sensor stream, 2D barcode scanner, and spatial clustering engine.</div>
          <div class="comp-bullets">
            <div><span class="dot"></span> Google ML Kit On-Device Text Engine</div>
            <div><span class="dot"></span> GS1 DataMatrix 2D Barcode Parser</div>
            <div><span class="dot"></span> 2D Line Clustering (&Delta;y &le; 0.65 line height)</div>
          </div>
          <div class="comp-pills">
            <span class="pill pill-green">ML Kit OCR</span>
            <span class="pill pill-green">GS1 Parser</span>
            <span class="pill pill-blue">Spatial Grouping</span>
          </div>
        </div>
        <!-- 1.3 -->
        <div class="comp-box">
          <div class="comp-top">
            <span class="comp-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              Family Circle Client
            </span>
            <span class="comp-badge">RBAC Client</span>
          </div>
          <div class="comp-desc">Caregiver proxy dose logging, dependent management, and consent control.</div>
          <div class="comp-bullets">
            <div><span class="dot"></span> 3 Permission Tiers (Owner, Caregiver, Viewer)</div>
            <div><span class="dot"></span> Sovereign Consent Revocation Switch</div>
            <div><span class="dot"></span> Shared OTC Medicine Cabinet Inventory</div>
          </div>
          <div class="comp-pills">
            <span class="pill pill-purple">Proxy Logging</span>
            <span class="pill pill-purple">Self-Sovereignty</span>
            <span class="pill pill-purple">Shared Cabinet</span>
          </div>
        </div>
        <!-- 1.4 -->
        <div class="comp-box">
          <div class="comp-top">
            <span class="comp-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              State & Scheduler
            </span>
            <span class="comp-badge">Offline Engine</span>
          </div>
          <div class="comp-desc">Zustand global stores, offline adherence queue, and local notification scheduler.</div>
          <div class="comp-bullets">
            <div><span class="dot"></span> AsyncStorage Offline Adherence Queue</div>
            <div><span class="dot"></span> Expo Background Push Escalation Nudges</div>
            <div><span class="dot"></span> Biometric KeyStore Session Tokens</div>
          </div>
          <div class="comp-pills">
            <span class="pill pill-amber">AsyncStorage</span>
            <span class="pill pill-amber">Expo Notifications</span>
            <span class="pill pill-amber">Zustand Store</span>
          </div>
        </div>
      </div>
    </div>

    <!-- CONNECTOR HIGHWAY 1 -->
    <div class="connector-strip">
      <div class="connector-line con-http">
        <span>HTTPS / REST 2.0 (TLS 1.3)</span>
        <span class="con-arrow">▼</span>
      </div>
      <div class="connector-line con-jwt">
        <span>GoTrue JWT Authorization Bearer</span>
        <span class="con-arrow">▼</span>
      </div>
      <div class="connector-line con-wss">
        <span>Supabase Realtime WebSockets (WSS)</span>
        <span class="con-arrow">▲▼</span>
      </div>
    </div>

    <!-- TIER 2: SERVERLESS EDGE GATEWAY -->
    <div class="tier-row tier-edge">
      <div class="tier-header">
        <div class="tier-title-wrap">
          <span class="tier-tag tag-edge">Tier 2 · Serverless Gateway</span>
          <span class="tier-name">Supabase Deno Edge Functions & Security Perimeter</span>
          <span class="tier-tech">(TypeScript, Distributed Edge PoPs, Zero Client Key Leakage)</span>
        </div>
        <div style="font-size:11px; color:#A78BFA; font-weight:700;">Sub-120ms Edge Routing & Policy Validation</div>
      </div>
      <div class="components-grid grid-3">
        <!-- 2.1 -->
        <div class="comp-box">
          <div class="comp-top">
            <span class="comp-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              ai-router Edge Gateway
            </span>
            <span class="comp-badge">Dispatch Engine</span>
          </div>
          <div class="comp-desc">Dispatches suitability, symptom_to_care, visual_id, and prescription_ocr requests.</div>
          <div class="comp-bullets">
            <div><span class="dot" style="background:#A78BFA;"></span> Dynamic Multi-Model Provider Fallback</div>
            <div><span class="dot" style="background:#A78BFA;"></span> Real-Time Latency & Token Usage Logger</div>
            <div><span class="dot" style="background:#A78BFA;"></span> Circuit Breaker & Exponential Backoff</div>
          </div>
          <div class="comp-pills">
            <span class="pill pill-purple">Multi-Model Routing</span>
            <span class="pill pill-purple">Latency Telemetry</span>
            <span class="pill pill-purple">Token Tracking</span>
          </div>
        </div>
        <!-- 2.2 -->
        <div class="comp-box">
          <div class="comp-top">
            <span class="comp-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Deterministic Allergy & Safety
            </span>
            <span class="comp-badge">Safety Guardrail</span>
          </div>
          <div class="comp-desc">Pre-flight cross-references patient profile allergies before LLM execution.</div>
          <div class="comp-bullets">
            <div><span class="dot" style="background:#FB7185;"></span> Deterministic Penicillin & Sulfa Cross-Check</div>
            <div><span class="dot" style="background:#FB7185;"></span> Overdose & Lethal Query Refusal Gates</div>
            <div><span class="dot" style="background:#FB7185;"></span> Pediatric Weight-Based Dosage Locks</div>
          </div>
          <div class="comp-pills">
            <span class="pill pill-rose">Allergy Pre-Check</span>
            <span class="pill pill-rose">3-Tier Guardrails</span>
            <span class="pill pill-rose">Pediatric Locks</span>
          </div>
        </div>
        <!-- 2.3 -->
        <div class="comp-box">
          <div class="comp-top">
            <span class="comp-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              admin-api Edge Gateway
            </span>
            <span class="comp-badge">Service Role</span>
          </div>
          <div class="comp-desc">Privileged GoTrue administrator, user moderation, and audit trail sink.</div>
          <div class="comp-bullets">
            <div><span class="dot" style="background:#A78BFA;"></span> Service-Role Gated Admin Operations</div>
            <div><span class="dot" style="background:#A78BFA;"></span> Atomic User Deactivation & Teardown</div>
            <div><span class="dot" style="background:#A78BFA;"></span> Immutable IP & User-Agent Audit Stamping</div>
          </div>
          <div class="comp-pills">
            <span class="pill pill-purple">Service Role</span>
            <span class="pill pill-purple">IP Stamped</span>
            <span class="pill pill-purple">Audit Log Sink</span>
          </div>
        </div>
      </div>
    </div>

    <!-- CONNECTOR HIGHWAY 2 -->
    <div class="connector-strip">
      <div class="connector-line con-http">
        <span>Encrypted AI Inference Dispatch (REST API)</span>
        <span class="con-arrow">▼</span>
      </div>
      <div class="connector-line con-wss">
        <span>PostgREST Database Pool / TLS Connection (PgBouncer)</span>
        <span class="con-arrow">▼</span>
      </div>
    </div>

    <!-- TIER 3: MULTI-PROVIDER AI & CLOUD DATABASE -->
    <div class="bottom-split">

      <!-- 3A: AI PROVIDER CLUSTER -->
      <div class="tier-row tier-ai">
        <div class="tier-header">
          <div class="tier-title-wrap">
            <span class="tier-tag tag-ai">Tier 3A · AI & Inference</span>
            <span class="tier-name">Multi-Provider AI Resilience Cluster</span>
          </div>
          <div style="font-size:11px; color:#FBBF24; font-weight:700;">99.9% High Availability SLA</div>
        </div>
        <div class="components-grid grid-2" style="grid-template-columns: 1fr 1fr;">
          <!-- AI 1 -->
          <div class="comp-box">
            <div class="comp-top">
              <span class="comp-title">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                Google Gemini 1.5 Flash
              </span>
              <span class="comp-badge">Tier 1 Cloud</span>
            </div>
            <div class="comp-desc">Multimodal vision OCR: Cursive doctor handwriting, blister pack extraction & clinical JSON schema.</div>
            <div class="comp-bullets">
              <div><span class="dot" style="background:#F59E0B;"></span> Unstructured prescription image parsing</div>
              <div><span class="dot" style="background:#F59E0B;"></span> Clinical token & dosage frequency mapping</div>
            </div>
            <div class="comp-pills"><span class="pill pill-amber">Vision OCR</span><span class="pill pill-amber">Prescription Schema</span></div>
          </div>
          <!-- AI 2 -->
          <div class="comp-box">
            <div class="comp-top">
              <span class="comp-title">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Groq LLaMA 3.3 70B
              </span>
              <span class="comp-badge">Tier 2 Chat</span>
            </div>
            <div class="comp-desc">Sub-second conversational health assistant for routine medication Q&A, dietary advice & interactions.</div>
            <div class="comp-bullets">
              <div><span class="dot" style="background:#F59E0B;"></span> Sub-second conversational responses</div>
              <div><span class="dot" style="background:#F59E0B;"></span> Multi-turn memory & active course awareness</div>
            </div>
            <div class="comp-pills"><span class="pill pill-amber">Sub-Second Speed</span><span class="pill pill-amber">Chat Companion</span></div>
          </div>
          <!-- AI 3 -->
          <div class="comp-box">
            <div class="comp-top">
              <span class="comp-title">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/></svg>
                DeepSeek / OpenRouter
              </span>
              <span class="comp-badge">Tier 3 Fallback</span>
            </div>
            <div class="comp-desc">Tertiary fallback tier ensuring system continuity during external cloud outages or quota exhaustion.</div>
            <div class="comp-bullets">
              <div><span class="dot" style="background:#F59E0B;"></span> Redundant community model pool</div>
              <div><span class="dot" style="background:#F59E0B;"></span> Zero downtime guarantee for critical Q&A</div>
            </div>
            <div class="comp-pills"><span class="pill pill-amber">Redundant Fallback</span><span class="pill pill-amber">Zero Downtime</span></div>
          </div>
          <!-- AI 4 -->
          <div class="comp-box">
            <div class="comp-top">
              <span class="comp-title">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/></svg>
                LiteRT / On-Device
              </span>
              <span class="comp-badge">Tier 0 Local</span>
            </div>
            <div class="comp-desc">Local on-device inference for offline drug interactions & emergency first-aid queries without internet.</div>
            <div class="comp-bullets">
              <div><span class="dot" style="background:#F59E0B;"></span> Zero network dependency & zero latency</div>
              <div><span class="dot" style="background:#F59E0B;"></span> First-line emergency medical interaction check</div>
            </div>
            <div class="comp-pills"><span class="pill pill-amber">Offline Capable</span><span class="pill pill-amber">Zero API Cost</span></div>
          </div>
        </div>
      </div>

      <!-- 3B: DATABASE & STORAGE LAYER -->
      <div class="tier-row tier-db">
        <div class="tier-header">
          <div class="tier-title-wrap">
            <span class="tier-tag tag-backend">Tier 3B · Database & AMR</span>
            <span class="tier-name">Supabase PostgreSQL 15 Engine</span>
          </div>
          <div style="font-size:11px; color:#34D399; font-weight:700;">100% RLS Enforcement</div>
        </div>
        <div class="components-grid grid-2" style="grid-template-columns: 1fr 1fr;">
          <!-- DB 1 -->
          <div class="comp-box">
            <div class="comp-top">
              <span class="comp-title">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                Relational Schema
              </span>
              <span class="comp-badge">14 Tables</span>
            </div>
            <div class="comp-desc">Normalized schemas: profiles, courses, dose_logs, prescriptions, family, cabinet, misuse_events.</div>
            <div class="comp-bullets">
              <div><span class="dot" style="background:#10B981;"></span> PgBouncer Connection Pool (P95 4.8ms)</div>
              <div><span class="dot" style="background:#10B981;"></span> Foreign key constraints & cascade integrity</div>
            </div>
            <div class="comp-pills"><span class="pill pill-green">PgBouncer Pool</span><span class="pill pill-green">Foreign Keys</span></div>
          </div>
          <!-- DB 2 -->
          <div class="comp-box">
            <div class="comp-top">
              <span class="comp-title">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Row-Level Security
              </span>
              <span class="comp-badge">Zero Leakage</span>
            </div>
            <div class="comp-desc">check_caregiver_access & check_circle_read_access with caregiver_consent_revoked gate.</div>
            <div class="comp-bullets">
              <div><span class="dot" style="background:#10B981;"></span> Zero cross-tenant data leakage guarantee</div>
              <div><span class="dot" style="background:#10B981;"></span> Audit logging of all caregiver actions</div>
            </div>
            <div class="comp-pills"><span class="pill pill-green">100% RLS Strict</span><span class="pill pill-green">Audit Trail</span></div>
          </div>
          <!-- DB 3 -->
          <div class="comp-box">
            <div class="comp-top">
              <span class="comp-title">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                pg_trgm Fuzzy GIN
              </span>
              <span class="comp-badge">Fuzzy RPC</span>
            </div>
            <div class="comp-desc">fuzzy_search_drug RPC absorbing OCR typographical noise against 752-drug WHO formulary catalog.</div>
            <div class="comp-bullets">
              <div><span class="dot" style="background:#10B981;"></span> GIN Trigram similarity indexing</div>
              <div><span class="dot" style="background:#10B981;"></span> 752-drug reference database matching</div>
            </div>
            <div class="comp-pills"><span class="pill pill-green">GIN Trigram</span><span class="pill pill-green">752 Drugs</span></div>
          </div>
          <!-- DB 4 -->
          <div class="comp-box">
            <div class="comp-top">
              <span class="comp-title">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Triggers & AMR RPC
              </span>
              <span class="comp-badge">K &ge; 5 Privacy</span>
            </div>
            <div class="comp-desc">trg_evaluate_badges streak engine & get_amr_heatmap differential privacy aggregation (k &ge; 5).</div>
            <div class="comp-bullets">
              <div><span class="dot" style="background:#10B981;"></span> Automated streak & milestone badges</div>
              <div><span class="dot" style="background:#10B981;"></span> Regional AMR misuse surveillance stream</div>
            </div>
            <div class="comp-pills"><span class="pill pill-green">Streak Triggers</span><span class="pill pill-green">AMR Heatmap</span></div>
          </div>
        </div>
      </div>

    </div>

  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">
      <span class="footer-dot"></span>
      <span>Client Layer: React Native (Expo SDK 52)</span>
      <span>➔</span>
      <span>Gateway: Supabase Deno Edge</span>
      <span>➔</span>
      <span>AI Inference: Gemini 1.5 & Groq LLaMA 3.3</span>
      <span>➔</span>
      <span>Storage & RLS: PostgreSQL 15</span>
      <span>➔</span>
      <span>Public Health: WHO AWaRe AMR Matrix</span>
    </div>
    <div>MedSentry Multi-Tier Healthcare Architecture · Production Standard · 2400 × 1350 px</div>
  </div>

</body>
</html>'''

# -----------------------------------------------------------------------------
# 2. MODULES CATEGORIES DIAGRAM (2400x1350) - 100% FILLED, ZERO VOID
# -----------------------------------------------------------------------------
modules_html = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>MedSentry Application Modules Taxonomy</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 2400px;
    height: 1350px;
    background: #080D1A;
    font-family: 'Google Sans Flex', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #F1F5F9;
    padding: 30px 44px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #1E293B;
    padding-bottom: 14px;
    margin-bottom: 14px;
  }
  .title-group {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .brand-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: linear-gradient(135deg, #06B6D4, #0891B2);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 24px rgba(6, 182, 212, 0.35);
  }
  .title-group h1 {
    font-size: 33px;
    font-weight: 800;
    color: #FFFFFF;
    letter-spacing: -0.5px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .title-group h1 span { color: #22D3EE; font-weight: 700; }
  .subtitle { font-size: 14px; color: #94A3B8; margin-top: 2px; font-weight: 500; }
  .header-badges { display: flex; align-items: center; gap: 10px; }
  .badge {
    padding: 6px 14px;
    border-radius: 30px;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .badge-cyan { background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.4); color: #22D3EE; }
  .badge-emerald { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34D399; }
  .badge-amber { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); color: #FBBF24; }

  /* 4 Domains Grid */
  .domains-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    flex: 1;
  }

  .domain-col {
    background: #0E1626;
    border: 1.5px solid #1E293B;
    border-radius: 16px;
    padding: 16px 14px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  }
  .domain-col.cat-adherence { border-top: 6px solid #10B981; }
  .domain-col.cat-ai { border-top: 6px solid #06B6D4; }
  .domain-col.cat-family { border-top: 6px solid #8B5CF6; }
  .domain-col.cat-governance { border-top: 6px solid #F59E0B; }

  .domain-header {
    margin-bottom: 10px;
    border-bottom: 1px solid #1E293B;
    padding-bottom: 8px;
  }
  .domain-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3px;
  }
  .domain-badge {
    font-size: 9.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    padding: 2px 7px;
    border-radius: 4px;
  }
  .badge-cat-adherence { background: rgba(16, 185, 129, 0.2); color: #34D399; }
  .badge-cat-ai { background: rgba(6, 182, 212, 0.2); color: #22D3EE; }
  .badge-cat-family { background: rgba(139, 92, 246, 0.2); color: #A78BFA; }
  .badge-cat-governance { background: rgba(245, 158, 11, 0.2); color: #FBBF24; }

  .domain-title { font-size: 16.5px; font-weight: 800; color: #FFFFFF; margin-bottom: 2px; }
  .domain-sub { font-size: 11px; color: #94A3B8; line-height: 1.35; }

  .modules-stack {
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
    margin-bottom: 10px;
  }

  .module-card {
    background: #131F35;
    border: 1px solid #24324D;
    border-radius: 11px;
    padding: 10px 11px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex: 1;
  }
  .mod-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }
  .mod-name {
    font-size: 13px;
    font-weight: 800;
    color: #F8FAFC;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .mod-num {
    font-size: 9px;
    font-weight: 800;
    padding: 2px 5px;
    border-radius: 4px;
    background: #1E293B;
    color: #94A3B8;
  }
  .mod-body {
    font-size: 10.5px;
    color: #94A3B8;
    line-height: 1.4;
    margin-bottom: 6px;
  }
  .mod-bullets {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin-bottom: 6px;
    font-size: 10px;
    color: #CBD5E1;
  }
  .mod-bullets div { display: flex; align-items: center; gap: 5px; }
  .mod-bullets span.dot { width: 4px; height: 4px; border-radius: 50%; }

  .mod-tags { display: flex; flex-wrap: wrap; gap: 4px; }
  .tag {
    font-size: 8.5px;
    font-weight: 600;
    padding: 2px 5px;
    border-radius: 4px;
    background: #1A2740;
    color: #CBD5E1;
    border: 1px solid #2A3B5A;
  }
  .tag-emerald { background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.35); color: #34D399; }
  .tag-cyan { background: rgba(6, 182, 212, 0.15); border-color: rgba(6, 182, 212, 0.35); color: #22D3EE; }
  .tag-purple { background: rgba(139, 92, 246, 0.15); border-color: rgba(139, 92, 246, 0.35); color: #A78BFA; }
  .tag-amber { background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.35); color: #FBBF24; }

  /* Bottom Domain Matrix Box (Full Height & Complete Specs) */
  .domain-matrix-box {
    background: #101B2E;
    border: 1px solid #1E2D4A;
    border-radius: 11px;
    padding: 10px 11px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .matrix-title {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #CBD5E1;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .matrix-item {
    font-size: 10px;
    color: #94A3B8;
    line-height: 1.35;
    display: flex;
    align-items: flex-start;
    gap: 5px;
  }
  .matrix-item span.bullet { font-weight: 800; }

  /* Inter-Domain Bridge Footer */
  .inter-bridge {
    margin-top: 14px;
    background: #0E1626;
    border: 1px solid #1E293B;
    border-radius: 12px;
    padding: 10px 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11.5px;
    color: #94A3B8;
  }
  .bridge-item { display: flex; align-items: center; gap: 7px; font-weight: 600; color: #CBD5E1; }
  .bridge-dot { width: 6px; height: 6px; border-radius: 50%; }
</style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="title-group">
      <div class="brand-icon">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
      </div>
      <div>
        <h1>MedSentry <span>Application Modules Taxonomy</span></h1>
        <div class="subtitle">Complete Decomposition of Functional Capabilities into 4 Clinical & Governance Categories</div>
      </div>
    </div>
    <div class="header-badges">
      <div class="badge badge-cyan">4 Functional Categories</div>
      <div class="badge badge-emerald">12 Cohesive Subsystems</div>
      <div class="badge badge-amber">100% RLS Security</div>
    </div>
  </div>

  <!-- 4 Domains Grid -->
  <div class="domains-grid">

    <!-- CATEGORY 1: PATIENT CLINICAL & ADHERENCE -->
    <div class="domain-col cat-adherence">
      <div class="domain-header">
        <div class="domain-meta">
          <span class="domain-badge badge-cat-adherence">Category A · Clinical</span>
          <span style="font-size:10.5px; color:#34D399; font-weight:700;">Core Care Layer</span>
        </div>
        <div class="domain-title">Patient Adherence Domain</div>
        <div class="domain-sub">Personal medication schedules, course tracking & gamified behavioral incentives.</div>
      </div>
      <div class="modules-stack">
        <!-- Mod 1.1 -->
        <div class="module-card">
          <div>
            <div class="mod-top">
              <span class="mod-name">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Home Dashboard & Routine
              </span>
              <span class="mod-num">MOD 01</span>
            </div>
            <div class="mod-body">Daily routine timeline (morning, afternoon, evening), 100% adherence streak ring, and quick-dose logger.</div>
            <div class="mod-bullets">
              <div><span class="dot" style="background:#10B981;"></span> Circular progress adherence ring with micro-animations</div>
              <div><span class="dot" style="background:#10B981;"></span> One-tap action buttons: Taken, Snooze (15m), Skipped</div>
              <div><span class="dot" style="background:#10B981;"></span> Today's medication dosage routine schedule view</div>
            </div>
          </div>
          <div class="mod-tags">
            <span class="tag tag-emerald">100% Streak Ring</span>
            <span class="tag tag-emerald">Quick-Log Actions</span>
            <span class="tag">Push Nudges</span>
          </div>
        </div>
        <!-- Mod 1.2 -->
        <div class="module-card">
          <div>
            <div class="mod-top">
              <span class="mod-name">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
                Regimen Tracker & Catalog
              </span>
              <span class="mod-num">MOD 02</span>
            </div>
            <div class="mod-body">Multiple concurrent regimens, days remaining counter (pills ÷ daily dose), Apollo pharmacy refill dispatch, and 752-drug catalog.</div>
            <div class="mod-bullets">
              <div><span class="dot" style="background:#10B981;"></span> Concurrent antibiotic & chronic cardiovascular courses</div>
              <div><span class="dot" style="background:#10B981;"></span> Days remaining calculation with 2-day low-stock alerts</div>
              <div><span class="dot" style="background:#10B981;"></span> WHO AWaRe classification monographs (Access/Watch/Reserve)</div>
            </div>
          </div>
          <div class="mod-tags">
            <span class="tag tag-emerald">752 Catalog Drugs</span>
            <span class="tag tag-emerald">WHO AWaRe Tiers</span>
            <span class="tag">Refill Dispatch</span>
          </div>
        </div>
        <!-- Mod 1.3 -->
        <div class="module-card">
          <div>
            <div class="mod-top">
              <span class="mod-name">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Gamification & Badges
              </span>
              <span class="mod-num">MOD 03</span>
            </div>
            <div class="mod-body">Automated streak calculation (3-day, 7-day, 14-day), "Responsible Antibiotic User" completion badge, and trigger auto-evaluation.</div>
            <div class="mod-bullets">
              <div><span class="dot" style="background:#10B981;"></span> trg_evaluate_badges fires on dose_logs INSERT</div>
              <div><span class="dot" style="background:#10B981;"></span> Milestone badges: 7-Day Champion, Master Guardian</div>
              <div><span class="dot" style="background:#10B981;"></span> Responsible Antibiotic User badge on course finish</div>
            </div>
          </div>
          <div class="mod-tags">
            <span class="tag tag-emerald">trg_evaluate_badges</span>
            <span class="tag tag-emerald">Streak Milestones</span>
            <span class="tag">Non-Shaming</span>
          </div>
        </div>
      </div>
      <!-- Domain Matrix Box -->
      <div class="domain-matrix-box">
        <div class="matrix-title"><span style="color:#10B981;">●</span> Category Architecture Specs</div>
        <div class="matrix-item"><span class="bullet" style="color:#10B981;">▪</span><span><strong>Adherence Formula:</strong> (Taken &divide; Scheduled) &times; 100% weekly metric</span></div>
        <div class="matrix-item"><span class="bullet" style="color:#10B981;">▪</span><span><strong>DB Engine:</strong> dose_logs trigger fires badge evaluations</span></div>
        <div class="matrix-item"><span class="bullet" style="color:#10B981;">▪</span><span><strong>Escalation Ladder:</strong> 15m snooze ➔ 30m nudge ➔ Caregiver alert</span></div>
        <div class="matrix-item"><span class="bullet" style="color:#10B981;">▪</span><span><strong>Security Context:</strong> Profiles RLS strictly scopes to authenticated UID</span></div>
      </div>
    </div>

    <!-- CATEGORY 2: COMPUTER VISION & AI DECISION SUPPORT -->
    <div class="domain-col cat-ai">
      <div class="domain-header">
        <div class="domain-meta">
          <span class="domain-badge badge-cat-ai">Category B · Vision & AI</span>
          <span style="font-size:10.5px; color:#22D3EE; font-weight:700;">Multimodal Intelligence</span>
        </div>
        <div class="domain-title">AI & Vision Decision Domain</div>
        <div class="domain-sub">Prescription OCR, clinical reasoning, drug interactions & conversational assistance.</div>
      </div>
      <div class="modules-stack">
        <!-- Mod 2.1 -->
        <div class="module-card">
          <div>
            <div class="mod-top">
              <span class="mod-name">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                Smart OCR & 2D Barcode
              </span>
              <span class="mod-num">MOD 04</span>
            </div>
            <div class="mod-body">GS1 DataMatrix 2D parser (GTIN, Batch, Expiry), Google ML Kit on-device OCR, and 2D spatial coordinate clustering for tables.</div>
            <div class="mod-bullets">
              <div><span class="dot" style="background:#06B6D4;"></span> GS1 DataMatrix hardware decoder for instant GTIN/Batch</div>
              <div><span class="dot" style="background:#06B6D4;"></span> 2D Spatial coordinate clustering (&Delta;y &le; 0.65 line height)</div>
              <div><span class="dot" style="background:#06B6D4;"></span> Multi-column table reconstruction for drug instructions</div>
            </div>
          </div>
          <div class="mod-tags">
            <span class="tag tag-cyan">Google ML Kit</span>
            <span class="tag tag-cyan">GS1 2D Parser</span>
            <span class="tag">Spatial Clustering</span>
          </div>
        </div>
        <!-- Mod 2.2 -->
        <div class="module-card">
          <div>
            <div class="mod-top">
              <span class="mod-name">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/></svg>
                AI Health Consultant
              </span>
              <span class="mod-num">MOD 05</span>
            </div>
            <div class="mod-body">Multimodal diagnostic form with photo upload (rash, strip, prescription), suitability checks, necessity assessment, and 3-tier guardrails.</div>
            <div class="mod-bullets">
              <div><span class="dot" style="background:#06B6D4;"></span> Gemini 1.5 Flash vision OCR for doctor handwriting</div>
              <div><span class="dot" style="background:#06B6D4;"></span> Deterministic pre-flight profile allergy cross-check</div>
              <div><span class="dot" style="background:#06B6D4;"></span> 3-tier safety guardrails blocking lethal overdose queries</div>
            </div>
          </div>
          <div class="mod-tags">
            <span class="tag tag-cyan">Gemini 1.5 Flash</span>
            <span class="tag tag-cyan">Allergy Pre-Check</span>
            <span class="tag">Safety Refusal</span>
          </div>
        </div>
        <!-- Mod 2.3 -->
        <div class="module-card">
          <div>
            <div class="mod-top">
              <span class="mod-name">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                AI Chatbot Companion
              </span>
              <span class="mod-num">MOD 06</span>
            </div>
            <div class="mod-body">Free-flowing conversational assistant with multi-turn memory, active medication course cross-checking, and sub-second Groq inference.</div>
            <div class="mod-bullets">
              <div><span class="dot" style="background:#06B6D4;"></span> Groq LLaMA 3.3 70B sub-second conversational model</div>
              <div><span class="dot" style="background:#06B6D4;"></span> Automatic context injection of active courses & dose history</div>
              <div><span class="dot" style="background:#06B6D4;"></span> Dietary advice, side effect queries & contraindications</div>
            </div>
          </div>
          <div class="mod-tags">
            <span class="tag tag-cyan">Groq LLaMA 3.3</span>
            <span class="tag tag-cyan">Context Memory</span>
            <span class="tag">Course Aware</span>
          </div>
        </div>
      </div>
      <!-- Domain Matrix Box -->
      <div class="domain-matrix-box">
        <div class="matrix-title"><span style="color:#06B6D4;">●</span> AI & Vision Specifications</div>
        <div class="matrix-item"><span class="bullet" style="color:#06B6D4;">▪</span><span><strong>Spatial Cluster:</strong> &Delta;y &le; 0.65 line height grouping algorithm</span></div>
        <div class="matrix-item"><span class="bullet" style="color:#06B6D4;">▪</span><span><strong>Fuzzy Search:</strong> pg_trgm GIN &ge; 0.4 + Levenshtein &ge; 70% threshold</span></div>
        <div class="matrix-item"><span class="bullet" style="color:#06B6D4;">▪</span><span><strong>Refusal Policy:</strong> Deterministic refusal for pediatric & overdose</span></div>
        <div class="matrix-item"><span class="bullet" style="color:#06B6D4;">▪</span><span><strong>Telemetry:</strong> Latency and tokens recorded to api_usage_logs</span></div>
      </div>
    </div>

    <!-- CATEGORY 3: SOCIAL CAREGIVER & COLLABORATIVE MEDICINE -->
    <div class="domain-col cat-family">
      <div class="domain-header">
        <div class="domain-meta">
          <span class="domain-badge badge-cat-family">Category C · Collaborative</span>
          <span style="font-size:10.5px; color:#A78BFA; font-weight:700;">Care Coordination</span>
        </div>
        <div class="domain-title">Family Circle & Caregivers</div>
        <div class="domain-sub">Multi-role permissions, proxy dose logging, shared inventory & self-sovereignty.</div>
      </div>
      <div class="modules-stack">
        <!-- Mod 3.1 -->
        <div class="module-card">
          <div>
            <div class="mod-top">
              <span class="mod-name">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                Family Circle Hub & RBAC
              </span>
              <span class="mod-num">MOD 07</span>
            </div>
            <div class="mod-body">Circle management via 6-character invite codes, 3 permission tiers (Owner, Caregiver, Viewer), and adult self-sovereign consent revocation.</div>
            <div class="mod-bullets">
              <div><span class="dot" style="background:#8B5CF6;"></span> Granular RBAC tiers: Owner, Caregiver, Viewer</div>
              <div><span class="dot" style="background:#8B5CF6;"></span> 6-character cryptographic invite codes & QR join</div>
              <div><span class="dot" style="background:#8B5CF6;"></span> Self-Sovereignty: Standing consent revocable anytime</div>
            </div>
          </div>
          <div class="mod-tags">
            <span class="tag tag-purple">3-Tier RBAC</span>
            <span class="tag tag-purple">6-Char Invites</span>
            <span class="tag">Self-Sovereignty</span>
          </div>
        </div>
        <!-- Mod 3.2 -->
        <div class="module-card">
          <div>
            <div class="mod-top">
              <span class="mod-name">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                Proxy Dosing & Audit Trail
              </span>
              <span class="mod-num">MOD 08</span>
            </div>
            <div class="mod-body">Caregiver logging doses on behalf of dependents, 2+ missed dose escalation ladder, household antibiotic overlap warning, and audit log.</div>
            <div class="mod-bullets">
              <div><span class="dot" style="background:#8B5CF6;"></span> Proxy dose logging for minors and elderly parents</div>
              <div><span class="dot" style="background:#8B5CF6;"></span> Caregiver push cross-alerts on 2+ consecutive misses</div>
              <div><span class="dot" style="background:#8B5CF6;"></span> Immutable append-only caregiver_audit_log entries</div>
            </div>
          </div>
          <div class="mod-tags">
            <span class="tag tag-purple">Proxy Logging</span>
            <span class="tag tag-purple">Audit Trail</span>
            <span class="tag">Escalation Ladder</span>
          </div>
        </div>
        <!-- Mod 3.3 -->
        <div class="module-card">
          <div>
            <div class="mod-top">
              <span class="mod-name">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                Shared Medicine Cabinet
              </span>
              <span class="mod-num">MOD 09</span>
            </div>
            <div class="mod-body">Shared OTC household inventory tracker (Paracetamol, ORS, antiseptics), batch logging, and 30-day automated near-expiry alert notifications.</div>
            <div class="mod-bullets">
              <div><span class="dot" style="background:#8B5CF6;"></span> Circle-level shared OTC inventory (cabinet_inventory)</div>
              <div><span class="dot" style="background:#8B5CF6;"></span> Automated 30-day near-expiry push notifications</div>
              <div><span class="dot" style="background:#8B5CF6;"></span> Safe drug disposal & take-back scheme advisories</div>
            </div>
          </div>
          <div class="mod-tags">
            <span class="tag tag-purple">Shared Stock</span>
            <span class="tag tag-purple">Near-Expiry Alerts</span>
            <span class="tag">Take-Back Notice</span>
          </div>
        </div>
      </div>
      <!-- Domain Matrix Box -->
      <div class="domain-matrix-box">
        <div class="matrix-title"><span style="color:#8B5CF6;">●</span> Governance & Consent Specs</div>
        <div class="matrix-item"><span class="bullet" style="color:#8B5CF6;">▪</span><span><strong>RBAC Hierarchy:</strong> Owner &gt; Caregiver &gt; Viewer</span></div>
        <div class="matrix-item"><span class="bullet" style="color:#8B5CF6;">▪</span><span><strong>Self-Sovereignty:</strong> Consent revocation instantly disables proxy</span></div>
        <div class="matrix-item"><span class="bullet" style="color:#8B5CF6;">▪</span><span><strong>Security Definers:</strong> check_caregiver_access() RPC policy</span></div>
        <div class="matrix-item"><span class="bullet" style="color:#8B5CF6;">▪</span><span><strong>Audit Trail:</strong> All proxy edits logged to caregiver_audit_log</span></div>
      </div>
    </div>

    <!-- CATEGORY 4: CLINICAL SAFETY, SURVEILLANCE & GOVERNANCE -->
    <div class="domain-col cat-governance">
      <div class="domain-header">
        <div class="domain-meta">
          <span class="domain-badge badge-cat-governance">Category D · Governance</span>
          <span style="font-size:10.5px; color:#FBBF24; font-weight:700;">Public Health & Oversight</span>
        </div>
        <div class="domain-title">Safety, ID & Governance</div>
        <div class="domain-sub">Symptom journals, emergency ID pass, admin telemetry & regional AMR heatmap.</div>
      </div>
      <div class="modules-stack">
        <!-- Mod 4.1 -->
        <div class="module-card">
          <div>
            <div class="mod-top">
              <span class="mod-name">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Symptom Journal & PD Link
              </span>
              <span class="mod-num">MOD 10</span>
            </div>
            <div class="mod-body">Interactive 1–10 severity rating slider, anatomical body system tags, active medication correlation, and post-viral antibiotic trend detection.</div>
            <div class="mod-bullets">
              <div><span class="dot" style="background:#F59E0B;"></span> Interactive 1-10 severity slider with anatomical tags</div>
              <div><span class="dot" style="background:#F59E0B;"></span> Pharmacodynamic link: Correlates symptoms with active meds</div>
              <div><span class="dot" style="background:#F59E0B;"></span> Trend detection: Flags rapid repeat antibiotic use post-viral</div>
            </div>
          </div>
          <div class="mod-tags">
            <span class="tag tag-amber">1–10 Severity</span>
            <span class="tag tag-amber">Drug-Side Effect Link</span>
            <span class="tag">Trend Analysis</span>
          </div>
        </div>
        <!-- Mod 4.2 -->
        <div class="module-card">
          <div>
            <div class="mod-top">
              <span class="mod-name">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="13" y2="12"/></svg>
                Medical ID & ABHA Card
              </span>
              <span class="mod-num">MOD 11</span>
            </div>
            <div class="mod-body">Digital emergency pass with blood group, critical drug allergies, ICE contacts, surgical safety (3T MRI), and national ABHA ID integration.</div>
            <div class="mod-bullets">
              <div><span class="dot" style="background:#F59E0B;"></span> Offline Emergency ICE Pass & blood group badges</div>
              <div><span class="dot" style="background:#F59E0B;"></span> National Digital Health ABHA ID (Ayushman Bharat)</div>
              <div><span class="dot" style="background:#F59E0B;"></span> Surgical flags: 3T MRI compatibility, organ donor pass</div>
            </div>
          </div>
          <div class="mod-tags">
            <span class="tag tag-amber">Emergency ICE</span>
            <span class="tag tag-amber">ABHA Digital ID</span>
            <span class="tag">3T MRI Safe</span>
          </div>
        </div>
        <!-- Mod 4.3 -->
        <div class="module-card">
          <div>
            <div class="mod-top">
              <span class="mod-name">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Admin & AMR Surveillance
              </span>
              <span class="mod-num">MOD 12</span>
            </div>
            <div class="mod-body">Executive admin console, atomic user moderation, real-time AI token telemetry, and regional AMR misuse heatmap with k &ge; 5 privacy.</div>
            <div class="mod-bullets">
              <div><span class="dot" style="background:#F59E0B;"></span> User administration with atomic deactivation</div>
              <div><span class="dot" style="background:#F59E0B;"></span> AI Token consumption & latency P95 metrics dashboard</div>
              <div><span class="dot" style="background:#F59E0B;"></span> Regional AMR misuse heatmap with k &ge; 5 privacy</div>
            </div>
          </div>
          <div class="mod-tags">
            <span class="tag tag-amber">K &ge; 5 Privacy</span>
            <span class="tag tag-amber">Token Telemetry</span>
            <span class="tag">AMR Heatmap</span>
          </div>
        </div>
      </div>
      <!-- Domain Matrix Box -->
      <div class="domain-matrix-box">
        <div class="matrix-title"><span style="color:#F59E0B;">●</span> Compliance & Privacy Matrix</div>
        <div class="matrix-item"><span class="bullet" style="color:#F59E0B;">▪</span><span><strong>Differential Privacy:</strong> k &ge; 5 thresholding protects user identity</span></div>
        <div class="matrix-item"><span class="bullet" style="color:#F59E0B;">▪</span><span><strong>WHO AWaRe:</strong> Access / Watch / Reserve classification tagging</span></div>
        <div class="matrix-item"><span class="bullet" style="color:#F59E0B;">▪</span><span><strong>Admin Security:</strong> Service-role Deno edge gating (Zero client trust)</span></div>
        <div class="matrix-item"><span class="bullet" style="color:#F59E0B;">▪</span><span><strong>Audit Integrity:</strong> Merkle root cryptographic event sealing</span></div>
      </div>
    </div>

  </div>

  <!-- Inter-Domain Bridge Footer -->
  <div class="inter-bridge">
    <div class="bridge-item">
      <span class="bridge-dot" style="background:#10B981;"></span>
      <span>PostgreSQL 15 Triggers (trg_evaluate_badges)</span>
    </div>
    <div style="color:#475569;">|</div>
    <div class="bridge-item">
      <span class="bridge-dot" style="background:#06B6D4;"></span>
      <span>Deno Edge Functions (ai-router, admin-api)</span>
    </div>
    <div style="color:#475569;">|</div>
    <div class="bridge-item">
      <span class="bridge-dot" style="background:#8B5CF6;"></span>
      <span>Row Level Security (100% Policy Isolation)</span>
    </div>
    <div style="color:#475569;">|</div>
    <div class="bridge-item">
      <span class="bridge-dot" style="background:#F59E0B;"></span>
      <span>Differential Privacy Aggregation (k &ge; 5)</span>
    </div>
    <div style="color:#475569;">|</div>
    <div style="font-weight:700; color:#CBD5E1;">MedSentry Architecture Taxonomy · 2400 × 1350 px</div>
  </div>

</body>
</html>'''

# -----------------------------------------------------------------------------
# 3. WORKFLOW DIAGRAM (2400x1350) - 100% FILLED, DENSE FLOWCHART, ZERO VOID
# -----------------------------------------------------------------------------
workflow_html = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>MedSentry Clinical Verification & Adherence Workflow</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 2400px;
    height: 1350px;
    background: #080D1A;
    font-family: 'Google Sans Flex', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #F1F5F9;
    padding: 30px 44px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #1E293B;
    padding-bottom: 14px;
    margin-bottom: 14px;
  }
  .title-group {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .brand-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: linear-gradient(135deg, #10B981, #06B6D4);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
  }
  .title-group h1 {
    font-size: 33px;
    font-weight: 800;
    color: #FFFFFF;
    letter-spacing: -0.5px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .title-group h1 span { color: #34D399; font-weight: 700; }
  .subtitle { font-size: 14px; color: #94A3B8; margin-top: 2px; font-weight: 500; }
  .header-badges { display: flex; align-items: center; gap: 10px; }
  .badge {
    padding: 6px 14px;
    border-radius: 30px;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .badge-emerald { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34D399; }
  .badge-cyan { background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.4); color: #22D3EE; }

  /* 5 Stages Grid */
  .workflow-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 14px;
    flex: 1;
  }

  .stage-col {
    background: #0E1626;
    border: 1.5px solid #1E293B;
    border-radius: 16px;
    padding: 14px 12px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    position: relative;
  }
  .stage-col.stage-1 { border-top: 5px solid #38BDF8; }
  .stage-col.stage-2 { border-top: 5px solid #06B6D4; }
  .stage-col.stage-3 { border-top: 5px solid #8B5CF6; }
  .stage-col.stage-4 { border-top: 5px solid #F59E0B; }
  .stage-col.stage-5 { border-top: 5px solid #10B981; }

  .stage-header {
    border-bottom: 1px solid #1E293B;
    padding-bottom: 8px;
    margin-bottom: 10px;
  }
  .stage-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3px;
  }
  .stage-num-badge {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #1E293B;
    color: #F8FAFC;
    font-size: 11px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .stage-tag {
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    padding: 2px 6px;
    border-radius: 4px;
  }
  .stagetag-1 { background: rgba(56, 189, 248, 0.2); color: #38BDF8; }
  .stagetag-2 { background: rgba(6, 182, 212, 0.2); color: #22D3EE; }
  .stagetag-3 { background: rgba(139, 92, 246, 0.2); color: #A78BFA; }
  .stagetag-4 { background: rgba(245, 158, 11, 0.2); color: #FBBF24; }
  .stagetag-5 { background: rgba(16, 185, 129, 0.2); color: #34D399; }

  .stage-title { font-size: 14.5px; font-weight: 800; color: #FFFFFF; margin-top: 2px; }

  .nodes-stack {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    margin-bottom: 8px;
  }

  .node-box {
    background: #131F35;
    border: 1px solid #24324D;
    border-radius: 10px;
    padding: 9px 10px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex: 1;
  }
  .node-title {
    font-size: 12px;
    font-weight: 800;
    color: #F8FAFC;
    margin-bottom: 3px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .node-desc {
    font-size: 10px;
    color: #94A3B8;
    line-height: 1.35;
    margin-bottom: 4px;
  }
  .node-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8.5px;
    color: #64748B;
  }
  .node-tech {
    font-weight: 700;
    padding: 2px 5px;
    border-radius: 4px;
    background: #1E293B;
    color: #CBD5E1;
  }

  /* Decision Diamond Box */
  .decision-box {
    background: #1B243B;
    border: 1.5px dashed #F59E0B;
    border-radius: 10px;
    padding: 8px 10px;
  }
  .decision-label {
    font-size: 9px;
    font-weight: 800;
    color: #FBBF24;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }
  .decision-q {
    font-size: 11px;
    font-weight: 800;
    color: #FFFFFF;
    line-height: 1.3;
  }
  .decision-branches {
    display: flex;
    gap: 5px;
    margin-top: 4px;
  }
  .branch-yes {
    font-size: 8px;
    font-weight: 800;
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid #10B981;
    color: #34D399;
    padding: 2px 5px;
    border-radius: 4px;
  }
  .branch-no {
    font-size: 8px;
    font-weight: 800;
    background: rgba(244, 63, 94, 0.2);
    border: 1px solid #F43F5E;
    color: #FB7185;
    padding: 2px 5px;
    border-radius: 4px;
  }

  /* Bottom Stage SLA Box */
  .stage-sla-box {
    background: #101B2E;
    border: 1px solid #1E2D4A;
    border-radius: 10px;
    padding: 8px 9px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .sla-title {
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    color: #CBD5E1;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .sla-metric { font-size: 9.5px; color: #94A3B8; line-height: 1.3; }

  /* Stage Arrow Separators */
  .stage-col::after {
    content: '➔';
    position: absolute;
    right: -10px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 15px;
    color: #10B981;
    font-weight: 800;
    z-index: 10;
  }
  .stage-col:last-child::after { display: none; }

  /* Footer */
  .footer {
    border-top: 2px solid #1E293B;
    padding-top: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: #64748B;
  }
  .footer-left {
    display: flex;
    align-items: center;
    gap: 14px;
    color: #94A3B8;
    font-weight: 600;
  }
</style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="title-group">
      <div class="brand-icon">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      </div>
      <div>
        <h1>MedSentry <span>Clinical Verification & Adherence Workflow</span></h1>
        <div class="subtitle">Complete End-to-End Decision Pipeline: Sensor Stream ➔ Barcode Fast-Path ➔ AI Vision ➔ RLS Commit ➔ AMR Engine</div>
      </div>
    </div>
    <div class="header-badges">
      <div class="badge badge-emerald">5-Stage Linear & Branching Pipeline</div>
      <div class="badge badge-cyan">Zero-Error Clinical Verification</div>
    </div>
  </div>

  <!-- 5 Stages Grid -->
  <div class="workflow-grid">

    <!-- STAGE 1: ACQUISITION & BARCODE FAST-PATH -->
    <div class="stage-col stage-1">
      <div class="stage-header">
        <div class="stage-meta">
          <span class="stage-num-badge">1</span>
          <span class="stage-tag stagetag-1">Acquisition</span>
        </div>
        <div class="stage-title">Sensor Stream & Barcode</div>
      </div>
      <div class="nodes-stack">
        <div class="node-box">
          <div>
            <div class="node-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              Camera Sensor Frame
            </div>
            <div class="node-desc">High-speed sensor capture targeting prescription document, blister strip, or syrup bottle.</div>
          </div>
          <div class="node-footer"><span>Sensor Stream</span><span class="node-tech">expo-camera</span></div>
        </div>
        <div class="decision-box">
          <div class="decision-label">Fast-Path Check</div>
          <div class="decision-q">GS1 DataMatrix 2D Barcode Detected?</div>
          <div class="decision-branches">
            <span class="branch-yes">YES ➔ Skip OCR to Step 3</span>
            <span class="branch-no">NO ➔ Proceed</span>
          </div>
        </div>
        <div class="node-box">
          <div>
            <div class="node-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
              GS1 2D Data Parser
            </div>
            <div class="node-desc">Direct extraction of GTIN-14, Expiration Date (YYMMDD), and Batch Number without optical uncertainty.</div>
          </div>
          <div class="node-footer"><span>Instant Parser</span><span class="node-tech">GS1 Standard</span></div>
        </div>
        <div class="node-box">
          <div>
            <div class="node-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2"><path d="M12 2v20M2 12h20"/></svg>
              Frame Normalization
            </div>
            <div class="node-desc">Applies unsharp mask, contrast leveling, and perspective rectification for OCR intake.</div>
          </div>
          <div class="node-footer"><span>Image Pipeline</span><span class="node-tech">On-Device Prep</span></div>
        </div>
        <div class="node-box">
          <div>
            <div class="node-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              Gallery / PDF Upload
            </div>
            <div class="node-desc">Supports multi-page e-prescription PDF imports and high-res gallery images.</div>
          </div>
          <div class="node-footer"><span>File Ingest</span><span class="node-tech">expo-document</span></div>
        </div>
      </div>
      <!-- SLA Box -->
      <div class="stage-sla-box">
        <div class="sla-title"><span style="color:#38BDF8;">●</span> Stage 1 Performance SLA</div>
        <div class="sla-metric"><strong>Latency:</strong> &le; 85ms on-device capture</div>
        <div class="sla-metric"><strong>Barcode Accuracy:</strong> 100% deterministic</div>
      </div>
    </div>

    <!-- STAGE 2: HYBRID OCR & SPATIAL CLUSTERING -->
    <div class="stage-col stage-2">
      <div class="stage-header">
        <div class="stage-meta">
          <span class="stage-num-badge">2</span>
          <span class="stage-tag stagetag-2">Vision & Layout</span>
        </div>
        <div class="stage-title">Hybrid OCR & Spatial</div>
      </div>
      <div class="nodes-stack">
        <div class="node-box">
          <div>
            <div class="node-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" stroke-width="2"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
              On-Device ML Kit OCR
            </div>
            <div class="node-desc">Rapid on-device optical character recognition detecting text blocks, bounding boxes, and lines.</div>
          </div>
          <div class="node-footer"><span>Local Model</span><span class="node-tech">ML Kit Android</span></div>
        </div>
        <div class="node-box">
          <div>
            <div class="node-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/></svg>
              2D Spatial Clustering
            </div>
            <div class="node-desc">Groups adjacent words on the same horizontal row (&Delta;y &le; 0.65 line height) to maintain tabular integrity.</div>
          </div>
          <div class="node-footer"><span>Spatial Geometry</span><span class="node-tech">Client Heuristics</span></div>
        </div>
        <div class="decision-box">
          <div class="decision-label">Routing Decision</div>
          <div class="decision-q">Cursive / Handwritten Rx or Low Clarity?</div>
          <div class="decision-branches">
            <span class="branch-yes">YES ➔ Cloud Gemini</span>
            <span class="branch-no">NO ➔ Local Extract</span>
          </div>
        </div>
        <div class="node-box">
          <div>
            <div class="node-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              Multimodal Gemini 1.5
            </div>
            <div class="node-desc">Dispatched via ai-router Edge Function for deep cursive transcription and clinical structured JSON.</div>
          </div>
          <div class="node-footer"><span>Cloud Vision</span><span class="node-tech">ai-router Edge</span></div>
        </div>
        <div class="node-box">
          <div>
            <div class="node-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              Table Schema Assembler
            </div>
            <div class="node-desc">Assembles parsed rows into structured drug candidate objects with frequency and strength.</div>
          </div>
          <div class="node-footer"><span>Data Struct</span><span class="node-tech">JSON Schema</span></div>
        </div>
      </div>
      <!-- SLA Box -->
      <div class="stage-sla-box">
        <div class="sla-title"><span style="color:#06B6D4;">●</span> Stage 2 Vision Metrics</div>
        <div class="sla-metric"><strong>Printed Accuracy:</strong> 98.4% optical precision</div>
        <div class="sla-metric"><strong>Cloud Fallback:</strong> P95 Latency 1.24s</div>
      </div>
    </div>

    <!-- STAGE 3: PHARMACEUTICAL RESOLUTION & DISAMBIGUATION -->
    <div class="stage-col stage-3">
      <div class="stage-header">
        <div class="stage-meta">
          <span class="stage-num-badge">3</span>
          <span class="stage-tag stagetag-3">Drug Matching</span>
        </div>
        <div class="stage-title">Resolution & Catalog</div>
      </div>
      <div class="nodes-stack">
        <div class="node-box">
          <div>
            <div class="node-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              pg_trgm Fuzzy GIN Search
            </div>
            <div class="node-desc">Database RPC fuzzy_search_drug absorbs OCR spelling errors and typographical glitches.</div>
          </div>
          <div class="node-footer"><span>Database RPC</span><span class="node-tech">pg_trgm GIN</span></div>
        </div>
        <div class="node-box">
          <div>
            <div class="node-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/></svg>
              Levenshtein Refinement
            </div>
            <div class="node-desc">Client-side Levenshtein distance scoring (&ge; 70% threshold) against active salts and generic aliases.</div>
          </div>
          <div class="node-footer"><span>Distance Metric</span><span class="node-tech">Client Logic</span></div>
        </div>
        <div class="decision-box">
          <div class="decision-label">Match Verification</div>
          <div class="decision-q">Drug Catalog Match Confidence &ge; 70%?</div>
          <div class="decision-branches">
            <span class="branch-yes">YES ➔ Fetch AWaRe</span>
            <span class="branch-no">NO ➔ Manual Input</span>
          </div>
        </div>
        <div class="node-box">
          <div>
            <div class="node-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
              WHO AWaRe Classification
            </div>
            <div class="node-desc">Retrieves Access / Watch / Reserve antimicrobial classification tier, standard dosages, and warnings.</div>
          </div>
          <div class="node-footer"><span>Formulary</span><span class="node-tech">752 Catalog Drugs</span></div>
        </div>
        <div class="node-box">
          <div>
            <div class="node-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/></svg>
              Monograph Enrichment
            </div>
            <div class="node-desc">Loads food restrictions, missed dose protocols, and known side effect profiles into preview.</div>
          </div>
          <div class="node-footer"><span>Clinical Context</span><span class="node-tech">CDSCO Data</span></div>
        </div>
      </div>
      <!-- SLA Box -->
      <div class="stage-sla-box">
        <div class="sla-title"><span style="color:#8B5CF6;">●</span> Stage 3 Resolution Specs</div>
        <div class="sla-metric"><strong>Catalog Scope:</strong> 752 Validated Drugs</div>
        <div class="sla-metric"><strong>Query Time:</strong> 4.8ms via GIN Trigram</div>
      </div>
    </div>

    <!-- STAGE 4: CLINICAL SAFETY & DETERMINISTIC PRE-CHECK -->
    <div class="stage-col stage-4">
      <div class="stage-header">
        <div class="stage-meta">
          <span class="stage-num-badge">4</span>
          <span class="stage-tag stagetag-4">Clinical Safety</span>
        </div>
        <div class="stage-title">Allergy & Interactions</div>
      </div>
      <div class="nodes-stack">
        <div class="node-box">
          <div>
            <div class="node-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Patient Profile Cross-Check
            </div>
            <div class="node-desc">Cross-references candidate drug against stored allergies, age, known conditions, and active courses.</div>
          </div>
          <div class="node-footer"><span>Pre-Flight Check</span><span class="node-tech">Deterministic</span></div>
        </div>
        <div class="decision-box" style="border-color:#F43F5E;">
          <div class="decision-label" style="color:#FB7185;">Critical Safety Gate</div>
          <div class="decision-q">Known Allergy Conflict Detected?</div>
          <div class="decision-branches">
            <span class="branch-no" style="background:rgba(244,63,94,0.3); border-color:#F43F5E;">CONFLICT ➔ BLOCK</span>
            <span class="branch-yes">SAFE ➔ Check DDI</span>
          </div>
        </div>
        <div class="decision-box">
          <div class="decision-label">Prescription Check</div>
          <div class="decision-q">Antibiotic Without Valid Prescription?</div>
          <div class="decision-branches">
            <span class="branch-no">UNPRESCRIBED ➔ Flag</span>
            <span class="branch-yes">VALID ➔ Confirm</span>
          </div>
        </div>
        <div class="node-box">
          <div>
            <div class="node-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Drug-Drug Interaction Scan
            </div>
            <div class="node-desc">Evaluates concurrent active regimens against drug_interactions table for severe or moderate flags.</div>
          </div>
          <div class="node-footer"><span>Safety Matrix</span><span class="node-tech">DDI Dataset</span></div>
        </div>
        <div class="node-box">
          <div>
            <div class="node-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Caregiver Emergency Alert
            </div>
            <div class="node-desc">Severe interaction triggers instant caregiver notification before user confirms intake.</div>
          </div>
          <div class="node-footer"><span>Escalation</span><span class="node-tech">Cross-Alert Push</span></div>
        </div>
      </div>
      <!-- SLA Box -->
      <div class="stage-sla-box">
        <div class="sla-title"><span style="color:#F59E0B;">●</span> Stage 4 Guardrail Gates</div>
        <div class="sla-metric"><strong>Refusal Guarantee:</strong> 100% Deterministic</div>
        <div class="sla-metric"><strong>Execution Latency:</strong> &le; 42ms pre-flight</div>
      </div>
    </div>

    <!-- STAGE 5: VERIFICATION, COMMIT & AMR ENGINE -->
    <div class="stage-col stage-5">
      <div class="stage-header">
        <div class="stage-meta">
          <span class="stage-num-badge">5</span>
          <span class="stage-tag stagetag-5">Commit & Track</span>
        </div>
        <div class="stage-title">Adherence & AMR Engine</div>
      </div>
      <div class="nodes-stack">
        <div class="node-box">
          <div>
            <div class="node-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              VerifyPrescription Modal
            </div>
            <div class="node-desc">Interactive review dialog: User verifies dosage, timing, duration, and dependent assignment.</div>
          </div>
          <div class="node-footer"><span>UI Interaction</span><span class="node-tech">Patient Approval</span></div>
        </div>
        <div class="node-box">
          <div>
            <div class="node-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
              Atomic Database Commit
            </div>
            <div class="node-desc">Inserts into medication_courses via Supabase RLS and schedules local Expo Push notifications.</div>
          </div>
          <div class="node-footer"><span>Database Engine</span><span class="node-tech">Supabase RLS</span></div>
        </div>
        <div class="node-box">
          <div>
            <div class="node-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Adherence Routine Loop
            </div>
            <div class="node-desc">User logs doses: trg_evaluate_badges updates streak. Missed doses trigger Caregiver Escalation Ladder.</div>
          </div>
          <div class="node-footer"><span>Continuous Loop</span><span class="node-tech">trg_evaluate</span></div>
        </div>
        <div class="node-box">
          <div>
            <div class="node-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              AMR Surveillance Stream
            </div>
            <div class="node-desc">Unprescribed buys & early course terminations pipe to misuse_events for regional k &ge; 5 AMR mapping.</div>
          </div>
          <div class="node-footer"><span>Public Health</span><span class="node-tech">K &ge; 5 Heatmap</span></div>
        </div>
        <div class="node-box">
          <div>
            <div class="node-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
              Course Completion Seal
            </div>
            <div class="node-desc">Unlocks Responsible Antibiotic User badge and generates antibiotic passport audit hash.</div>
          </div>
          <div class="node-footer"><span>Stewardship Seal</span><span class="node-tech">Immutable Badge</span></div>
        </div>
      </div>
      <!-- SLA Box -->
      <div class="stage-sla-box">
        <div class="sla-title"><span style="color:#10B981;">●</span> Stage 5 Commit & Security</div>
        <div class="sla-metric"><strong>Security Model:</strong> 100% RLS Policy Enforcement</div>
        <div class="sla-metric"><strong>Privacy Guarantee:</strong> Differential Privacy (k &ge; 5)</div>
      </div>
    </div>

  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">
      <span>Stage 1: Hardware Stream & Barcode</span>
      <span>➔</span>
      <span>Stage 2: ML Kit & Gemini Vision</span>
      <span>➔</span>
      <span>Stage 3: pg_trgm & WHO AWaRe</span>
      <span>➔</span>
      <span>Stage 4: Allergy & Safety Gate</span>
      <span>➔</span>
      <span>Stage 5: Adherence & AMR Heatmap</span>
    </div>
    <div>MedSentry Workflow Architecture Pipeline · 2400 × 1350 px</div>
  </div>

</body>
</html>'''

# -----------------------------------------------------------------------------
# 4. DATABASE ER & SECURITY MODEL DIAGRAM (2400x1350) - 100% FILLED, ZERO VOID
# -----------------------------------------------------------------------------
er_html = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>MedSentry Database ER & Security Model</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 2400px;
    height: 1350px;
    background: #080D1A;
    font-family: 'Google Sans Flex', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #F1F5F9;
    padding: 30px 44px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #1E293B;
    padding-bottom: 14px;
    margin-bottom: 14px;
  }
  .title-group {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .brand-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: linear-gradient(135deg, #10B981, #047857);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
  }
  .title-group h1 {
    font-size: 33px;
    font-weight: 800;
    color: #FFFFFF;
    letter-spacing: -0.5px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .title-group h1 span { color: #34D399; font-weight: 700; }
  .subtitle { font-size: 14px; color: #94A3B8; margin-top: 2px; font-weight: 500; }
  .header-badges { display: flex; align-items: center; gap: 10px; }
  .badge {
    padding: 6px 14px;
    border-radius: 30px;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .badge-emerald { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34D399; }
  .badge-purple { background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.4); color: #A78BFA; }

  /* 8 Tables Grid (4x2) */
  .schema-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 14px;
    flex: 1;
  }

  .table-card {
    background: #0E1626;
    border: 1.5px solid #1E293B;
    border-radius: 15px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  }

  .table-header {
    background: #131F35;
    padding: 10px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1.5px solid #1E293B;
  }
  .table-name {
    font-family: 'JetBrainsMono Nerd Font', 'JetBrains Mono', monospace;
    font-size: 13.5px;
    font-weight: 800;
    color: #F8FAFC;
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .rls-badge {
    font-size: 8.5px;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 5px;
  }
  .rls-enabled { background: rgba(16, 185, 129, 0.2); border: 1px solid #10B981; color: #34D399; }
  .rls-readonly { background: rgba(56, 189, 248, 0.2); border: 1px solid #38BDF8; color: #38BDF8; }
  .rls-append { background: rgba(139, 92, 246, 0.2); border: 1px solid #8B5CF6; color: #A78BFA; }
  .rls-privacy { background: rgba(245, 158, 11, 0.2); border: 1px solid #F59E0B; color: #FBBF24; }

  .column-list {
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    font-family: 'JetBrainsMono Nerd Font', 'JetBrains Mono', monospace;
    font-size: 11px;
    justify-content: space-around;
  }
  .col-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #CBD5E1;
  }
  .col-pk { color: #F59E0B; font-weight: 800; }
  .col-fk { color: #38BDF8; font-weight: 700; }
  .col-trigger { color: #34D399; font-weight: 700; }
  .col-type { color: #64748B; font-size: 9.5px; }

  .table-footer {
    background: #111A2E;
    border-top: 1px solid #1E2D4A;
    padding: 6px 14px;
    font-size: 9.5px;
    color: #94A3B8;
    display: flex;
    justify-content: space-between;
  }

  /* Footer */
  .footer {
    border-top: 2px solid #1E293B;
    padding-top: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: #64748B;
  }
  .footer-left {
    display: flex;
    align-items: center;
    gap: 18px;
    color: #94A3B8;
    font-weight: 600;
  }
</style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="title-group">
      <div class="brand-icon">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3"/>
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
        </svg>
      </div>
      <div>
        <h1>MedSentry <span>Database Schema & Security Model</span></h1>
        <div class="subtitle">Supabase PostgreSQL 15 Relational Core · 100% Row-Level Security (RLS) & Differential Privacy</div>
      </div>
    </div>
    <div class="header-badges">
      <div class="badge badge-emerald">PostgreSQL 15 Relational Schema</div>
      <div class="badge badge-purple">Zero Cross-Tenant Leakage</div>
    </div>
  </div>

  <!-- 8 Tables Grid (4x2) -->
  <div class="schema-grid">

    <!-- Table 1: profiles -->
    <div class="table-card">
      <div class="table-header">
        <span class="table-name">profiles</span>
        <span class="rls-badge rls-enabled">RLS ENABLED</span>
      </div>
      <div class="column-list">
        <div class="col-row"><span class="col-pk">🔑 id (UUID)</span><span class="col-type">auth.users FK</span></div>
        <div class="col-row"><span>full_name</span><span class="col-type">TEXT</span></div>
        <div class="col-row"><span>age, weight_kg, height</span><span class="col-type">NUMERIC</span></div>
        <div class="col-row"><span>known_conditions</span><span class="col-type">TEXT[]</span></div>
        <div class="col-row"><span style="color:#FB7185;">allergies</span><span class="col-type">TEXT[] (Safety)</span></div>
        <div class="col-row"><span style="color:#FBBF24;">caregiver_consent_revoked</span><span class="col-type">BOOLEAN</span></div>
        <div class="col-row"><span>is_admin, account_type</span><span class="col-type">BOOL / ENUM</span></div>
        <div class="col-row"><span>preferred_language</span><span class="col-type">TEXT DEFAULT 'en'</span></div>
      </div>
      <div class="table-footer"><span>Policy: auth.uid() = id</span><span>Indexes: id (PK)</span></div>
    </div>

    <!-- Table 2: medication_courses -->
    <div class="table-card">
      <div class="table-header">
        <span class="table-name">medication_courses</span>
        <span class="rls-badge rls-enabled">RLS ENABLED</span>
      </div>
      <div class="column-list">
        <div class="col-row"><span class="col-pk">🔑 id (UUID)</span><span class="col-type">PRIMARY KEY</span></div>
        <div class="col-row"><span class="col-fk">user_id (UUID)</span><span class="col-type">profiles FK</span></div>
        <div class="col-row"><span class="col-fk">drug_id (UUID)</span><span class="col-type">drugs FK</span></div>
        <div class="col-row"><span class="col-fk">prescription_id (UUID)</span><span class="col-type">prescriptions FK</span></div>
        <div class="col-row"><span>total_pills, daily_dose</span><span class="col-type">INTEGER</span></div>
        <div class="col-row"><span>days_remaining</span><span class="col-type">INTEGER</span></div>
        <div class="col-row"><span style="color:#34D399;">is_antibiotic, necessity</span><span class="col-type">BOOL / ENUM</span></div>
        <div class="col-row"><span>status ('active'|'stopped')</span><span class="col-type">TEXT</span></div>
      </div>
      <div class="table-footer"><span>Policy: Caregiver & Self Access</span><span>Indexes: user_id, drug_id</span></div>
    </div>

    <!-- Table 3: dose_logs -->
    <div class="table-card">
      <div class="table-header">
        <span class="table-name">dose_logs</span>
        <span class="rls-badge rls-enabled">RLS ENABLED</span>
      </div>
      <div class="column-list">
        <div class="col-row"><span class="col-pk">🔑 id (UUID)</span><span class="col-type">PRIMARY KEY</span></div>
        <div class="col-row"><span class="col-fk">course_id (UUID)</span><span class="col-type">courses FK</span></div>
        <div class="col-row"><span>scheduled_time</span><span class="col-type">TIMESTAMPTZ</span></div>
        <div class="col-row"><span>status</span><span class="col-type">'taken'|'skipped'</span></div>
        <div class="col-row"><span class="col-fk">confirmed_by (UUID)</span><span class="col-type">profiles FK</span></div>
        <div class="col-row"><span class="col-trigger">⚡ trg_evaluate_badges</span><span class="col-type">TRIGGER</span></div>
        <div class="col-row"><span class="col-trigger">⚡ trg_track_misuse</span><span class="col-type">TRIGGER</span></div>
        <div class="col-row"><span>logged_at</span><span class="col-type">TIMESTAMPTZ</span></div>
      </div>
      <div class="table-footer"><span>Policy: Circle Member Access</span><span>Indexes: course_id, status</span></div>
    </div>

    <!-- Table 4: drugs Reference -->
    <div class="table-card">
      <div class="table-header">
        <span class="table-name">drugs (Formulary)</span>
        <span class="rls-badge rls-readonly">READ ONLY</span>
      </div>
      <div class="column-list">
        <div class="col-row"><span class="col-pk">🔑 id (UUID)</span><span class="col-type">PRIMARY KEY</span></div>
        <div class="col-row"><span>name</span><span class="col-type">TEXT (GIN TRGM)</span></div>
        <div class="col-row"><span>generic_name</span><span class="col-type">TEXT</span></div>
        <div class="col-row"><span style="color:#34D399;">aware_class</span><span class="col-type">WHO ENUM</span></div>
        <div class="col-row"><span>common_uses</span><span class="col-type">TEXT</span></div>
        <div class="col-row"><span>side_effects, warnings</span><span class="col-type">TEXT</span></div>
        <div class="col-row"><span class="col-trigger">⚡ fuzzy_search_drug</span><span class="col-type">RPC STORED</span></div>
        <div class="col-row"><span>interaction_notes</span><span class="col-type">TEXT</span></div>
      </div>
      <div class="table-footer"><span>Policy: Public Authenticated Read</span><span>Indexes: GIN (name, generic)</span></div>
    </div>

    <!-- Table 5: family_groups -->
    <div class="table-card">
      <div class="table-header">
        <span class="table-name">family_groups</span>
        <span class="rls-badge rls-enabled">RLS ENABLED</span>
      </div>
      <div class="column-list">
        <div class="col-row"><span class="col-pk">🔑 id (UUID)</span><span class="col-type">PRIMARY KEY</span></div>
        <div class="col-row"><span>name</span><span class="col-type">TEXT</span></div>
        <div class="col-row"><span class="col-fk">owner_id (UUID)</span><span class="col-type">profiles FK</span></div>
        <div class="col-row"><span style="color:#FBBF24;">invite_code (6-char)</span><span class="col-type">TEXT UNIQUE</span></div>
        <div class="col-row"><span>created_at</span><span class="col-type">TIMESTAMPTZ</span></div>
        <div class="col-row"><span class="col-trigger">⚡ check_circle_read</span><span class="col-type">SECURITY DEF</span></div>
        <div class="col-row"><span>member_count</span><span class="col-type">INT DEFAULT 1</span></div>
        <div class="col-row"><span>shared_cabinet_enabled</span><span class="col-type">BOOLEAN</span></div>
      </div>
      <div class="table-footer"><span>Policy: Group Membership Gated</span><span>Indexes: invite_code (UNIQUE)</span></div>
    </div>

    <!-- Table 6: family_members -->
    <div class="table-card">
      <div class="table-header">
        <span class="table-name">family_members</span>
        <span class="rls-badge rls-enabled">RLS ENABLED</span>
      </div>
      <div class="column-list">
        <div class="col-row"><span class="col-pk">🔑 id (UUID)</span><span class="col-type">PRIMARY KEY</span></div>
        <div class="col-row"><span class="col-fk">group_id (UUID)</span><span class="col-type">groups FK</span></div>
        <div class="col-row"><span class="col-fk">member_id (UUID)</span><span class="col-type">profiles FK</span></div>
        <div class="col-row"><span style="color:#38BDF8;">role</span><span class="col-type">'owner'|'caregiver'</span></div>
        <div class="col-row"><span>is_linked_dependent</span><span class="col-type">BOOLEAN</span></div>
        <div class="col-row"><span class="col-trigger">⚡ check_caregiver</span><span class="col-type">SECURITY DEF</span></div>
        <div class="col-row"><span>joined_at</span><span class="col-type">TIMESTAMPTZ</span></div>
        <div class="col-row"><span>consent_granted_at</span><span class="col-type">TIMESTAMPTZ</span></div>
      </div>
      <div class="table-footer"><span>Policy: Circle Co-Management</span><span>Indexes: group_id, member_id</span></div>
    </div>

    <!-- Table 7: caregiver_audit_log -->
    <div class="table-card">
      <div class="table-header">
        <span class="table-name">caregiver_audit_log</span>
        <span class="rls-badge rls-append">APPEND ONLY</span>
      </div>
      <div class="column-list">
        <div class="col-row"><span class="col-pk">🔑 id (UUID)</span><span class="col-type">PRIMARY KEY</span></div>
        <div class="col-row"><span class="col-fk">caregiver_id (UUID)</span><span class="col-type">profiles FK</span></div>
        <div class="col-row"><span class="col-fk">target_member_id (UUID)</span><span class="col-type">profiles FK</span></div>
        <div class="col-row"><span>action</span><span class="col-type">TEXT</span></div>
        <div class="col-row"><span>details (payload)</span><span class="col-type">JSONB</span></div>
        <div class="col-row"><span>device_id, ip_address</span><span class="col-type">TEXT</span></div>
        <div class="col-row"><span>created_at</span><span class="col-type">TIMESTAMPTZ</span></div>
        <div class="col-row"><span class="col-trigger">⚡ immutable_insert</span><span class="col-type">NO UPDATE/DEL</span></div>
      </div>
      <div class="table-footer"><span>Policy: Append Only Audit Trail</span><span>Indexes: caregiver_id, target_id</span></div>
    </div>

    <!-- Table 8: misuse_events (AMR Heatmap) -->
    <div class="table-card">
      <div class="table-header">
        <span class="table-name">misuse_events</span>
        <span class="rls-badge rls-privacy">K &ge; 5 PRIVACY</span>
      </div>
      <div class="column-list">
        <div class="col-row"><span class="col-pk">🔑 id (UUID)</span><span class="col-type">PRIMARY KEY</span></div>
        <div class="col-row"><span>region (De-identified)</span><span class="col-type">TEXT</span></div>
        <div class="col-row"><span>drug_category</span><span class="col-type">TEXT</span></div>
        <div class="col-row"><span style="color:#FB7185;">event_type</span><span class="col-type">'unprescribed'</span></div>
        <div class="col-row"><span class="col-trigger">⚡ get_amr_heatmap()</span><span class="col-type">RPC VIEW (k &ge; 5)</span></div>
        <div class="col-row"><span>created_at</span><span class="col-type">TIMESTAMPTZ</span></div>
        <div class="col-row"><span>laplace_noise_sigma</span><span class="col-type">NUMERIC (DP)</span></div>
        <div class="col-row"><span>cluster_k_count</span><span class="col-type">INT (&ge; 5)</span></div>
      </div>
      <div class="table-footer"><span>Policy: Differential Privacy K &ge; 5</span><span>Indexes: region, event_type</span></div>
    </div>

  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">
      <span>14 Normalized Relational Tables</span>
      <span>·</span>
      <span>Zero Cross-User Data Leakage (100% RLS Enforcement)</span>
      <span>·</span>
      <span>pg_trgm Trigram GIN Search</span>
      <span>·</span>
      <span>Differential Privacy (k &ge; 5)</span>
    </div>
    <div>Supabase Cloud PostgreSQL 15 · Database Security Model · 2400 × 1350 px</div>
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
    os.remove(tmp_path)
    print(f'✅ Generated diagram: {filename} (2400x1350) successfully!')

print('🎉 All 4 architectural, taxonomy, workflow, and ER diagrams generated successfully!')
