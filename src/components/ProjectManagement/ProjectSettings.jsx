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
  onAddCollaborator
}) {
  const [name, setName] = useState(project?.name || '')
  const [description, setDescription] = useState(project?.description || '')
  const [tempo, setTempo] = useState(project?.settings?.tempo || 100)
  const [key, setKey] = useState(project?.settings?.key || 'C')
  const [timeSignature, setTimeSignature] = useState(project?.settings?.timeSignature || '4/4')
  const [newCollaborator, setNewCollaborator] = useState('')

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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-dark rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          <h2 className="text-xl font-bold">Project Instellingen</h2>
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
