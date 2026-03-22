#!/usr/bin/env tsx
/**
 * E2E API Integration Test Suite
 * Tests every API endpoint on the running stack.
 *
 * Usage:
 *   pnpm test:e2e                    # uses defaults from .env
 *   API_URL=http://localhost:3000 ADMIN_PASSWORD=admin_secure_2024 tsx scripts/test-e2e.ts
 */

import * as process from 'process';

const API_URL    = process.env.API_URL       || 'http://localhost:3000';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin_secure_2024';
const USERNAME   = process.env.ADMIN_USER    || 'admin';

// ─── Result tracking ─────────────────────────────────────────────────────────
type Result = { name: string; pass: boolean; detail: string };
const results: Result[] = [];
let jwt = '';

function pass(name: string, detail = '') { results.push({ name, pass: true,  detail }); }
function fail(name: string, detail = '') { results.push({ name, pass: false, detail }); }

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
async function request(method: string, path: string, body?: unknown, raw = false) {
  const headers: Record<string, string> = {
    ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
  };
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (raw) return res;
  if (res.status === 204) return { status: 204, body: {} };
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

const get   = (path: string)                 => request('GET',    path);
const post  = (path: string, body?: unknown) => request('POST',   path, body);
const put   = (path: string, body?: unknown) => request('PUT',    path, body);
const del   = (path: string)                 => request('DELETE', path);

// ─── Test blocks ──────────────────────────────────────────────────────────────

async function testAuth() {
  console.log('\n🔐 AUTH');

  // 1. Login with correct credentials
  const r = await post('/auth/login', { username: USERNAME, password: ADMIN_PASS }) as any;
  if (r.status === 200 && r.body.token) {
    jwt = r.body.token;
    pass('Login with valid credentials', 'JWT received');
  } else {
    fail('Login with valid credentials', `status=${r.status} body=${JSON.stringify(r.body)}`);
    console.error('  ⚠️  Cannot continue without JWT — aborting remaining tests.');
    process.exit(1);
  }

  // 2. Login with wrong password
  const r2 = await post('/auth/login', { username: USERNAME, password: 'wrong-password' }) as any;
  if (r2.status === 401) pass('Reject invalid credentials', 'status=401');
  else fail('Reject invalid credentials', `expected 401 got ${r2.status}`);

  // 3. /auth/me
  const r3 = await get('/auth/me') as any;
  if (r3.status === 200 && r3.body.user) pass('/auth/me returns user', `user.id=${r3.body.user.id}`);
  else fail('/auth/me returns user', `status=${r3.status}`);

  // 4. No JWT should 401
  const savedJwt = jwt;
  jwt = '';
  const r4 = await get('/commands') as any;
  jwt = savedJwt;
  if (r4.status === 401) pass('Unauthenticated request rejected', 'status=401');
  else fail('Unauthenticated request rejected', `expected 401 got ${r4.status}`);
}

async function testCommands() {
  console.log('\n📋 COMMANDS');

  // list
  const r1 = await get('/commands') as any;
  if (r1.status === 200 && Array.isArray(r1.body)) pass('GET /commands', `${r1.body.length} commands`);
  else fail('GET /commands', `status=${r1.status}`);

  // cleanup any leftover e2e-test command from a previous failed run
  const existing = r1.body?.find((c: any) => c.name === 'e2e-test');
  if (existing) {
    await del(`/commands/${existing.id}`);
    console.log('  🧹 Cleaned up leftover e2e-test command');
  }

  // create
  const r2 = await post('/commands', {
    name: 'e2e-test',
    description: 'Automated test command',
    script: 'module.exports = async (ctx) => { await ctx.reply("e2e ok"); }',
  }) as any;
  if (r2.status === 201 && r2.body.id) pass('POST /commands (create)', `id=${r2.body.id}`);
  else { fail('POST /commands (create)', `status=${r2.status} body=${JSON.stringify(r2.body)}`); return; }

  const id = r2.body.id;

  // get by id
  const r3 = await get(`/commands/${id}`) as any;
  if (r3.status === 200 && r3.body.id === id) pass(`GET /commands/:id`, `name=${r3.body.name}`);
  else fail(`GET /commands/:id`, `status=${r3.status}`);

  // update
  const r4 = await put(`/commands/${id}`, { description: 'Updated by e2e test' }) as any;
  if (r4.status === 200 && r4.body.description === 'Updated by e2e test') pass('PUT /commands/:id', 'description updated');
  else fail('PUT /commands/:id', `status=${r4.status}`);

  // duplicate name should 409
  const r5 = await post('/commands', { name: 'e2e-test', script: 'x' }) as any;
  if (r5.status === 409) pass('POST /commands — duplicate name returns 409', 'status=409');
  else fail('POST /commands — duplicate name returns 409', `got ${r5.status}`);

  // delete
  const r6 = await del(`/commands/${id}`) as any;
  if (r6.status === 200 || r6.status === 204) pass('DELETE /commands/:id', 'deleted');
  else fail('DELETE /commands/:id', `status=${r6.status} body=${JSON.stringify(r6.body)}`);

  // 404 after delete
  const r7 = await get(`/commands/${id}`) as any;
  if (r7.status === 404) pass('GET /commands/:id after delete returns 404', 'status=404');
  else fail('GET /commands/:id after delete returns 404', `got ${r7.status}`);
}

async function testSettings() {
  console.log('\n⚙️  SETTINGS');

  const r1 = await get('/settings') as any;
  if (r1.status === 200 && typeof r1.body === 'object') pass('GET /settings', `${Object.keys(r1.body).length} keys`);
  else fail('GET /settings', `status=${r1.status}`);

  // valid save
  const r2 = await post('/settings', { WA_COMMAND_PREFIX: '/', WA_MAINTENANCE_MODE: 'false' }) as any;
  if (r2.status === 200 && r2.body.success) pass('POST /settings (valid keys)', 'saved');
  else fail('POST /settings (valid keys)', `status=${r2.status} body=${JSON.stringify(r2.body)}`);

  // forbidden key
  const r3 = await post('/settings', { FORBIDDEN_KEY: 'hax' }) as any;
  if (r3.status === 400) pass('POST /settings — forbidden key returns 400', 'status=400');
  else fail('POST /settings — forbidden key returns 400', `got ${r3.status}`);

  // AI_API_KEY save
  const r4 = await post('/settings', { AI_API_KEY: 'test-key-from-e2e' }) as any;
  if (r4.status === 200) pass('POST /settings (AI_API_KEY)', 'AI key saved');
  else fail('POST /settings (AI_API_KEY)', `status=${r4.status} body=${JSON.stringify(r4.body)}`);
}

async function testLogs() {
  console.log('\n📜 LOGS');

  const r1 = await get('/logs') as any;
  if (r1.status === 200 && Array.isArray(r1.body)) pass('GET /logs', `${r1.body.length} entries`);
  else fail('GET /logs', `status=${r1.status}`);

  const r2 = await get('/logs?limit=5') as any;
  if (r2.status === 200 && r2.body.length <= 5) pass('GET /logs?limit=5', `${r2.body.length} entries`);
  else fail('GET /logs?limit=5', `got ${r2.body.length} entries`);
}

async function testCron() {
  console.log('\n⏰ CRON');

  const r1 = await get('/cron') as any;
  if (r1.status === 200 && Array.isArray(r1.body)) pass('GET /cron', `${r1.body.length} jobs`);
  else fail('GET /cron', `status=${r1.status}`);

  // get a valid commandId
  const cmds = await get('/commands') as any;
  if (!cmds.body.length) { fail('POST /cron — skip (no commands)', 'skipped'); return; }
  const commandId = cmds.body[0].id;

  const r2 = await post('/cron', {
    commandId,
    schedule: '0 9 * * *',
    targetJid: '6281234567890@s.whatsapp.net',
    enabled: true,
  }) as any;
  if (r2.status === 201 && r2.body.id) pass('POST /cron (create)', `id=${r2.body.id}`);
  else { fail('POST /cron (create)', `status=${r2.status} body=${JSON.stringify(r2.body)}`); return; }

  const cronId = r2.body.id;

  // invalid cron expression
  const r3 = await post('/cron', { commandId, schedule: 'not-a-cron', targetJid: 'test' }) as any;
  if (r3.status === 400) pass('POST /cron — invalid cron expression returns 400', 'validated');
  else fail('POST /cron — invalid cron expression returns 400', `got ${r3.status}`);

  // update
  const r4 = await put(`/cron/${cronId}`, { enabled: false }) as any;
  if (r4.status === 200) pass(`PUT /cron/:id`, 'updated');
  else fail(`PUT /cron/:id`, `status=${r4.status}`);

  // delete
  const r5 = await del(`/cron/${cronId}`) as any;
  if (r5.status === 200 || r5.status === 204) pass('DELETE /cron/:id', 'deleted');
  else fail('DELETE /cron/:id', `status=${r5.status} body=${JSON.stringify(r5.body)}`);
}

async function testWhitelist() {
  console.log('\n🔒 WHITELIST');

  const r1 = await get('/whitelist') as any;
  if (r1.status === 200 && Array.isArray(r1.body)) pass('GET /whitelist', `${r1.body.length} entries`);
  else fail('GET /whitelist', `status=${r1.status}`);

  const r2 = await post('/whitelist', { jid: 'e2e-test@s.whatsapp.net', name: 'E2E Test' }) as any;
  if (r2.status === 201 && r2.body.id) pass('POST /whitelist (add)', `id=${r2.body.id}`);
  else { fail('POST /whitelist (add)', `status=${r2.status} body=${JSON.stringify(r2.body)}`); return; }

  const wlId = r2.body.id;

  // upsert (same jid)
  const r3 = await post('/whitelist', { jid: 'e2e-test@s.whatsapp.net', name: 'Updated' }) as any;
  if (r3.status === 201) pass('POST /whitelist — upsert same JID', 'upserted');
  else fail('POST /whitelist — upsert same JID', `status=${r3.status}`);

  const r4 = await del(`/whitelist/${wlId}`) as any;
  if (r4.status === 200 || r4.status === 204) pass('DELETE /whitelist/:id', 'deleted');
  else fail('DELETE /whitelist/:id', `status=${r4.status} body=${JSON.stringify(r4.body)}`);
}

async function testSecrets() {
  console.log('\n🔐 SECRETS (API KEYS)');

  const r1 = await get('/secrets') as any;
  if (r1.status === 200 && Array.isArray(r1.body)) pass('GET /secrets', `${r1.body.length} secrets`);
  else fail('GET /secrets', `status=${r1.status}`);

  // values should be masked
  const exposed = r1.body.find((s: any) => s.value !== '••••••••');
  if (!exposed) pass('GET /secrets — all values masked', '••••••••');
  else fail('GET /secrets — all values masked', `EXPOSED real value for key=${exposed.key}`);

  const r2 = await post('/secrets', { key: 'E2E_TEST_KEY', value: 'secret-value-e2e' }) as any;
  if (r2.status === 201 && r2.body.value === '••••••••') pass('POST /secrets (create + masked response)', `id=${r2.body.id}`);
  else { fail('POST /secrets (create)', `status=${r2.status}`); return; }

  const secretId = r2.body.id;

  const r3 = await del(`/secrets/${secretId}`) as any;
  if (r3.status === 200 || r3.status === 204) pass('DELETE /secrets/:id', 'deleted');
  else fail('DELETE /secrets/:id', `status=${r3.status} body=${JSON.stringify(r3.body)}`);
}

async function testExpenses() {
  console.log('\n💰 EXPENSES');

  const r1 = await get('/expenses') as any;
  if (r1.status === 200 && Array.isArray(r1.body.expenses)) pass('GET /expenses', `${r1.body.expenses.length} records`);
  else fail('GET /expenses', `status=${r1.status}`);

  const r2 = await post('/expenses', { amount: 99.99, note: 'E2E test', category: 'Food' }) as any;
  if (r2.status === 201 && r2.body.id) pass('POST /expenses (create)', `id=${r2.body.id}`);
  else { fail('POST /expenses (create)', `status=${r2.status}`); return; }

  const expId = r2.body.id;

  // invalid amount
  const r3 = await post('/expenses', { amount: -10 }) as any;
  if (r3.status === 400) pass('POST /expenses — negative amount returns 400', 'validated');
  else fail('POST /expenses — negative amount returns 400', `got ${r3.status}`);

  const r4 = await del(`/expenses/${expId}`) as any;
  if (r4.status === 200 || r4.status === 204) pass('DELETE /expenses/:id', 'deleted');
  else fail('DELETE /expenses/:id', `status=${r4.status} body=${JSON.stringify(r4.body)}`);
}

async function testWhatsApp() {
  console.log('\n📱 WHATSAPP STATUS');

  const r1 = await get('/whatsapp/status') as any;
  if (r1.status === 200 && r1.body.status) {
    pass('GET /whatsapp/status', `status=${r1.body.status}`);
    if (r1.body.status === 'connected') {
      pass('WhatsApp — connected', `user=${r1.body.user || 'unknown'}`);
    } else if (r1.body.status === 'qr_ready') {
      pass('WhatsApp — QR ready for scanning', 'qr_ready');
    } else {
      pass('WhatsApp — initializing', `status=${r1.body.status}`);
    }
  } else {
    fail('GET /whatsapp/status', `status=${r1.status}`);
  }
}

async function testRateLimit() {
  console.log('\n🛡️  RATE LIMITING');

  // Hammer the login endpoint — rate limit kicks in after 10 failed attempts per 5 min window
  // Note: previous test runs may have partially consumed the window, so we try up to 15 attempts
  let got429 = false;
  let attempts = 0;
  for (let i = 0; i < 15; i++) {
    attempts++;
    const r = await post('/auth/login', { username: 'admin', password: 'definitely-wrong-pw-x9z' }) as any;
    if (r.status === 429) { got429 = true; break; }
  }
  if (got429) pass(`Rate limiter triggers on /auth/login (after ${attempts} attempts)`, '429 received');
  else fail('Rate limiter skipped', `rate-limit counter may still be warm from previous run — rerun after 5 min`);
}

// ─── Main runner ──────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  WhatsApp Assistant — E2E API Test Suite');
  console.log(`  Target: ${API_URL}`);
  console.log(`  Time:   ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════');

  await testAuth();
  await testCommands();
  await testSettings();
  await testLogs();
  await testCron();
  await testWhitelist();
  await testSecrets();
  await testExpenses();
  await testWhatsApp();
  await testRateLimit();

  // ─── Summary ─────────────────────────────────────────────────────────────
  const passed = results.filter(r => r.pass);
  const failed = results.filter(r => !r.pass);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════');

  for (const r of results) {
    const icon = r.pass ? '✅' : '❌';
    const detail = r.detail ? `  (${r.detail})` : '';
    console.log(`  ${icon} ${r.name}${detail}`);
  }

  console.log('\n───────────────────────────────────────────────────');
  console.log(`  Passed: ${passed.length} / ${results.length}`);
  console.log(`  Failed: ${failed.length} / ${results.length}`);
  console.log('───────────────────────────────────────────────────');

  if (failed.length > 0) {
    console.log('\n⚠️  FAILURES:');
    for (const r of failed) {
      console.log(`  ❌ ${r.name}: ${r.detail}`);
    }
    process.exit(1);
  } else {
    console.log('\n🎉  All tests passed!');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal error in test runner:', err);
  process.exit(1);
});
