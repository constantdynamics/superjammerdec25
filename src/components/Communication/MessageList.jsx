import { formatTime, formatDate } from '../../utils/formatUtils'

export function MessageList({ messages, onTimestampClick, currentUser = 'Ik' }) {
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-700/50 flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">
          Nog geen berichten. Begin een gesprek!
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {messages.map((message) => {
        const isOwnMessage = message.sender === currentUser

        return (
          <div
            key={message.id}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                isOwnMessage
                  ? 'bg-purple-600 rounded-br-md'
                  : 'bg-gray-700 rounded-bl-md'
              }`}
            >
              {/* Sender name (voor andere gebruikers) */}
              {!isOwnMessage && (
                <p className="text-xs text-purple-400 mb-1">{message.sender}</p>
              )}

              {/* Timestamped comment indicator */}
              {message.messageType === 'timestamped' && message.projectTimestamp !== null && (
                <button
                  onClick={() => onTimestampClick && onTimestampClick(message.projectTimestamp)}
                  className="flex items-center gap-1 text-xs text-purple-300 hover:text-purple-200 mb-1 transition-colors"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  @ {formatTime(message.projectTimestamp)}
                </button>
              )}

              {/* Message content */}
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>

              {/* Timestamp */}
              <p className={`text-xs mt-1 ${isOwnMessage ? 'text-purple-300' : 'text-gray-500'}`}>
                {new Date(message.timestamp).toLocaleTimeString('nl-NL', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function MessageItem({ message, isOwn, onTimestampClick }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          isOwn
            ? 'bg-purple-600 rounded-br-md'
            : 'bg-gray-700 rounded-bl-md'
        }`}
      >
        {!isOwn && (
          <p className="text-xs text-purple-400 mb-1">{message.sender}</p>
        )}

        {message.projectTimestamp !== null && (
          <button
            onClick={() => onTimestampClick(message.projectTimestamp)}
            className="flex items-center gap-1 text-xs text-purple-300 hover:text-purple-200 mb-1"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
            </svg>
            @ {formatTime(message.projectTimestamp)}
          </button>
        )}

        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

        <p className={`text-xs mt-1 ${isOwn ? 'text-purple-300' : 'text-gray-500'}`}>
          {new Date(message.timestamp).toLocaleTimeString('nl-NL', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    </div>
  )
}
