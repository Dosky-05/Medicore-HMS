/**
 * Reset a staff member's password directly via Supabase admin API.
 * Run: node --env-file=.env.local scripts/resetPassword.js
 *
 * Edit TARGET_EMAIL and NEW_PASSWORD below, then run the script.
 */

import { createClient } from '@supabase/supabase-js';

const TARGET_EMAIL = 'e.chen@medicore.com';   // ← change this to whichever account needs reset
const NEW_PASSWORD = 'MediCore2026!';          // ← change this to the new password

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function reset() {
  // Look up the user by email
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) { console.error('Failed to list users:', listError.message); process.exit(1); }

  const target = users.find(u => u.email === TARGET_EMAIL);
  if (!target) { console.error(`No user found with email: ${TARGET_EMAIL}`); process.exit(1); }

  // Reset password and confirm email in one call
  const { error } = await supabase.auth.admin.updateUserById(target.id, {
    password: NEW_PASSWORD,
    email_confirm: true,
  });
  if (error) { console.error('Reset failed:', error.message); process.exit(1); }

  console.log(`Password reset for ${TARGET_EMAIL}`);
  console.log(`Email confirmed: yes`);
  console.log(`New password: ${NEW_PASSWORD}  ← note the capital C in "Core"`);
}

reset().catch(err => { console.error(err.message); process.exit(1); });
