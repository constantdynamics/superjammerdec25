import { useState, useCallback, useEffect, useRef } from 'react'
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
import {
  isFirebaseConfigured,
  signInUser,
  onAuthChange,
  getCurrentUser,
  createProjectInCloud,
  updateProjectInCloud,
  deleteProjectFromCloud,
  getUserProjects,
  getSharedProjects,
  subscribeToProject,
  shareProjectWithCode,
  joinProjectWithCode,
  uploadAudioToCloud,
  deleteAudioFromCloud,
  addMessageToProject,
  subscribeToMessages
} from '../utils/firebase'

export function useProjectData() {
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [tracks, setTracks] = useState([])
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [isOnline, setIsOnline] = useState(isFirebaseConfigured())
  const [shareCode, setShareCode] = useState(null)
  const [syncStatus, setSyncStatus] = useState('local') // 'local' | 'syncing' | 'synced' | 'error'

  const unsubscribeProjectRef = useRef(null)
  const unsubscribeMessagesRef = useRef(null)

  // Initialize auth
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setIsOnline(false)
      loadLocalData()
      return
    }

    const unsubscribe = onAuthChange(async (authUser) => {
      if (authUser) {
        setUser(authUser)
        await loadCloudData(authUser.uid)
      } else {
        // Try to sign in anonymously
        const newUser = await signInUser()
        if (newUser) {
          setUser(newUser)
          await loadCloudData(newUser.uid)
        } else {
          loadLocalData()
        }
      }
    })

    return () => unsubscribe()
  }, [])

  // Load local data (fallback)
  const loadLocalData = useCallback(() => {
    const loadedProjects = loadAllProjects()
    setProjects(loadedProjects)

    if (loadedProjects.length > 0) {
      const lastProject = loadedProjects[loadedProjects.length - 1]
      selectProjectLocal(lastProject.id)
    } else {
      createProject('Mijn Eerste Song', 'Een nieuwe muzikale creatie')
    }

    setIsLoading(false)
  }, [])

  // Load cloud data
  const loadCloudData = useCallback(async (userId) => {
    try {
      setSyncStatus('syncing')

      // Get user's own projects and shared projects
      const [ownProjects, shared] = await Promise.all([
        getUserProjects(userId),
        getSharedProjects(userId)
      ])

      const allProjects = [...ownProjects, ...shared]

      // Also load local projects that might not be synced yet
      const localProjects = loadAllProjects()
      const localOnlyProjects = localProjects.filter(
        lp => !allProjects.find(cp => cp.id === lp.id)
      )

      // Sync local-only projects to cloud
      for (const localProject of localOnlyProjects) {
        await createProjectInCloud(localProject, userId)
        allProjects.push(localProject)
      }

      setProjects(allProjects)

      if (allProjects.length > 0) {
        await selectProject(allProjects[allProjects.length - 1].id)
      } else {
        await createProject('Mijn Eerste Song', 'Een nieuwe muzikale creatie')
      }

      setSyncStatus('synced')
    } catch (error) {
      console.error('Cloud load error:', error)
      setSyncStatus('error')
      loadLocalData()
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Select project (local only)
  const selectProjectLocal = useCallback((projectId) => {
    const project = loadProject(projectId)
    if (project) {
      setCurrentProject(project)
      setTracks(project.tracks || [])
      setMessages(loadMessages(projectId))
    }
  }, [])

  // Select project (with cloud sync)
  const selectProject = useCallback(async (projectId) => {
    // Cleanup previous subscriptions
    if (unsubscribeProjectRef.current) {
      unsubscribeProjectRef.current()
    }
    if (unsubscribeMessagesRef.current) {
      unsubscribeMessagesRef.current()
    }

    // First load from local
    const localProject = loadProject(projectId)
    if (localProject) {
      setCurrentProject(localProject)
      setTracks(localProject.tracks || [])
      setMessages(loadMessages(projectId))
    }

    // If online, subscribe to real-time updates
    if (isOnline && isFirebaseConfigured()) {
      unsubscribeProjectRef.current = subscribeToProject(projectId, (cloudProject) => {
        if (cloudProject) {
          setCurrentProject(cloudProject)
          setTracks(cloudProject.tracks || [])
          // Also save locally
          saveProject(cloudProject)
        }
      })

      unsubscribeMessagesRef.current = subscribeToMessages(projectId, (cloudMessages) => {
        setMessages(cloudMessages)
        saveMessages(projectId, cloudMessages)
      })
    }
  }, [isOnline])

  // Save project (local + cloud)
  const saveProjectData = useCallback(async (project) => {
    // Always save locally first
    saveProject(project)

    // If online, sync to cloud
    if (isOnline && user) {
      setSyncStatus('syncing')
      try {
        await updateProjectInCloud(project.id, {
          ...project,
          tracks: project.tracks?.map(t => ({
            ...t,
            audioBlob: undefined,
            audioBlobUrl: t.cloudUrl || t.audioBlobUrl
          }))
        })
        setSyncStatus('synced')
      } catch (error) {
        console.error('Cloud save error:', error)
        setSyncStatus('error')
      }
    }
  }, [isOnline, user])

  // Auto-save when tracks change
  useEffect(() => {
    if (currentProject && tracks.length >= 0) {
      const updatedProject = {
        ...currentProject,
        tracks: tracks.map(t => ({
          ...t,
          audioBlob: undefined
        })),
        lastModified: new Date().toISOString()
      }
      saveProjectData(updatedProject)
    }
  }, [tracks])

  // Auto-save messages
  useEffect(() => {
    if (currentProject) {
      saveMessages(currentProject.id, messages)

      // Sync messages to cloud
      if (isOnline && messages.length > 0) {
        const lastMessage = messages[messages.length - 1]
        if (lastMessage && !lastMessage.synced) {
          addMessageToProject(currentProject.id, lastMessage)
        }
      }
    }
  }, [messages, currentProject, isOnline])

  // Create project
  const createProject = useCallback(async (name, description = '') => {
    const newProject = {
      id: generateId(),
      name,
      description,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      collaborators: [user?.uid ? 'Ik' : 'Ik'],
      ownerId: user?.uid || 'local',
      settings: {
        tempo: 100,
        key: 'C',
        timeSignature: '4/4'
      },
      tracks: []
    }

    // Save locally
    saveProject(newProject)
    setProjects(prev => [...prev, newProject])
    setCurrentProject(newProject)
    setTracks([])
    setMessages([])

    // Sync to cloud
    if (isOnline && user) {
      await createProjectInCloud(newProject, user.uid)
    }

    return newProject
  }, [isOnline, user])

  // Update project settings
  const updateProjectSettings = useCallback(async (settings) => {
    if (currentProject) {
      const updated = {
        ...currentProject,
        settings: { ...currentProject.settings, ...settings },
        lastModified: new Date().toISOString()
      }
      setCurrentProject(updated)
      await saveProjectData(updated)
    }
  }, [currentProject, saveProjectData])

  // Update project info
  const updateProjectInfo = useCallback(async (name, description) => {
    if (currentProject) {
      const updated = {
        ...currentProject,
        name,
        description,
        lastModified: new Date().toISOString()
      }
      setCurrentProject(updated)
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
      await saveProjectData(updated)
    }
  }, [currentProject, saveProjectData])

  // Remove project
  const removeProject = useCallback(async (projectId) => {
    deleteProject(projectId)
    setProjects(prev => prev.filter(p => p.id !== projectId))

    if (isOnline) {
      await deleteProjectFromCloud(projectId)
    }

    if (currentProject?.id === projectId) {
      const remaining = projects.filter(p => p.id !== projectId)
      if (remaining.length > 0) {
        await selectProject(remaining[0].id)
      } else {
        await createProject('Nieuw Project')
      }
    }
  }, [currentProject, projects, selectProject, createProject, isOnline])

  // Add track
  const addTrack = useCallback(async (blob, duration, name, instrument = 'other', recordedBy = 'Ik') => {
    const colorIndex = tracks.length % TRACK_COLORS.length
    const trackId = generateId()

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

    // Upload audio to cloud
    if (isOnline && currentProject) {
      setSyncStatus('syncing')
      try {
        const cloudUrl = await uploadAudioToCloud(currentProject.id, trackId, blob)
        if (cloudUrl) {
          setTracks(prev => prev.map(t =>
            t.id === trackId ? { ...t, cloudUrl } : t
          ))
        }
        setSyncStatus('synced')
      } catch (error) {
        console.error('Upload error:', error)
        setSyncStatus('error')
      }
    }

    return newTrack
  }, [tracks.length, isOnline, currentProject])

  // Update track
  const updateTrack = useCallback((trackId, updates) => {
    setTracks(prev => prev.map(track =>
      track.id === trackId ? { ...track, ...updates } : track
    ))
  }, [])

  // Remove track
  const removeTrack = useCallback(async (trackId) => {
    setTracks(prev => {
      const track = prev.find(t => t.id === trackId)
      if (track?.audioBlobUrl) {
        URL.revokeObjectURL(track.audioBlobUrl)
      }
      return prev.filter(t => t.id !== trackId)
    })

    // Delete from cloud
    if (isOnline && currentProject) {
      await deleteAudioFromCloud(currentProject.id, trackId)
    }
  }, [isOnline, currentProject])

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
  const addMessage = useCallback(async (content, sender = 'Ik', projectTimestamp = null) => {
    const newMessage = {
      id: generateId(),
      sender,
      content,
      timestamp: new Date().toISOString(),
      projectTimestamp,
      messageType: projectTimestamp !== null ? 'timestamped' : 'text'
    }

    setMessages(prev => [...prev, newMessage])

    // Sync to cloud
    if (isOnline && currentProject) {
      await addMessageToProject(currentProject.id, newMessage)
    }

    return newMessage
  }, [isOnline, currentProject])

  // Remove message
  const removeMessage = useCallback((messageId) => {
    setMessages(prev => prev.filter(m => m.id !== messageId))
  }, [])

  // Add collaborator
  const addCollaborator = useCallback(async (name) => {
    if (currentProject && !currentProject.collaborators.includes(name)) {
      const updated = {
        ...currentProject,
        collaborators: [...currentProject.collaborators, name],
        lastModified: new Date().toISOString()
      }
      setCurrentProject(updated)
      await saveProjectData(updated)
    }
  }, [currentProject, saveProjectData])

  // Generate share code
  const generateShareCode = useCallback(async () => {
    if (!currentProject || !isOnline) return null

    const code = await shareProjectWithCode(currentProject.id)
    setShareCode(code)
    return code
  }, [currentProject, isOnline])

  // Join project with code
  const joinWithCode = useCallback(async (code) => {
    if (!user || !isOnline) {
      throw new Error('Je moet online zijn om een project te joinen')
    }

    const projectId = await joinProjectWithCode(code, user.uid)
    if (projectId) {
      // Reload projects
      const [ownProjects, shared] = await Promise.all([
        getUserProjects(user.uid),
        getSharedProjects(user.uid)
      ])
      setProjects([...ownProjects, ...shared])
      await selectProject(projectId)
      return true
    }
    return false
  }, [user, isOnline, selectProject])

  return {
    projects,
    currentProject,
    tracks,
    messages,
    isLoading,
    isOnline,
    user,
    shareCode,
    syncStatus,
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
    addCollaborator,
    generateShareCode,
    joinWithCode
  }
}
