import { TrackItem } from './TrackItem'

export function TrackList({
  tracks,
  waveforms,
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
  if (tracks.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700/50 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-300 mb-2">Nog geen tracks</h3>
        <p className="text-sm text-gray-500">
          Druk op de opname knop om je eerste track op te nemen
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-medium text-gray-300">
          Tracks ({tracks.length})
        </h3>
        {tracks.some(t => t.solo) && (
          <span className="text-xs text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded">
            Solo actief
          </span>
        )}
      </div>

      <div className="space-y-2">
        {tracks.map((track) => (
          <TrackItem
            key={track.id}
            track={track}
            waveform={waveforms[track.id]}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            onVolumeChange={onVolumeChange}
            onMuteToggle={onMuteToggle}
            onSoloToggle={onSoloToggle}
            onDelete={onDelete}
            onRename={onRename}
            onSeek={onSeek}
          />
        ))}
      </div>
    </div>
  )
}
