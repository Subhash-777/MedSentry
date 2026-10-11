import os, subprocess, tempfile
import pygments
from pygments.lexers import get_lexer_by_name
from pygments.formatters import HtmlFormatter

snippets = [
    {
        'filename': '01_backend_supabase_client.png',
        'title': 'mobile-app/src/lib/supabase.ts',
        'badge': 'Supabase Client · Session Persistence',
        'lang': 'typescript',
        'width': 1180,
        'height': 680,
        'code': '''import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables.\\n' +
      'Copy mobile-app/.env.example to mobile-app/.env and fill in your project values.',
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});'''
    },
    {
        'filename': '02_backend_ai_router_edge_function.png',
        'title': 'supabase/functions/ai-router/index.ts',
        'badge': 'Deno Edge Function · Multi-Model Router',
        'lang': 'typescript',
        'width': 1240,
        'height': 820,
        'code': '''// Deterministic server-side allergy pre-check against user's recorded allergies
if (profile?.allergies && Array.isArray(profile.allergies) && profile.allergies.length > 0) {
  const drugTargetText = `${drug.name || ""} ${drug.category || ""} ${drug.aware_class || ""}`.toLowerCase();
  for (const allergy of profile.allergies) {
    const allergyTerm = String(allergy).trim().toLowerCase();
    if (allergyTerm.length >= 3 && drugTargetText.includes(allergyTerm)) {
      allergyMatchWarning = `CRITICAL SAFETY WARNING: The user has a recorded allergy to '${allergy}'. ` +
        `The target drug '${drug.name}' matches this allergy category ('${drug.category || drug.name}'). ` +
        `YOU MUST LEAD YOUR RESPONSE WITH AN EXPLICIT, HIGH-PRIORITY ALLERGY WARNING IN BOLD.`;
      break;
    }
  }
}

// Multi-Tier AI Provider Routing with Guardrails
if (geminiKey) {
  try {
    const res = await callGemini(geminiKey, request_type, messages, image_base64, systemPrompt, query);
    await logUsage(adminClient, userId, "gemini", request_type, res.tokens, res.latency, "success");
    const { safeText, flagged, guardTriggered } = applyGuardrails(query, res.response);
    return new Response(JSON.stringify({ text: safeText, provider: "gemini", flagged, guardTriggered, necessityFlag, parsed }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    // Graceful fallback to Tier 3 (Groq Llama 3)
    await logUsage(adminClient, userId, "gemini", request_type, 0, 0, "fallback_to_groq");
  }
}'''
    },
    {
        'filename': '03_backend_ocr_fuzzy_search_rpc.png',
        'title': 'supabase/migrations/20261010000001_ocr_fuzzy_search_trgm.sql',
        'badge': 'PostgreSQL · pg_trgm Trigram Matching RPC',
        'lang': 'sql',
        'width': 1180,
        'height': 720,
        'code': '''-- Enable PostgreSQL trigram extension for fault-tolerant fuzzy OCR search
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Create GIN Trigram index for high-performance sub-linear fuzzy matching
CREATE INDEX IF NOT EXISTS idx_drugs_name_trgm 
ON public.drugs USING gin (name extensions.gin_trgm_ops);

-- Stored RPC function for fuzzy OCR drug candidates
CREATE OR REPLACE FUNCTION public.fuzzy_search_drug(search_terms text[])
RETURNS TABLE(id uuid, name text, similarity real)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    d.id, 
    d.name,
    extensions.similarity(d.name, term) as similarity
  FROM public.drugs d
  CROSS JOIN unnest(search_terms) as term
  WHERE length(term) >= 4
    AND extensions.similarity(d.name, term) >= 0.40
  ORDER BY similarity DESC
  LIMIT 5;
$$;'''
    },
    {
        'filename': '04_backend_badge_trigger_engine.png',
        'title': 'supabase/migrations/20260719183000_phase6_user_badges.sql',
        'badge': 'Database Trigger · Streak Gamification',
        'lang': 'sql',
        'width': 1200,
        'height': 850,
        'code': '''-- Trigger function: Evaluate adherence streak & unlock badges upon dose logging
CREATE OR REPLACE FUNCTION public.evaluate_user_badges()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_consecutive_days INT;
BEGIN
  SELECT user_id INTO v_user_id FROM public.medication_courses WHERE id = NEW.course_id;

  -- 1. Award First Dose Logged Badge
  INSERT INTO public.user_badges (user_id, badge_type)
  VALUES (v_user_id, 'first_dose_logged')
  ON CONFLICT (user_id, badge_type) DO NOTHING;

  -- 2. Calculate consecutive dose logging streak
  WITH daily_doses AS (
    SELECT DISTINCT DATE(taken_at) as log_date
    FROM public.dose_logs dl
    JOIN public.medication_courses mc ON dl.course_id = mc.id
    WHERE mc.user_id = v_user_id AND dl.status = 'taken'
  ),
  streak_calc AS (
    SELECT COUNT(*) as streak_days
    FROM daily_doses
    WHERE log_date >= CURRENT_DATE - INTERVAL '7 days'
  )
  SELECT streak_days INTO v_consecutive_days FROM streak_calc;

  -- 3. Award 7-Day Adherence Streak Badge
  IF v_consecutive_days >= 7 THEN
    INSERT INTO public.user_badges (user_id, badge_type)
    VALUES (v_user_id, '7_day_streak')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_evaluate_badges
AFTER INSERT ON public.dose_logs
FOR EACH ROW EXECUTE FUNCTION public.evaluate_user_badges();'''
    },
    {
        'filename': '05_backend_amr_differential_privacy_rpc.png',
        'title': 'supabase/migrations/20260723183000_phase6_amr_heatmap_rpc.sql',
        'badge': 'SQL RPC · K-Anonymity Surveillance (K ≥ 5)',
        'lang': 'sql',
        'width': 1240,
        'height': 860,
        'code': '''CREATE OR REPLACE FUNCTION public.get_amr_heatmap()
RETURNS TABLE (
    region TEXT,
    drug_category TEXT,
    event_type TEXT,
    total_30d_count BIGINT,
    is_elevated BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    WITH stats AS (
      SELECT
        region,
        drug_category,
        event_type,
        COUNT(*) FILTER (WHERE created_at >= (NOW() - INTERVAL '30 days')) AS total_30d_count,
        COUNT(*) FILTER (WHERE created_at >= (NOW() - INTERVAL '7 days')) AS recent_7d_count,
        COUNT(*) FILTER (WHERE created_at >= (NOW() - INTERVAL '97 days') 
                           AND created_at < (NOW() - INTERVAL '7 days')) AS baseline_count,
        MIN(created_at) FILTER (WHERE created_at >= (NOW() - INTERVAL '97 days') 
                                  AND created_at < (NOW() - INTERVAL '7 days')) AS baseline_start_dt
      FROM public.misuse_events
      WHERE created_at >= (NOW() - INTERVAL '97 days')
        AND region IS NOT NULL
      GROUP BY region, drug_category, event_type
    )
    SELECT
      region, drug_category, event_type, total_30d_count,
      CASE
        -- 1. Noise filter: Require >= 5 events in last 7 days for spike consideration
        WHEN recent_7d_count < 5 THEN false
        -- 2. Anomaly detection: 7-day daily average >= 2.5x baseline daily rate
        WHEN (recent_7d_count / 7.0) >= 2.5 * (baseline_count / 
             (EXTRACT(EPOCH FROM ((NOW() - INTERVAL '7 days') - baseline_start_dt))/86400.0)) THEN true
        ELSE false
      END AS is_elevated
    FROM stats
    WHERE total_30d_count >= 5; -- Strict K-Anonymity Threshold (K >= 5)
$$;'''
    },
    {
        'filename': '06_backend_caregiver_rbac_rls.png',
        'title': 'supabase/migrations/20260719120000_phase4_family_circles.sql',
        'badge': 'PostgreSQL Security Definer · RLS Policies',
        'lang': 'sql',
        'width': 1200,
        'height': 720,
        'code': '''-- Security Definer: Authorizes caregiver actions respecting self-sovereignty consent
CREATE OR REPLACE FUNCTION public.check_caregiver_access(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.family_members m_actor
    JOIN public.family_members m_target ON m_actor.group_id = m_target.group_id
    JOIN public.profiles p_target ON p_target.id = target_user_id
    WHERE m_actor.member_id = auth.uid()
      AND m_target.member_id = target_user_id
      AND m_actor.role IN ('owner', 'caregiver')
      AND p_target.caregiver_consent_revoked = false -- Self-Sovereignty Privacy Check
  );
$$;

-- RLS Policy: Allow authorized caregivers to view dependent medication courses
CREATE POLICY "Caregiver circle read access on courses"
ON public.medication_courses FOR SELECT
USING (
  auth.uid() = user_id OR public.check_caregiver_access(user_id)
);'''
    },
    {
        'filename': '07_backend_admin_api_edge_function.png',
        'title': 'supabase/functions/admin-api/index.ts',
        'badge': 'Deno Edge Function · Service-Role Admin API',
        'lang': 'typescript',
        'width': 1240,
        'height': 760,
        'code': '''// Administrative User Deletion & Deactivation with GoTrue & Audit Log
serve(async (req) => {
  const { action, targetUserId, reason } = await req.json();
  const authHeader = req.headers.get("Authorization");
  
  // Verify Admin Claim
  const { data: { user } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
  const { data: profile } = await adminClient.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return new Response("Unauthorized: Admin privileges required", { status: 403 });

  if (action === "delete_user") {
    // 1. Audit trail record
    await adminClient.from("caregiver_audit_log").insert({
      caregiver_id: user.id, target_member_id: targetUserId,
      action: "admin_user_deleted", details: { reason }
    });
    // 2. Multi-table cleanup & GoTrue deletion
    await adminClient.from("medication_courses").delete().eq("user_id", targetUserId);
    await adminClient.from("profiles").delete().eq("id", targetUserId);
    await adminClient.auth.admin.deleteUser(targetUserId);
    return new Response(JSON.stringify({ success: true, message: "User deleted cleanly" }));
  }
});'''
    },
    {
        'filename': '08_frontend_ocr_spatial_clustering.png',
        'title': 'mobile-app/src/lib/ocr.ts',
        'badge': 'OCR Heuristics · 2D Spatial Layout Clustering',
        'lang': 'typescript',
        'width': 1240,
        'height': 820,
        'code': '''/**
 * 2D Spatial Layout Reconstruction:
 * Group OCR lines into horizontal table rows based on vertical Y-overlap (Δy <= 65% height),
 * then sort each row left-to-right by X-coordinate. Preserves physical tabular rows.
 */
function clusterLinesSpatially(blocks: MlkitOcrResult): { lines: string[]; fullText: string } {
  const rawLines: LineWithCoords[] = extractLinesWithBoundingBoxes(blocks);
  rawLines.sort((a, b) => a.top - b.top); // Sort primarily by top Y

  const rows: LineWithCoords[][] = [];
  let currentRow: LineWithCoords[] = [];
  let currentY = rawLines[0].top;
  let currentHeight = rawLines[0].height;

  for (const item of rawLines) {
    const verticalDiff = Math.abs(item.top - currentY);
    const threshold = Math.max(item.height, currentHeight) * 0.65;

    if (currentRow.length === 0 || verticalDiff <= threshold) {
      currentRow.push(item);
      currentY = currentRow.reduce((acc, l) => acc + l.top, 0) / currentRow.length;
      currentHeight = currentRow.reduce((acc, l) => acc + l.height, 0) / currentRow.length;
    } else {
      rows.push(currentRow);
      currentRow = [item];
      currentY = item.top;
      currentHeight = item.height;
    }
  }
  if (currentRow.length > 0) rows.push(currentRow);

  // Sort each row left-to-right (X-clustering) to align medicine with dosage and schedule
  return {
    lines: rows.map(row => row.sort((a, b) => a.left - b.left).map(r => r.text).join(' ').trim()),
    fullText: rows.map(r => r.map(c => c.text).join(' ')).join(' ')
  };
}'''
    },
    {
        'filename': '09_frontend_levenshtein_drug_matching.png',
        'title': 'mobile-app/src/lib/ocr.ts',
        'badge': 'Catalog Matcher · Levenshtein Distance (>= 70%)',
        'lang': 'typescript',
        'width': 1200,
        'height': 760,
        'code': '''/**
 * Fast client-side Levenshtein distance for fuzzy matching against drug catalog
 * Absorbs OCR optical scanning errors (e.g. 'Amoxlcillin' or 'Paracetam0l' -> catalog matches)
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      if (a[i - 1].toLowerCase() === b[j - 1].toLowerCase()) {
        dp[j] = prev;
      } else {
        dp[j] = 1 + Math.min(prev, dp[j], dp[j - 1]);
      }
      prev = temp;
    }
  }
  return dp[n];
}

export function calculateSimilarity(s1: string, s2: string): number {
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  return (maxLen - levenshteinDistance(s1, s2)) / maxLen;
}'''
    },
    {
        'filename': '10_frontend_proxy_dose_logging.png',
        'title': 'mobile-app/src/screens/family/MemberProfileScreen.tsx',
        'badge': 'Caregiver Action · Proxy Dose & Audit Logging',
        'lang': 'typescript',
        'width': 1220,
        'height': 780,
        'code': '''// Logs adherence dose on dependent's behalf with automated caregiver security audit entry
const handleLogDoseForMember = async (courseId: string, drugLabel: string) => {
  setLoggingDoseId(courseId);
  try {
    // 1. Record adherence dose in dose_logs
    const { error } = await supabase.from('dose_logs').insert({
      course_id: courseId,
      status: 'taken',
    });
    if (error) throw error;

    // 2. Automatically record entry in caregiver audit trail if acting on dependent's behalf
    if (user && user.id !== memberId) {
      await supabase.from('caregiver_audit_log').insert({
        caregiver_id: user.id,
        target_member_id: memberId,
        action: 'dose_logged_for_dependent',
        details: { course_id: courseId, drug_name: drugLabel, timestamp: new Date().toISOString() },
      });
    }

    Alert.alert('✅ Dose Logged', `Logged dose for ${memberName} (${drugLabel}).`);
    fetchMemberDetails();
  } catch (err: any) {
    Alert.alert('Error', err.message || 'Failed to log dose.');
  } finally {
    setLoggingDoseId(null);
  }
};'''
    }
]

out_dir = '/home/subhash/projects/MedSentry/report_assets/code_snippets'
os.makedirs(out_dir, exist_ok=True)

for item in snippets:
    lexer = get_lexer_by_name(item['lang'])
    formatter = HtmlFormatter(style='dracula', nowrap=True)
    raw_lines = item['code'].strip().split('\n')
    
    table_rows = []
    for idx, line in enumerate(raw_lines, 1):
        hl = pygments.highlight(line, lexer, formatter).strip()
        table_rows.append(f'''<tr>
          <td class="line-num">{idx}</td>
          <td class="line-code"><pre>{hl if hl else " "}</pre></td>
        </tr>''')
    
    table_html = '\n'.join(table_rows)

    w = item['width']
    h = item['height']

    html_content = f'''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  ::-webkit-scrollbar {{ display: none; }}
  body {{
    background: #0B0F17;
    width: {w}px;
    height: {h}px;
    padding: 30px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }}
  .window {{
    background: #111827;
    border: 1.5px solid #283548;
    border-radius: 18px;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85);
    overflow: hidden;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }}
  .titlebar {{
    background: #192231;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1.5px solid #283548;
    flex-shrink: 0;
  }}
  .dots {{
    display: flex;
    gap: 10px;
  }}
  .dot {{
    width: 13px;
    height: 13px;
    border-radius: 50%;
  }}
  .dot-red {{ background: #EF4444; }}
  .dot-yellow {{ background: #F59E0B; }}
  .dot-green {{ background: #10B981; }}
  .filename {{
    color: #F3F4F6;
    font-family: 'JetBrains Mono', 'Fira Code', 'Menlo', 'Courier New', monospace;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.4px;
  }}
  .badge {{
    background: rgba(45, 106, 79, 0.35);
    border: 1px solid #2D6A4F;
    color: #52B788;
    padding: 5px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }}
  .code-body {{
    padding: 24px 10px;
    flex: 1;
    overflow: hidden;
  }}
  .code-table {{
    width: 100%;
    border-collapse: collapse;
    font-family: 'JetBrains Mono', 'Fira Code', 'Menlo', 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.65;
  }}
  .line-num {{
    width: 55px;
    text-align: right;
    padding: 1px 18px 1px 12px;
    color: #4B5563;
    user-select: none;
    vertical-align: top;
    font-size: 13px;
    border-right: 1px solid #283548;
  }}
  .line-code {{
    padding: 1px 24px 1px 18px;
    color: #E5E7EB;
    vertical-align: top;
    white-space: pre;
  }}
  pre {{
    margin: 0;
    font-family: inherit;
  }}
  /* Dracula custom overrides */
  .k, .kd, .kr {{ color: #FF79C6; font-weight: bold; }}
  .s, .s1, .s2 {{ color: #F1FA8C; }}
  .c, .c1, .cm {{ color: #6272A4; font-style: italic; }}
  .nf, .na {{ color: #50FA7B; }}
  .nb, .nc {{ color: #8BE9FD; }}
  .mi, .mf {{ color: #BD93F9; }}
  .o, .p {{ color: #F8F8F2; }}
</style>
</head>
<body>
  <div class="window">
    <div class="titlebar">
      <div class="dots">
        <div class="dot dot-red"></div>
        <div class="dot dot-yellow"></div>
        <div class="dot dot-green"></div>
      </div>
      <div class="filename">{item['title']}</div>
      <div class="badge">{item['badge']}</div>
    </div>
    <div class="code-body">
      <table class="code-table">
        {table_html}
      </table>
    </div>
  </div>
</body>
</html>'''

    with tempfile.NamedTemporaryFile('w', suffix='.html', delete=False) as f:
        f.write(html_content)
        tmp_path = f.name
    
    out_file = os.path.join(out_dir, item['filename'])
    cmd = [
        '/usr/bin/brave',
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        f'--window-size={w},{h}',
        f'--screenshot={out_file}',
        f'file://{tmp_path}'
    ]
    subprocess.run(cmd, check=True)
    print(f'Generated {item["filename"]} ({w}x{h}) successfully!')

print('🎉 All 10 code snippet cards generated with zero scrollbars!')
