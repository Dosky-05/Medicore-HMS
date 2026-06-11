/**
 * Sets role metadata on all admin auth users so RLS policies work correctly.
 * Run: node --env-file=.env.local scripts/fixAdminMeta.js
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function fix() {
  // Get all profiles (service role bypasses RLS)
  const { data: profiles, error } = await supabase
    .from('staff_profiles')
    .select('id, name, email, role');

  if (error) { console.error('Failed to fetch profiles:', error.message); process.exit(1); }

  console.log(`Found ${profiles.length} staff profiles. Syncing auth metadata...\n`);

  for (const profile of profiles) {
    process.stdout.write(`  ${profile.name.padEnd(26)} (${profile.role.padEnd(12)}) `);

    const { error: updateError } = await supabase.auth.admin.updateUserById(profile.id, {
      user_metadata: { name: profile.name, role: profile.role },
    });

    if (updateError) {
      console.log(`FAIL — ${updateError.message}`);
    } else {
      console.log('OK');
    }
  }

  console.log('\nDone. Refresh the app and check Settings → Staff Accounts.');
}

fix().catch(err => { console.error(err.message); process.exit(1); });
