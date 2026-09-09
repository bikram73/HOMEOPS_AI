/**
 * HomeOps AI — Conversation Store
 * Persists recent chat interactions with the HomeOps Assistant.
 * Configured with a safe limit of 100 messages to prevent uncontrolled storage growth.
 */
import { ChatMessage } from '../types';
import { idbGet, idbSet, idbDelete, STORES } from './storage';

const MAX_MESSAGES_SAVED = 100;
const CONVERSATION_KEY = 'recent_messages';

export async function saveConversation(messages: ChatMessage[]): Promise<boolean> {
  try {
    const recent = messages.slice(-MAX_MESSAGES_SAVED);
    return await idbSet(STORES.CONVERSATIONS, CONVERSATION_KEY, recent);
  } catch (err) {
    console.warn('[HomeOps ConversationStore] Failed to save conversation:', err);
    return false;
  }
}

export async function loadConversation(): Promise<ChatMessage[] | null> {
  try {
    return await idbGet<ChatMessage[]>(STORES.CONVERSATIONS, CONVERSATION_KEY);
  } catch (err) {
    console.warn('[HomeOps ConversationStore] Failed to load conversation:', err);
    return null;
  }
}

export async function clearConversation(): Promise<void> {
  try {
    await idbDelete(STORES.CONVERSATIONS, CONVERSATION_KEY);
  } catch (err) {
    console.warn('[HomeOps ConversationStore] Failed to clear conversation:', err);
  }
}
