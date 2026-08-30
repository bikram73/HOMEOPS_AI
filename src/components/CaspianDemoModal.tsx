import React, { useState, useEffect } from 'react';
import { api, CaspianStatusResponse } from '../services/api';
import { Send, Bot, Smartphone, CheckCircle, RefreshCw, X, Play } from 'lucide-react';

interface CaspianDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshState: () => void;
}

export const CaspianDemoModal: React.FC<CaspianDemoModalProps> = ({
  isOpen,
  onClose,
  onRefreshState,
}) => {
  const [status, setStatus] = useState<CaspianStatusResponse | null>(null);
  const [inputMsg, setInputMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatLog, setChatLog] = useState<
    { sender: 'telegram_user' | 'caspian_bot'; text: string; time: string; toolUsed?: string }[]
  >([
    {
      sender: 'telegram_user',
      text: "We're out of detergent.",
      time: '10:02 AM',
    },
    {
      sender: 'caspian_bot',
      text: 'Detergent has been updated to CRITICAL in inventory and added to your shopping list.',
      time: '10:02 AM',
      toolUsed: 'updateInventory + addShoppingItem',
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      api.getCaspianStatus().then(setStatus).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulate = async (textToSend?: string) => {
    const text = textToSend || inputMsg;
    if (!text.trim() || isSending) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatLog((prev) => [...prev, { sender: 'telegram_user', text, time }]);
    setInputMsg('');
    setIsSending(true);

    try {
      const res = await api.simulateCaspianMessage(text, 'Telegram');
      const toolNames = res.agentResult?.toolsExecuted?.map((t: any) => t.toolName).join(', ');

      setChatLog((prev) => [
        ...prev,
        {
          sender: 'caspian_bot',
          text: res.response,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          toolUsed: toolNames || 'Natural Language Intelligence',
        },
      ]);
      onRefreshState();
      // refresh status message counter
      api.getCaspianStatus().then(setStatus).catch(console.error);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-[#131b2e] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#006a63] flex items-center justify-center text-white">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Caspian Messaging Layer</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Bridge
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Multi-channel Telegram &amp; Discord conversational agent interface
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Architecture Notice */}
        <div className="bg-slate-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#006a63]" />
            <span>Channel: <strong>Telegram</strong> ({status?.botUsername || '@HomeOpsAIBot'})</span>
          </div>
          <div>
            Processed: <strong>{status?.totalMessagesProcessed || chatLog.length}</strong> messages
          </div>
        </div>

        {/* Simulated Telegram Chat Window */}
        <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-[#f0f2f5]">
          {chatLog.map((item, idx) => {
            const isUser = item.sender === 'telegram_user';
            return (
              <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-xs ${
                    isUser
                      ? 'bg-[#006a63] text-white rounded-tr-xs'
                      : 'bg-white text-gray-800 rounded-tl-xs border border-gray-200'
                  }`}
                >
                  <p className="leading-relaxed">{item.text}</p>
                  <div className="flex items-center justify-between gap-3 mt-1.5 text-[10px] opacity-75">
                    {item.toolUsed && (
                      <span className="font-mono bg-teal-50 text-teal-800 px-1 rounded border border-teal-200">
                        ⚡ {item.toolUsed}
                      </span>
                    )}
                    <span className="ml-auto">{item.time}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-tl-xs px-4 py-2 text-xs text-gray-500 border border-gray-200 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#006a63]" />
                <span>Caspian agent reasoning via Gemini...</span>
              </div>
            </div>
          )}
        </div>

        {/* Preset Sample Prompts */}
        <div className="p-3 bg-white border-t border-gray-100 flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => handleSimulate("We're running low on rice.")}
            className="text-[11px] font-semibold bg-gray-100 hover:bg-teal-50 hover:text-[#006a63] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
          >
            "We're low on rice"
          </button>
          <button
            onClick={() => handleSimulate('What should I do today?')}
            className="text-[11px] font-semibold bg-gray-100 hover:bg-teal-50 hover:text-[#006a63] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
          >
            "What should I do today?"
          </button>
          <button
            onClick={() => handleSimulate('Mark electricity bill as paid')}
            className="text-[11px] font-semibold bg-gray-100 hover:bg-teal-50 hover:text-[#006a63] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
          >
            "Mark bill paid"
          </button>
          <button
            onClick={() => handleSimulate('Plan my week')}
            className="text-[11px] font-semibold bg-gray-100 hover:bg-teal-50 hover:text-[#006a63] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
          >
            "Plan my week"
          </button>
        </div>

        {/* Input bar */}
        <div className="p-4 bg-white border-t border-gray-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSimulate();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Simulate an incoming Telegram message..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#006a63]"
            />
            <button
              type="submit"
              disabled={!inputMsg.trim() || isSending}
              className="bg-[#006a63] hover:bg-[#00504a] disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
