import { TEMPO_PRESETS, TIME_SIGNATURES } from '../../utils/audioUtils'

export function MetronomeControl({
  isActive,
  bpm,
  timeSignature,
  currentBeat,
  volume,
  onToggle,
  onBpmChange,
  onTimeSignatureChange,
  onVolumeChange,
  onTapTempo
}) {
  return (
    <div className="glass rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Metronoom</h3>
        <button
          onClick={onToggle}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            isActive
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {isActive ? 'Stop' : 'Start'}
        </button>
      </div>

      {/* Beat indicator */}
      <div className="flex justify-center gap-2">
        {Array.from({ length: timeSignature.beats }).map((_, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-100 ${
              isActive && currentBeat === i
                ? i === 0
                  ? 'bg-red-500 scale-110'
                  : 'bg-purple-500 scale-110'
                : 'bg-gray-700'
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* BPM Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Tempo</span>
          <span className="text-xl font-bold">{bpm} BPM</span>
        </div>
        <input
          type="range"
          min="40"
          max="240"
          value={bpm}
          onChange={(e) => onBpmChange(parseInt(e.target.value))}
          className="w-full"
        />
        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {TEMPO_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onBpmChange(preset.bpm)}
              className={`px-3 py-1 text-xs rounded-full transition-all ${
                bpm === preset.bpm
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tap Tempo */}
      <button
        onClick={onTapTempo}
        className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-all active:scale-95"
      >
        Tap Tempo
      </button>

      {/* Time Signature */}
      <div className="space-y-2">
        <span className="text-sm text-gray-400">Maatsoort</span>
        <div className="flex flex-wrap gap-2">
          {TIME_SIGNATURES.map((ts) => (
            <button
              key={ts.name}
              onClick={() => onTimeSignatureChange(ts.beats, ts.noteValue)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                timeSignature.beats === ts.beats
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {ts.name}
            </button>
          ))}
        </div>
      </div>

      {/* Volume */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Volume</span>
          <span className="text-sm">{Math.round(volume * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={volume * 100}
          onChange={(e) => onVolumeChange(parseInt(e.target.value) / 100)}
          className="w-full"
        />
      </div>
    </div>
  )
}

export function MetronomeCompact({
  isActive,
  bpm,
  currentBeat,
  beatsPerMeasure,
  onToggle,
  onBpmChange
}) {
  return (
    <div className="flex items-center gap-3 glass rounded-lg px-3 py-2">
      {/* Mini beat indicators */}
      <div className="flex gap-1">
        {Array.from({ length: beatsPerMeasure }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-75 ${
              isActive && currentBeat === i
                ? i === 0
                  ? 'bg-red-500'
                  : 'bg-purple-500'
                : 'bg-gray-600'
            }`}
          />
        ))}
      </div>

      {/* BPM display en control */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onBpmChange(Math.max(40, bpm - 5))}
          className="w-6 h-6 flex items-center justify-center bg-gray-700 rounded text-sm hover:bg-gray-600"
        >
          -
        </button>
        <span className="text-sm font-medium w-12 text-center">{bpm}</span>
        <button
          onClick={() => onBpmChange(Math.min(240, bpm + 5))}
          className="w-6 h-6 flex items-center justify-center bg-gray-700 rounded text-sm hover:bg-gray-600"
        >
          +
        </button>
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          isActive ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
        }`}
      >
        {isActive ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </div>
  )
}
