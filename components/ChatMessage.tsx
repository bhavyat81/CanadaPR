interface ChatMessageProps {
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  isOwnMessage: boolean;
  onClickUsername?: (senderId: string) => void;
}

export default function ChatMessage({
  senderId,
  senderName,
  content,
  createdAt,
  isOwnMessage,
  onClickUsername,
}: ChatMessageProps) {
  const formattedTime = new Date(createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const displayName = isOwnMessage ? 'You' : senderName;

  return (
    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} mb-4`}>
      <button
        className={`text-xs text-gray-500 mb-1 mx-1 hover:underline focus:outline-none ${
          isOwnMessage ? 'text-right' : 'text-left'
        }`}
        onClick={() => onClickUsername?.(senderId)}
      >
        {displayName}
      </button>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
          isOwnMessage
            ? 'bg-red-600 text-white rounded-br-none'
            : 'bg-gray-100 text-gray-800 rounded-bl-none'
        }`}
      >
        <p className="text-sm">{content}</p>
      </div>
      <span className="text-xs text-gray-400 mt-1 mx-1">{formattedTime}</span>
    </div>
  );
}
