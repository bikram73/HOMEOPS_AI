import React, { useState, useEffect } from 'react';
import { ConversationMessage, LiveEventPayload } from '../types';
import { api } from '../services/api';
import { Send, Sparkles, CheckCircle2, MessageSquare, Bot, ArrowRight, RefreshCw, Radio } from 'lucide-react';

interface LiveActivityFeedProps {
  onOpenCaspianModal?: () => void;
  onRefreshState?: () => void;
}

export const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({
  onOpenCaspianModal,
  onRefreshState,
}) => {
  const [conversations, setConversations] = useState<ConversationMessage[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>('');
  const [lastEventTime, setLastEventTime] = useState<string>('Just now');
  const [newArrivalHighlightId, setNewArrivalHighlightId] = useState<string | null>(null);

  // 1. Initial load from API
  useEffect(() => {
    let isMounted = true;
    api.getConversations(20)
      .then((data) => {
        if (isMounted && data && Array.isArray(data)) {
          setConversations(data);
        }
      })
      .catch((err) => console.log('[LiveFeed] Initial fetch error:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Connect to Server-Sent Events (SSE) stream for instant real-time Telegram updates
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/events');

        eventSource.onopen = () => {
          setIsConnected(true);
        };

        eventSource.onmessage = (event) => {
          try {
            const payload: LiveEventPayload | { type: string; data: any } = JSON.parse(event.data);

            if (payload.type === 'connected') {
              setIsConnected(true);
              if (payload.data?.conversations) {
                setConversations(payload.data.conversations);
              }
            } else if (payload.type === 'conversation_created' && payload.data?.conversation) {
              const newMsg = payload.data.conversation;
              setConversations((prev) => {
                const exists = prev.some((m) => m.id === newMsg.id);
                if (exists) return prev;
                return [newMsg, ...prev.slice(0, 30)];
              });
              setNewArrivalHighlightId(newMsg.id);
              setLastEventTime(new Date().toLocaleTimeString());
              setTimeout(() => setNewArrivalHighlightId(null), 3000);

              // Notify parent to refresh state if needed
              if (onRefreshState) onRefreshState();
            } else if (payload.type === 'state_updated') {
              if (onRefreshState) onRefreshState();
            }
          } catch (e) {
            // Ignore parse errors from comments/heartbeats
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Exponential / backoff reconnection
          reconnectTimeout = setTimeout(connectSSE, 3000);
        };
      } catch (err) {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connectSSE, 4000);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [onRefreshState]);

  const handleSimulate = async (textToSend: string) => {
    if (!textToSend.trim() || isSimulating) return;
    setIsSimulating(true);
    try {
      await api.simulateCaspianMessage(textToSend.trim(), 'Telegram');
      setCustomInput('');
      if (onRefreshState) onRefreshState();
    } catch (err) {
      console.error('Failed to simulate message:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const samplePrompts = [
    'Add rice to inventory with 2 kg',
    'Set rice quantity to 0.5 kg',
    'We are running low on detergent',
    'What bills are due this week?',
  ];

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(15,23,42,0.06)] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Radio className="w-4 h-4" />
            <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#0F172A]">Live Telegram & Activity Stream</h3>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {isConnected ? '🔴 LIVE SSE CONNECTED' : 'CONNECTING...'}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Real-time shared state & conversation feed from Caspian Hosted Gateway
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenCaspianModal && (
            <button
              onClick={onOpenCaspianModal}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>Caspian Settings</span>
            </button>
          )}
          <button
            onClick={() => {
              api.getConversations(20).then((data) => {
                if (data && Array.isArray(data)) setConversations(data);
              });
            }}
            title="Refresh stream"
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Test Prompt Chips */}
      <div className="px-5 py-2.5 bg-slate-50/80 border-b border-[#e2e8f0] flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-gray-400 font-medium shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Try live:
        </span>
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            disabled={isSimulating}
            onClick={() => handleSimulate(prompt)}
            className="shrink-0 px-2.5 py-1 rounded-md bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 transition-all font-medium disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            "{prompt}"
          </button>
        ))}
      </div>

      {/* Conversation Feed List */}
      <div className="divide-y divide-[#f1f5f9] max-h-[380px] overflow-y-auto">
        {conversations.length > 0 ? (
          conversations.map((msg) => {
            const isHighlighted = msg.id === newArrivalHighlightId;
            return (
              <div
                key={msg.id}
                className={`p-4 md:p-5 transition-colors ${
                  isHighlighted ? 'bg-emerald-50/70' : 'hover:bg-slate-50/60'
                }`}
              >
                {/* Header metadata row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                      <MessageSquare className="w-3 h-3" />
                      {msg.channel || 'Telegram'}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">{msg.sender}</span>
                  </div>
                  <span className="text-[11px] text-gray-400">{msg.time || 'Today'}</span>
                </div>

                {/* User Inbound Message */}
                <div className="flex items-start gap-2.5 mb-2.5">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-slate-600">👤</span>
                  </div>
                  <div className="bg-slate-100 rounded-lg px-3 py-2 text-xs md:text-sm text-[#0F172A] max-w-xl font-medium">
                    "{msg.text}"
                  </div>
                </div>

                {/* AI Agent Response */}
                {msg.response && (
                  <div className="flex items-start gap-2.5 ml-3 md:ml-4">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-emerald-50/70 border border-emerald-100 rounded-lg px-3 py-2 text-xs md:text-sm text-slate-800 max-w-2xl">
                      <div className="font-medium text-emerald-950">{msg.response}</div>

                      {/* Tool Badges / Impact Indicators */}
                      {(msg.impact || (msg.agentToolsExecuted && msg.agentToolsExecuted.length > 0)) && (
                        <div className="mt-2 pt-2 border-t border-emerald-200/60 flex flex-wrap items-center gap-1.5">
                          {msg.impact?.inventoryUpdated && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100/90 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Inventory updated
                            </span>
                          )}
                          {msg.impact?.shoppingAdded && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100/90 text-amber-900">
                              <CheckCircle2 className="w-3 h-3" />
                              Shopping list updated
                            </span>
                          )}
                          {msg.impact?.taskCreated && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100/90 text-blue-900">
                              <CheckCircle2 className="w-3 h-3" />
                              Task created
                            </span>
                          )}
                          {msg.impact?.billUpdated && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-100/90 text-purple-900">
                              <CheckCircle2 className="w-3 h-3" />
                              Bill recorded
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded text-gray-500">
                            ✓ Activity logged
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-gray-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">No Telegram conversations recorded yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Send a message to your Telegram bot or click one of the quick test prompt chips above.
            </p>
          </div>
        )}
      </div>

      {/* Interactive Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSimulate(customInput);
        }}
        className="p-3 bg-slate-50 border-t border-[#e2e8f0] flex items-center gap-2"
      >
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Simulate Telegram message (e.g. 'Add rice to inventory 2 kg')..."
          className="flex-1 text-xs md:text-sm bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-slate-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={!customInput.trim() || isSimulating}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
        >
          {isSimulating ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
