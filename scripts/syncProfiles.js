/**
 * Creates missing staff_profiles rows for auth users that don't have one.
 * Run: node --env-file=.env.local scripts/syncProfiles.js
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const STAFF = [
  { email: 'e.chen@medicore.com',     name: 'Dr. Emily Chen',     role: 'doctor', doctor_id: '1', department: 'Cardiology',  phone: '+1-555-0101' },
  { email: 'j.wilson@medicore.com',   name: 'Dr. James Wilson',   role: 'doctor', doctor_id: '2', department: 'Neurology',   phone: '+1-555-0102' },
  { email: 'm.brown@medicore.com',    name: 'Dr. Michael Brown',  role: 'doctor', doctor_id: '3', department: 'Orthopedics', phone: '+1-555-0103' },
  { email: 's.davis@medicore.com',    name: 'Dr. Sarah Davis',    role: 'doctor', doctor_id: '4', department: 'Pediatrics',  phone: '+1-555-0104' },
  { email: 'r.zane@medicore.com',     name: 'Dr. Robert Zane',    role: 'doctor', doctor_id: '5', department: 'Emergency',   phone: '+1-555-0105' },
  { email: 'l.martinez@medicore.com', name: 'Dr. Linda Martinez', role: 'doctor', doctor_id: '6', department: 'Radiology',   phone: '+1-555-0106' },
  { email: 'd.thompson@medicore.com', name: 'Dr. David Thompson', role: 'doctor', doctor_id: '7', department: 'Surgery',     phone: '+1-555-0107' },
  { email: 'j.white@medicore.com',    name: 'Dr. Jennifer White', role: 'doctor', doctor_id: '8', department: 'Dermatology', phone: '+1-555-0108' },
  { email: 'm.philips@medicore.com',   name: 'Maria Phillips',    role: 'nurse',        doctor_id: null, department: 'Emergency', phone: null },
  { email: 'm.delmonte@medicore.com', name: 'Marcus Delmonte',   role: 'receptionist', doctor_id: null, department: null,        phone: null },
];

async function sync() {
  // Fetch all auth users
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) { console.error('Failed to fetch users:', error.message); process.exit(1); }

  // Fetch existing profiles
  const { data: profiles } = await supabase.from('staff_profiles').select('id, email');
  const existingEmails = new Set((profiles || []).map(p => p.email));

  console.log(`Auth users found: ${users.length}`);
  console.log(`Existing profiles: ${existingEmails.size}\n`);

  let created = 0;
  let skipped = 0;

  for (const staff of STAFF) {
    process.stdout.write(`  ${staff.name.padEnd(24)} `);

    if (existingEmails.has(staff.email)) {
      console.log('SKIP  — profile already exists');
      skipped++;
      continue;
    }

    const authUser = users.find(u => u.email === staff.email);
    if (!authUser) {
      console.log('SKIP  — no auth user found');
      skipped++;
      continue;
    }

    const { error: insertError } = await supabase.from('staff_profiles').insert({
      id:         authUser.id,
      name:       staff.name,
      email:      staff.email,
      role:       staff.role,
      doctor_id:  staff.doctor_id,
      department: staff.department,
      phone:      staff.phone,
    });

    if (insertError) {
      console.log(`FAIL  — ${insertError.message}`);
      skipped++;
    } else {
      console.log('OK');
      created++;
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Created: ${created}   Skipped: ${skipped}`);
}

sync().catch(err => { console.error(err.message); process.exit(1); });
