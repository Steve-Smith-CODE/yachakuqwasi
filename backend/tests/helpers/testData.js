import { supabaseAdmin } from '../../src/config/supabase.js';

const createdUserIds = [];

export function uniqueEmail(prefix) {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1000000)}@test.yachakuqwasi.local`;
}

export async function createRealUser({ role = 'student', name = 'Test User', password = 'TestPass123!', ...rest } = {}) {
  const email = uniqueEmail(role);
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role, ...rest }
  });
  if (error) throw error;
  createdUserIds.push(data.user.id);
  return { id: data.user.id, email, password, name, role };
}

export function trackUserForCleanup(id) {
  createdUserIds.push(id);
}

export async function cleanupCreatedUsers() {
  const ids = createdUserIds.splice(0, createdUserIds.length);
  for (const id of ids) {
    await supabaseAdmin.auth.admin.deleteUser(id).catch(() => {});
  }
}
