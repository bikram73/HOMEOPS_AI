import { stateManager } from '../server/state';
import { classifyIntent, parseQuantityAndUnit } from '../server/intent-router';
import { processUserMessage } from '../server/gemini';
import { caspianService } from '../server/caspian';

interface TestRecord {
  id: string;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const records: TestRecord[] = [];

function assertTest(id: string, name: string, expected: string, actual: string, condition: boolean) {
  records.push({ id, name, expected, actual, passed: condition });
  const icon = condition ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} [${id}] ${name}\n     Expected: ${expected}\n     Actual:   ${actual}`);
}

async function runIntentSuite() {
  console.log('\n================================================================');
  console.log('HOMEOPS AI — INTENT ROUTING & IDEMPOTENCY VERIFICATION SUITE');
  console.log('================================================================\n');

  // Test 1: Unit and quantity parsing
  const q1 = parseQuantityAndUnit('Set Rice quantity to 0.5 kg');
  assertTest(
    'UNIT-001',
    'Parse decimal quantity and unit (0.5 kg)',
    'quantity: 0.5, unit: kg',
    `quantity: ${q1?.quantity}, unit: ${q1?.unit}`,
    q1?.quantity === 0.5 && q1?.unit === 'kg'
  );

  const q2 = parseQuantityAndUnit('We have 500 grams of flour');
  assertTest(
    'UNIT-002',
    'Parse grams',
    'quantity: 500, unit: grams',
    `quantity: ${q2?.quantity}, unit: ${q2?.unit}`,
    q2?.quantity === 500 && q2?.unit === 'grams'
  );

  const q3 = parseQuantityAndUnit('half a kilo of sugar');
  assertTest(
    'UNIT-003',
    'Parse half a kilo natural language',
    'quantity: 0.5, unit: kg',
    `quantity: ${q3?.quantity}, unit: ${q3?.unit}`,
    q3?.quantity === 0.5 && q3?.unit === 'kg'
  );

  // Test 2: Intent Classification (BUG-001)
  stateManager.resetState();
  const state = stateManager.getState();

  const c1 = classifyIntent('Set Rice quantity to 0.5 kg.', state);
  assertTest(
    'INT-001',
    'Classify "Set Rice quantity to 0.5 kg." as INVENTORY_UPDATE',
    'INVENTORY_UPDATE',
    c1.intent,
    c1.intent === 'INVENTORY_UPDATE' && c1.quantity === 0.5 && c1.unit === 'kg'
  );

  // Test 3: Intent Classification (BUG-002)
  const c2 = classifyIntent('Is rice low in stock?', state);
  assertTest(
    'INT-002',
    'Classify "Is rice low in stock?" as INVENTORY_STATUS_QUERY',
    'INVENTORY_STATUS_QUERY',
    c2.intent,
    c2.intent === 'INVENTORY_STATUS_QUERY' && c2.entity?.toLowerCase().includes('rice') === true
  );

  // Test 4: Intent Classification (BUG-003)
  const c3 = classifyIntent('Which room is the vacuum in?', state);
  assertTest(
    'INT-003',
    'Classify unclear question as UNKNOWN, never task creation',
    'UNKNOWN',
    c3.intent,
    c3.intent === 'UNKNOWN'
  );

  // Test 5: Explicit Task Creation Intent
  const c4 = classifyIntent('Create a task to deep clean the oven', state);
  assertTest(
    'INT-004',
    'Classify "Create a task..." as TASK_CREATE',
    'TASK_CREATE',
    c4.intent,
    c4.intent === 'TASK_CREATE'
  );

  // Test 6: End-to-End Execution of BUG-001
  stateManager.resetState();
  const initialTaskCount = stateManager.getState().tasks.length;
  const initialShoppingCount = stateManager.getState().shopping.length;

  // Execute "Set Rice quantity to 0.5 kg."
  const res1 = await processUserMessage('Set Rice quantity to 0.5 kg.');
  const afterState1 = stateManager.getState();
  const riceItem = afterState1.inventory.find(i => i.name.toLowerCase().includes('rice'));
  const taskCreated = afterState1.tasks.find(t => t.title.toLowerCase().includes('rice'));

  assertTest(
    'EXEC-001',
    'BUG-001: "Set Rice quantity to 0.5 kg." updates inventory and NOT task list',
    'Inventory updated to 0.5 kg, tasks unchanged',
    `Rice quantity: ${riceItem?.currentQuantity} ${riceItem?.unit}, tasks diff: ${afterState1.tasks.length - initialTaskCount}`,
    afterState1.tasks.length === initialTaskCount &&
    !taskCreated &&
    riceItem?.currentQuantity === 0.5 &&
    riceItem?.unit === 'kg'
  );

  assertTest(
    'EXEC-002',
    'Low stock threshold crossing automatically queues to shopping list',
    'Rice status is low, added to shopping list',
    `Rice status: ${riceItem?.status}, shopping count: ${afterState1.shopping.length}`,
    riceItem?.status === 'low' && afterState1.shopping.length > initialShoppingCount
  );

  assertTest(
    'EXEC-003',
    'Activity calendar logs inventory update and replenishment events',
    'Activity log contains Inventory Updated & Low Stock / Replenishment',
    `Logged ${afterState1.activityEvents.length} events`,
    afterState1.activityEvents.some(e => e.title.includes('Rice'))
  );

  // Test 7: End-to-End Execution of BUG-002
  const tasksBeforeQuestion = afterState1.tasks.length;
  const invBeforeQuestion = JSON.stringify(afterState1.inventory);
  const res2 = await processUserMessage('Is rice low in stock?');
  const afterState2 = stateManager.getState();
  const invAfterQuestion = JSON.stringify(afterState2.inventory);

  assertTest(
    'EXEC-004',
    'BUG-002: "Is rice low in stock?" is read-only and produces ZERO mutations',
    'Zero new tasks, zero inventory changes',
    `Tasks diff: ${afterState2.tasks.length - tasksBeforeQuestion}, Inventory changed: ${invBeforeQuestion !== invAfterQuestion}`,
    afterState2.tasks.length === tasksBeforeQuestion &&
    invBeforeQuestion === invAfterQuestion &&
    res2.toolsExecuted.every(t => t.toolName === 'checkInventoryItem' || t.toolName === 'getLowStockItems')
  );

  // Test 8: End-to-End Execution of BUG-003 (Unknown Intent Fallback)
  const res3 = await processUserMessage('Which room is the vacuum in?');
  const afterState3 = stateManager.getState();

  assertTest(
    'EXEC-005',
    'BUG-003: Unknown intent returns clarification and NEVER creates task',
    'Clarification requested, 0 tasks created',
    `Response: "${res3.response.slice(0, 60)}...", tasks diff: ${afterState3.tasks.length - afterState2.tasks.length}`,
    afterState3.tasks.length === afterState2.tasks.length &&
    res3.toolsExecuted.length === 0 &&
    res3.response.toLowerCase().includes('clarify')
  );

  // Test 9: Caspian Inbound Idempotency Protection (Duplicate Delivery Test)
  const eventId = 'evt_test_unique_998877';
  const firstWebhook = await caspianService.handleIncomingMessage(
    'Telegram',
    'user123',
    'Set Rice quantity to 2 kg.',
    eventId
  );

  assertTest(
    'IDEMP-001',
    'First inbound event processes normally',
    'response present, duplicate: false',
    `response: "${firstWebhook.response.slice(0, 30)}...", duplicate: ${!!firstWebhook.duplicate}`,
    !!firstWebhook.response && !firstWebhook.duplicate
  );

  const secondWebhook = await caspianService.handleIncomingMessage(
    'Telegram',
    'user123',
    'Set Rice quantity to 2 kg.',
    eventId
  );

  assertTest(
    'IDEMP-002',
    'Duplicate event with same eventId is deduplicated safely',
    'duplicate: true, same response returned',
    `duplicate: ${secondWebhook.duplicate}, matches: ${secondWebhook.response === firstWebhook.response}`,
    secondWebhook.duplicate === true && secondWebhook.response === firstWebhook.response
  );

  // Summary
  const total = records.length;
  const passed = records.filter(r => r.passed).length;
  const failed = records.filter(r => !r.passed).length;

  console.log('\n================================================================');
  console.log(`TOTAL SUITE TESTS: ${total}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`PASS RATE: ${Math.round((passed / total) * 100)}%`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runIntentSuite().catch(err => {
  console.error('Fatal error running intent suite:', err);
  process.exit(1);
});
