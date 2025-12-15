import { useState, useCallback, useEffect } from 'react'
import {
  saveProject,
  loadProject,
  deleteProject,
  loadAllProjects,
  saveMessages,
  loadMessages,
  saveAudioBlob,
  loadAudioBlob,
  deleteAudioBlob,
  initDB
} from '../utils/storageUtils'
import { generateId } from '../utils/formatUtils'
import { TRACK_COLORS } from '../utils/audioUtils'

export function useProjectData() {
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [tracks, setTracks] = useState([])
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Initialize IndexedDB and load projects
  useEffect(() => {
    const init = async () => {
      try {
        // Initialize IndexedDB
        await initDB()

        // Load projects from localStorage
        const loadedProjects = loadAllProjects()
        setProjects(loadedProjects)

        // Select last project or create new
        if (loadedProjects.length > 0) {
          const lastProject = loadedProjects[loadedProjects.length - 1]
          await selectProject(lastProject.id)
        } else {
          createProject('Mijn Eerste Song', 'Een nieuwe muzikale creatie')
        }
      } catch (error) {
        console.error('Init error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [])

  // Save project when tracks change
  useEffect(() => {
    if (currentProject) {
      const updatedProject = {
        ...currentProject,
        tracks: tracks.map(t => ({
          ...t,
          audioBlob: undefined, // Don't save blob in localStorage
          audioBlobUrl: undefined // URL is recreated on load
        })),
        lastModified: new Date().toISOString()
      }
      saveProject(updatedProject)
    }
  }, [tracks, currentProject])

  // Save messages when they change
  useEffect(() => {
    if (currentProject) {
      saveMessages(currentProject.id, messages)
    }
  }, [messages, currentProject])

  // Create new project
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

  // Select project and load audio from IndexedDB
  const selectProject = useCallback(async (projectId) => {
    const project = loadProject(projectId)
    if (project) {
      setCurrentProject(project)
      setMessages(loadMessages(projectId))

      // Load audio blobs from IndexedDB for each track
      const tracksWithAudio = await Promise.all(
        (project.tracks || []).map(async (track) => {
          const blob = await loadAudioBlob(track.id)
          if (blob) {
            return {
              ...track,
              audioBlob: blob,
              audioBlobUrl: URL.createObjectURL(blob)
            }
          }
          return track
        })
      )

      setTracks(tracksWithAudio)
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

  // Update project name/description
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

  // Remove project
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

  // Add track with audio saved to IndexedDB
  const addTrack = useCallback(async (blob, duration, name, instrument = 'other', recordedBy = 'Ik') => {
    const colorIndex = tracks.length % TRACK_COLORS.length
    const trackId = generateId()

    // Save audio blob to IndexedDB
    await saveAudioBlob(trackId, blob)

    const newTrack = {
      id: trackId,
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

  // Remove track
  const removeTrack = useCallback(async (trackId) => {
    // Delete audio from IndexedDB
    await deleteAudioBlob(trackId)

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

  // Add message
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

  // Remove message
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
