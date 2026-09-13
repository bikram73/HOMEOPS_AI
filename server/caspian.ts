import { Caspian } from 'caspian-sdk';
import { processUserMessage } from './gemini';
import { stateManager } from './state';

/**
 * Caspian Multi-Channel Integration & Telegram Gateway for HomeOps-AI
 * 
 * Clean Caspian v1 Architecture:
 * Telegram (@MyHomeOps_bot)
 *    ↓
 * Caspian Hosted Gateway
 *    ↓
 * cx.onMessage({ channel: 'telegram', overlap: 'queue' })
 *    ↓
 * HomeOps handleIncomingMessage (Gemini Agent + Tools + In-Memory State)
 *    ↓
 * thread.post(result.response)
 *    ↓
 * Caspian Outbound Delivery
 *    ↓
 * Telegram User
 */

export interface CaspianChannelInfo {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'available' | 'standby';
  description: string;
  icon: string;
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
  webhookInfo: TelegramWebhookInfo | null;
  pollingActive: boolean;
  lastMessageReceived?: string;
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
  private agentName = 'HomeOps-AI';
  private defaultChannel = 'Telegram';
  private totalMessages = 0;
  private lastActiveTimestamp: string | null = null;
  private pollingActive = false;
  private pollerAbortController: AbortController | null = null;
  private lastUpdateId = 0;

  private telegramBotInfo: { username: string; name: string; valid: boolean } = {
    username: '@MyHomeOps_bot',
    name: 'HomeOps Bot',
    valid: false,
  };
  private lastTelegramWebhookInfo: TelegramWebhookInfo | null = null;
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
   * 1. Caspian v1 Initialization:
   * Instantiate Caspian -> Add Telegram Channel -> Register onMessage -> Start cx.run()
   */
  public async initCaspian() {
    const apiKey = this.getApiKey();
    const baseUrl = this.getBaseUrl();
    const botToken = this.getBotToken();

    if (!apiKey) {
      console.warn('[Caspian] CASPIAN_API_KEY is not configured');
    }

    if (!botToken) {
      console.warn('[Caspian] TELEGRAM_BOT_TOKEN is not configured');
    }

    try {
      const cx = new Caspian();

      // 2. Register onMessage handler with Caspian v1
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

            // 4. Send outbound reply using Caspian thread.post()
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

      // 1. Connect Telegram channel to Caspian SDK
      if (botToken) {
        try {
          await cx.channels.add('telegram', {
            via: 'hosted',
            bot_token: botToken,
            botToken,
          });
          console.log(`[Caspian] Telegram channel registered for ${this.agentName}`);
        } catch (chErr: any) {
          console.warn('[Caspian] channels.add warning:', chErr?.message || chErr);
        }
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
      console.error('[Caspian] Initialization failed:', err?.message || err);
      this.isInitialized = false;
    }

    // Check Telegram token status and sync
    if (botToken) {
      this.syncTelegramStatus().then(() => {
        // If webhook is empty and direct updates are pending, run background poller to ensure zero lost messages
        if (this.lastTelegramWebhookInfo && !this.lastTelegramWebhookInfo.url) {
          this.startTelegramPoller();
        }
      }).catch(console.error);
    }

    this.fetchLiveChannels().catch(console.error);
  }

  /**
   * Sync Telegram webhook info and verify Bot Token
   */
  public async syncTelegramStatus(): Promise<TelegramLiveStatus> {
    const token = this.getBotToken();
    if (!token) {
      return {
        hasToken: false,
        valid: false,
        botUsername: this.getBotUsername(),
        botName: 'HomeOps Bot',
        webhookInfo: null,
        pollingActive: false,
        lastError: 'TELEGRAM_BOT_TOKEN is not configured',
      };
    }

    try {
      // 1. Verify getMe
      const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const meData = await meRes.json();
      if (meData.ok && meData.result) {
        this.telegramBotInfo = {
          username: meData.result.username ? `@${meData.result.username}` : this.getBotUsername(),
          name: meData.result.first_name || 'HomeOps Bot',
          valid: true,
        };
      } else {
        this.telegramBotInfo.valid = false;
        this.lastTelegramError = meData.description || 'Invalid Telegram Bot Token';
      }

      // 2. Query getWebhookInfo
      const whRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
      const whData = await whRes.json();
      if (whData.ok && whData.result) {
        this.lastTelegramWebhookInfo = whData.result;
      }
    } catch (err: any) {
      this.lastTelegramError = err.message || 'Failed to connect to Telegram API';
    }

    // Update cached channel status accurately
    this.cachedChannels = this.cachedChannels.map((c) => {
      if (c.id === 'telegram') {
        return {
          ...c,
          status: this.telegramBotInfo.valid && this.isInitialized ? 'connected' : 'standby',
        };
      }
      return c;
    });

    return {
      hasToken: true,
      valid: this.telegramBotInfo.valid,
      botUsername: this.telegramBotInfo.username,
      botName: this.telegramBotInfo.name,
      webhookInfo: this.lastTelegramWebhookInfo,
      pollingActive: this.pollingActive,
      lastActiveTimestamp: this.lastActiveTimestamp,
      lastError: this.lastTelegramError || undefined,
    } as any;
  }

  /**
   * Clear pending updates from Telegram queue so stale/duplicate messages are not executed
   */
  public async clearPendingUpdates(): Promise<{ ok: boolean; message: string; pendingCleared?: number }> {
    const token = this.getBotToken();
    if (!token) {
      return { ok: false, message: 'TELEGRAM_BOT_TOKEN is not configured' };
    }

    try {
      const beforeInfo = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
      const beforeData = await beforeInfo.json();
      const count = beforeData?.result?.pending_update_count || 0;

      const res = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`);
      const data = await res.json();

      this.lastUpdateId = 0;
      await this.syncTelegramStatus();

      return {
        ok: data.ok,
        message: data.ok ? `Successfully cleared ${count} pending updates.` : (data.description || 'Failed to clear updates'),
        pendingCleared: count,
      };
    } catch (err: any) {
      return { ok: false, message: err.message || 'Error clearing pending updates' };
    }
  }

  /**
   * Set custom or Caspian webhook on Telegram Bot
   */
  public async setWebhook(webhookUrl: string): Promise<{ ok: boolean; message: string }> {
    const token = this.getBotToken();
    if (!token) return { ok: false, message: 'TELEGRAM_BOT_TOKEN is not configured' };

    try {
      this.stopTelegramPoller();
      const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
      const data = await res.json();
      await this.syncTelegramStatus();
      return { ok: data.ok, message: data.ok ? `Webhook set to ${webhookUrl}` : (data.description || 'Failed') };
    } catch (err: any) {
      return { ok: false, message: err.message || 'Error setting webhook' };
    }
  }

  /**
   * Delete Telegram Webhook and re-enable direct Poller
   */
  public async deleteWebhook(dropPending: boolean = false): Promise<{ ok: boolean; message: string }> {
    const token = this.getBotToken();
    if (!token) return { ok: false, message: 'TELEGRAM_BOT_TOKEN is not configured' };

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=${dropPending}`);
      const data = await res.json();
      await this.syncTelegramStatus();
      this.startTelegramPoller();
      return { ok: data.ok, message: data.ok ? 'Webhook removed. Polling mode activated.' : (data.description || 'Failed') };
    } catch (err: any) {
      return { ok: false, message: err.message || 'Error deleting webhook' };
    }
  }

  /**
   * Continuous Telegram Long-Polling consumer (active when no webhook is configured)
   */
  public startTelegramPoller() {
    const token = this.getBotToken();
    if (!token || this.pollingActive) return;

    this.pollingActive = true;
    this.pollerAbortController = new AbortController();

    const pollLoop = async () => {
      console.log('[Telegram Poller] Started Telegram message consumer loop...');
      while (this.pollingActive) {
        try {
          const currentToken = this.getBotToken();
          if (!currentToken) break;

          const url = `https://api.telegram.org/bot${currentToken}/getUpdates?offset=${this.lastUpdateId ? this.lastUpdateId + 1 : 0}&timeout=15`;
          const res = await fetch(url, { signal: this.pollerAbortController?.signal });
          
          if (res.ok) {
            const data = await res.json();
            if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
              for (const update of data.result) {
                this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
                
                const msg = update.message || update.edited_message;
                if (msg && msg.text) {
                  const senderId = msg.chat?.id?.toString() || msg.from?.id?.toString() || 'unknown_chat';
                  const text = msg.text;
                  const eventId = update.update_id.toString();

                  console.log(`[Telegram Poller] Ingesting message from ${senderId}: "${text}"`);

                  // Process message through HomeOps AI Agent
                  const result = await this.handleIncomingMessage('Telegram', senderId, text, eventId);

                  // Send response back to chat
                  if (result?.response && senderId && senderId !== 'unknown_chat') {
                    try {
                      await fetch(`https://api.telegram.org/bot${currentToken}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          chat_id: senderId,
                          text: result.response,
                          parse_mode: 'Markdown',
                        }),
                      });
                    } catch (replyErr) {
                      console.error('[Telegram Reply Error]:', replyErr);
                    }
                  }
                }
              }
            }
          } else {
            await new Promise((r) => setTimeout(r, 4000));
          }
        } catch (err: any) {
          if (err.name === 'AbortError') break;
          await new Promise((r) => setTimeout(r, 5000));
        }
      }
      this.pollingActive = false;
      console.log('[Telegram Poller] Stopped message consumer loop');
    };

    pollLoop().catch((e) => console.error('[Telegram Poller error]', e));
  }

  public stopTelegramPoller() {
    this.pollingActive = false;
    if (this.pollerAbortController) {
      this.pollerAbortController.abort();
      this.pollerAbortController = null;
    }
  }

  /**
   * Check GET https://api.trycaspianai.com/v1/channels dynamically
   * Accurately reflects real status without hardcoding "connected"
   */
  public async fetchLiveChannels(): Promise<CaspianChannelInfo[]> {
    const apiKey = this.getApiKey();
    const baseUrl = this.getBaseUrl();

    const isTgConnected = this.isInitialized && this.telegramBotInfo.valid;

    if (!apiKey) {
      this.cachedChannels = this.cachedChannels.map((c) => ({
        ...c,
        status: c.id === 'telegram' ? (isTgConnected ? 'connected' : 'standby') : 'available',
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
            // Accurate status assignment based on actual connection verification
            status: c.id === 'telegram' 
              ? (isTgConnected ? 'connected' : (c.status || 'standby'))
              : (c.status || 'available'),
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
   * Parse incoming webhook payload from Caspian gateway or Telegram
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
   * Processes message via Gemini Agent + HomeOps deterministic Tools.
   * Enforces Idempotency Protection.
   * Returns clean result object without duplicate outbound side-effects.
   */
  public async handleIncomingMessage(
    channel: string,
    senderId: string,
    messageText: string,
    eventId?: string
  ) {
    const dedupeKey = eventId || `${channel}:${senderId}:${messageText.trim().toLowerCase()}`;

    // Clean old entries (TTL 10 mins)
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

    const finalResult = {
      response: agentResult.response,
      agentToolsExecuted: agentResult.toolsExecuted?.map((t) => t.toolName) || [],
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
    const isTgConnected = this.isInitialized && this.telegramBotInfo.valid;

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
        status: c.id === 'telegram' ? (isTgConnected ? 'connected' : 'standby') : c.status,
      })),
      telegram: {
        hasToken: !!this.getBotToken(),
        valid: this.telegramBotInfo.valid,
        botUsername: this.telegramBotInfo.username || this.getBotUsername(),
        botName: this.telegramBotInfo.name,
        webhookInfo: this.lastTelegramWebhookInfo,
        pollingActive: this.pollingActive,
        lastError: this.lastTelegramError || undefined,
      },
    };
  }
}

export const caspianService = new CaspianIntegrationService();
