/**
 * Seed script — creates Supabase auth accounts for all staff in mockData.js
 * Run: node --env-file=.env.local scripts/seedStaff.js
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (get it from
 * Supabase Dashboard → Project Settings → API → service_role key)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL       = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing env vars. Make sure .env.local has:');
  console.error('  VITE_SUPABASE_URL=...');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=...');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Default password given to every new account.
// Staff should change it after their first login.
const DEFAULT_PASSWORD = 'MediCore2026!';

const STAFF = [
  // ── Doctors (linked to DOCTORS array in mockData.js) ──────────────────────
  { name: 'Dr. Emily Chen',     email: 'e.chen@medicore.com',     role: 'doctor', doctor_id: '1', department: 'Cardiology',  phone: '+1-555-0101' },
  { name: 'Dr. James Wilson',   email: 'j.wilson@medicore.com',   role: 'doctor', doctor_id: '2', department: 'Neurology',   phone: '+1-555-0102' },
  { name: 'Dr. Michael Brown',  email: 'm.brown@medicore.com',    role: 'doctor', doctor_id: '3', department: 'Orthopedics', phone: '+1-555-0103' },
  { name: 'Dr. Sarah Davis',    email: 's.davis@medicore.com',    role: 'doctor', doctor_id: '4', department: 'Pediatrics',  phone: '+1-555-0104' },
  { name: 'Dr. Robert Zane',    email: 'r.zane@medicore.com',     role: 'doctor', doctor_id: '5', department: 'Emergency',   phone: '+1-555-0105' },
  { name: 'Dr. Linda Martinez', email: 'l.martinez@medicore.com', role: 'doctor', doctor_id: '6', department: 'Radiology',   phone: '+1-555-0106' },
  { name: 'Dr. David Thompson', email: 'd.thompson@medicore.com', role: 'doctor', doctor_id: '7', department: 'Surgery',     phone: '+1-555-0107' },
  { name: 'Dr. Jennifer White', email: 'j.white@medicore.com',    role: 'doctor', doctor_id: '8', department: 'Dermatology', phone: '+1-555-0108' },
];

async function seed() {
  console.log(`Seeding ${STAFF.length} staff accounts...\n`);

  let created = 0;
  let skipped = 0;

  for (const staff of STAFF) {
    process.stdout.write(`  ${staff.role.padEnd(12)} ${staff.name.padEnd(24)} `);

    // Create the Supabase auth user
    const { data, error } = await supabase.auth.admin.createUser({
      email: staff.email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { name: staff.name, role: staff.role },
    });

    if (error) {
      console.log(`SKIP  — ${error.message}`);
      skipped++;
      continue;
    }

    // Insert matching row in staff_profiles
    const { error: profileError } = await supabase.from('staff_profiles').insert({
      id:        data.user.id,
      name:      staff.name,
      email:     staff.email,
      role:      staff.role,
      doctor_id: staff.doctor_id  ?? null,
      department: staff.department ?? null,
      phone:     staff.phone      ?? null,
    });

    if (profileError) {
      console.log(`AUTH OK  profile error — ${profileError.message}`);
      skipped++;
    } else {
      console.log('OK');
      created++;
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Created: ${created}   Skipped: ${skipped}`);
  console.log(`\nDefault password: ${DEFAULT_PASSWORD}`);
  console.log('Share this with each staff member — they can change it after logging in.');
}

seed().catch(err => {
  console.error('\nUnexpected error:', err.message);
  process.exit(1);
});
