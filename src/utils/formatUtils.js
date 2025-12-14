/**
 * Format tijd in seconden naar mm:ss formaat
 * @param {number} seconds - Tijd in seconden
 * @returns {string} Geformatteerde tijd string
 */
export function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format datum naar leesbare string
 * @param {Date|string} date - Datum object of ISO string
 * @returns {string} Geformatteerde datum string
 */
export function formatDate(date) {
  const d = new Date(date)
  return d.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format bestandsgrootte naar leesbare string
 * @param {number} bytes - Grootte in bytes
 * @returns {string} Geformatteerde grootte string
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Genereer een unieke ID
 * @returns {string} Unieke ID string
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * Debounce functie voor performance optimization
 * @param {Function} func - Functie om te debouncen
 * @param {number} wait - Wacht tijd in ms
 * @returns {Function} Gedebounced functie
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Clamp een waarde tussen min en max
 * @param {number} value - Waarde om te clampen
 * @param {number} min - Minimum waarde
 * @param {number} max - Maximum waarde
 * @returns {number} Geclamped waarde
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}
