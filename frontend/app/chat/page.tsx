'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Language, getTranslation } from '@/app/lib/i18n';
import Nav from '@/app/components/Nav';
import { api } from '@/app/lib/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedLang = localStorage.getItem('preferred_language') || 'en';
    setLang(storedLang as Language);

    const farmId = localStorage.getItem('farm_id');
    if (!farmId) {
      router.push('/onboarding/location');
      return;
    }

    const sessionKey = `tablegrape_session_${farmId}`;
    let currentSessionId = localStorage.getItem(sessionKey);
    if (!currentSessionId) {
      currentSessionId = crypto.randomUUID();
      localStorage.setItem(sessionKey, currentSessionId);
    }
    setSessionId(currentSessionId);

    const loadHistory = async () => {
      try {
        const history = await api.getChatHistory(farmId, 30).catch(() => []);
        const normalizedHistory = history.map(msg => ({
          ...msg,
          role: (msg.role?.toLowerCase() || 'assistant') as 'user' | 'assistant'
        }));
        const sortedHistory = normalizedHistory.sort((a, b) => {
          const timeA = new Date(a.created_at).getTime();
          const timeB = new Date(b.created_at).getTime();
          if (timeA !== timeB) return timeA - timeB;
          return a.id.localeCompare(b.id);
        });
        setMessages(sortedHistory);
      } catch (err) {
        console.error('Error loading chat history:', err);
      }
    };
    loadHistory();

    const handleLanguageChange = (e: CustomEvent) => {
      setLang(e.detail.lang);
    };
    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const farmId = localStorage.getItem('farm_id');
    if (!farmId) {
      router.push('/onboarding/location');
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    const tempUserMsg: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await api.sendChatMessage(farmId, userMessage, lang, sessionId || undefined);
      
      if (response.session_id && response.session_id !== sessionId) {
        const farmId = localStorage.getItem('farm_id');
        if (farmId) {
          const sessionKey = `tablegrape_session_${farmId}`;
          localStorage.setItem(sessionKey, response.session_id);
          setSessionId(response.session_id);
        }
      }
      
      const assistantMsg: ChatMessage = {
        id: `temp-assistant-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleNewChat = () => {
    const farmId = localStorage.getItem('farm_id');
    if (!farmId) return;
    
    const newSessionId = crypto.randomUUID();
    const sessionKey = `tablegrape_session_${farmId}`;
    localStorage.setItem(sessionKey, newSessionId);
    setSessionId(newSessionId);
    setMessages([]);
    setInput('');
  };

  const suggestions = [
    getTranslation('chat.suggestion.sweetness', lang),
    getTranslation('chat.suggestion.mildew', lang),
    getTranslation('chat.suggestion.rain', lang),
    getTranslation('chat.suggestion.harvest', lang),
  ];

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <Nav lang={lang} />
      
      <div className="flex-1 flex flex-col container mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-4 max-w-3xl overflow-hidden">
        {/* Header - Compact on mobile */}
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {getTranslation('chat.title', lang)}
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">Ask anything about your farm</p>
            </div>
          </div>
          <button
            onClick={handleNewChat}
            className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            + New
          </button>
        </div>

        {/* Chat Container */}
        <div className="flex-1 bg-white border border-gray-100 rounded-xl sm:rounded-2xl shadow-sm flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-4 sm:mt-8">
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-2 sm:mb-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm">Start a conversation about your farm</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role?.toLowerCase() === 'user';
                return (
                  <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] sm:max-w-[80%] px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm ${
                        isUser
                          ? 'bg-gray-900 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-800 rounded-bl-md'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-600 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl rounded-bl-md text-xs sm:text-sm">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions - Scrollable on mobile */}
          {messages.length === 0 && (
            <div className="px-2 sm:px-4 pb-1 sm:pb-2">
              <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestion(suggestion)}
                    className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-full text-[10px] sm:text-xs hover:bg-gray-100 transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSend} className="p-2 sm:p-3 border-t border-gray-100">
            <div className="flex gap-1.5 sm:gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={getTranslation('chat.placeholder', lang)}
                disabled={loading}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-900 text-white rounded-xl text-xs sm:text-sm font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
