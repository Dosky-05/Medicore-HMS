import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { name, email, password, role, doctor_id, department, phone } = await req.json()

    // Verify caller is an authenticated admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors })

    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors })

    const { data: callerProfile } = await callerClient
      .from('staff_profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only admins can create staff accounts' }), { status: 403, headers: cors })
    }

    // Use service role — bypasses RLS, no session side-effects
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Create the auth user (email already confirmed, no sign-in side-effect)
    const { data, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    })

    if (createError) return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: cors })

    // Insert the staff profile
    const { error: profileError } = await adminClient.from('staff_profiles').insert({
      id:         data.user.id,
      name,
      email,
      role,
      doctor_id:  doctor_id  || null,
      department: department || null,
      phone:      phone      || null,
    })

    if (profileError) {
      // Roll back the auth user if profile insert fails
      await adminClient.auth.admin.deleteUser(data.user.id)
      return new Response(JSON.stringify({ error: profileError.message }), { status: 400, headers: cors })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors })
  }
})
