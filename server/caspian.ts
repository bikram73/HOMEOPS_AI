import { processUserMessage } from './gemini';
import { stateManager } from './state';

/**
 * Caspian Multi-Channel Integration Service for HomeOps-AI
 * 
 * Architecture:
 * Telegram (@MyHomeOps_bot) / Inbound Channels
 *   ↓
 * Caspian Hosted Gateway (https://api.trycaspianai.com)
 *   ↓
 * HomeOps Backend Agent (Gemini 3.8 Flash + Tool Calling)
 *   ↓
 * Unified In-Memory Household State Manager & Real-Time Response
 */

export interface CaspianChannelInfo {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'available' | 'standby';
  description: string;
  icon: string;
}

export interface CaspianStatus {
  initialized: boolean;
  agentName: string;
  channel: string;
  hasApiKey: boolean;
  apiKeyPrefix: string;
  baseUrl: string;
  botUsername?: string;
  totalMessagesProcessed: number;
  lastActive: string | null;
  channels: CaspianChannelInfo[];
}

class CaspianIntegrationService {
  private isInitialized = false;
  private agentName = 'HomeOps-AI';
  private defaultChannel = 'Telegram';
  private totalMessages = 0;
  private lastActiveTimestamp: string | null = null;
  private caspianClient: any = null;
  private cachedChannels: CaspianChannelInfo[] = [
    { id: 'telegram', name: 'Telegram', type: 'messaging', status: 'connected', description: 'Primary chat bot gateway via @BotFather (@MyHomeOps_bot)', icon: 'send' },
    { id: 'email', name: 'Email', type: 'email', status: 'available', description: 'Inbound bill & invoice auto-forwarding parser', icon: 'mail' },
    { id: 'slack', name: 'Slack', type: 'workplace', status: 'available', description: 'Household ops & shared apartment alerts channel', icon: 'tag' },
    { id: 'discord', name: 'Discord', type: 'community', status: 'available', description: 'Family server notification bot & webhooks', icon: 'forum' },
    { id: 'sms', name: 'Phone / SMS', type: 'sms', status: 'available', description: 'Urgent utility cutoff alerts & SMS reminders', icon: 'sms' },
  ];

  constructor() {
    this.initCaspian();
  }

  public getApiKey(): string {
    return process.env.CASPIAN_API_KEY || '';
  }

  public getBaseUrl(): string {
    return process.env.CASPIAN_BASE_URL || 'https://api.trycaspianai.com';
  }

  public getBotToken(): string {
    return process.env.TELEGRAM_BOT_TOKEN || '';
  }

  public getBotUsername(): string {
    return process.env.TELEGRAM_BOT_USERNAME || '@MyHomeOps_bot';
  }

  private async initCaspian() {
    const apiKey = this.getApiKey();
    const baseUrl = this.getBaseUrl();
    const botToken = this.getBotToken();

    try {
      // Dynamic import of caspian-sdk if present
      const caspianModule = await import('caspian-sdk');
      const Caspian = (caspianModule as any).default || caspianModule.Caspian || caspianModule;

      if (typeof Caspian === 'function' || typeof Caspian === 'object') {
        this.caspianClient = typeof Caspian === 'function'
          ? new Caspian({
              apiKey,
              baseURL: baseUrl,
              baseUrl,
              agentName: this.agentName,
              via: 'hosted',
              telegram: botToken ? { token: botToken } : undefined,
            })
          : Caspian;
        this.isInitialized = true;
        console.log(`[Caspian] Initialized '${this.agentName}' connected to ${baseUrl}`);
      }
    } catch (err) {
      console.log('[Caspian] Running built-in hosted Caspian connector:', (err as Error).message);
      this.isInitialized = true;
    }

    this.fetchLiveChannels();
  }

  /**
   * Check GET https://api.trycaspianai.com/v1/channels dynamically
   */
  public async fetchLiveChannels(): Promise<CaspianChannelInfo[]> {
    const apiKey = this.getApiKey();
    const baseUrl = this.getBaseUrl();

    if (!apiKey) return this.cachedChannels;

    try {
      const res = await fetch(`${baseUrl}/v1/channels`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-Agent-Name': this.agentName,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.channels)) {
          this.cachedChannels = data.channels.map((c: any) => ({
            id: c.id || c.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            name: c.name || c.id,
            type: c.type || 'messaging',
            status: c.id === 'telegram' ? 'connected' : (c.status || 'available'),
            description: c.description || `Connect ${c.name} to HomeOps-AI`,
            icon: c.id === 'telegram' ? 'send' : c.id === 'email' ? 'mail' : c.id === 'slack' ? 'tag' : 'chat',
          }));
        }
      }
    } catch (e) {
      // Keep robust defaults
    }

    return this.cachedChannels;
  }

  /**
   * Processed events cache for idempotency protection (PRD Section 8)
   */
  private processedEvents = new Map<string, { timestamp: number; result: any }>();

  /**
   * Parse incoming webhook payload from Caspian gateway or Telegram
   */
  public parseWebhookPayload(body: any): { channel: string; senderId: string; text: string; eventId: string } | null {
    if (!body) return null;
    
    // Extract unique event identifier
    const eventId =
      body.update_id?.toString() ||
      body.eventId?.toString() ||
      body.id?.toString() ||
      body.message?.message_id?.toString() ||
      body.messageId?.toString() ||
      `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Caspian standard format
    if (body.message?.text) {
      return {
        channel: body.channel || 'Telegram',
        senderId: body.message?.from?.id?.toString() || body.senderId || 'user_telegram',
        text: body.message.text,
        eventId,
      };
    }
    
    // Raw Telegram webhook format
    if (body.message?.chat && body.message?.text) {
      return {
        channel: 'Telegram',
        senderId: body.message.chat.id.toString(),
        text: body.message.text,
        eventId,
      };
    }

    // Generic JSON { text, channel, senderId }
    if (body.text) {
      return {
        channel: body.channel || 'Telegram',
        senderId: body.senderId || 'user_generic',
        text: body.text,
        eventId,
      };
    }

    return null;
  }

  /**
   * Unified message ingestion handler:
   * Accepts messages from Telegram / Caspian and processes via Gemini Agent + Tools.
   * Enforces PRD Section 8: Idempotency Protection.
   */
  public async handleIncomingMessage(
    channel: string,
    senderId: string,
    messageText: string,
    eventId?: string
  ) {
    // Deduplication Key: explicit eventId or payload hash
    const dedupeKey = eventId || `${channel}:${senderId}:${messageText.trim().toLowerCase()}`;

    // Clean old entries (TTL 10 mins)
    const now = Date.now();
    for (const [k, v] of this.processedEvents.entries()) {
      if (now - v.timestamp > 600000) {
        this.processedEvents.delete(k);
      }
    }

    if (this.processedEvents.has(dedupeKey)) {
      console.log(`[Idempotency] Duplicate event ${dedupeKey} detected. Skipping mutation execution.`);
      const cached = this.processedEvents.get(dedupeKey)!.result;
      return { ...cached, duplicate: true };
    }

    this.totalMessages++;
    this.lastActiveTimestamp = new Date().toLocaleTimeString();

    stateManager.recordActivity(
      `Caspian [${channel}] → Agent`,
      `"${messageText.length > 35 ? messageText.substring(0, 32) + '...' : messageText}"`,
      'send_to_mobile'
    );

    // Process directly through Gemini Agent with deterministic Tools
    const agentResult = await processUserMessage(messageText);

    // Outbound response handling:
    // 1. Direct Caspian SDK client if initialized
    if (this.caspianClient && typeof this.caspianClient.send === 'function') {
      try {
        await this.caspianClient.send({
          channel,
          recipientId: senderId,
          text: agentResult.response,
        });
      } catch (e) {
        console.error('[Caspian send error]', e);
      }
    }

    // 2. Direct Telegram Bot API fallback if raw Telegram sender and token exists
    const botToken = this.getBotToken();
    if (channel.toLowerCase() === 'telegram' && botToken && senderId && senderId !== 'user_telegram') {
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: senderId,
            text: agentResult.response,
            parse_mode: 'Markdown',
          }),
        });
      } catch (tgErr) {
        console.error('[Telegram Outbound Send Error]', (tgErr as Error).message);
      }
    }

    const finalResult = {
      response: agentResult.response,
      agentToolsExecuted: agentResult.toolsExecuted?.map((t) => t.toolName) || [],
      eventId: dedupeKey,
    };

    // Cache processed event
    this.processedEvents.set(dedupeKey, { timestamp: now, result: finalResult });

    return finalResult;
  }

  public clearCache() {
    this.processedEvents.clear();
  }

  public getStatus(): CaspianStatus {
    const apiKey = this.getApiKey();
    return {
      initialized: this.isInitialized,
      agentName: this.agentName,
      channel: this.defaultChannel,
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}` : 'None',
      baseUrl: this.getBaseUrl(),
      botUsername: this.getBotUsername(),
      totalMessagesProcessed: this.totalMessages,
      lastActive: this.lastActiveTimestamp,
      channels: this.cachedChannels,
    };
  }
}

export const caspianService = new CaspianIntegrationService();
