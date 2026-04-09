/**
 * iMessage-style chat bubble.
 * role = 'assistant' → left-aligned, dark bg
 * role = 'user'      → right-aligned, blue bg
 */
export default function ChatBubble({ role, content }) {
  const isUser = role === 'user';

  // Strip WATCH_DATA JSON from display (it's machine-readable, not for the user)
  const displayContent = content.replace(/\nWATCH_DATA:\s*\{[^}]+\}/g, '').trim();

  return (
    <div
      className={`flex animate-fade-in-up ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`
          max-w-[80%] px-4 py-2.5 text-sm leading-relaxed
          ${isUser
            ? 'bg-electric text-white rounded-2xl rounded-br-md'
            : 'bg-navy-light text-gray-200 rounded-2xl rounded-bl-md'
          }
        `}
      >
        {displayContent}
      </div>
    </div>
  );
}
