'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Language, getTranslation } from '@/app/lib/i18n';
import Nav from '@/app/components/Nav';
import LanguageToggle from '@/app/components/LanguageToggle';
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
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedLang = localStorage.getItem('preferred_language') || 'en';
    setLang(storedLang as Language);
    
    // Check if farm_id exists
    const farmId = localStorage.getItem('farm_id');
    if (!farmId) {
      router.push('/onboarding/location');
      return;
    }
    
    // Load chat history
    loadHistory();
  }, [router]);

  const loadHistory = async () => {
    const farmId = localStorage.getItem('farm_id');
    if (!farmId) return;
    
    try {
      setLoadingHistory(true);
      const history = await api.getChatHistory(farmId, 30);
      // Normalize roles to lowercase (safety check)
      const normalizedHistory = history.map(msg => ({
        ...msg,
        role: (msg.role?.toLowerCase() || 'assistant') as 'user' | 'assistant'
      }));
      // Sort by created_at (ascending), then by id (ascending) as tie-breaker
      const sortedHistory = normalizedHistory.sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        if (timeA !== timeB) {
          return timeA - timeB;
        }
        // Tie-breaker: sort by id (ascending)
        return a.id.localeCompare(b.id);
      });
      setMessages(sortedHistory);
    } catch (err) {
      console.error('Error loading chat history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
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

    // Optimistically add user message (keep it permanently)
    const tempUserMsg: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await api.sendChatMessage(farmId, userMessage, lang);
      
      // Add assistant reply (keep user message, just add assistant)
      const assistantMsg: ChatMessage = {
        id: `temp-assistant-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        created_at: new Date().toISOString()
      };
      
      setMessages((prev) => [...prev, assistantMsg]);
      
      // Reload history to get real IDs from database
      await loadHistory();
    } catch (err) {
      console.error('Error sending message:', err);
      // Keep user message, just add error message
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

  const handleNewChat = async () => {
    const farmId = localStorage.getItem('farm_id');
    if (!farmId) return;
    
    try {
      await api.clearChatHistory(farmId);
      setMessages([]);
      setInput('');
      // Focus input after clearing
      setTimeout(() => {
        const inputEl = document.querySelector('input[type="text"]') as HTMLInputElement;
        inputEl?.focus();
      }, 100);
    } catch (err) {
      console.error('Error clearing chat history:', err);
    }
  };

  const suggestions = [
    getTranslation('chat.suggestion.sweetness', lang),
    getTranslation('chat.suggestion.mildew', lang),
    getTranslation('chat.suggestion.rain', lang),
    getTranslation('chat.suggestion.harvest', lang),
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Nav lang={lang} />
      <div className="container mx-auto p-8 flex-1 flex flex-col max-w-4xl">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {getTranslation('chat.title', lang)}
          </h1>
          <div className="flex gap-2 items-center">
            <button
              onClick={handleNewChat}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium"
            >
              {getTranslation('chat.newChat', lang) || 'New Chat'}
            </button>
            <LanguageToggle currentLang={lang} onLanguageChange={setLang} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadingHistory ? (
              <div className="text-center text-gray-800 mt-8">
                {getTranslation('common.loading', lang)}
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-800 mt-8">
                <p className="mb-4">Ask me anything about your table grape farm!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role?.toLowerCase() === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isUser
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <span className={isUser ? 'text-white' : 'text-gray-800'}>
                        {msg.content}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                  {getTranslation('common.loading', lang)}...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 0 && !loadingHistory && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestion(suggestion)}
                    className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm hover:bg-green-200 transition-colors text-gray-800"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSend} className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={getTranslation('chat.placeholder', lang)}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-400 caret-gray-900 disabled:bg-gray-100"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {getTranslation('chat.send', lang)}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

