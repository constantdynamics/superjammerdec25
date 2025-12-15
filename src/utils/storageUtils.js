const STORAGE_PREFIX = 'muziekSamen_'
const DB_NAME = 'MuziekSamenDB'
const DB_VERSION = 1
const AUDIO_STORE = 'audioTracks'

// IndexedDB instance
let db = null

/**
 * Initialize IndexedDB
 * @returns {Promise<IDBDatabase>}
 */
export async function initDB() {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('IndexedDB error:', request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = event.target.result

      // Create audio store if it doesn't exist
      if (!database.objectStoreNames.contains(AUDIO_STORE)) {
        database.createObjectStore(AUDIO_STORE, { keyPath: 'id' })
      }
    }
  })
}

/**
 * Save audio blob to IndexedDB
 * @param {string} trackId - Track ID
 * @param {Blob} blob - Audio blob
 * @returns {Promise<boolean>}
 */
export async function saveAudioBlob(trackId, blob) {
  try {
    const database = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([AUDIO_STORE], 'readwrite')
      const store = transaction.objectStore(AUDIO_STORE)

      const request = store.put({ id: trackId, blob, savedAt: Date.now() })

      request.onsuccess = () => resolve(true)
      request.onerror = () => {
        console.error('Save audio error:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('Save audio blob error:', error)
    return false
  }
}

/**
 * Load audio blob from IndexedDB
 * @param {string} trackId - Track ID
 * @returns {Promise<Blob|null>}
 */
export async function loadAudioBlob(trackId) {
  try {
    const database = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([AUDIO_STORE], 'readonly')
      const store = transaction.objectStore(AUDIO_STORE)

      const request = store.get(trackId)

      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.blob : null)
      }
      request.onerror = () => {
        console.error('Load audio error:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('Load audio blob error:', error)
    return null
  }
}

/**
 * Delete audio blob from IndexedDB
 * @param {string} trackId - Track ID
 * @returns {Promise<boolean>}
 */
export async function deleteAudioBlob(trackId) {
  try {
    const database = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([AUDIO_STORE], 'readwrite')
      const store = transaction.objectStore(AUDIO_STORE)

      const request = store.delete(trackId)

      request.onsuccess = () => resolve(true)
      request.onerror = () => {
        console.error('Delete audio error:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('Delete audio blob error:', error)
    return false
  }
}

/**
 * Delete all audio blobs for a project
 * @param {string[]} trackIds - Array of track IDs to delete
 * @returns {Promise<boolean>}
 */
export async function deleteProjectAudio(trackIds) {
  try {
    for (const trackId of trackIds) {
      await deleteAudioBlob(trackId)
    }
    return true
  } catch (error) {
    console.error('Delete project audio error:', error)
    return false
  }
}

/**
 * Sla data op in localStorage
 * @param {string} key - Storage key
 * @param {any} value - Waarde om op te slaan
 */
export function saveToStorage(key, value) {
  try {
    const serialized = JSON.stringify(value)
    localStorage.setItem(STORAGE_PREFIX + key, serialized)
    return true
  } catch (error) {
    console.error('Storage save error:', error)
    return false
  }
}

/**
 * Haal data op uit localStorage
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default waarde als key niet bestaat
 * @returns {any} Opgeslagen waarde of default
 */
export function loadFromStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error('Storage load error:', error)
    return defaultValue
  }
}

/**
 * Verwijder data uit localStorage
 * @param {string} key - Storage key
 */
export function removeFromStorage(key) {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key)
    return true
  } catch (error) {
    console.error('Storage remove error:', error)
    return false
  }
}

/**
 * Verkrijg alle project IDs uit storage
 * @returns {string[]} Array van project IDs
 */
export function getProjectIds() {
  return loadFromStorage('projectIds', [])
}

/**
 * Sla project IDs op
 * @param {string[]} ids - Array van project IDs
 */
export function saveProjectIds(ids) {
  saveToStorage('projectIds', ids)
}

/**
 * Sla een project op
 * @param {object} project - Project object
 */
export function saveProject(project) {
  saveToStorage(`project_${project.id}`, project)

  // Update project IDs lijst
  const ids = getProjectIds()
  if (!ids.includes(project.id)) {
    ids.push(project.id)
    saveProjectIds(ids)
  }
}

/**
 * Laad een project
 * @param {string} projectId - Project ID
 * @returns {object|null} Project object of null
 */
export function loadProject(projectId) {
  return loadFromStorage(`project_${projectId}`, null)
}

/**
 * Verwijder een project
 * @param {string} projectId - Project ID
 */
export function deleteProject(projectId) {
  // Get project to find track IDs
  const project = loadProject(projectId)
  if (project?.tracks) {
    // Delete all audio blobs for this project
    const trackIds = project.tracks.map(t => t.id)
    deleteProjectAudio(trackIds)
  }

  removeFromStorage(`project_${projectId}`)

  // Update project IDs lijst
  const ids = getProjectIds().filter(id => id !== projectId)
  saveProjectIds(ids)
}

/**
 * Laad alle projecten
 * @returns {object[]} Array van project objecten
 */
export function loadAllProjects() {
  const ids = getProjectIds()
  return ids.map(id => loadProject(id)).filter(Boolean)
}

/**
 * Bereken gebruikte storage grootte
 * @returns {object} Object met used en total in bytes
 */
export function getStorageUsage() {
  let used = 0
  for (let key in localStorage) {
    if (key.startsWith(STORAGE_PREFIX)) {
      used += localStorage.getItem(key).length * 2 // UTF-16
    }
  }
  return {
    used,
    total: 5 * 1024 * 1024, // ~5MB typical limit
    percentage: (used / (5 * 1024 * 1024)) * 100
  }
}

/**
 * Sla chat berichten op voor een project
 * @param {string} projectId - Project ID
 * @param {object[]} messages - Array van berichten
 */
export function saveMessages(projectId, messages) {
  saveToStorage(`messages_${projectId}`, messages)
}

/**
 * Laad chat berichten voor een project
 * @param {string} projectId - Project ID
 * @returns {object[]} Array van berichten
 */
export function loadMessages(projectId) {
  return loadFromStorage(`messages_${projectId}`, [])
}
