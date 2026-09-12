import { HomeState, InventoryItem } from './types';

export type UserIntent =
  | 'TASK_CREATE'
  | 'TASK_UPDATE'
  | 'TASK_COMPLETE'
  | 'TASK_DELETE'
  | 'TASK_QUERY'
  | 'INVENTORY_ADD'
  | 'INVENTORY_UPDATE'
  | 'INVENTORY_QUERY'
  | 'INVENTORY_STATUS_QUERY'
  | 'SHOPPING_ADD'
  | 'SHOPPING_REMOVE'
  | 'SHOPPING_QUERY'
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
  // 1. INVENTORY UPDATE (Highest Priority for quantity alterations)
  // -------------------------------------------------------------
  // Matches:
  // "Set Rice quantity to 0.5 kg."
  // "Update rice stock to 500 grams."
  // "Change Rice quantity to 1 kg"
  // "I have only 500 grams of rice left"
  // "I only have half a kilo of rice left"
  // "Only 0.5 kg of rice remaining"
  // "Reduce rice to 1 kg"
  // "We used some rice. There is 0.5 kg remaining"
  const setQtyMatch = lower.match(
    /(?:set|update|change|adjust)\s+(?:the\s+)?([a-zA-Z\s]+?)\s+(?:quantity|stock|level|amount)\s+(?:to|at)\s+([0-9.]+\s*[a-zA-Z%]*|half\s+a\s+[a-zA-Z]+|quarter\s+[a-zA-Z]+)/i
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

  // "We used some rice... there is 0.5 kg remaining"
  if (/(?:used|consumed|finished|drank|ate)\s+(?:some\s+)?([a-zA-Z\s]+?)[,.]/i.test(lower)) {
    const entitySub = lower.match(/(?:used|consumed|finished|drank|ate)\s+(?:some\s+)?([a-zA-Z\s]+?)[,.]/i);
    const qtySub = lower.match(/([0-9.]+\s*[a-zA-Z%]*|half\s+a\s+[a-zA-Z]+)\s+(?:left|remaining)/i);
    if (entitySub && qtySub) {
      const qtyParsed = parseQuantityAndUnit(qtySub[1]);
      return {
        intent: 'INVENTORY_UPDATE',
        confidence: 0.92,
        entity: entitySub[1].trim(),
        quantity: qtyParsed?.quantity,
        unit: qtyParsed?.unit,
      };
    }
  }

  // -------------------------------------------------------------
  // 2. INVENTORY STATUS QUERY (Read-Only Safety)
  // -------------------------------------------------------------
  // "Is rice low in stock?"
  // "Is Jasmine Rice low?"
  // "How much rice do I have?"
  // "How many eggs do I have?"
  // "What is the stock of rice?"
  // "Do we have milk?"
  // "Check rice inventory"
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
  // 3. INVENTORY ADD
  // -------------------------------------------------------------
  // "Add Rice to inventory with 2 kg."
  // "Add 2 kg Rice to inventory"
  // "Add milk to inventory: 1 Gallon"
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

  // "Add 2 kg of Rice to inventory"
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
  // 4. GENERAL INVENTORY QUERY (Read-Only)
  // -------------------------------------------------------------
  if (
    /^(?:show|list|get|view|display|check)\s+(?:my\s+)?inventory/i.test(lower) ||
    /^(?:what\s+is\s+in\s+(?:my\s+)?inventory|what\s+inventory\s+do\s+(?:i|we)\s+have)/i.test(lower) ||
    /^(?:low\s+stock\s+items|which\s+items\s+are\s+low)/i.test(lower)
  ) {
    return {
      intent: 'INVENTORY_QUERY',
      confidence: 0.95,
    };
  }

  // -------------------------------------------------------------
  // 5. EXPLICIT TASK INTENT (Rule TS-001 & BUG-003)
  // Explicit task verbs required: "create a task", "add a task",
  // "remind me to", "put this on my to-do list", "schedule a task"
  // -------------------------------------------------------------
  const explicitTaskMatch = lower.match(
    /^(?:create\s+(?:a\s+)?task|add\s+(?:a\s+)?task|remind\s+me\s+to|put\s+(?:this\s+)?on\s+(?:my\s+)?(?:to-do|todo)\s+list|schedule\s+(?:a\s+)?task|new\s+task\s*:?)\s*(.*)/i
  );
  if (explicitTaskMatch) {
    const taskDetails = explicitTaskMatch[1]?.trim() || clean;
    // Extract date if present, e.g. "tomorrow", "next Monday"
    let targetDate: string | undefined;
    if (/tomorrow/i.test(taskDetails)) targetDate = 'Tomorrow';
    else if (/today/i.test(taskDetails)) targetDate = 'Today';
    else if (/in\s+(\d+)\s+days?/i.test(taskDetails)) {
      const d = taskDetails.match(/in\s+(\d+)\s+days?/i);
      if (d) targetDate = `In ${d[1]} days`;
    }

    return {
      intent: 'TASK_CREATE',
      confidence: 0.98,
      details: { title: taskDetails },
      targetDate,
    };
  }

  // Task complete
  if (
    /^(?:mark|set)\s+(?:the\s+)?task\s+(.+?)\s+(?:as\s+)?(?:completed|done|finished)/i.test(lower) ||
    /^(?:complete|finish)\s+(?:the\s+)?task\s+(.+)/i.test(lower) ||
    /^(?:mark\s+)?clean\s+kitchen\s+(?:as\s+)?(?:completed|done)/i.test(lower)
  ) {
    const m = lower.match(/(?:task\s+|mark\s+)(.+?)(?:\s+as\s+completed|\s+as\s+done|\s+complete|\s+done|$)/i);
    return {
      intent: 'TASK_COMPLETE',
      confidence: 0.95,
      entity: m ? m[1].trim() : 'task',
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
    /^(?:what\s+tasks|show\s+(?:my\s+)?tasks|list\s+tasks|what\s+chores|pending\s+tasks)/i.test(lower) ||
    lower === 'tasks' ||
    lower === 'show tasks'
  ) {
    return {
      intent: 'TASK_QUERY',
      confidence: 0.95,
    };
  }

  // -------------------------------------------------------------
  // 6. SHOPPING LIST INTENTS
  // -------------------------------------------------------------
  if (
    /^(?:add\s+(.+?)\s+to\s+(?:my\s+)?shopping\s+list|need\s+to\s+buy\s+(.+)|buy\s+(.+?)\s+for\s+shopping)/i.test(lower) &&
    !/task/i.test(lower)
  ) {
    const m = lower.match(/(?:add\s+(.+?)\s+to\s+(?:my\s+)?shopping|need\s+to\s+buy\s+(.+))/i);
    return {
      intent: 'SHOPPING_ADD',
      confidence: 0.94,
      entity: m ? (m[1] || m[2]).trim() : 'item',
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
  if (/^(?:mark|set)\s+(.+?)\s+(?:bill\s+)?(?:as\s+)?paid/i.test(lower) || /^paid\s+(?:my\s+)?(.+?)\s+bill/i.test(lower)) {
    const m = lower.match(/(?:mark|set|paid)\s+(?:my\s+)?(.+?)(?:\s+bill)?\s+(?:as\s+)?paid/i) ||
      lower.match(/^paid\s+(?:my\s+)?(.+?)\s+bill/i);
    return {
      intent: 'BILL_PAY',
      confidence: 0.96,
      entity: m ? m[1].trim() : 'bill',
    };
  }

  if (
    /^(?:did\s+i\s+pay|have\s+i\s+paid|is\s+(?:the\s+)?([a-zA-Z\s]+?)\s+bill\s+paid|what\s+bills|show\s+(?:my\s+)?bills|upcoming\s+bills)/i.test(lower)
  ) {
    const m = lower.match(/(?:did\s+i\s+pay|have\s+i\s+paid|is)\s+(?:the\s+)?([a-zA-Z\s]+?)\s+bill/i);
    return {
      intent: 'BILL_QUERY',
      confidence: 0.95,
      entity: m ? m[1].trim() : undefined,
    };
  }

  // -------------------------------------------------------------
  // 8. MAINTENANCE INTENTS
  // -------------------------------------------------------------
  if (/^(?:schedule|add)\s+maintenance\s+(.+)/i.test(lower)) {
    const m = lower.match(/(?:schedule|add)\s+maintenance\s+(.+)/i);
    return {
      intent: 'MAINTENANCE_ADD',
      confidence: 0.95,
      details: { title: m ? m[1].trim() : 'Maintenance' },
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

  if (/^(?:what\s+maintenance|upcoming\s+maintenance|maintenance\s+schedule)/i.test(lower)) {
    return {
      intent: 'MAINTENANCE_QUERY',
      confidence: 0.95,
    };
  }

  // -------------------------------------------------------------
  // 9. PRIORITY & PLANNING QUERIES
  // -------------------------------------------------------------
  if (
    /^(?:what\s+should\s+i\s+do\s+now|what\s+to\s+do\s+now|prioritize\s+(?:my\s+)?tasks|daily\s+briefing|morning\s+briefing|weekly\s+plan)/i.test(lower)
  ) {
    return {
      intent: 'PRIORITY_QUERY',
      confidence: 0.98,
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
