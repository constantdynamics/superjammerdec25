import { useState } from 'react'
import { formatTime } from '../../utils/formatUtils'
import { INSTRUMENT_TYPES } from '../../utils/audioUtils'

export function RecordingControls({
  isRecording,
  isPaused,
  recordingTime,
  countdown,
  hasPermission,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onDiscardRecording,
  onCancelCountdown,
  onRequestPermission
}) {
  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <p className="text-gray-400 text-center">
          Geef toegang tot je microfoon om te kunnen opnemen
        </p>
        <button
          onClick={onRequestPermission}
          className="btn-primary"
        >
          Microfoon Toestaan
        </button>
      </div>
    )
  }

  if (countdown !== null) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="w-32 h-32 rounded-full bg-purple-600/30 flex items-center justify-center animate-pulse">
          <span className="text-6xl font-bold">{countdown}</span>
        </div>
        <p className="text-gray-400">Opname start over {countdown}...</p>
        <button
          onClick={onCancelCountdown}
          className="btn-secondary"
        >
          Annuleren
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      {/* Recording timer */}
      {isRecording && (
        <div className="text-3xl font-mono font-bold text-red-500">
          {formatTime(recordingTime)}
        </div>
      )}

      {/* Main controls */}
      <div className="flex items-center gap-4">
        {!isRecording ? (
          <button
            onClick={() => onStartRecording(true)}
            className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-red-500/30"
          >
            <div className="w-6 h-6 rounded-full bg-white" />
          </button>
        ) : (
          <>
            {/* Pause/Resume */}
            <button
              onClick={isPaused ? onResumeRecording : onPauseRecording}
              className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all active:scale-95"
            >
              {isPaused ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              )}
            </button>

            {/* Stop */}
            <button
              onClick={onStopRecording}
              className={`w-20 h-20 rounded-full bg-red-500 flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-red-500/30 ${
                !isPaused ? 'recording-pulse relative' : ''
              }`}
            >
              <div className="w-8 h-8 rounded bg-white" />
            </button>

            {/* Discard */}
            <button
              onClick={onDiscardRecording}
              className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all active:scale-95"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Quick start without countdown */}
      {!isRecording && (
        <button
          onClick={() => onStartRecording(false)}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Direct starten (zonder countdown)
        </button>
      )}
    </div>
  )
}

export function SaveTrackModal({
  isOpen,
  onClose,
  onSave,
  duration
}) {
  const [name, setName] = useState('')
  const [instrument, setInstrument] = useState('guitar')

  const handleSave = () => {
    onSave(name || 'Nieuwe Track', instrument)
    setName('')
    setInstrument('guitar')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-dark rounded-2xl p-6 w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold">Track Opslaan</h2>

        <p className="text-gray-400 text-sm">
          Duur: {formatTime(duration)}
        </p>

        <div className="space-y-2">
          <label className="text-sm text-gray-400">Track Naam</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bijv. Gitaar intro"
            className="input-field"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-400">Instrument</label>
          <div className="grid grid-cols-3 gap-2">
            {INSTRUMENT_TYPES.map((inst) => (
              <button
                key={inst.id}
                onClick={() => setInstrument(inst.id)}
                className={`p-3 rounded-lg text-center transition-all ${
                  instrument === inst.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span className="text-2xl block">{inst.icon}</span>
                <span className="text-xs">{inst.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            className="flex-1 btn-primary"
          >
            Opslaan
          </button>
        </div>
      </div>
    </div>
  )
}
