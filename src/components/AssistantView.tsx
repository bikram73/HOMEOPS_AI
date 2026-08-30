import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, PageTab } from '../types';
import { api } from '../services/api';
import { Sparkles, Send, Zap, Calendar, Wrench, RefreshCw, CheckCircle2 } from 'lucide-react';

interface AssistantViewProps {
  chatHistory: ChatMessage[];
  onSendMessage: (text: string) => void;
  setActiveTab: (tab: PageTab) => void;
  onRefreshState?: () => void;
}

export const AssistantView: React.FC<AssistantViewProps> = ({
  chatHistory,
  onSendMessage,
  setActiveTab,
  onRefreshState,
}) => {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isGenerating]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isGenerating) return;

    onSendMessage(query.trim());
    setInputText('');
    setIsGenerating(true);

    try {
      // Call live backend agentic processing
      const res = await api.sendAgentMessage(query.trim());
      if (onRefreshState) {
        onRefreshState();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSend(prompt);
  };

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full h-full relative bg-white md:bg-transparent overflow-hidden animate-in fade-in duration-200">
      {/* Chat Header */}
      <div className="px-6 py-6 md:py-8 border-b border-[#e2e8f0]/60 bg-white/90 backdrop-blur-xs sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] flex items-center gap-3 tracking-tight">
              <span className="material-symbols-outlined text-[#0F766E] text-3xl md:text-4xl">
                auto_awesome
              </span>
              HomeOps AI
            </h2>
            <p className="text-sm md:text-base text-gray-500 mt-1.5 font-medium">
              Autonomous Household Operations Agent
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Gemini Reasoning + Tools Ready</span>
          </div>
        </div>
      </div>

      {/* Chat Messages History */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6 scrollbar-hide pb-52">
        {chatHistory.map((msg) => {
          const isUser = msg.sender === 'user';

          if (isUser) {
            return (
              <div key={msg.id} className="flex justify-end w-full">
                <div className="bg-[#f1f5f9] text-[#0F172A] px-5 py-3.5 rounded-2xl rounded-tr-xs max-w-[85%] md:max-w-[70%] border border-[#e2e8f0]/50 shadow-xs">
                  <p className="text-sm md:text-base leading-relaxed">{msg.text}</p>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className="flex justify-start w-full gap-3.5">
              {/* AI Avatar */}
              <div className="w-8 h-8 rounded-full bg-[#99efe5] flex-shrink-0 flex items-center justify-center mt-1 shadow-xs">
                <span className="material-symbols-outlined text-[#006f67] text-[18px]">
                  smart_toy
                </span>
              </div>

              <div className="w-full max-w-[90%] md:max-w-[85%] space-y-4">
                {/* Standard text bubble */}
                {msg.text && (
                  <div className="bg-[#F0FDFA] border-l-3 border-[#0F766E] text-[#0F172A] px-5 py-4 rounded-2xl rounded-tl-xs shadow-xs">
                    <p className="text-sm md:text-base text-[#134E4A] leading-relaxed whitespace-pre-line">
                      {msg.text}
                    </p>
                  </div>
                )}

                {/* Priority Bento Cards (if present in message) */}
                {msg.priorities && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                    {msg.priorities.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (item.type === 'High Priority' || item.type === 'Maintenance') {
                            setActiveTab('tasks');
                          } else {
                            setActiveTab('shopping');
                          }
                        }}
                        className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-sm hover:border-[#0F766E] hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
                      >
                        {/* Decorative Corner Accent */}
                        <div
                          className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 ${
                            item.colorType === 'error'
                              ? 'bg-[#ffdad6]/40'
                              : item.colorType === 'secondary'
                              ? 'bg-[#99efe5]/40'
                              : 'bg-[#dae2fd]/40'
                          }`}
                        ></div>

                        <div className="flex items-center gap-2 mb-2.5">
                          <span
                            className={`material-symbols-outlined text-lg ${
                              item.colorType === 'error'
                                ? 'text-[#ba1a1a]'
                                : item.colorType === 'secondary'
                                ? 'text-[#006a63]'
                                : 'text-[#188ace]'
                            }`}
                          >
                            {item.icon}
                          </span>
                          <span
                            className={`text-xs font-bold ${
                              item.colorType === 'error'
                                ? 'text-[#ba1a1a]'
                                : item.colorType === 'secondary'
                                ? 'text-[#006a63]'
                                : 'text-[#188ace]'
                            }`}
                          >
                            {item.type}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#0F172A] mb-1.5 group-hover:text-[#0F766E] transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isGenerating && (
          <div className="flex justify-start w-full gap-3.5">
            <div className="w-8 h-8 rounded-full bg-[#99efe5] flex-shrink-0 flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[#006f67] text-[18px] animate-spin">
                sync
              </span>
            </div>
            <div className="bg-[#F0FDFA] border-l-3 border-[#0F766E] text-[#134E4A] px-4 py-3 rounded-2xl text-xs font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0F766E] animate-bounce"></span>
              <span
                className="w-2 h-2 rounded-full bg-[#0F766E] animate-bounce"
                style={{ animationDelay: '0.2s' }}
              ></span>
              <span
                className="w-2 h-2 rounded-full bg-[#0F766E] animate-bounce"
                style={{ animationDelay: '0.4s' }}
              ></span>
              <span>HomeOps AI is reasoning and inspecting household state...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area (Bottom Sticky) */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white/95 to-transparent pt-8 pb-6 px-4 md:px-8">
        {/* Quick Action Prompt Chips */}
        <div className="flex gap-2 mb-3.5 overflow-x-auto scrollbar-hide pb-1">
          <button
            id="chip-whats-urgent"
            onClick={() => handleQuickPrompt("What's urgent today?")}
            className="whitespace-nowrap px-3.5 py-1.5 rounded-full border border-[#e2e8f0] bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 hover:text-[#0F172A] hover:border-[#0F766E] transition-all flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[15px] text-amber-500">bolt</span>
            What's urgent?
          </button>
          <button
            id="chip-what-should-i-do-now"
            onClick={() => handleQuickPrompt('What should I do right now?')}
            className="whitespace-nowrap px-3.5 py-1.5 rounded-full border border-[#e2e8f0] bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 hover:text-[#0F172A] hover:border-[#0F766E] transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 text-teal-600" />
            What should I do now?
          </button>
          <button
            id="chip-show-shopping-list"
            onClick={() => handleQuickPrompt('Show shopping list')}
            className="whitespace-nowrap px-3.5 py-1.5 rounded-full border border-[#e2e8f0] bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 hover:text-[#0F172A] hover:border-[#0F766E] transition-all flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[15px] text-[#0F766E]">list_alt</span>
            Show shopping list
          </button>
          <button
            id="chip-weeks-overview"
            onClick={() => handleQuickPrompt('Generate a weekly household plan')}
            className="whitespace-nowrap px-3.5 py-1.5 rounded-full border border-[#e2e8f0] bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 hover:text-[#0F172A] hover:border-[#0F766E] transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            Plan my week
          </button>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center shadow-sm"
        >
          <input
            id="ai-assistant-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask HomeOps anything (e.g. 'We are out of detergent', 'Pay electricity bill', 'Prioritize today')..."
            className="w-full bg-white border border-[#e2e8f0] rounded-xl py-3.5 pl-4 pr-14 text-sm md:text-base text-[#0F172A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent transition-all shadow-xs"
          />
          <button
            id="btn-ai-send"
            type="submit"
            disabled={!inputText.trim() || isGenerating}
            className="absolute right-2.5 p-2 bg-[#006a63] hover:bg-[#00504a] disabled:opacity-40 text-white rounded-lg transition-colors flex items-center justify-center shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </form>

        <div className="text-center mt-2.5">
          <span className="text-[11px] text-gray-400 font-medium">
            HomeOps AI connects directly to household inventory, tasks, bills, and maintenance state.
          </span>
        </div>
      </div>
    </div>
  );
};
