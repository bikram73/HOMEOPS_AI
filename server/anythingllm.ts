import { stateManager } from './state';
import { processUserMessage, AgentProcessResult } from './gemini';

export interface AnythingLLMCitation {
  title: string;
  source: string;
  snippet: string;
  score?: number;
}

export interface AnythingLLMWorkspaceResponse {
  id: string;
  workspaceSlug: string;
  textResponse: string;
  sources: AnythingLLMCitation[];
  contextRetained: boolean;
  agentToolsExecuted?: string[];
}

export interface WorkspaceDocument {
  id: string;
  title: string;
  filename: string;
  category: string;
  summary: string;
  updatedAt: string;
}

// Default HomeOps Knowledge Base / Documents loaded into AnythingLLM workspace
export const INITIAL_WORKSPACE_DOCUMENTS: WorkspaceDocument[] = [
  {
    id: 'doc-1',
    title: 'Home Maintenance & AC Servicing Manual',
    filename: 'home_maintenance_guide_2026.pdf',
    category: 'Maintenance',
    summary: 'Filter cleaning cadence (every 90 days), deep coil check before summer, refrigerant recharge specs.',
    updatedAt: 'Aug 2026',
  },
  {
    id: 'doc-2',
    title: 'Household Utility Bills & Payment Calendar',
    filename: 'bills_schedule_2026.json',
    category: 'Finances',
    summary: 'Electricity due 5th of month (BESCOM), Wi-Fi due 10th (Airtel), Gas piped utility due 18th.',
    updatedAt: 'Aug 2026',
  },
  {
    id: 'doc-3',
    title: 'Pantry Minimum Par Levels & Grocery SOP',
    filename: 'pantry_par_levels.md',
    category: 'Inventory',
    summary: 'Restock thresholds: Basmati rice (<2kg), olive oil (<1 bottle), organic eggs (<6 pack), dish soap (<1 refill).',
    updatedAt: 'Aug 2026',
  },
  {
    id: 'doc-4',
    title: 'Home Cleaning Schedule & Maid Checklist',
    filename: 'cleaning_routines.md',
    category: 'Cleaning',
    summary: 'Daily sweep & mop, Tuesdays bathroom deep clean, Saturdays linen rotation & vacuuming.',
    updatedAt: 'Aug 2026',
  },
];

class AnythingLLMBridgeService {
  private workspaceSlug = 'homeops-ai';
  private workspaceName = 'HomeOps-AI Workspace';
  private documents: WorkspaceDocument[] = INITIAL_WORKSPACE_DOCUMENTS;
  // Per-person / channel context memory
  private userContexts: Map<string, { lastInteraction: string; citedDocs: string[]; messageCount: number; history: Array<{ role: 'user' | 'assistant'; content: string }> }> = new Map();

  /**
   * Query the AnythingLLM workspace for a user across any channel (Telegram, Slack, Email, etc.)
   */
  public async queryWorkspace(
    message: string,
    senderId: string = 'telegram_user',
    channel: string = 'Telegram'
  ): Promise<AnythingLLMWorkspaceResponse> {
    const contextKey = `${channel}:${senderId}`;
    let userCtx = this.userContexts.get(contextKey);
    if (!userCtx) {
      userCtx = {
        lastInteraction: new Date().toISOString(),
        citedDocs: [],
        messageCount: 0,
        history: [],
      };
      this.userContexts.set(contextKey, userCtx);
    }

    userCtx.messageCount++;
    userCtx.lastInteraction = new Date().toISOString();
    userCtx.history.push({ role: 'user', content: message });
    if (userCtx.history.length > 10) userCtx.history.shift();

    // Find relevant documents to cite
    const citations: AnythingLLMCitation[] = [];
    const lower = message.toLowerCase();

    if (lower.includes('ac') || lower.includes('filter') || lower.includes('repair') || lower.includes('service') || lower.includes('maintenance')) {
      const doc = this.documents.find(d => d.id === 'doc-1');
      if (doc) {
        citations.push({
          title: doc.title,
          source: doc.filename,
          snippet: doc.summary,
          score: 0.94,
        });
        if (!userCtx.citedDocs.includes(doc.title)) userCtx.citedDocs.push(doc.title);
      }
    }

    if (lower.includes('bill') || lower.includes('electric') || lower.includes('pay') || lower.includes('wifi') || lower.includes('rent')) {
      const doc = this.documents.find(d => d.id === 'doc-2');
      if (doc) {
        citations.push({
          title: doc.title,
          source: doc.filename,
          snippet: doc.summary,
          score: 0.91,
        });
        if (!userCtx.citedDocs.includes(doc.title)) userCtx.citedDocs.push(doc.title);
      }
    }

    if (lower.includes('rice') || lower.includes('milk') || lower.includes('oil') || lower.includes('egg') || lower.includes('grocery') || lower.includes('stock') || lower.includes('inventory') || lower.includes('shopping')) {
      const doc = this.documents.find(d => d.id === 'doc-3');
      if (doc) {
        citations.push({
          title: doc.title,
          source: doc.filename,
          snippet: doc.summary,
          score: 0.93,
        });
        if (!userCtx.citedDocs.includes(doc.title)) userCtx.citedDocs.push(doc.title);
      }
    }

    // Call HomeOps AI core (Gemini + tool executions + in-memory store)
    const agentResult: AgentProcessResult = await processUserMessage(message);

    userCtx.history.push({ role: 'assistant', content: agentResult.response });
    if (userCtx.history.length > 10) userCtx.history.shift();

    return {
      id: `allm-${Date.now()}`,
      workspaceSlug: this.workspaceSlug,
      textResponse: agentResult.response,
      sources: citations,
      contextRetained: true,
      agentToolsExecuted: agentResult.toolsExecuted?.map(t => t.toolName) || [],
    };
  }

  public getWorkspaceInfo() {
    return {
      workspaceSlug: this.workspaceSlug,
      workspaceName: this.workspaceName,
      activeDocuments: this.documents,
      activeContextsCount: this.userContexts.size,
      allCitedDocuments: Array.from(
        new Set(Array.from(this.userContexts.values()).flatMap(c => c.citedDocs))
      ),
    };
  }

  public getUserContext(channel: string, senderId: string) {
    const contextKey = `${channel}:${senderId}`;
    return this.userContexts.get(contextKey) || {
      lastInteraction: null,
      citedDocs: [],
      messageCount: 0,
      history: [],
    };
  }
}

export const anythingLLMBridge = new AnythingLLMBridgeService();
