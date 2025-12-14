import { useState, useCallback, useEffect } from 'react'
import {
  saveProject,
  loadProject,
  deleteProject,
  loadAllProjects,
  saveMessages,
  loadMessages
} from '../utils/storageUtils'
import { generateId } from '../utils/formatUtils'
import { TRACK_COLORS } from '../utils/audioUtils'

export function useProjectData() {
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [tracks, setTracks] = useState([])
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Load projecten bij mount
  useEffect(() => {
    const loadedProjects = loadAllProjects()
    setProjects(loadedProjects)

    // Selecteer laatste project of maak nieuw
    if (loadedProjects.length > 0) {
      const lastProject = loadedProjects[loadedProjects.length - 1]
      selectProject(lastProject.id)
    } else {
      // Maak eerste project
      createProject('Mijn Eerste Song', 'Een nieuwe muzikale creatie')
    }

    setIsLoading(false)
  }, [])

  // Save project wanneer tracks wijzigen
  useEffect(() => {
    if (currentProject) {
      const updatedProject = {
        ...currentProject,
        tracks: tracks.map(t => ({
          ...t,
          audioBlob: undefined, // Blob niet opslaan in localStorage
          audioBlobUrl: t.audioBlobUrl
        })),
        lastModified: new Date().toISOString()
      }
      saveProject(updatedProject)
    }
  }, [tracks, currentProject])

  // Save messages wanneer ze wijzigen
  useEffect(() => {
    if (currentProject) {
      saveMessages(currentProject.id, messages)
    }
  }, [messages, currentProject])

  // Maak nieuw project
  const createProject = useCallback((name, description = '') => {
    const newProject = {
      id: generateId(),
      name,
      description,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      collaborators: ['Ik'],
      settings: {
        tempo: 100,
        key: 'C',
        timeSignature: '4/4'
      },
      tracks: []
    }

    saveProject(newProject)
    setProjects(prev => [...prev, newProject])
    setCurrentProject(newProject)
    setTracks([])
    setMessages([])

    return newProject
  }, [])

  // Selecteer project
  const selectProject = useCallback((projectId) => {
    const project = loadProject(projectId)
    if (project) {
      setCurrentProject(project)
      setTracks(project.tracks || [])
      setMessages(loadMessages(projectId))
    }
  }, [])

  // Update project settings
  const updateProjectSettings = useCallback((settings) => {
    if (currentProject) {
      const updated = {
        ...currentProject,
        settings: { ...currentProject.settings, ...settings },
        lastModified: new Date().toISOString()
      }
      setCurrentProject(updated)
      saveProject(updated)
    }
  }, [currentProject])

  // Update project naam/beschrijving
  const updateProjectInfo = useCallback((name, description) => {
    if (currentProject) {
      const updated = {
        ...currentProject,
        name,
        description,
        lastModified: new Date().toISOString()
      }
      setCurrentProject(updated)
      saveProject(updated)
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
    }
  }, [currentProject])

  // Verwijder project
  const removeProject = useCallback((projectId) => {
    deleteProject(projectId)
    setProjects(prev => prev.filter(p => p.id !== projectId))

    if (currentProject?.id === projectId) {
      const remaining = projects.filter(p => p.id !== projectId)
      if (remaining.length > 0) {
        selectProject(remaining[0].id)
      } else {
        createProject('Nieuw Project')
      }
    }
  }, [currentProject, projects, selectProject, createProject])

  // Voeg track toe
  const addTrack = useCallback((blob, duration, name, instrument = 'other', recordedBy = 'Ik') => {
    const colorIndex = tracks.length % TRACK_COLORS.length
    const newTrack = {
      id: generateId(),
      name: name || `Track ${tracks.length + 1}`,
      instrument,
      recordedBy,
      recordedAt: new Date().toISOString(),
      duration,
      audioBlob: blob,
      audioBlobUrl: URL.createObjectURL(blob),
      volume: 1,
      muted: false,
      solo: false,
      color: TRACK_COLORS[colorIndex]
    }

    setTracks(prev => [...prev, newTrack])
    return newTrack
  }, [tracks.length])

  // Update track
  const updateTrack = useCallback((trackId, updates) => {
    setTracks(prev => prev.map(track =>
      track.id === trackId ? { ...track, ...updates } : track
    ))
  }, [])

  // Verwijder track
  const removeTrack = useCallback((trackId) => {
    setTracks(prev => {
      const track = prev.find(t => t.id === trackId)
      if (track?.audioBlobUrl) {
        URL.revokeObjectURL(track.audioBlobUrl)
      }
      return prev.filter(t => t.id !== trackId)
    })
  }, [])

  // Toggle track mute
  const toggleTrackMute = useCallback((trackId) => {
    setTracks(prev => prev.map(track =>
      track.id === trackId ? { ...track, muted: !track.muted } : track
    ))
  }, [])

  // Toggle track solo
  const toggleTrackSolo = useCallback((trackId) => {
    setTracks(prev => prev.map(track =>
      track.id === trackId ? { ...track, solo: !track.solo } : track
    ))
  }, [])

  // Set track volume
  const setTrackVolume = useCallback((trackId, volume) => {
    setTracks(prev => prev.map(track =>
      track.id === trackId ? { ...track, volume } : track
    ))
  }, [])

  // Voeg bericht toe
  const addMessage = useCallback((content, sender = 'Ik', projectTimestamp = null) => {
    const newMessage = {
      id: generateId(),
      sender,
      content,
      timestamp: new Date().toISOString(),
      projectTimestamp,
      messageType: projectTimestamp !== null ? 'timestamped' : 'text'
    }

    setMessages(prev => [...prev, newMessage])
    return newMessage
  }, [])

  // Verwijder bericht
  const removeMessage = useCallback((messageId) => {
    setMessages(prev => prev.filter(m => m.id !== messageId))
  }, [])

  // Add collaborator
  const addCollaborator = useCallback((name) => {
    if (currentProject && !currentProject.collaborators.includes(name)) {
      const updated = {
        ...currentProject,
        collaborators: [...currentProject.collaborators, name],
        lastModified: new Date().toISOString()
      }
      setCurrentProject(updated)
      saveProject(updated)
    }
  }, [currentProject])

  return {
    projects,
    currentProject,
    tracks,
    messages,
    isLoading,
    createProject,
    selectProject,
    updateProjectSettings,
    updateProjectInfo,
    removeProject,
    addTrack,
    updateTrack,
    removeTrack,
    toggleTrackMute,
    toggleTrackSolo,
    setTrackVolume,
    addMessage,
    removeMessage,
    addCollaborator
  }
}
