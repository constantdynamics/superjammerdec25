/**
 * Verkrijg ondersteund audio MIME type
 * @returns {string} Ondersteund MIME type
 */
export function getSupportedMimeType() {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg'
  ]

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  return 'audio/webm' // Fallback
}

/**
 * Vraag microfoon toegang aan
 * @returns {Promise<MediaStream>} Media stream
 */
export async function requestMicrophoneAccess() {
  const constraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 44100,
      channelCount: 2
    }
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    return stream
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      throw new Error('Microfoon toegang geweigerd. Sta toegang toe in je browser instellingen.')
    } else if (error.name === 'NotFoundError') {
      throw new Error('Geen microfoon gevonden. Sluit een microfoon aan en probeer opnieuw.')
    } else {
      throw new Error(`Microfoon fout: ${error.message}`)
    }
  }
}

/**
 * Stop alle tracks van een media stream
 * @param {MediaStream} stream - Media stream om te stoppen
 */
export function stopMediaStream(stream) {
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
  }
}

/**
 * Maak een AudioContext aan
 * @returns {AudioContext} AudioContext instance
 */
export function createAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  return new AudioContextClass({ sampleRate: 44100 })
}

/**
 * Decodeer audio blob naar AudioBuffer
 * @param {AudioContext} audioContext - AudioContext instance
 * @param {Blob} blob - Audio blob
 * @returns {Promise<AudioBuffer>} Gedecodeerde audio buffer
 */
export async function decodeAudioBlob(audioContext, blob) {
  const arrayBuffer = await blob.arrayBuffer()
  return await audioContext.decodeAudioData(arrayBuffer)
}

/**
 * Bereken RMS (volume level) van audio data
 * @param {Uint8Array} dataArray - Audio data array
 * @returns {number} RMS waarde 0-1
 */
export function calculateRMS(dataArray) {
  let sum = 0
  for (let i = 0; i < dataArray.length; i++) {
    const value = (dataArray[i] - 128) / 128
    sum += value * value
  }
  return Math.sqrt(sum / dataArray.length)
}

/**
 * Converteer decibels naar lineaire amplitude
 * @param {number} db - Decibel waarde
 * @returns {number} Lineaire amplitude
 */
export function dbToLinear(db) {
  return Math.pow(10, db / 20)
}

/**
 * Converteer lineaire amplitude naar decibels
 * @param {number} linear - Lineaire amplitude
 * @returns {number} Decibel waarde
 */
export function linearToDb(linear) {
  if (linear <= 0) return -Infinity
  return 20 * Math.log10(linear)
}

/**
 * Genereer click geluid voor metronome
 * @param {AudioContext} audioContext - AudioContext instance
 * @param {boolean} accent - Of het een accent beat is
 * @param {number} volume - Volume 0-1
 */
export function playMetronomeClick(audioContext, accent = false, volume = 0.5) {
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.frequency.value = accent ? 1000 : 800
  oscillator.type = 'sine'

  const now = audioContext.currentTime
  gainNode.gain.setValueAtTime(volume, now)
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

  oscillator.start(now)
  oscillator.stop(now + 0.05)
}

/**
 * Bereken waveform data van audio buffer
 * @param {AudioBuffer} audioBuffer - Audio buffer
 * @param {number} samples - Aantal samples voor waveform
 * @returns {Float32Array} Waveform data
 */
export function getWaveformData(audioBuffer, samples = 200) {
  const channelData = audioBuffer.getChannelData(0)
  const blockSize = Math.floor(channelData.length / samples)
  const waveform = new Float32Array(samples)

  for (let i = 0; i < samples; i++) {
    const start = blockSize * i
    let sum = 0
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channelData[start + j])
    }
    waveform[i] = sum / blockSize
  }

  return waveform
}

/**
 * Normaliseer waveform data
 * @param {Float32Array} waveform - Waveform data
 * @returns {Float32Array} Genormaliseerde waveform
 */
export function normalizeWaveform(waveform) {
  const max = Math.max(...waveform)
  if (max === 0) return waveform
  return waveform.map(v => v / max)
}

/**
 * Track kleuren voor visuele organisatie
 */
export const TRACK_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
]

/**
 * Instrument types voor categorisatie
 */
export const INSTRUMENT_TYPES = [
  { id: 'vocal', name: 'Zang', icon: '🎤' },
  { id: 'guitar', name: 'Gitaar', icon: '🎸' },
  { id: 'piano', name: 'Piano', icon: '🎹' },
  { id: 'bass', name: 'Bas', icon: '🎸' },
  { id: 'drums', name: 'Drums', icon: '🥁' },
  { id: 'violin', name: 'Viool', icon: '🎻' },
  { id: 'flute', name: 'Fluit', icon: '🎵' },
  { id: 'accordion', name: 'Accordeon', icon: '🪗' },
  { id: 'other', name: 'Anders', icon: '🎶' },
]

/**
 * Tempo presets
 */
export const TEMPO_PRESETS = [
  { name: 'Langzaam', bpm: 70 },
  { name: 'Matig', bpm: 90 },
  { name: 'Medium', bpm: 110 },
  { name: 'Snel', bpm: 130 },
  { name: 'Zeer snel', bpm: 150 },
]

/**
 * Maatsoorten
 */
export const TIME_SIGNATURES = [
  { name: '4/4', beats: 4, noteValue: 4 },
  { name: '3/4', beats: 3, noteValue: 4 },
  { name: '6/8', beats: 6, noteValue: 8 },
  { name: '2/4', beats: 2, noteValue: 4 },
  { name: '5/4', beats: 5, noteValue: 4 },
  { name: '7/8', beats: 7, noteValue: 8 },
]
