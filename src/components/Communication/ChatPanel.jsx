import { useState, useRef, useEffect } from 'react'
import { MessageList } from './MessageList'
import { formatTime } from '../../utils/formatUtils'

export function ChatPanel({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  onTimestampClick,
  currentTime,
  currentUser = 'Ik'
}) {
  const [inputValue, setInputValue] = useState('')
  const [showTimestamp, setShowTimestamp] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Scroll naar beneden bij nieuwe berichten
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input wanneer panel opent
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const handleSend = () => {
    if (!inputValue.trim()) return

    const timestamp = showTimestamp ? currentTime : null
    onSendMessage(inputValue.trim(), currentUser, timestamp)
    setInputValue('')
    setShowTimestamp(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const insertTimestamp = () => {
    setShowTimestamp(true)
    const timeStr = formatTime(currentTime)
    setInputValue((prev) => `${prev}[@ ${timeStr}] `)
    inputRef.current?.focus()
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-full max-w-md bg-gray-900/95 backdrop-blur-xl border-l border-gray-700/50 z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold">Chat</h2>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
              {messages.length} berichten
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <MessageList
          messages={messages}
          onTimestampClick={onTimestampClick}
          currentUser={currentUser}
        />
        <div ref={messagesEndRef} />

        {/* Timestamp indicator */}
        {showTimestamp && (
          <div className="px-4 py-2 bg-purple-600/20 border-t border-purple-600/30 flex items-center justify-between">
            <span className="text-sm text-purple-300">
              Gekoppeld aan: {formatTime(currentTime)}
            </span>
            <button
              onClick={() => setShowTimestamp(false)}
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              Verwijderen
            </button>
          </div>
        )}

        {/* Input area */}
        <div className="p-4 border-t border-gray-700/50 space-y-3">
          <div className="flex gap-2">
            {/* Timestamp button */}
            <button
              onClick={insertTimestamp}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                showTimestamp
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              title="Voeg tijdstip toe"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
              </svg>
            </button>

            {/* Text input */}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Typ een bericht..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
            />

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                inputValue.trim()
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-800 text-gray-600'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Gebruik de klok om feedback te koppelen aan een specifiek moment in de song
          </p>
        </div>
      </div>
    </>
  )
}

export function ChatToggleButton({ onClick, unreadCount = 0 }) {
  return (
    <button
      onClick={onClick}
      className="relative w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}
