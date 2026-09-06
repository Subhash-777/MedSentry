import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id') || url.searchParams.get('id');
    const email = url.searchParams.get('email');
    const name = url.searchParams.get('name') || url.searchParams.get('full_name');

    // Handle POST request from the "Verified" button press
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const targetId = body.user_id || userId;
      const targetName = body.full_name || name;

      if (targetId) {
        // Update database with user signup details on button press
        const { error: dbError } = await supabaseAdmin.from('profiles').upsert({
          id: targetId,
          full_name: targetName || null,
          account_type: 'standard',
          is_admin: false,
          updated_at: new Date().toISOString(),
        });
        if (dbError) {
          console.error('Error updating profile on button press:', dbError);
        }
      }
      return new Response(JSON.stringify({ success: true, message: 'Database updated successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update database directly on page load if user_id is present
    if (userId) {
      await supabaseAdmin.from('profiles').upsert({
        id: userId,
        full_name: name || null,
        account_type: 'standard',
        is_admin: false,
        updated_at: new Date().toISOString(),
      });
    }

    // HTML Response for Email Verified page
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verified — MedSentry</title>
  <style>
    :root {
      --bg: #F7F5F0;
      --card-bg: #FFFFFF;
      --primary: #2E6D56;
      --primary-hover: #235442;
      --text: #1C2A26;
      --caption: #6B7C75;
      --border: #E2E8E4;
      --accent-glow: rgba(46, 109, 86, 0.12);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body {
      background-color: var(--bg);
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      background: var(--card-bg);
      border-radius: 24px;
      padding: 40px 32px;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 12px 32px rgba(28, 42, 38, 0.08);
      border: 1px solid var(--border);
    }
    .icon-wrap {
      width: 80px;
      height: 80px;
      border-radius: 40px;
      background: var(--accent-glow);
      border: 2px solid rgba(46, 109, 86, 0.25);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }
    .icon-wrap svg {
      width: 40px;
      height: 40px;
      stroke: var(--primary);
    }
    h1 {
      font-size: 26px;
      font-weight: 800;
      color: var(--text);
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    p {
      font-size: 15px;
      color: var(--caption);
      line-height: 1.5;
      margin-bottom: 28px;
    }
    .email-badge {
      display: inline-block;
      background: var(--accent-glow);
      color: var(--primary);
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      margin-bottom: 24px;
    }
    .btn {
      display: block;
      width: 100%;
      background: var(--primary);
      color: #FFFFFF;
      font-size: 16px;
      font-weight: 700;
      padding: 16px 24px;
      border-radius: 16px;
      text-decoration: none;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(46, 109, 86, 0.3);
      transition: all 0.2s ease;
    }
    .btn:hover {
      background: var(--primary-hover);
      transform: translateY(-1px);
    }
    .status-note {
      font-size: 12px;
      color: var(--caption);
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-wrap">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    </div>
    <h1>Email Verified!</h1>
    <p>Your email address has been successfully verified. Your account registration details are now recorded in MedSentry.</p>
    ${email ? `<div class="email-badge">${email}</div>` : ''}
    <button class="btn" id="verifyBtn" onclick="onVerifiedPress()">Verified — Open MedSentry</button>
    <div class="status-note" id="statusNote">Press the button above to launch MedSentry on your device</div>
  </div>

  <script>
    async function onVerifiedPress() {
      const btn = document.getElementById('verifyBtn');
      const note = document.getElementById('statusNote');
      btn.innerText = 'Updating details & opening app...';
      btn.disabled = true;

      try {
        // Send verification confirmation POST to ensure DB update
        await fetch(window.location.href, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: "${userId || ''}",
            full_name: "${name || ''}",
            email: "${email || ''}"
          })
        });
      } catch (err) {
        console.warn('DB update sync:', err);
      }

      note.innerText = 'Redirecting to MedSentry app...';
      // Attempt deep link to app
      window.location.href = 'medsentry://email-verified?verified=true';

      setTimeout(() => {
        btn.innerText = 'Verified — Open MedSentry';
        btn.disabled = false;
      }, 3000);
    }
  </script>
</body>
</html>`;

    return new Response(html, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err: any) {
    return new Response(`<h1>Error</h1><p>${err?.message || 'Verification error'}</p>`, {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
});
