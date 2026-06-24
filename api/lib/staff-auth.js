import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

export const DEFAULT_HASHES = {
  admin: '$2b$10$dnwg7thsViQm0EPs4pxVKuezrTh3t/5egfdARofmCkqa3eUc1Koy.',
  staff: '$2b$10$kRcjWl5koj0oDLLeJb1/DeCFsD.u3GZ7Qj3UQUOcQDmamh6pVV7Li'
};

function adminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function getPasswordHashes() {
  const supabase = adminClient();
  if (!supabase) return { ...DEFAULT_HASHES, source: 'default' };

  const { data, error } = await supabase.from('staff_auth').select('role, password_hash');
  if (error || !data?.length) {
    return { ...DEFAULT_HASHES, source: 'default' };
  }

  const hashes = { ...DEFAULT_HASHES };
  for (const row of data) {
    if (row.role === 'admin' || row.role === 'staff') {
      hashes[row.role] = row.password_hash;
    }
  }
  return { ...hashes, source: 'database' };
}

export async function verifyPassword(password, role) {
  const hashes = await getPasswordHashes();
  const hash = hashes[role];
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export async function loginWithPassword(password) {
  if (await verifyPassword(password, 'admin')) return 'admin';
  if (await verifyPassword(password, 'staff')) return 'staff';
  return null;
}

export async function updatePassword(role, newPassword) {
  const supabase = adminClient();
  if (!supabase) {
    return {
      ok: false,
      error: 'Password changes require SUPABASE_SERVICE_ROLE_KEY in Vercel. Run schema/staff_auth.sql in Supabase first.'
    };
  }

  const password_hash = await bcrypt.hash(newPassword, 10);
  const { error } = await supabase
    .from('staff_auth')
    .upsert({ role, password_hash, updated_at: new Date().toISOString() });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function seedDefaultsIfEmpty() {
  const supabase = adminClient();
  if (!supabase) return;

  const { data } = await supabase.from('staff_auth').select('role');
  if (data?.length) return;

  await supabase.from('staff_auth').upsert([
    { role: 'admin', password_hash: DEFAULT_HASHES.admin },
    { role: 'staff', password_hash: DEFAULT_HASHES.staff }
  ]);
}
