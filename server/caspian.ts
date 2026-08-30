import { processUserMessage, AgentProcessResult } from './gemini';
import { stateManager } from './state';

/**
 * Caspian SDK Integration Module for HomeOps AI
 * 
 * Follows the Caspian multi-channel conversational agent architecture:
 * User (Telegram / Discord) -> Caspian Webhook -> HomeOps Agent -> Gemini / Tools -> Caspian thread response
 */

export interface CaspianStatus {
  initialized: boolean;
  channel: string;
  hasApiKey: boolean;
  botUsername?: string;
  totalMessagesProcessed: number;
  lastActive: string | null;
}

class CaspianIntegrationService {
  private isInitialized = false;
  private channel = 'Telegram';
  private totalMessages = 0;
  private lastActiveTimestamp: string | null = null;
  private caspianClient: any = null;

  constructor() {
    this.initCaspian();
  }

  private async initCaspian() {
    const apiKey = process.env.CASPIAN_API_KEY;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!apiKey) {
      console.log('[Caspian] CASPIAN_API_KEY not configured. Running in ready/standby mode with demo message simulator.');
      this.isInitialized = true;
      return;
    }

    try {
      // Dynamic import / safe instantiation of caspian-sdk
      const caspianModule = await import('caspian-sdk');
      const Caspian = (caspianModule as any).default || caspianModule.Caspian || caspianModule;

      if (typeof Caspian === 'function' || typeof Caspian === 'object') {
        this.caspianClient = typeof Caspian === 'function' ? new Caspian({ apiKey, botToken }) : Caspian;
        this.isInitialized = true;
        console.log('[Caspian] SDK successfully initialized for HomeOps AI agent on channel:', this.channel);
      }
    } catch (err) {
      console.warn('[Caspian] Notice initializing caspian-sdk:', (err as Error).message);
      this.isInitialized = true;
    }
  }

  /**
   * Unified message ingestion handler:
   * Passes external incoming messages (e.g. from Telegram via Caspian webhook)
   * into the shared HomeOps agent, updating in-memory state and returning the response.
   */
  public async handleIncomingMessage(
    channel: string,
    senderId: string,
    messageText: string
  ): Promise<{ response: string; agentResult: AgentProcessResult }> {
    this.totalMessages++;
    this.lastActiveTimestamp = new Date().toLocaleTimeString();

    stateManager.recordActivity(
      `Caspian (${channel}) Message`,
      `"${messageText.length > 35 ? messageText.substring(0, 32) + '...' : messageText}"`,
      'send_to_mobile'
    );

    // Call the shared HomeOps AI core agent (Gemini + Tools + In-Memory State)
    const agentResult = await processUserMessage(messageText);

    // If live Caspian client instance exists and has post/send method, forward it
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

    return {
      response: agentResult.response,
      agentResult,
    };
  }

  public getStatus(): CaspianStatus {
    return {
      initialized: this.isInitialized,
      channel: this.channel,
      hasApiKey: !!process.env.CASPIAN_API_KEY,
      botUsername: process.env.TELEGRAM_BOT_USERNAME || '@HomeOpsAIBot',
      totalMessagesProcessed: this.totalMessages,
      lastActive: this.lastActiveTimestamp,
    };
  }
}

export const caspianService = new CaspianIntegrationService();
