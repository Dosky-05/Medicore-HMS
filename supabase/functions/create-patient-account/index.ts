import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { name, email, password, phone, age, gender, blood_type, department, status } = await req.json()

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors })

    // Verify caller is an authenticated admin
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
      return new Response(JSON.stringify({ error: 'Only admins can create patient accounts' }), { status: 403, headers: cors })
    }

    // Use service role — bypasses RLS, no session side-effects
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'patient' },
    })

    if (createError) return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: cors })

    const { error: profileError } = await adminClient.from('patient_profiles').insert({
      id:         data.user.id,
      name,
      email,
      phone:      phone      || null,
      age:        age        || null,
      gender:     gender     || null,
      blood_type: blood_type || null,
      department: department || null,
      status:     status     || 'Outpatient',
    })

    if (profileError) {
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
