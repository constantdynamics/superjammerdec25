import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore'
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from 'firebase/auth'
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage'

// Firebase configuratie - VERVANG DIT MET JE EIGEN CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDEMO-KEY-REPLACE-THIS",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
}

// Initialize Firebase
let app
let db
let auth
let storage

try {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  auth = getAuth(app)
  storage = getStorage(app)
} catch (error) {
  console.warn('Firebase not configured:', error.message)
}

// Auth helpers
export async function signInUser() {
  if (!auth) return null
  try {
    const result = await signInAnonymously(auth)
    return result.user
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

export function onAuthChange(callback) {
  if (!auth) return () => {}
  return onAuthStateChanged(auth, callback)
}

export function getCurrentUser() {
  return auth?.currentUser || null
}

// Project helpers
export async function createProjectInCloud(project, userId) {
  if (!db) return null
  try {
    const projectRef = doc(db, 'projects', project.id)
    await setDoc(projectRef, {
      ...project,
      ownerId: userId,
      sharedWith: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return project.id
  } catch (error) {
    console.error('Create project error:', error)
    return null
  }
}

export async function updateProjectInCloud(projectId, updates) {
  if (!db) return false
  try {
    const projectRef = doc(db, 'projects', projectId)
    await updateDoc(projectRef, {
      ...updates,
      updatedAt: serverTimestamp()
    })
    return true
  } catch (error) {
    console.error('Update project error:', error)
    return false
  }
}

export async function deleteProjectFromCloud(projectId) {
  if (!db) return false
  try {
    await deleteDoc(doc(db, 'projects', projectId))
    return true
  } catch (error) {
    console.error('Delete project error:', error)
    return false
  }
}

export async function getProjectFromCloud(projectId) {
  if (!db) return null
  try {
    const docSnap = await getDoc(doc(db, 'projects', projectId))
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    }
    return null
  } catch (error) {
    console.error('Get project error:', error)
    return null
  }
}

export async function getUserProjects(userId) {
  if (!db) return []
  try {
    const q = query(
      collection(db, 'projects'),
      where('ownerId', '==', userId)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Get user projects error:', error)
    return []
  }
}

export async function getSharedProjects(userId) {
  if (!db) return []
  try {
    const q = query(
      collection(db, 'projects'),
      where('sharedWith', 'array-contains', userId)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Get shared projects error:', error)
    return []
  }
}

// Real-time project listener
export function subscribeToProject(projectId, callback) {
  if (!db) return () => {}
  return onSnapshot(doc(db, 'projects', projectId), (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() })
    }
  })
}

// Share project with friend via share code
export async function shareProjectWithCode(projectId) {
  if (!db) return null
  try {
    // Create a unique share code
    const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await setDoc(doc(db, 'shareCodes', shareCode), {
      projectId,
      expiresAt,
      createdAt: serverTimestamp()
    })

    return shareCode
  } catch (error) {
    console.error('Share project error:', error)
    return null
  }
}

export async function joinProjectWithCode(shareCode, userId) {
  if (!db) return null
  try {
    const codeDoc = await getDoc(doc(db, 'shareCodes', shareCode.toUpperCase()))
    if (!codeDoc.exists()) {
      throw new Error('Ongeldige code')
    }

    const { projectId, expiresAt } = codeDoc.data()
    if (new Date(expiresAt.toDate()) < new Date()) {
      throw new Error('Code is verlopen')
    }

    // Add user to shared list
    const projectRef = doc(db, 'projects', projectId)
    await updateDoc(projectRef, {
      sharedWith: arrayUnion(userId)
    })

    return projectId
  } catch (error) {
    console.error('Join project error:', error)
    throw error
  }
}

// Audio storage helpers
export async function uploadAudioToCloud(projectId, trackId, blob) {
  if (!storage) return null
  try {
    const audioRef = ref(storage, `projects/${projectId}/tracks/${trackId}.webm`)
    await uploadBytes(audioRef, blob)
    const url = await getDownloadURL(audioRef)
    return url
  } catch (error) {
    console.error('Upload audio error:', error)
    return null
  }
}

export async function deleteAudioFromCloud(projectId, trackId) {
  if (!storage) return false
  try {
    const audioRef = ref(storage, `projects/${projectId}/tracks/${trackId}.webm`)
    await deleteObject(audioRef)
    return true
  } catch (error) {
    console.error('Delete audio error:', error)
    return false
  }
}

export async function getAudioUrlFromCloud(projectId, trackId) {
  if (!storage) return null
  try {
    const audioRef = ref(storage, `projects/${projectId}/tracks/${trackId}.webm`)
    return await getDownloadURL(audioRef)
  } catch (error) {
    console.error('Get audio URL error:', error)
    return null
  }
}

// Chat/Messages helpers
export async function addMessageToProject(projectId, message) {
  if (!db) return false
  try {
    const messagesRef = collection(db, 'projects', projectId, 'messages')
    await setDoc(doc(messagesRef, message.id), {
      ...message,
      createdAt: serverTimestamp()
    })
    return true
  } catch (error) {
    console.error('Add message error:', error)
    return false
  }
}

export function subscribeToMessages(projectId, callback) {
  if (!db) return () => {}
  const messagesRef = collection(db, 'projects', projectId, 'messages')
  return onSnapshot(messagesRef, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    // Sort by timestamp
    messages.sort((a, b) => {
      const timeA = a.createdAt?.toDate?.() || new Date(a.timestamp)
      const timeB = b.createdAt?.toDate?.() || new Date(b.timestamp)
      return timeA - timeB
    })
    callback(messages)
  })
}

// Check if Firebase is configured
export function isFirebaseConfigured() {
  return !!(db && auth && storage && firebaseConfig.apiKey !== "AIzaSyDEMO-KEY-REPLACE-THIS")
}

export { db, auth, storage }
