import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { userId, newPassword } = await req.json()

    if (!userId || !newPassword) {
      return new Response(JSON.stringify({ error: 'userId and newPassword are required' }), { status: 400, headers: cors })
    }

    // Verify the caller is an authenticated admin using their JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors })
    }

    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Confirm caller identity
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors })
    }

    // Confirm caller is an admin in staff_profiles
    const { data: profile } = await callerClient
      .from('staff_profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only admins can reset staff passwords' }), { status: 403, headers: cors })
    }

    // Use service role to update the target user's password
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { error } = await adminClient.auth.admin.updateUserById(userId, { password: newPassword })
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: cors })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors })
  }
})
