import { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import ChatBubble from '../components/ChatBubble';
import TypingIndicator from '../components/TypingIndicator';
import EyeLogo from '../components/EyeLogo';

export default function Chat({ onBack }) {
  const { messages, sending, sendMessage, clearHistory } = useChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-navy">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/10 flex items-center gap-3">
        <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <EyeLogo size={28} />
        <div className="flex-1">
          <h2 className="text-white font-semibold text-sm leading-tight">Chat with Argus</h2>
          <p className="text-green text-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green inline-block pulse-glow" />
            Online
          </p>
        </div>
        <button
          onClick={clearHistory}
          className="text-gray-600 text-xs hover:text-gray-400 transition-colors"
        >
          Clear chat
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 chat-scroll"
      >
        {messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} content={msg.content} />
        ))}
        {sending && <TypingIndicator />}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex-shrink-0 px-4 py-3 border-t border-white/10"
      >
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={sending ? 'Argus is typing...' : 'Type a message...'}
            disabled={sending}
            className="flex-1 bg-navy-light rounded-xl px-4 py-2.5 text-white text-sm
                       placeholder-gray-500 outline-none focus:ring-2 focus:ring-electric/50
                       disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-electric hover:bg-electric-dark
                       disabled:opacity-30 disabled:cursor-not-allowed
                       flex items-center justify-center transition-all active:scale-95"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
