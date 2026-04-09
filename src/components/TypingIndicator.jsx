/**
 * Three-dot typing indicator shown while Claude is thinking.
 */
export default function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in-up">
      <div className="bg-navy-light rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-500" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-500" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-500" />
      </div>
    </div>
  );
}
