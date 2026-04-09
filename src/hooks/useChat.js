import { useState, useCallback, useEffect } from 'react';
import { chatWithClaude, parseWatchData, getWatchContext } from '../utils/api';

const STORAGE_KEY = 'argus_chat_history';

const FIRST_MESSAGE = {
  role: 'assistant',
  content: "Hey! I'm Argus. I watch Amtrak prices 24/7 and alert you the moment fares drop. Ask me anything about your watched trains, or tell me a new route to monitor!",
};

/**
 * Custom hook for the Claude-powered chat with localStorage persistence.
 *
 * Returns:
 *  - messages: array of { role: 'user'|'assistant', content: string }
 *  - sending: boolean
 *  - watchData: parsed WATCH_DATA object or null
 *  - sendMessage: (text) => void
 *  - clearHistory: () => void
 */
export function useChat() {
  const [messages, setMessages] = useState(() => {
    // Load persisted chat history on mount
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore corrupt data */ }
    return [FIRST_MESSAGE];
  });

  const [sending, setSending] = useState(false);
  const [watchData, setWatchData] = useState(null);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || sending) return;

      const userMsg = { role: 'user', content: text.trim() };
      const history = [...messages, userMsg];
      setMessages(history);
      setSending(true);

      try {
        const apiMessages = history.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Build current watch context from localStorage
        const watchContext = getWatchContext();

        const reply = await chatWithClaude(apiMessages, watchContext);

        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);

        // Check if Claude included WATCH_DATA
        const data = parseWatchData(reply);
        if (data) {
          setWatchData(data);
        }
      } catch (err) {
        console.error('[Argus] Chat error:', err);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: "Sorry, I had trouble processing that. Could you try again?",
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [messages, sending]
  );

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([FIRST_MESSAGE]);
    setWatchData(null);
  }, []);

  return { messages, sending, watchData, sendMessage, clearHistory };
}
