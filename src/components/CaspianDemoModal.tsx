import React, { useState, useEffect } from 'react';
import { api, CaspianStatusResponse, CaspianChannel } from '../services/api';
import { Send, Bot, Smartphone, RefreshCw, X, Sparkles, ShieldCheck, ExternalLink } from 'lucide-react';

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
  const [channels, setChannels] = useState<CaspianChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('Telegram');
  const [inputMsg, setInputMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatLog, setChatLog] = useState<
    {
      sender: 'user' | 'bot';
      channel: string;
      text: string;
      time: string;
      toolUsed?: string;
    }[]
  >([
    {
      sender: 'user',
      channel: 'Telegram',
      text: "We're running low on detergent.",
      time: '10:02 AM',
    },
    {
      sender: 'bot',
      channel: 'Telegram',
      text: 'Detergent quantity has been updated to critical in your inventory and automatically added to your shopping list.',
      time: '10:02 AM',
      toolUsed: 'updateInventory + addShoppingItem',
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      api.getCaspianStatus().then((s) => {
        setStatus(s);
        if (s.channels && s.channels.length > 0) {
          setChannels(s.channels);
        }
      }).catch(console.error);

      api.getCaspianChannels().then((c) => {
        if (c.channels && c.channels.length > 0) {
          setChannels(c.channels);
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulate = async (textToSend?: string) => {
    const text = textToSend || inputMsg;
    if (!text.trim() || isSending) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatLog((prev) => [...prev, { sender: 'user', channel: activeChannel, text, time }]);
    setInputMsg('');
    setIsSending(true);

    try {
      const res = await api.simulateCaspianMessage(text, activeChannel);
      const toolNames = res.agentToolsExecuted?.join(', ');

      setChatLog((prev) => [
        ...prev,
        {
          sender: 'bot',
          channel: activeChannel,
          text: res.response,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          toolUsed: toolNames || 'Gemini Agent Heuristics',
        },
      ]);
      onRefreshState();
      api.getCaspianStatus().then(setStatus).catch(console.error);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#131b2e] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#006a63] flex items-center justify-center text-white">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white tracking-tight">Caspian Multi-Channel Simulator</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Caspian Gateway
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Agent: <strong className="text-teal-300">{status?.agentName || 'HomeOps-AI'}</strong> • Single agent handler answering connected channels
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

        {/* Telegram Direct Connect Banner */}
        <div className="bg-gradient-to-r from-sky-50 to-teal-50 border-b border-sky-100 px-6 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-sky-900">
            <Smartphone className="w-4 h-4 text-sky-600" />
            <span>
              Telegram Bot: <strong>{status?.botUsername || '@MyHomeOps_bot'}</strong>
            </span>
          </div>
          <a
            href={`https://t.me/${(status?.botUsername || '@MyHomeOps_bot').replace('@', '')}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 bg-[#0088cc] hover:bg-[#0077b5] text-white px-3 py-1 rounded-full font-bold shadow-xs text-[11px] transition-transform active:scale-95"
          >
            <span>Open in Telegram</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Channel Selector */}
        <div className="px-6 py-2 bg-white border-b border-gray-100 flex items-center gap-2 overflow-x-auto scrollbar-hide text-xs">
          <span className="text-slate-400 font-medium shrink-0">Channel:</span>
          {(channels.length > 0 ? channels : [
            { id: 'telegram', name: 'Telegram', status: 'connected' },
            { id: 'email', name: 'Email', status: 'available' },
            { id: 'slack', name: 'Slack', status: 'available' },
            { id: 'discord', name: 'Discord', status: 'available' },
            { id: 'sms', name: 'Phone / SMS', status: 'available' },
          ]).map((ch: any) => {
            const isSelected = activeChannel.toLowerCase() === ch.name.toLowerCase() || (activeChannel === 'Telegram' && ch.id === 'telegram');
            return (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch.name)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#006a63] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{ch.name}</span>
                {ch.status === 'connected' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Simulated Chat Window */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#f0f2f5]">
          {chatLog.map((item, idx) => {
            const isUser = item.sender === 'user';
            return (
              <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs shadow-xs ${
                    isUser
                      ? 'bg-[#006a63] text-white rounded-tr-xs'
                      : 'bg-white text-gray-800 rounded-tl-xs border border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] opacity-75 mb-1.5">
                    <span className="font-semibold uppercase tracking-wider">
                      {isUser ? `User via ${item.channel}` : `HomeOps-AI (${item.channel})`}
                    </span>
                    <span>{item.time}</span>
                  </div>

                  <p className="leading-relaxed whitespace-pre-wrap">{item.text}</p>

                  {item.toolUsed && (
                    <div className="flex items-center justify-between gap-3 mt-2 text-[10px] opacity-80">
                      <span className="font-mono bg-teal-50 text-teal-900 px-1.5 py-0.5 rounded border border-teal-200 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-teal-600" />
                        Tool: {item.toolUsed}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-tl-xs px-4 py-2.5 text-xs text-gray-500 border border-gray-200 flex items-center gap-2 shadow-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#006a63]" />
                <span>Processing household intent via Gemini Agent &amp; Tools...</span>
              </div>
            </div>
          )}
        </div>

        {/* Preset Sample Prompts */}
        <div className="p-3 bg-white border-t border-gray-100 flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => handleSimulate("We're running low on basmati rice.")}
            className="text-[11px] font-semibold bg-gray-100 hover:bg-teal-50 hover:text-[#006a63] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
          >
            "We're low on basmati rice"
          </button>
          <button
            onClick={() => handleSimulate("When is the electricity bill due and can I pay it?")}
            className="text-[11px] font-semibold bg-gray-100 hover:bg-teal-50 hover:text-[#006a63] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
          >
            "When is electricity bill due?"
          </button>
          <button
            onClick={() => handleSimulate("Schedule AC maintenance for Saturday")}
            className="text-[11px] font-semibold bg-gray-100 hover:bg-teal-50 hover:text-[#006a63] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
          >
            "Schedule AC maintenance"
          </button>
          <button
            onClick={() => handleSimulate("What should I do today?")}
            className="text-[11px] font-semibold bg-gray-100 hover:bg-teal-50 hover:text-[#006a63] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
          >
            "What should I do today?"
          </button>
        </div>

        {/* Input Bar */}
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
              placeholder={`Send message via ${activeChannel} to HomeOps-AI...`}
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
