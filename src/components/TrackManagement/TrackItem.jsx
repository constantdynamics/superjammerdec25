import { useState } from 'react'
import { formatTime, formatDate } from '../../utils/formatUtils'
import { INSTRUMENT_TYPES } from '../../utils/audioUtils'
import { WaveformDisplay } from '../AudioRecorder/AudioVisualizer'

export function TrackItem({
  track,
  waveform,
  currentTime,
  duration,
  isPlaying,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
  onDelete,
  onRename,
  onSeek
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(track.name)

  const instrument = INSTRUMENT_TYPES.find(i => i.id === track.instrument) || INSTRUMENT_TYPES[8]

  const handleRename = () => {
    if (editName.trim()) {
      onRename(track.id, editName.trim())
    }
    setIsEditing(false)
  }

  return (
    <div
      className={`glass rounded-xl overflow-hidden transition-all ${
        track.muted ? 'opacity-50' : ''
      }`}
      style={{ borderLeft: `4px solid ${track.color}` }}
    >
      {/* Header */}
      <div
        className="p-3 flex items-center gap-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Instrument icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
          style={{ backgroundColor: `${track.color}33` }}
        >
          {instrument.icon}
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 rounded px-2 py-1 text-sm w-full"
              autoFocus
            />
          ) : (
            <h4 className="font-medium truncate">{track.name}</h4>
          )}
          <p className="text-xs text-gray-400">
            {track.recordedBy} • {formatTime(track.duration)}
          </p>
        </div>

        {/* Quick controls */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onMuteToggle(track.id)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
              track.muted ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            M
          </button>
          <button
            onClick={() => onSoloToggle(track.id)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
              track.solo ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            S
          </button>
        </div>

        {/* Expand arrow */}
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Waveform */}
          {waveform && (
            <WaveformDisplay
              waveform={waveform}
              currentTime={isPlaying ? currentTime : 0}
              duration={track.duration}
              color={track.color}
              onClick={(time) => onSeek && onSeek(time)}
            />
          )}

          {/* Volume slider */}
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
            </svg>
            <input
              type="range"
              min="0"
              max="100"
              value={track.volume * 100}
              onChange={(e) => onVolumeChange(track.id, parseInt(e.target.value) / 100)}
              className="flex-1"
            />
            <span className="text-xs text-gray-400 w-10 text-right">
              {Math.round(track.volume * 100)}%
            </span>
          </div>

          {/* Track details */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>Opgenomen: {formatDate(track.recordedAt)}</p>
            <p>Instrument: {instrument.name}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-all"
            >
              Hernoemen
            </button>
            <button
              onClick={() => onDelete(track.id)}
              className="py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-all"
            >
              Verwijderen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
