import http from 'http';
import { validateProfileInput } from '../src/utils/profileStore';
import { sanitizeAndCheckSecurity } from '../src/utils/storage';
import { validateBackupData } from '../src/utils/exportImport';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ ${msg}`);
  }
}

async function request(
  path: string,
  options: { method?: string; body?: any; headers?: Record<string, string> } = {}
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const payload = options.body ? JSON.stringify(options.body) : null;
    const req = http.request(
      `http://localhost:3000${path}`,
      {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload).toString() } : {}),
          ...options.headers,
        },
      },
      (res) => {
        let text = '';
        res.on('data', (chunk) => (text += chunk));
        res.on('end', () => {
          try {
            const data = text ? JSON.parse(text) : null;
            resolve({ status: res.statusCode || 200, data });
          } catch {
            resolve({ status: res.statusCode || 200, data: text });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runPersistenceTests() {
  console.log('--- Testing User Profile Validation ---');
  assert(!validateProfileInput('').valid, 'Empty string name is rejected');
  assert(!validateProfileInput('   ').valid, 'Whitespace-only name is rejected');
  assert(!validateProfileInput('a').valid, 'Single character name is rejected');
  assert(validateProfileInput('Bikram').valid, 'Valid name "Bikram" is accepted');
  assert(validateProfileInput('  Bikram  ').cleanName === 'Bikram', 'Name is trimmed cleanly');

  console.log('\n--- Testing Storage Security Rules ---');
  assert(!sanitizeAndCheckSecurity('GEMINI_API_KEY', 'test'), 'GEMINI_API_KEY is blocked');
  assert(!sanitizeAndCheckSecurity('CASPIAN_API_KEY', 'test'), 'CASPIAN_API_KEY is blocked');
  assert(!sanitizeAndCheckSecurity('TELEGRAM_BOT_TOKEN', 'test'), 'TELEGRAM_BOT_TOKEN is blocked');
  assert(!sanitizeAndCheckSecurity('my_key', 'contains GEMINI_API_KEY inside'), 'Value containing secret pattern is blocked');
  assert(sanitizeAndCheckSecurity('homeops_profile', { name: 'Bikram' }), 'Standard profile data is allowed');

  console.log('\n--- Testing Backup & Restore JSON Validation ---');
  assert(!validateBackupData(null).valid, 'Null backup is rejected');
  assert(!validateBackupData({}).valid, 'Empty object without profile is rejected');
  assert(!validateBackupData({ profile: { name: '' } }).valid, 'Profile without name is rejected');
  
  const sampleBackup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    profile: {
      id: 'prof-123',
      name: 'Bikram',
      householdName: "Bikram's Home",
      currency: 'INR (₹)',
      notificationPref: 'dashboard',
    },
    tasks: [{ id: 't1', title: 'Test chore', category: 'cleaning', priority: 'medium', dueDate: 'Today', completed: false }],
    inventory: [{ id: 'i1', name: 'Milk', category: 'Dairy', quantity: 2, unit: 'liters', status: 'normal', minThreshold: 1, lastRestocked: '2026-03-01' }],
    shopping: [{ id: 's1', name: 'Bread', completed: false }],
    bills: [{ id: 'b1', name: 'Water', amount: 300, dueDate: '2026-03-15', category: 'utilities', paid: false }],
    activities: [],
  };
  const validRes = validateBackupData(sampleBackup);
  assert(validRes.valid, 'Valid backup JSON structure passes validation');
  assert(validRes.parsed?.profile.name === 'Bikram', 'Parsed profile name matches');
  assert(validRes.parsed?.tasks.length === 1, 'Parsed tasks array matches');

  console.log('\n--- Testing Server State Sync Endpoint ---');
  const syncPayload = {
    tasks: [
      {
        id: 'persisted-task-1',
        title: 'Restored chore from IndexedDB',
        category: 'cleaning',
        priority: 'high',
        dueDate: 'Today',
        completed: false,
        createdAt: new Date().toISOString(),
      },
    ],
  };
  const syncRes = await request('/api/state/sync', {
    method: 'POST',
    body: syncPayload,
  });
  assert(syncRes.status === 200, 'POST /api/state/sync returns 200');
  assert(syncRes.data?.state?.tasks?.[0]?.id === 'persisted-task-1', 'Server state updated with synced task');

  console.log('\n========================================');
  console.log('🎉 ALL PERSISTENCE & ONBOARDING TESTS PASSED!');
  console.log('========================================');
}

runPersistenceTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
