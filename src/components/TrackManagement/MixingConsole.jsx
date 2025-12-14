import { formatTime } from '../../utils/formatUtils'

export function MixingConsole({
  tracks,
  isPlaying,
  currentTime,
  duration,
  masterVolume,
  onPlay,
  onStop,
  onSeek,
  onMasterVolumeChange
}) {
  const hasAnySolo = tracks.some(t => t.solo)

  return (
    <div className="glass rounded-xl p-4 space-y-4">
      {/* Transport controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Rewind */}
        <button
          onClick={() => onSeek(0)}
          className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all active:scale-95"
          disabled={tracks.length === 0}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>

        {/* Play/Stop */}
        <button
          onClick={isPlaying ? onStop : onPlay}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95 ${
            isPlaying
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'bg-green-600 hover:bg-green-700'
          } ${tracks.length === 0 ? 'opacity-50 cursor-not-allowed' : 'shadow-lg'}`}
          disabled={tracks.length === 0}
        >
          {isPlaying ? (
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Forward */}
        <button
          onClick={() => onSeek(Math.min(currentTime + 10, duration))}
          className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all active:scale-95"
          disabled={tracks.length === 0}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
          </svg>
        </button>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-purple-500 rounded-full"
            style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
            disabled={tracks.length === 0}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Master volume */}
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
        </svg>
        <span className="text-sm text-gray-400 w-16">Master</span>
        <input
          type="range"
          min="0"
          max="100"
          value={masterVolume * 100}
          onChange={(e) => onMasterVolumeChange(parseInt(e.target.value) / 100)}
          className="flex-1"
        />
        <span className="text-sm text-gray-400 w-10 text-right">
          {Math.round(masterVolume * 100)}%
        </span>
      </div>

      {/* Track status */}
      {tracks.length > 0 && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <span>{tracks.length} track{tracks.length !== 1 ? 's' : ''}</span>
          {tracks.some(t => t.muted) && (
            <span className="text-red-400">• {tracks.filter(t => t.muted).length} gemute</span>
          )}
          {hasAnySolo && (
            <span className="text-yellow-400">• Solo actief</span>
          )}
        </div>
      )}
    </div>
  )
}

export function MiniTransport({
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onTogglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          isPlaying ? 'bg-purple-600' : 'bg-green-600'
        }`}
      >
        {isPlaying ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <div className="flex-1">
        <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500"
            style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
        </div>
      </div>

      <span className="text-xs text-gray-400 w-16 text-right">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  )
}
