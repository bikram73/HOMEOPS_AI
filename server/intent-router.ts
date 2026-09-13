import { HomeState, InventoryItem } from './types';

export type UserIntent =
  | 'TASK_CREATE'
  | 'TASK_UPDATE'
  | 'TASK_COMPLETE'
  | 'TASK_DELETE'
  | 'TASK_QUERY'
  | 'INVENTORY_ADD'
  | 'INVENTORY_UPDATE'
  | 'INVENTORY_REDUCE'
  | 'INVENTORY_QUERY'
  | 'INVENTORY_STATUS_QUERY'
  | 'INVENTORY_OUT_OF_STOCK_QUERY'
  | 'INVENTORY_RESTOCK_QUERY'
  | 'SHOPPING_ADD'
  | 'SHOPPING_REMOVE'
  | 'SHOPPING_QUERY'
  | 'SHOPPING_URGENT_QUERY'
  | 'BILL_ADD'
  | 'BILL_PAY'
  | 'BILL_QUERY'
  | 'MAINTENANCE_ADD'
  | 'MAINTENANCE_COMPLETE'
  | 'MAINTENANCE_QUERY'
  | 'PRIORITY_QUERY'
  | 'ACTIVITY_HISTORY_QUERY'
  | 'GENERAL_CONVERSATION'
  | 'UNKNOWN';

export interface ParsedQuantity {
  quantity: number;
  unit: string;
  rawText: string;
}

export interface IntentClassification {
  intent: UserIntent;
  confidence: number;
  entity?: string;
  quantity?: number;
  unit?: string;
  threshold?: number;
  thresholdQuantity?: number;
  status?: 'good' | 'low' | 'critical';
  targetDate?: string;
  details?: Record<string, any>;
  clarificationMessage?: string;
}

/**
 * Normalizes units and values:
 * e.g., "500 grams" -> if target is kg: 0.5 kg.
 * "half a kilo" -> 0.5 kg
 * "quarter kilo" -> 0.25 kg
 */
export function parseQuantityAndUnit(text: string): ParsedQuantity | null {
  const t = text.toLowerCase().trim();

  // Special natural language expressions
  if (/half\s+a\s+(kilo|kg|kilogram)/i.test(t)) {
    return { quantity: 0.5, unit: 'kg', rawText: 'half a kilo' };
  }
  if (/quarter\s+(kilo|kg|kilogram)/i.test(t)) {
    return { quantity: 0.25, unit: 'kg', rawText: 'quarter kilo' };
  }
  if (/half\s+a\s+(liter|litre)/i.test(t)) {
    return { quantity: 0.5, unit: 'liters', rawText: 'half a liter' };
  }

  // Matches numbers (including decimals e.g., 0.5, 2, 1.25) followed by unit
  const match = t.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z%]+)?/);
  if (!match) return null;

  const rawNum = parseFloat(match[1]);
  if (isNaN(rawNum)) return null;

  let unit = (match[2] || 'units').toLowerCase().trim();

  // Normalize common units
  if (unit === 'kg' || unit === 'kgs' || unit === 'kilo' || unit === 'kilos' || unit === 'kilogram' || unit === 'kilograms') {
    unit = 'kg';
  } else if (unit === 'g' || unit === 'gm' || unit === 'gms' || unit === 'gram' || unit === 'grams') {
    unit = 'grams';
  } else if (unit === 'l' || unit === 'liter' || unit === 'liters' || unit === 'litre' || unit === 'litres') {
    unit = 'liters';
  } else if (unit === 'ml' || unit === 'mls') {
    unit = 'ml';
  } else if (unit === 'oz' || unit === 'ounce' || unit === 'ounces') {
    unit = 'oz';
  } else if (unit === 'bottle' || unit === 'bottles') {
    unit = 'bottles';
  } else if (unit === 'box' || unit === 'boxes') {
    unit = 'boxes';
  } else if (unit === 'bag' || unit === 'bags') {
    unit = 'bags';
  } else if (unit === 'tube' || unit === 'tubes') {
    unit = 'tubes';
  }

  return { quantity: rawNum, unit, rawText: match[0] };
}

/**
 * Normalizes quantity against an existing item's unit:
 * e.g. If item unit is 'kg' and input is '500 grams' -> converts to 0.5 kg.
 */
export function normalizeQuantityToItemUnit(
  parsed: ParsedQuantity,
  itemUnit?: string
): { quantity: number; unit: string } {
  const normItemUnit = (itemUnit || '').toLowerCase();

  // Grams -> Kilograms
  if (parsed.unit === 'grams' && (normItemUnit === 'kg' || normItemUnit.includes('kg') || !itemUnit)) {
    return { quantity: parsed.quantity / 1000, unit: 'kg' };
  }

  // Kilograms -> Grams
  if (parsed.unit === 'kg' && normItemUnit === 'grams') {
    return { quantity: parsed.quantity * 1000, unit: 'grams' };
  }

  // ML -> Liters
  if (parsed.unit === 'ml' && (normItemUnit === 'liters' || normItemUnit.includes('liter'))) {
    return { quantity: parsed.quantity / 1000, unit: 'liters' };
  }

  return { quantity: parsed.quantity, unit: parsed.unit || itemUnit || 'units' };
}

/**
 * Strict Intent Classifier adhering to HomeOps AI PRD Section 3.
 * Prioritizes INVENTORY_UPDATE, INVENTORY_STATUS_QUERY, and explicit TASK_CREATE.
 * HARD RULE: Unknown intent must never automatically create a task.
 */
export function classifyIntent(message: string, state?: HomeState): IntentClassification {
  const clean = message.trim();
  const lower = clean.toLowerCase();

  // -------------------------------------------------------------
  // 1. INVENTORY REDUCE / REMOVAL ("Remove 1 kg of rice from my inventory", "We used 1 kg of rice")
  // -------------------------------------------------------------
  const removeInvMatch = lower.match(
    /(?:remove|deduct|subtract|use|consumed?|drank|ate)\s+([0-9.]+\s*[a-zA-Z%]*|half\s+a\s+[a-zA-Z]+|quarter\s+[a-zA-Z]+)\s+(?:of\s+)?([a-zA-Z\s]+?)(?:\s+from\s+(?:my\s+)?inventory)?$/i
  );
  if (removeInvMatch && !/task|bill|shopping/i.test(lower)) {
    const qtyParsed = parseQuantityAndUnit(removeInvMatch[1]);
    const rawEntity = removeInvMatch[2].replace(/^(the|my|our)\s+/i, '').trim();
    if (qtyParsed && rawEntity) {
      return {
        intent: 'INVENTORY_REDUCE',
        confidence: 0.98,
        entity: rawEntity,
        quantity: qtyParsed.quantity,
        unit: qtyParsed.unit,
      };
    }
  }

  const removeInvMatch2 = lower.match(
    /(?:remove|deduct|subtract)\s+([a-zA-Z\s]+?)\s+(?:by|with)\s+([0-9.]+\s*[a-zA-Z%]*|half\s+a\s+[a-zA-Z]+)(?:\s+from\s+(?:my\s+)?inventory)?/i
  );
  if (removeInvMatch2 && !/task|bill|shopping/i.test(lower)) {
    const rawEntity = removeInvMatch2[1].replace(/^(the|my|our)\s+/i, '').trim();
    const qtyParsed = parseQuantityAndUnit(removeInvMatch2[2]);
    if (qtyParsed && rawEntity) {
      return {
        intent: 'INVENTORY_REDUCE',
        confidence: 0.98,
        entity: rawEntity,
        quantity: qtyParsed.quantity,
        unit: qtyParsed.unit,
      };
    }
  }

  // -------------------------------------------------------------
  // 2. INVENTORY UPDATE (Highest Priority for quantity alterations)
  // -------------------------------------------------------------
  // Matches:
  // "Set Rice quantity to 0.5 kg."
  // "Set rice quantity to 500 grams."
  // "Update rice stock to 500 grams."
  // "Change Rice quantity to 1 kg"
  // "I have only 500 grams of rice left"
  // "I only have half a kilo of rice left"
  // "Only 0.5 kg of rice remaining"
  const setQtyMatch = lower.match(
    /(?:set|update|change|adjust)\s+(?:the\s+)?([a-zA-Z\s]+?)\s+(?:quantity|stock|level|amount)\s+(?:to|at|as)\s+([0-9.]+\s*[a-zA-Z%]*|half\s+a\s+[a-zA-Z]+|quarter\s+[a-zA-Z]+)/i
  );
  if (setQtyMatch) {
    const rawEntity = setQtyMatch[1].replace(/^(the|my|our)\s+/i, '').trim();
    const qtyParsed = parseQuantityAndUnit(setQtyMatch[2]);
    return {
      intent: 'INVENTORY_UPDATE',
      confidence: 0.98,
      entity: rawEntity,
      quantity: qtyParsed?.quantity,
      unit: qtyParsed?.unit,
    };
  }

  const setStockMatch2 = lower.match(
    /(?:set|update|change|adjust)\s+(?:the\s+)?([a-zA-Z\s]+?)\s+to\s+([0-9.]+\s*[a-zA-Z%]*|half\s+a\s+[a-zA-Z]+)/i
  );
  // Avoid matching "set task to complete"
  if (setStockMatch2 && !/task|bill|maintenance/i.test(setStockMatch2[1])) {
    const rawEntity = setStockMatch2[1].replace(/^(the|my|our)\s+/i, '').trim();
    const qtyParsed = parseQuantityAndUnit(setStockMatch2[2]);
    if (qtyParsed) {
      return {
        intent: 'INVENTORY_UPDATE',
        confidence: 0.95,
        entity: rawEntity,
        quantity: qtyParsed.quantity,
        unit: qtyParsed.unit,
      };
    }
  }

  // "I have only 500 grams of rice left" / "I only have half a kilo of rice left" / "Only 0.5 kg remaining"
  const remainingMatch = lower.match(
    /(?:i\s+have\s+(?:only\s+|just\s+)?|i\s+only\s+have\s+|there\s+is\s+(?:only\s+|just\s+)?|only\s+)([0-9.]+\s*[a-zA-Z%]*|half\s+a\s+[a-zA-Z]+|quarter\s+[a-zA-Z]+)\s+(?:of\s+)?([a-zA-Z\s]+?)(?:\s+left|\s+remaining|\s+in\s+stock)?$/i
  );
  if (remainingMatch && !/task|bill|dollar|\$/i.test(lower)) {
    const qtyParsed = parseQuantityAndUnit(remainingMatch[1]);
    const rawEntity = remainingMatch[2].replace(/(?:left|remaining|in\s+stock)$/i, '').trim();
    if (qtyParsed && rawEntity) {
      return {
        intent: 'INVENTORY_UPDATE',
        confidence: 0.95,
        entity: rawEntity,
        quantity: qtyParsed.quantity,
        unit: qtyParsed.unit,
      };
    }
  }

  // -------------------------------------------------------------
  // 3. INVENTORY STATUS QUERY & SPECIAL QUERIES (Read-Only Safety)
  // -------------------------------------------------------------
  // "What household items are out of stock?" / "What items are out of stock?"
  if (
    /(?:what|which)\s+(?:household\s+)?(?:items|things|supplies)?\s+(?:are\s+)?(?:out\s+of\s+stock|depleted|empty)/i.test(lower)
  ) {
    return {
      intent: 'INVENTORY_OUT_OF_STOCK_QUERY',
      confidence: 0.98,
    };
  }

  // "What items should I restock based on my inventory?" / "Which items should I restock?" / "What should I restock?"
  if (
    /(?:what|which)\s+items\s+should\s+i\s+restock/i.test(lower) ||
    /restock\s+based\s+on\s+(?:my\s+)?inventory/i.test(lower) ||
    /(?:what|which)\s+to\s+restock/i.test(lower)
  ) {
    return {
      intent: 'INVENTORY_RESTOCK_QUERY',
      confidence: 0.98,
    };
  }

  // "Which items are running low?" / "What items are low in stock?"
  if (
    /(?:which|what)\s+(?:household\s+)?items\s+are\s+(?:running\s+)?low/i.test(lower) ||
    /low\s+stock\s+items/i.test(lower) ||
    /^running\s+low$/i.test(lower)
  ) {
    return {
      intent: 'INVENTORY_QUERY',
      confidence: 0.98,
    };
  }

  // "Is rice low in stock?"
  // "How much rice do I have?"
  // "How many eggs do I have?"
  const isLowMatch = lower.match(
    /^is\s+(?:the\s+)?([a-zA-Z\s]+?)\s+(?:running\s+)?(?:low|critical|out\s+of\s+stock|in\s+stock)(?:\s+in\s+stock)?\??$/i
  );
  if (isLowMatch) {
    return {
      intent: 'INVENTORY_STATUS_QUERY',
      confidence: 0.98,
      entity: isLowMatch[1].trim(),
    };
  }

  const howMuchMatch = lower.match(
    /^(?:how\s+much|how\s+many|what\s+quantity\s+of|what\s+is\s+the\s+stock\s+of|what\s+is\s+the\s+level\s+of)\s+(?:the\s+)?([a-zA-Z\s]+?)(?:\s+do\s+(?:i|we)\s+have|\s+left|\s+remaining|\s+in\s+stock|\s+inventory)?\??$/i
  );
  if (howMuchMatch) {
    return {
      intent: 'INVENTORY_STATUS_QUERY',
      confidence: 0.98,
      entity: howMuchMatch[1].trim(),
    };
  }

  const doWeHaveMatch = lower.match(
    /^(?:do\s+(?:i|we)\s+have|check\s+(?:the\s+)?inventory\s+for|check\s+(?:the\s+)?stock\s+of|check\s+([a-zA-Z\s]+?)\s+(?:inventory|stock))\s*(?:any\s+)?([a-zA-Z\s]*)\??$/i
  );
  if (doWeHaveMatch) {
    const rawEntity = (doWeHaveMatch[1] || doWeHaveMatch[2] || '').trim();
    if (rawEntity && !/task|bill|maintenance/i.test(rawEntity)) {
      return {
        intent: 'INVENTORY_STATUS_QUERY',
        confidence: 0.94,
        entity: rawEntity,
      };
    }
  }

  // -------------------------------------------------------------
  // 4. INVENTORY ADD
  // -------------------------------------------------------------
  // "Add rice to my inventory with 2 kg."
  // "Add 2 kg rice to my inventory"
  const addInvMatch = lower.match(
    /(?:add|register|insert)\s+([a-zA-Z\s]+?)\s+to\s+(?:my\s+)?inventory(?:\s+with\s+|\s*:\s*|\s+at\s+)?([0-9.]+\s*[a-zA-Z%]*|half\s+a\s+[a-zA-Z]+)?/i
  );
  if (addInvMatch) {
    const rawEntity = addInvMatch[1].replace(/^(the|my|our)\s+/i, '').trim();
    const qtyParsed = addInvMatch[2] ? parseQuantityAndUnit(addInvMatch[2]) : null;
    return {
      intent: 'INVENTORY_ADD',
      confidence: 0.97,
      entity: rawEntity,
      quantity: qtyParsed?.quantity ?? 100,
      unit: qtyParsed?.unit ?? 'units',
      threshold: qtyParsed?.quantity ? (qtyParsed.quantity > 1 ? Math.round(qtyParsed.quantity * 0.5 * 10) / 10 : 1) : 1,
    };
  }

  const addInvMatch2 = lower.match(
    /(?:add|register)\s+([0-9.]+\s*[a-zA-Z%]*)\s+(?:of\s+)?([a-zA-Z\s]+?)\s+to\s+(?:my\s+)?inventory/i
  );
  if (addInvMatch2) {
    const qtyParsed = parseQuantityAndUnit(addInvMatch2[1]);
    const rawEntity = addInvMatch2[2].trim();
    return {
      intent: 'INVENTORY_ADD',
      confidence: 0.97,
      entity: rawEntity,
      quantity: qtyParsed?.quantity ?? 100,
      unit: qtyParsed?.unit ?? 'units',
      threshold: qtyParsed?.quantity ? (qtyParsed.quantity > 1 ? Math.round(qtyParsed.quantity * 0.5 * 10) / 10 : 1) : 1,
    };
  }

  // -------------------------------------------------------------
  // 5. GENERAL INVENTORY QUERY (Read-Only)
  // -------------------------------------------------------------
  if (
    /^(?:show|list|get|view|display|check)\s+(?:my\s+)?inventory/i.test(lower) ||
    /^(?:what\s+is\s+in\s+(?:my\s+)?inventory|what\s+inventory\s+do\s+(?:i|we)\s+have)/i.test(lower)
  ) {
    return {
      intent: 'INVENTORY_QUERY',
      confidence: 0.95,
    };
  }

  // -------------------------------------------------------------
  // 6. SHOPPING LIST INTENTS
  // -------------------------------------------------------------
  // "What should I buy urgently?"
  if (/what\s+should\s+i\s+buy\s+urgently/i.test(lower) || /urgent\s+(?:shopping|groceries|items\s+to\s+buy)/i.test(lower)) {
    return {
      intent: 'SHOPPING_URGENT_QUERY',
      confidence: 0.98,
    };
  }

  // "Add milk to my shopping list." / "Add 2 kg rice and 1 litre oil to my shopping list."
  if (
    /^(?:add\s+(.+?)\s+to\s+(?:my\s+)?shopping\s+list|need\s+to\s+buy\s+(.+)|buy\s+(.+?)\s+for\s+shopping)/i.test(lower) &&
    !/task/i.test(lower)
  ) {
    const m = lower.match(/(?:add\s+(.+?)\s+to\s+(?:my\s+)?shopping|need\s+to\s+buy\s+(.+))/i);
    const itemStr = (m ? (m[1] || m[2]) : '').trim();
    return {
      intent: 'SHOPPING_ADD',
      confidence: 0.96,
      entity: itemStr || 'item',
      details: { rawItems: itemStr },
    };
  }

  if (/^(?:remove|delete)\s+(.+?)\s+from\s+(?:my\s+)?shopping\s+list/i.test(lower)) {
    const m = lower.match(/(?:remove|delete)\s+(.+?)\s+from\s+(?:my\s+)?shopping/i);
    return {
      intent: 'SHOPPING_REMOVE',
      confidence: 0.95,
      entity: m ? m[1].trim() : 'item',
    };
  }

  if (
    /^(?:show|view|display|what\s+is\s+on)\s+(?:my\s+)?shopping\s+list/i.test(lower) ||
    lower === 'shopping list' ||
    lower === 'show my shopping list' ||
    lower === 'show shopping list'
  ) {
    return {
      intent: 'SHOPPING_QUERY',
      confidence: 0.98,
    };
  }

  // -------------------------------------------------------------
  // 7. BILLS INTENTS
  // -------------------------------------------------------------
  // "Add my electricity bill of ₹1,850 due on September 20."
  // "Add electricity bill $120 due tomorrow"
  const addBillMatch = lower.match(
    /(?:add|register|record)\s+(?:my\s+)?([a-zA-Z\s]+?)\s+bill(?:\s+of|\s*:)?\s*(?:[₹$€£Rs\.\s]*)([0-9,]+(?:\.[0-9]{2})?)\s*(?:due\s+(?:on\s+)?([a-zA-Z0-9\s]+))?/i
  );
  if (addBillMatch) {
    const billName = `${addBillMatch[1].trim()} Bill`;
    const cleanAmt = parseFloat(addBillMatch[2].replace(/,/g, ''));
    const dueStr = addBillMatch[3] ? addBillMatch[3].trim() : 'Due Soon';
    return {
      intent: 'BILL_ADD',
      confidence: 0.98,
      entity: billName,
      quantity: isNaN(cleanAmt) ? 0 : cleanAmt,
      targetDate: dueStr,
    };
  }

  // "Mark the electricity bill as paid." / "Paid electricity bill"
  if (
    /^(?:mark\s+(?:the\s+)?([a-zA-Z\s]+?)\s+bill\s+as\s+paid|mark\s+bill\s+([a-zA-Z\s]+?)\s+as\s+paid|paid\s+(?:my\s+|the\s+)?([a-zA-Z\s]+?)\s+bill)/i.test(lower) ||
    /^(?:mark\s+(.+?)\s+as\s+paid)/i.test(lower)
  ) {
    const m = lower.match(/(?:mark\s+(?:the\s+)?|paid\s+(?:my\s+|the\s+)?)(.+?)(?:\s+bill)?(?:\s+as\s+paid|$)/i);
    return {
      intent: 'BILL_PAY',
      confidence: 0.98,
      entity: m ? m[1].replace(/bill|paid|the|my/gi, '').trim() : 'bill',
    };
  }

  // "Which bills are due this week?" / "What bills are overdue?" / "Show my upcoming bills."
  if (
    /^(?:show\s+(?:my\s+)?(?:upcoming\s+)?bills|which\s+bills\s+are\s+due|what\s+bills\s+are\s+overdue|what\s+bills|upcoming\s+bills|overdue\s+bills)/i.test(lower)
  ) {
    let filter = 'upcoming';
    if (/overdue/i.test(lower)) filter = 'overdue';
    else if (/this\s+week/i.test(lower)) filter = 'this_week';
    return {
      intent: 'BILL_QUERY',
      confidence: 0.98,
      details: { filter },
    };
  }

  // -------------------------------------------------------------
  // 8. MAINTENANCE INTENTS
  // -------------------------------------------------------------
  // "Add AC servicing for next Saturday."
  // "Remind me to service the washing machine."
  // "Schedule maintenance: water filter"
  const addMaintMatch = lower.match(
    /(?:add|schedule)\s+(?:an?\s+)?([a-zA-Z\s]+?)(?:\s+servicing|\s+service|\s+maintenance)(?:\s+for\s+([a-zA-Z0-9\s]+))?/i
  );
  if (addMaintMatch) {
    const title = `${addMaintMatch[1].trim()} Servicing`;
    const due = addMaintMatch[2] ? addMaintMatch[2].trim() : 'Upcoming';
    let cat = 'Appliance';
    if (/ac|air\s*con/i.test(title)) cat = 'HVAC';
    else if (/tap|sink|plumb|water/i.test(title)) cat = 'Plumbing';
    return {
      intent: 'MAINTENANCE_ADD',
      confidence: 0.98,
      details: { title, category: cat, dueDate: due },
    };
  }

  if (/^remind\s+me\s+to\s+service\s+(?:the\s+)?([a-zA-Z\s]+)/i.test(lower)) {
    const m = lower.match(/^remind\s+me\s+to\s+service\s+(?:the\s+)?([a-zA-Z\s]+)/i);
    const title = `Service the ${m ? m[1].trim() : 'Appliance'}`;
    return {
      intent: 'MAINTENANCE_ADD',
      confidence: 0.96,
      details: { title, category: 'Appliance', dueDate: 'This Weekend' },
    };
  }

  // "When is my next maintenance task?" / "Show all upcoming maintenance." / "What home maintenance is overdue?"
  if (
    /^(?:when\s+is\s+my\s+next\s+maintenance|show\s+all\s+upcoming\s+maintenance|what\s+home\s+maintenance\s+is\s+overdue|what\s+maintenance|upcoming\s+maintenance)/i.test(lower)
  ) {
    let filter = 'upcoming';
    if (/overdue/i.test(lower)) filter = 'overdue';
    else if (/next/i.test(lower)) filter = 'next';
    return {
      intent: 'MAINTENANCE_QUERY',
      confidence: 0.98,
      details: { filter },
    };
  }

  if (/^(?:mark|set)\s+(?:the\s+)?maintenance\s+(.+?)\s+(?:as\s+)?(?:completed|done)/i.test(lower)) {
    const m = lower.match(/maintenance\s+(.+?)(?:\s+as\s+completed|\s+as\s+done|\s+done|$)/i);
    return {
      intent: 'MAINTENANCE_COMPLETE',
      confidence: 0.95,
      entity: m ? m[1].trim() : 'maintenance',
    };
  }

  // -------------------------------------------------------------
  // 9. EXPLICIT TASK INTENT (Rule TS-001 & BUG-003)
  // "Add a task to clean the kitchen tomorrow."
  // "Remind me to pay the electricity bill."
  // "Show my pending tasks."
  // "What tasks are due today?"
  // "Mark the kitchen cleaning task as completed."
  // "What's the most urgent task right now?"
  // -------------------------------------------------------------
  // "What's the most urgent task right now?" / "What is the most urgent task?"
  if (
    /(?:what(?:'s|\s+is)\s+the\s+most\s+urgent\s+task|most\s+urgent\s+task|top\s+priority\s+task)/i.test(lower)
  ) {
    return {
      intent: 'PRIORITY_QUERY',
      confidence: 0.98,
    };
  }

  // "What tasks are due today?"
  if (
    /what\s+tasks\s+are\s+due\s+today/i.test(lower) ||
    /tasks\s+due\s+today/i.test(lower) ||
    /today(?:'s)?\s+tasks/i.test(lower)
  ) {
    return {
      intent: 'TASK_QUERY',
      confidence: 0.98,
      details: { filter: 'today' },
    };
  }

  // "Show my pending tasks."
  if (
    /show\s+(?:my\s+)?pending\s+tasks/i.test(lower) ||
    /pending\s+tasks/i.test(lower) ||
    /what\s+are\s+my\s+pending\s+tasks/i.test(lower)
  ) {
    return {
      intent: 'TASK_QUERY',
      confidence: 0.98,
      details: { filter: 'pending' },
    };
  }

  // "Add a task to clean the kitchen tomorrow."
  // "Remind me to pay the electricity bill."
  const explicitTaskMatch = lower.match(
    /^(?:add\s+(?:a\s+)?task\s+(?:to\s+)?|create\s+(?:a\s+)?task\s+(?:to\s+)?|remind\s+me\s+to\s+|put\s+(?:this\s+)?on\s+(?:my\s+)?(?:to-do|todo)\s+list|schedule\s+(?:a\s+)?task)\s*(.*)/i
  );
  if (explicitTaskMatch) {
    let taskTitle = explicitTaskMatch[1]?.trim() || clean;
    let targetDate = 'Today';
    let cat: any = 'general';

    if (/tomorrow/i.test(taskTitle)) {
      targetDate = 'Tomorrow';
      taskTitle = taskTitle.replace(/\s+tomorrow/i, '').trim();
    } else if (/today/i.test(taskTitle)) {
      targetDate = 'Today';
      taskTitle = taskTitle.replace(/\s+today/i, '').trim();
    }

    if (/kitchen|clean|sweep|vacuum|disinfect/i.test(taskTitle)) cat = 'cleaning';
    else if (/bill|pay|electricity|utility/i.test(taskTitle)) cat = 'bill';
    else if (/service|ac|plumb|maintenance/i.test(taskTitle)) cat = 'maintenance';
    else if (/buy|shop|grocery/i.test(taskTitle)) cat = 'shopping';

    return {
      intent: 'TASK_CREATE',
      confidence: 0.98,
      details: { title: taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1), category: cat, dueDate: targetDate },
      targetDate,
    };
  }

  // Task complete: "Mark the kitchen cleaning task as completed."
  if (
    /^(?:mark|set)\s+(?:the\s+)?([a-zA-Z\s]+?)\s*(?:task)?\s+as\s+(?:completed|done|finished)/i.test(lower) ||
    /^(?:complete|finish)\s+(?:the\s+)?([a-zA-Z\s]+?)\s*(?:task)?$/i.test(lower)
  ) {
    const m = lower.match(/(?:mark|set|complete|finish)\s+(?:the\s+)?([a-zA-Z\s]+?)(?:\s+task)?(?:\s+as\s+completed|\s+as\s+done|\s+done|$)/i);
    const target = m ? m[1].replace(/task|the|my/gi, '').trim() : 'task';
    return {
      intent: 'TASK_COMPLETE',
      confidence: 0.98,
      entity: target,
    };
  }

  // Task delete
  if (/^(?:delete|remove)\s+(?:the\s+)?task\s+(.+)/i.test(lower)) {
    const m = lower.match(/(?:delete|remove)\s+(?:the\s+)?task\s+(.+)/i);
    return {
      intent: 'TASK_DELETE',
      confidence: 0.95,
      entity: m ? m[1].trim() : 'task',
    };
  }

  // Task query (Read-Only)
  if (
    /^(?:what\s+tasks|show\s+(?:my\s+)?tasks|list\s+tasks|what\s+chores)/i.test(lower) ||
    lower === 'tasks' ||
    lower === 'show tasks'
  ) {
    return {
      intent: 'TASK_QUERY',
      confidence: 0.95,
    };
  }

  // -------------------------------------------------------------
  // 10. ACTIVITY HISTORY & CALENDAR QUERIES
  // -------------------------------------------------------------
  if (
    /^(?:what\s+did\s+i\s+(?:change|do)|activity\s+calendar|activity\s+history|when\s+did\s+i\s+update|which\s+day\s+did\s+i\s+pay)/i.test(lower)
  ) {
    return {
      intent: 'ACTIVITY_HISTORY_QUERY',
      confidence: 0.95,
    };
  }

  // -------------------------------------------------------------
  // 11. GENERAL CONVERSATION
  // -------------------------------------------------------------
  if (/^(?:hi|hello|hey|good\s+morning|good\s+evening|who\s+are\s+you|help|what\s+can\s+you\s+do|thanks|thank\s+you)$/i.test(lower)) {
    return {
      intent: 'GENERAL_CONVERSATION',
      confidence: 0.99,
    };
  }

  // -------------------------------------------------------------
  // 12. UNKNOWN INTENT (CRITICAL PRD MANDATE)
  // Input like "Rice situation." or fragmented words.
  // HARD RULE: Unknown intent must never automatically create a task!
  // -------------------------------------------------------------
  return {
    intent: 'UNKNOWN',
    confidence: 0.2,
    clarificationMessage:
      "I'm not sure whether you want to update inventory, create a task, or check an existing record. Could you clarify?",
  };
}
