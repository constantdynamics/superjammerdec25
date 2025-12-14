import { useState } from 'react'
import { formatDate } from '../../utils/formatUtils'

export function ProjectSelector({
  projects,
  currentProject,
  onSelectProject,
  onCreateProject,
  onDeleteProject
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')

  const handleCreate = () => {
    if (newName.trim()) {
      onCreateProject(newName.trim(), newDescription.trim())
      setNewName('')
      setNewDescription('')
      setShowCreate(false)
      setIsOpen(false)
    }
  }

  const handleSelect = (projectId) => {
    onSelectProject(projectId)
    setIsOpen(false)
  }

  const handleDelete = (e, projectId) => {
    e.stopPropagation()
    if (window.confirm('Weet je zeker dat je dit project wilt verwijderen?')) {
      onDeleteProject(projectId)
    }
  }

  return (
    <div className="relative">
      {/* Current project button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors"
      >
        <span className="font-medium truncate max-w-[200px]">
          {currentProject?.name || 'Selecteer project'}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-80 bg-gray-800 rounded-xl shadow-xl border border-gray-700 z-50 overflow-hidden">
            {/* Project list */}
            <div className="max-h-64 overflow-y-auto">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleSelect(project.id)}
                  className={`p-3 cursor-pointer hover:bg-gray-700/50 transition-colors border-b border-gray-700/50 last:border-b-0 ${
                    currentProject?.id === project.id ? 'bg-purple-600/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{project.name}</h4>
                      {project.description && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {project.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {project.tracks?.length || 0} tracks • Laatst bewerkt {formatDate(project.lastModified)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, project.id)}
                      className="ml-2 p-1 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {projects.length === 0 && (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Geen projecten gevonden
                </div>
              )}
            </div>

            {/* Create new button */}
            {!showCreate ? (
              <button
                onClick={() => setShowCreate(true)}
                className="w-full p-3 flex items-center justify-center gap-2 bg-gray-700/50 hover:bg-gray-700 text-purple-400 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nieuw project
              </button>
            ) : (
              <div className="p-4 space-y-3 bg-gray-700/30">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Project naam"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                  autoFocus
                />
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Beschrijving (optioneel)"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim()}
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
                  >
                    Maken
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
