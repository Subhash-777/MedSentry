import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // 1. Initialize client using the caller's auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error("Missing Authorization header")

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // 2. Cryptographically verify the JWT against Supabase Auth
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: userError }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 3. Verify Admin Status natively (THIS IS THE SINGLE GATE FOR ALL ACTIONS)
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 4. Admin is verified. Use Service Role for requested action.
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
    const body = await req.json()
    const { action, payload } = body

    if (action === 'get_dashboard_data') {
      const [profilesRes, authUsersRes, groups, usage, syncs, admin_audits, caregiver_audits] = await Promise.all([
        supabaseAdmin.from('profiles').select('*'),
        supabaseAdmin.auth.admin.listUsers(),
        supabaseAdmin.from('family_groups').select('id, name, owner_id, created_at'),
        supabaseAdmin.from('api_usage_logs').select('*').order('created_at', { ascending: false }).limit(100),
        supabaseAdmin.from('dataset_sync_log').select('*').order('last_refreshed_at', { ascending: false }).limit(20),
        supabaseAdmin.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(100),
        supabaseAdmin.from('caregiver_audit_log').select('*').order('created_at', { ascending: false }).limit(100)
      ])

      const authUsersMap = new Map((authUsersRes.data?.users || []).map((u: any) => [u.id, u]))

      const enrichedUsers = (profilesRes.data || []).map((p: any) => {
        const authUser = authUsersMap.get(p.id)
        return {
          ...p,
          email: authUser?.email || null,
          is_banned: authUser?.banned_until ? new Date(authUser.banned_until) > new Date() : false,
          banned_until: authUser?.banned_until || null,
          confirmed_at: authUser?.email_confirmed_at || null,
          last_sign_in_at: authUser?.last_sign_in_at || null,
        }
      })

      return new Response(JSON.stringify({
        users: enrichedUsers,
        groups: groups.data,
        usage: usage.data,
        syncs: syncs.data,
        admin_audits: admin_audits.data,
        caregiver_audits: caregiver_audits.data
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Server-side validation for destructive/corrective actions
    if (['deactivate_user', 'activate_user', 'delete_user', 'update_profile', 'disband_circle'].includes(action)) {
      if (!payload?.reason || payload.reason.trim() === '') {
        return new Response(JSON.stringify({ error: 'A mandatory reason must be provided for this action.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    if (action === 'get_user_details') {
      const target_id = payload.target_user_id
      const [coursesRes, familyRes, userAuditRes] = await Promise.all([
        supabaseAdmin.from('medication_courses').select('id, custom_name, status, created_at').eq('user_id', target_id),
        supabaseAdmin.from('family_members').select('group_id, role, is_linked_dependent, family_groups(name)').eq('member_id', target_id),
        supabaseAdmin.from('admin_audit_log').select('*').eq('target_user_id', target_id).order('created_at', { ascending: false }).limit(20)
      ])
      return new Response(JSON.stringify({
        courses: coursesRes.data || [],
        family: familyRes.data || [],
        audits: userAuditRes.data || []
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'deactivate_user') {
      const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(payload.target_user_id, { ban_duration: '876000h' })
      if (banError) throw banError

      await supabaseAdmin.from('admin_audit_log').insert({
        admin_id: user.id,
        target_user_id: payload.target_user_id,
        action: 'deactivate_user',
        details: { reason: payload.reason }
      })
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'activate_user') {
      const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(payload.target_user_id, { ban_duration: 'none' })
      if (unbanError) throw unbanError

      await supabaseAdmin.from('admin_audit_log').insert({
        admin_id: user.id,
        target_user_id: payload.target_user_id,
        action: 'activate_user',
        details: { reason: payload.reason }
      })
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'delete_user') {
      const target_id = payload.target_user_id;

      // 1. Log administrative audit entry prior to deletion
      await supabaseAdmin.from('admin_audit_log').insert({
        admin_id: user.id,
        target_user_id: target_id,
        action: 'delete_user',
        details: { reason: payload.reason }
      })

      // 2. Delete user from Auth FIRST (GoTrue Admin API).
      // If GoTrue fails or throws, execution stops immediately and NO profile/database data is deleted.
      const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(target_id)
      if (delError) {
        throw new Error(`Auth user deletion failed: ${delError.message || JSON.stringify(delError)}`)
      }

      // 3. Clean up any remaining database rows (Postgres ON DELETE CASCADE will also fire automatically)
      await supabaseAdmin.from('medication_courses').delete().eq('user_id', target_id)
      await supabaseAdmin.from('family_members').delete().eq('member_id', target_id)
      await supabaseAdmin.from('profiles').delete().eq('id', target_id)

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'update_profile') {
      const { data, error } = await supabaseAdmin.from('profiles').update({ full_name: payload.full_name }).eq('id', payload.target_user_id).select().single()
      if (error) throw error
      
      await supabaseAdmin.from('admin_audit_log').insert({
        admin_id: user.id,
        target_user_id: payload.target_user_id,
        action: 'update_profile',
        details: { original: payload.original_name, new: payload.full_name, reason: payload.reason }
      })
      return new Response(JSON.stringify({ success: true, profile: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'disband_circle') {
      const target_group_id = payload.target_group_id

      // Capture before-state snapshot
      const { data: circle, error: circleError } = await supabaseAdmin.from('family_groups').select('*').eq('id', target_group_id).single()
      if (circleError || !circle) throw new Error("Circle not found")
      
      const { data: members } = await supabaseAdmin.from('family_members').select('*').eq('group_id', target_group_id)

      // Log the destructive action BEFORE deletion (in case deletion fails)
      await supabaseAdmin.from('admin_audit_log').insert({
        admin_id: user.id,
        action: 'disband_circle',
        details: {
          group_id: target_group_id,
          group_name: circle.name,
          owner_id: circle.owner_id,
          members_removed: members,
          reason: payload.reason
        }
      })

      // Cascade delete: Cabinet Inventory -> Members -> Group
      await supabaseAdmin.from('cabinet_inventory').delete().eq('group_id', target_group_id)
      await supabaseAdmin.from('family_members').delete().eq('group_id', target_group_id)
      const { error: delError } = await supabaseAdmin.from('family_groups').delete().eq('id', target_group_id)
      
      if (delError) throw delError

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
