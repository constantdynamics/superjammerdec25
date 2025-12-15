import { useState, useEffect } from 'react'
import { TEMPO_PRESETS, TIME_SIGNATURES } from '../../utils/audioUtils'

const MUSICAL_KEYS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
]

export function ProjectSettings({
  isOpen,
  onClose,
  project,
  onUpdateInfo,
  onUpdateSettings,
  onAddCollaborator,
  isOnline,
  syncStatus,
  shareCode,
  onGenerateShareCode,
  onJoinWithCode
}) {
  const [name, setName] = useState(project?.name || '')
  const [description, setDescription] = useState(project?.description || '')
  const [tempo, setTempo] = useState(project?.settings?.tempo || 100)
  const [key, setKey] = useState(project?.settings?.key || 'C')
  const [timeSignature, setTimeSignature] = useState(project?.settings?.timeSignature || '4/4')
  const [newCollaborator, setNewCollaborator] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState(null)
  const [showShareSection, setShowShareSection] = useState(false)

  // Reset form when project changes
  useEffect(() => {
    if (project) {
      setName(project.name || '')
      setDescription(project.description || '')
      setTempo(project.settings?.tempo || 100)
      setKey(project.settings?.key || 'C')
      setTimeSignature(project.settings?.timeSignature || '4/4')
    }
  }, [project])

  if (!isOpen || !project) return null

  const handleSaveInfo = () => {
    onUpdateInfo(name, description)
  }

  const handleSaveSettings = () => {
    onUpdateSettings({ tempo, key, timeSignature })
  }

  const handleAddCollaborator = () => {
    if (newCollaborator.trim()) {
      onAddCollaborator(newCollaborator.trim())
      setNewCollaborator('')
    }
  }

  const handleGenerateCode = async () => {
    setIsGeneratingCode(true)
    try {
      await onGenerateShareCode()
    } finally {
      setIsGeneratingCode(false)
    }
  }

  const handleJoinWithCode = async () => {
    if (!joinCode.trim()) return

    setIsJoining(true)
    setJoinError(null)
    try {
      await onJoinWithCode(joinCode.trim())
      setJoinCode('')
      onClose()
    } catch (error) {
      setJoinError(error.message)
    } finally {
      setIsJoining(false)
    }
  }

  const copyShareCode = () => {
    if (shareCode) {
      navigator.clipboard.writeText(shareCode)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-dark rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">Project Instellingen</h2>
            {/* Sync status indicator */}
            {isOnline && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                syncStatus === 'synced' ? 'bg-green-500/20 text-green-400' :
                syncStatus === 'syncing' ? 'bg-yellow-500/20 text-yellow-400' :
                syncStatus === 'error' ? 'bg-red-500/20 text-red-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {syncStatus === 'synced' ? 'Gesynchroniseerd' :
                 syncStatus === 'syncing' ? 'Synchroniseren...' :
                 syncStatus === 'error' ? 'Sync fout' : 'Lokaal'}
              </span>
            )}
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

        <div className="p-4 space-y-6">
          {/* Share section */}
          <section className="space-y-3">
            <button
              onClick={() => setShowShareSection(!showShareSection)}
              className="w-full flex items-center justify-between p-3 bg-purple-600/20 hover:bg-purple-600/30 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="font-medium text-purple-300">Delen met vrienden</span>
              </div>
              <svg className={`w-5 h-5 text-purple-400 transition-transform ${showShareSection ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showShareSection && (
              <div className="space-y-4 p-3 bg-gray-800/50 rounded-xl">
                {!isOnline ? (
                  <p className="text-sm text-gray-400 text-center">
                    Delen is alleen beschikbaar wanneer Firebase is geconfigureerd.
                  </p>
                ) : (
                  <>
                    {/* Generate share code */}
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">Deel dit project</label>
                      {shareCode ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-700 rounded-lg px-4 py-3 font-mono text-xl text-center tracking-widest">
                            {shareCode}
                          </div>
                          <button
                            onClick={copyShareCode}
                            className="p-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                            title="Kopieer code"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleGenerateCode}
                          disabled={isGeneratingCode}
                          className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg font-medium transition-colors"
                        >
                          {isGeneratingCode ? 'Code genereren...' : 'Genereer deelcode'}
                        </button>
                      )}
                      <p className="text-xs text-gray-500">
                        Deel deze code met je vriend. De code is 24 uur geldig.
                      </p>
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                      {/* Join with code */}
                      <label className="text-sm text-gray-400">Heb je een code ontvangen?</label>
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          value={joinCode}
                          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                          placeholder="ABCD12"
                          maxLength={6}
                          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 font-mono text-center tracking-widest uppercase focus:outline-none focus:border-purple-500"
                        />
                        <button
                          onClick={handleJoinWithCode}
                          disabled={!joinCode.trim() || isJoining}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg font-medium transition-colors"
                        >
                          {isJoining ? '...' : 'Join'}
                        </button>
                      </div>
                      {joinError && (
                        <p className="text-sm text-red-400 mt-2">{joinError}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </section>

          {/* Project info */}
          <section className="space-y-3">
            <h3 className="font-medium text-gray-300">Project Informatie</h3>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Naam</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleSaveInfo}
                className="input-field"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Beschrijving</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleSaveInfo}
                rows={2}
                className="input-field resize-none"
                placeholder="Beschrijf je song..."
              />
            </div>
          </section>

          {/* Musical settings */}
          <section className="space-y-3">
            <h3 className="font-medium text-gray-300">Muzikale Instellingen</h3>

            {/* Tempo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-400">Tempo</label>
                <span className="text-sm font-medium">{tempo} BPM</span>
              </div>
              <input
                type="range"
                min="40"
                max="240"
                value={tempo}
                onChange={(e) => setTempo(parseInt(e.target.value))}
                onMouseUp={handleSaveSettings}
                onTouchEnd={handleSaveSettings}
                className="w-full"
              />
              <div className="flex flex-wrap gap-2">
                {TEMPO_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setTempo(preset.bpm)
                      setTimeout(handleSaveSettings, 0)
                    }}
                    className={`px-3 py-1 text-xs rounded-full transition-all ${
                      tempo === preset.bpm
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {preset.name} ({preset.bpm})
                  </button>
                ))}
              </div>
            </div>

            {/* Key */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Toonsoort</label>
              <div className="flex flex-wrap gap-2">
                {MUSICAL_KEYS.slice(0, 12).map((k) => (
                  <button
                    key={k}
                    onClick={() => {
                      setKey(k)
                      setTimeout(handleSaveSettings, 0)
                    }}
                    className={`px-3 py-1 text-sm rounded-lg transition-all ${
                      key === k
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {MUSICAL_KEYS.slice(12).map((k) => (
                  <button
                    key={k}
                    onClick={() => {
                      setKey(k)
                      setTimeout(handleSaveSettings, 0)
                    }}
                    className={`px-3 py-1 text-sm rounded-lg transition-all ${
                      key === k
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            {/* Time signature */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Maatsoort</label>
              <div className="flex flex-wrap gap-2">
                {TIME_SIGNATURES.map((ts) => (
                  <button
                    key={ts.name}
                    onClick={() => {
                      setTimeSignature(ts.name)
                      setTimeout(handleSaveSettings, 0)
                    }}
                    className={`px-4 py-2 text-sm rounded-lg transition-all ${
                      timeSignature === ts.name
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {ts.name}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Collaborators */}
          <section className="space-y-3">
            <h3 className="font-medium text-gray-300">Medewerkers</h3>
            <div className="flex flex-wrap gap-2">
              {project.collaborators?.map((collab, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-700 rounded-full text-sm"
                >
                  {collab}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCollaborator}
                onChange={(e) => setNewCollaborator(e.target.value)}
                placeholder="Voeg medewerker toe"
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                onKeyDown={(e) => e.key === 'Enter' && handleAddCollaborator()}
              />
              <button
                onClick={handleAddCollaborator}
                disabled={!newCollaborator.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-sm transition-colors"
              >
                Toevoegen
              </button>
            </div>
          </section>

          {/* Project stats */}
          <section className="space-y-3">
            <h3 className="font-medium text-gray-300">Statistieken</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-2xl font-bold">{project.tracks?.length || 0}</p>
                <p className="text-xs text-gray-500">Tracks</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-2xl font-bold">{project.collaborators?.length || 0}</p>
                <p className="text-xs text-gray-500">Medewerkers</p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700/50">
          <button
            onClick={onClose}
            className="w-full btn-primary"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  )
}
