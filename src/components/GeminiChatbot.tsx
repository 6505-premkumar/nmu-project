import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createFAQ } from '../services/faqService';
import {
  Sparkles,
  Send,
  Trash2,
  Copy,
  Check,
  PlusCircle,
  Cpu,
  Bot,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  modelUsed?: string;
}

const CHATBOT_ROLES = [
  {
    id: 'support',
    name: 'Customer Support Agent',
    description: 'Empathetic, clear, and structured resolution of customer and student inquiries.',
    systemInstruction:
      'You are a high-tier Customer Support Assistant. You provide helpful, friendly, and structured troubleshooting answers. If technical terms are used, explain them concisely.',
  },
  {
    id: 'engineer',
    name: 'Knowledge Base Engineer',
    description: 'Drafts comprehensive, well-formatted Q&A pairs suitable for FAQ documentation.',
    systemInstruction:
      'You are a Knowledge Base Engineer. Provide answers in clear, documentation-ready format with bullet points and code snippets where appropriate. Answers should be self-contained and accurate.',
  },
  {
    id: 'architect',
    name: 'Systems & API Architect',
    description: 'Deep technical analysis of REST APIs, Firebase Firestore rules, and stateless JWT tokens.',
    systemInstruction:
      'You are a Principal Software & Security Architect. Explain system mechanics, Firestore real-time listeners, JWT authentication, and RBAC security rules with technical depth.',
  },
];

const SUGGESTED_PROMPTS = [
  'How does stateless JWT authentication work in this app?',
  'Draft an FAQ explaining how to reset forgotten passwords',
  'What are the differences between Admin, Creator, and User roles?',
  'How does Cloud Firestore sync live database mutations across tabs?',
];

export const GeminiChatbot: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content:
        'Hello! I am your AI Support Assistant powered by Gemini. Ask me any question about the platform, customer support, or system architecture, or let me help you draft FAQs for your knowledge base.',
      timestamp: new Date(),
      modelUsed: 'gemini-3.5-flash',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(CHATBOT_ROLES[0]);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview'>('gemini-3.5-flash');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedFaqId, setSavedFaqId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (userPrompt?: string) => {
    const textToSend = (userPrompt || input).trim();
    if (!textToSend || loading) return;

    const userMessage: ChatMessage = {
      id: 'user_' + Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    if (!userPrompt) setInput('');
    setLoading(true);

    try {
      // Build conversation history payload for multi-turn chat
      // Format as role: 'user' | 'model', content: string
      const payloadMessages = newHistory
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          model: selectedModel,
          systemInstruction: selectedRole.systemInstruction,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      const modelMessage: ChatMessage = {
        id: 'model_' + Date.now(),
        role: 'model',
        content: data.reply || 'No response generated.',
        timestamp: new Date(),
        modelUsed: data.model || selectedModel,
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: 'err_' + Date.now(),
        role: 'model',
        content: `Apologies, I encountered an error: ${err.message || 'Failed to fetch response'}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveAsFAQ = async (msgId: string, answerContent: string) => {
    if (!currentUser) {
      alert('Please log in or select a demo role to save FAQs to Firestore.');
      return;
    }

    try {
      setSavedFaqId(msgId);
      // Find the preceding user question
      const msgIndex = messages.findIndex((m) => m.id === msgId);
      const precedingUserMsg = msgIndex > 0 ? messages[msgIndex - 1] : null;
      const question = precedingUserMsg && precedingUserMsg.role === 'user'
        ? precedingUserMsg.content
        : 'Support Knowledge Base Query';

      const profile = userProfile || {
        uid: currentUser.uid,
        name: currentUser.displayName || 'Support Agent',
        email: currentUser.email || '',
        role: 'creator',
        createdAt: new Date().toISOString(),
      };

      await createFAQ(
        {
          question,
          answer: answerContent,
          category: 'Support Automation',
        },
        profile
      );

      setTimeout(() => setSavedFaqId(null), 3000);
    } catch (err: any) {
      console.error('Failed to save FAQ:', err);
      alert('Failed to save FAQ: ' + (err.message || 'Permission denied'));
      setSavedFaqId(null);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome_reset',
        role: 'model',
        content: `Conversation reset. I am in **${selectedRole.name}** mode. How can I assist you?`,
        timestamp: new Date(),
        modelUsed: selectedModel,
      },
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Devpost-style Header Banner */}
      <div className="bg-[#003E54] text-white rounded-lg p-5 sm:p-6 shadow-sm border border-[#002838]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 text-xs font-bold uppercase tracking-wider text-[#00EAA6]">
              <Bot className="w-4 h-4" />
              <span>Multi-Turn Gemini Assistant</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              AI Support & Knowledge Base Chat
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-teal-100/90 max-w-xl">
              Conversational multi-turn support agent with customizable system roles and direct Cloud Firestore sync.
            </p>
          </div>

          {/* Model & Persona Selectors */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Model Selector */}
            <div className="bg-[#002B3A] border border-teal-500/30 rounded px-2.5 py-1.5 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-[#00EAA6]" />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as any)}
                className="bg-transparent text-xs text-white font-semibold focus:outline-hidden cursor-pointer"
                title="Select Gemini Intelligence Model"
              >
                <option value="gemini-3.5-flash" className="bg-[#002B3A] text-white">
                  gemini-3.5-flash (General Support)
                </option>
                <option value="gemini-3.1-flash-lite" className="bg-[#002B3A] text-white">
                  gemini-3.1-flash-lite (Fast Tasks)
                </option>
                <option value="gemini-3.1-pro-preview" className="bg-[#002B3A] text-white">
                  gemini-3.1-pro-preview (Complex Reasoning)
                </option>
              </select>
            </div>

            <button
              onClick={clearChat}
              className="p-2 text-teal-200 hover:text-white bg-[#002B3A] hover:bg-[#002432] rounded border border-teal-500/30 transition cursor-pointer"
              title="Reset conversation thread"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Persona / System Role Pill Selector */}
        <div className="mt-4 pt-3 border-t border-teal-800/60 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-teal-200 uppercase tracking-wider flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-[#00EAA6]" /> Role:
          </span>
          {CHATBOT_ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role)}
              className={`text-xs px-2.5 py-1 rounded transition cursor-pointer font-medium ${
                selectedRole.id === role.id
                  ? 'bg-[#00EAA6] text-[#003E54] font-bold shadow-xs'
                  : 'bg-[#002838] text-teal-200 hover:text-white border border-teal-600/30'
              }`}
            >
              {role.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Thread Container */}
      <div className="bg-white rounded-lg border border-[#DDE2E5] shadow-2xs overflow-hidden flex flex-col h-[520px]">
        {/* Thread Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#003E54] text-[#00EAA6] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-lg p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#003E54] text-white shadow-xs'
                    : 'bg-[#F4F6F8] text-zinc-900 border border-zinc-200 shadow-2xs'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                {/* Footer metadata & actions */}
                <div
                  className={`mt-2.5 pt-2 flex items-center justify-between gap-3 text-[10px] ${
                    msg.role === 'user'
                      ? 'border-t border-teal-700/60 text-teal-200'
                      : 'border-t border-zinc-200 text-zinc-400'
                  }`}
                >
                  <span className="font-mono">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.modelUsed && ` · ${msg.modelUsed}`}
                  </span>

                  {msg.role === 'model' && msg.id !== 'welcome' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1 hover:text-zinc-700 transition cursor-pointer"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => handleSaveAsFAQ(msg.id, msg.content)}
                        className="px-1.5 py-0.5 bg-white hover:bg-zinc-100 text-[#003E54] font-semibold rounded border border-zinc-300 transition flex items-center gap-1 cursor-pointer"
                        title="Save this answer directly to Firestore FAQs"
                      >
                        {savedFaqId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Saved!</span>
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-3 h-3 text-[#008272]" />
                            <span>Save as FAQ</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#00EAA6] text-[#003E54] font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start items-center text-xs text-zinc-500 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-[#003E54] text-[#00EAA6] flex items-center justify-center">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-[#F4F6F8] p-3 rounded-lg border border-zinc-200">
                Gemini is synthesizing response using <strong className="text-zinc-700">{selectedModel}</strong>...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts */}
        <div className="p-2 sm:px-4 bg-[#F8FAFC] border-t border-zinc-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider shrink-0">
            Suggested:
          </span>
          {SUGGESTED_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="text-[11px] bg-white hover:bg-zinc-100 text-zinc-700 font-medium px-2.5 py-1 rounded border border-zinc-200 whitespace-nowrap transition cursor-pointer disabled:opacity-50 shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-zinc-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${selectedRole.name} anything...`}
              disabled={loading}
              className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-[#F4F6F8] text-zinc-900 placeholder:text-zinc-400 rounded-md border border-zinc-300 focus:outline-hidden focus:ring-2 focus:ring-[#00EAA6] transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-[#00EAA6] hover:bg-[#00c78d] text-[#003E54] font-bold px-4 py-2.5 rounded-md transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline text-xs">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
