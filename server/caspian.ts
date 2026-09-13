import { Caspian } from 'caspian-sdk';
import { processUserMessage } from './gemini';
import { stateManager } from './state';

/**
 * Caspian Multi-Channel Integration & Telegram Gateway for HomeOps-AI
 * 
 * Clean Caspian 1.0 Hosted Architecture:
 * Telegram (@MyHomeOps_bot)
 *    ↓
 * Caspian Hosted Gateway
 *    ↓
 * cx.run({ apiKey, baseUrl })
 *    ↓
 * cx.onMessage({ channel: 'telegram', overlap: 'queue' })
 *    ↓
 * HomeOps handleIncomingMessage (Gemini Agent + Deterministic Tools + State)
 *    ↓
 * thread.post(result.response)
 *    ↓
 * Caspian Hosted Gateway
 *    ↓
 * Telegram User
 */

export interface CaspianChannelInfo {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'configured' | 'available' | 'standby';
  description: string;
  icon: string;
  lastActive?: string | null;
}

export interface TelegramWebhookInfo {
  url: string;
  has_custom_certificate?: boolean;
  pending_update_count?: number;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
  ip_address?: string;
}

export interface TelegramLiveStatus {
  hasToken: boolean;
  valid: boolean;
  botUsername: string;
  botName: string;
  mode: 'caspian_hosted';
  status: 'connected' | 'configured' | 'unconfigured' | 'error';
  totalMessagesProcessed: number;
  lastActiveTimestamp?: string | null;
  lastError?: string;
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
  telegram?: TelegramLiveStatus;
}

class CaspianIntegrationService {
  private caspianClient: Caspian | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  private agentName = 'HomeOps-AI';
  private defaultChannel = 'Telegram';
  private totalMessages = 0;
  private lastActiveTimestamp: string | null = null;

  private telegramBotInfo: { username: string; name: string; valid: boolean } = {
    username: '@MyHomeOps_bot',
    name: 'HomeOps Bot',
    valid: false,
  };
  private lastTelegramError: string | null = null;

  private cachedChannels: CaspianChannelInfo[] = [
    { id: 'telegram', name: 'Telegram', type: 'messaging', status: 'standby', description: 'Primary chat bot gateway via @BotFather (@MyHomeOps_bot)', icon: 'send' },
    { id: 'email', name: 'Email', type: 'email', status: 'available', description: 'Inbound bill & invoice auto-forwarding parser', icon: 'mail' },
    { id: 'slack', name: 'Slack', type: 'workplace', status: 'available', description: 'Household ops & shared apartment alerts channel', icon: 'tag' },
    { id: 'discord', name: 'Discord', type: 'community', status: 'available', description: 'Family server notification bot & webhooks', icon: 'forum' },
    { id: 'sms', name: 'Phone / SMS', type: 'sms', status: 'available', description: 'Urgent utility cutoff alerts & SMS reminders', icon: 'sms' },
  ];

  /**
   * Processed events cache for idempotency protection
   */
  private processedEvents = new Map<string, { timestamp: number; result: any }>();

  constructor() {
    void this.initCaspian();
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

  /**
   * 1. Idempotent Caspian v1 Hosted Initialization:
   * Instantiate Caspian -> Register onMessage -> Add Telegram Channel -> Start cx.run()
   */
  public async initCaspian(): Promise<void> {
    if (this.isInitialized && this.caspianClient) {
      console.log(`[Caspian] Already initialized and listening for ${this.agentName}.`);
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      const apiKey = this.getApiKey();
      const baseUrl = this.getBaseUrl();
      const botToken = this.getBotToken();

      if (!apiKey) {
        console.warn('[Caspian] Missing CASPIAN_API_KEY');
      }

      if (!botToken) {
        console.warn('[Caspian] Missing TELEGRAM_BOT_TOKEN');
      }

      try {
        const cx = new Caspian();

        // 2. Register onMessage handler with Caspian SDK v1
        cx.onMessage(
          {
            channel: 'telegram',
            overlap: 'queue',
          },
          async (thread: any, msg: any) => {
            console.log(`[Caspian] Inbound message received on ${msg.chat_kind || 'telegram'}: "${msg.text}"`);

            try {
              const senderId = String(msg.sender || msg.thread_id || 'telegram_user');
              const eventId = String(msg.message_id || msg.id || '');
              const text = msg.text || '';

              if (!text.trim()) return;

              const result = await this.handleIncomingMessage(
                'Telegram',
                senderId,
                text,
                eventId
              );

              // 4. Send clean outbound reply strictly through Caspian thread.post()
              if (thread && typeof thread.post === 'function') {
                await thread.post(result.response);
                console.log('[Caspian] Response successfully dispatched via thread.post()');
              }
            } catch (error) {
              console.error('[Caspian] Message processing error:', error);
              if (thread && typeof thread.post === 'function') {
                await thread.post("Sorry, I couldn't process that request right now.");
              }
            }
          }
        );

        // 1. Connect Telegram channel via Caspian hosted mode
        if (botToken) {
          await cx.channels.add('telegram', {
            via: 'hosted',
            bot_token: botToken,
            botToken,
          });
          console.log(`[Caspian] Telegram channel registered for ${this.agentName}`);
        }

        this.caspianClient = cx;
        this.isInitialized = true;
        console.log(`[Caspian] Connected & ready for ${this.agentName}`);

        // 3. Start hosted Caspian event loop (cx.run)
        if (apiKey) {
          cx.run({
            apiKey,
            baseUrl,
          }).catch((runErr: any) => {
            console.log('[Caspian run background loop note]:', runErr?.message || runErr);
          });
        }
      } catch (err: any) {
        this.isInitialized = false;
        this.caspianClient = null;
        console.error('[Caspian] Initialization failed:', err?.message || err);
        throw err;
      }

      if (botToken) {
        await this.syncTelegramStatus();
      }

      await this.fetchLiveChannels();
    })().finally(() => {
      this.initializationPromise = null;
    });

    return this.initializationPromise;
  }

  /**
   * Sync Telegram bot verification status via getMe
   */
  public async syncTelegramStatus(): Promise<TelegramLiveStatus> {
    const token = this.getBotToken();
    if (!token) {
      return {
        hasToken: false,
        valid: false,
        botUsername: this.getBotUsername(),
        botName: 'HomeOps Bot',
        mode: 'caspian_hosted',
        status: 'unconfigured',
        totalMessagesProcessed: this.totalMessages,
        lastActiveTimestamp: this.lastActiveTimestamp,
        lastError: 'TELEGRAM_BOT_TOKEN is not configured',
      };
    }

    try {
      const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const meData = await meRes.json();
      if (meData.ok && meData.result) {
        this.telegramBotInfo = {
          username: meData.result.username ? `@${meData.result.username}` : this.getBotUsername(),
          name: meData.result.first_name || 'HomeOps Bot',
          valid: true,
        };
        this.lastTelegramError = null;
      } else {
        this.telegramBotInfo.valid = false;
        this.lastTelegramError = meData.description || 'Invalid Telegram Bot Token';
      }
    } catch (err: any) {
      this.lastTelegramError = err.message || 'Failed to connect to Telegram API';
    }

    const currentChannelStatus: 'connected' | 'configured' | 'standby' = 
      this.isInitialized && this.telegramBotInfo.valid
        ? (this.totalMessages > 0 ? 'connected' : 'configured')
        : 'standby';

    this.cachedChannels = this.cachedChannels.map((c) => {
      if (c.id === 'telegram') {
        return {
          ...c,
          status: currentChannelStatus,
          lastActive: this.lastActiveTimestamp,
        };
      }
      return c;
    });

    return {
      hasToken: true,
      valid: this.telegramBotInfo.valid,
      botUsername: this.telegramBotInfo.username,
      botName: this.telegramBotInfo.name,
      mode: 'caspian_hosted',
      status: this.isInitialized && this.telegramBotInfo.valid 
        ? (this.totalMessages > 0 ? 'connected' : 'configured')
        : (this.telegramBotInfo.valid ? 'configured' : 'error'),
      totalMessagesProcessed: this.totalMessages,
      lastActiveTimestamp: this.lastActiveTimestamp,
      lastError: this.lastTelegramError || undefined,
    };
  }

  /**
   * Fetch connected channels from Caspian Gateway API
   */
  public async fetchLiveChannels(): Promise<CaspianChannelInfo[]> {
    const apiKey = this.getApiKey();
    const baseUrl = this.getBaseUrl();

    const currentTgStatus: 'connected' | 'configured' | 'standby' = 
      this.isInitialized && this.telegramBotInfo.valid
        ? (this.totalMessages > 0 ? 'connected' : 'configured')
        : 'standby';

    if (!apiKey) {
      this.cachedChannels = this.cachedChannels.map((c) => ({
        ...c,
        status: c.id === 'telegram' ? currentTgStatus : 'available',
      }));
      return this.cachedChannels;
    }

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
            status: c.id === 'telegram' ? currentTgStatus : (c.status || 'available'),
            description: c.description || `Connect ${c.name} to HomeOps-AI`,
            icon: c.id === 'telegram' ? 'send' : c.id === 'email' ? 'mail' : c.id === 'slack' ? 'tag' : 'chat',
            lastActive: c.id === 'telegram' ? this.lastActiveTimestamp : undefined,
          }));
        }
      }
    } catch (e) {
      // Keep verified cached channels
    }

    return this.cachedChannels;
  }

  /**
   * Parse incoming webhook payload for simulator or external events
   */
  public parseWebhookPayload(body: any): { channel: string; senderId: string; text: string; eventId: string } | null {
    if (!body) return null;
    
    const eventId =
      body.update_id?.toString() ||
      body.eventId?.toString() ||
      body.id?.toString() ||
      body.message?.message_id?.toString() ||
      body.messageId?.toString() ||
      `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Caspian standard payload
    if (body.message?.text) {
      return {
        channel: body.channel || 'Telegram',
        senderId: body.message?.from?.id?.toString() || body.senderId || 'user_telegram',
        text: body.message.text,
        eventId,
      };
    }
    
    // Telegram standard payload
    if (body.message?.chat && body.message?.text) {
      return {
        channel: 'Telegram',
        senderId: body.message.chat.id.toString(),
        text: body.message.text,
        eventId,
      };
    }

    // Generic JSON payload
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
   * 1. Evaluates message via Gemini Agent + deterministic HomeOps Tools.
   * 2. Enforces Idempotency with deduplication key & cache.
   * 3. Records timeline activities and updates in-memory household state.
   */
  public async handleIncomingMessage(
    channel: string,
    senderId: string,
    messageText: string,
    eventId?: string
  ) {
    const dedupeKey = eventId || `${channel}:${senderId}:${messageText.trim().toLowerCase()}`;

    // Clean old cache entries (TTL 10 mins)
    const now = Date.now();
    for (const [k, v] of this.processedEvents.entries()) {
      if (now - v.timestamp > 600000) {
        this.processedEvents.delete(k);
      }
    }

    if (this.processedEvents.has(dedupeKey)) {
      console.log(`[Idempotency] Duplicate event ${dedupeKey} detected. Returning cached result.`);
      const cached = this.processedEvents.get(dedupeKey)!.result;
      return { ...cached, duplicate: true };
    }

    this.totalMessages++;
    this.lastActiveTimestamp = new Date().toLocaleTimeString();

    stateManager.recordActivity(
      `Caspian [${channel}] → Agent`,
      `"${messageText.length > 35 ? messageText.substring(0, 32) + '...' : messageText}"`,
      'telegram'
    );

    // Process directly through Gemini Agent with deterministic Tools & State Mutators
    const agentResult = await processUserMessage(messageText);
    const toolsExecuted = agentResult.toolsExecuted?.map((t) => t.toolName) || [];

    const isInventoryUpdated = toolsExecuted.some((t) => t.toLowerCase().includes('inventory'));
    const isShoppingAdded = toolsExecuted.some((t) => t.toLowerCase().includes('shop'));
    const isTaskCreated = toolsExecuted.some((t) => t.toLowerCase().includes('task'));
    const isBillUpdated = toolsExecuted.some((t) => t.toLowerCase().includes('bill'));
    const isMaintenanceCreated = toolsExecuted.some((t) => t.toLowerCase().includes('maint'));

    // Record conversation message in persistent in-memory event store
    stateManager.addConversationMessage({
      source: channel.toLowerCase() === 'telegram' ? 'telegram' : 'web',
      channel,
      sender: senderId,
      text: messageText,
      response: agentResult.response,
      agentToolsExecuted: toolsExecuted,
      impact: {
        inventoryUpdated: isInventoryUpdated,
        shoppingAdded: isShoppingAdded,
        taskCreated: isTaskCreated,
        billUpdated: isBillUpdated,
        maintenanceCreated: isMaintenanceCreated,
        summary: toolsExecuted.length > 0 ? `Executed: ${toolsExecuted.join(', ')}` : 'Agent response',
      },
    });

    const finalResult = {
      response: agentResult.response,
      agentToolsExecuted: toolsExecuted,
      eventId: dedupeKey,
    };

    // Cache processed event for idempotency
    this.processedEvents.set(dedupeKey, { timestamp: now, result: finalResult });

    return finalResult;
  }

  public clearCache() {
    this.processedEvents.clear();
  }

  public getStatus(): CaspianStatus {
    const apiKey = this.getApiKey();
    const currentTgStatus: 'connected' | 'configured' | 'standby' = 
      this.isInitialized && this.telegramBotInfo.valid
        ? (this.totalMessages > 0 ? 'connected' : 'configured')
        : 'standby';

    return {
      initialized: this.isInitialized,
      agentName: this.agentName,
      channel: this.defaultChannel,
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}` : 'None',
      baseUrl: this.getBaseUrl(),
      botUsername: this.telegramBotInfo.username || this.getBotUsername(),
      totalMessagesProcessed: this.totalMessages,
      lastActive: this.lastActiveTimestamp,
      channels: this.cachedChannels.map((c) => ({
        ...c,
        status: c.id === 'telegram' ? currentTgStatus : c.status,
        lastActive: c.id === 'telegram' ? this.lastActiveTimestamp : undefined,
      })),
      telegram: {
        hasToken: !!this.getBotToken(),
        valid: this.telegramBotInfo.valid,
        botUsername: this.telegramBotInfo.username || this.getBotUsername(),
        botName: this.telegramBotInfo.name,
        mode: 'caspian_hosted',
        status: this.isInitialized && this.telegramBotInfo.valid
          ? (this.totalMessages > 0 ? 'connected' : 'configured')
          : (this.telegramBotInfo.valid ? 'configured' : 'unconfigured'),
        totalMessagesProcessed: this.totalMessages,
        lastActiveTimestamp: this.lastActiveTimestamp,
        lastError: this.lastTelegramError || undefined,
      },
    };
  }
}

export const caspianService = new CaspianIntegrationService();
