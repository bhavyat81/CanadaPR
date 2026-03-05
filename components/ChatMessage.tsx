interface ChatMessageProps {
  senderName: string;
  content: string;
  createdAt: string;
  isOwnMessage: boolean;
}

export default function ChatMessage({ senderName, content, createdAt, isOwnMessage }: ChatMessageProps) {
  const formattedTime = new Date(createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} mb-4`}>
      {!isOwnMessage && (
        <span className="text-xs text-gray-500 mb-1 ml-1">{senderName}</span>
      )}
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
