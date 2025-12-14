import { useState, useRef, useCallback, useEffect } from 'react'
import { createAudioContext, playMetronomeClick } from '../utils/audioUtils'

export function useMetronome() {
  const [isActive, setIsActive] = useState(false)
  const [bpm, setBpm] = useState(100)
  const [timeSignature, setTimeSignature] = useState({ beats: 4, noteValue: 4 })
  const [currentBeat, setCurrentBeat] = useState(0)
  const [volume, setVolume] = useState(0.5)

  const audioContextRef = useRef(null)
  const nextBeatTimeRef = useRef(0)
  const currentBeatRef = useRef(0)
  const timerRef = useRef(null)
  const lookahead = 25 // ms
  const scheduleAheadTime = 0.1 // seconds

  // Initialize audio context
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = createAudioContext()
    }
    return audioContextRef.current
  }, [])

  // Cleanup bij unmount
  useEffect(() => {
    return () => {
      stop()
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Schedule beat
  const scheduleBeat = useCallback((beatNumber, time) => {
    const ctx = audioContextRef.current
    if (!ctx) return

    const isAccent = beatNumber === 0 // Eerste beat van de maat

    // Maak click geluid
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = isAccent ? 1000 : 800
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(volume, time)
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05)

    oscillator.start(time)
    oscillator.stop(time + 0.05)
  }, [volume])

  // Scheduler functie
  const scheduler = useCallback(() => {
    const ctx = audioContextRef.current
    if (!ctx) return

    while (nextBeatTimeRef.current < ctx.currentTime + scheduleAheadTime) {
      scheduleBeat(currentBeatRef.current, nextBeatTimeRef.current)

      // Update huidige beat voor UI
      const beat = currentBeatRef.current
      setTimeout(() => {
        setCurrentBeat(beat)
      }, (nextBeatTimeRef.current - ctx.currentTime) * 1000)

      // Bereken volgende beat
      const secondsPerBeat = 60.0 / bpm
      nextBeatTimeRef.current += secondsPerBeat

      // Update beat counter
      currentBeatRef.current = (currentBeatRef.current + 1) % timeSignature.beats
    }
  }, [bpm, timeSignature.beats, scheduleBeat])

  // Start metronome
  const start = useCallback(async () => {
    const ctx = initAudioContext()

    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    currentBeatRef.current = 0
    nextBeatTimeRef.current = ctx.currentTime
    setCurrentBeat(0)

    timerRef.current = setInterval(scheduler, lookahead)
    setIsActive(true)
  }, [initAudioContext, scheduler])

  // Stop metronome
  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsActive(false)
    setCurrentBeat(0)
  }, [])

  // Toggle metronome
  const toggle = useCallback(() => {
    if (isActive) {
      stop()
    } else {
      start()
    }
  }, [isActive, start, stop])

  // Update BPM
  const updateBpm = useCallback((newBpm) => {
    const clampedBpm = Math.max(40, Math.min(240, newBpm))
    setBpm(clampedBpm)
  }, [])

  // Update time signature
  const updateTimeSignature = useCallback((beats, noteValue = 4) => {
    setTimeSignature({ beats, noteValue })
    currentBeatRef.current = 0
    setCurrentBeat(0)
  }, [])

  // Tap tempo
  const tapTimes = useRef([])
  const tapTempo = useCallback(() => {
    const now = Date.now()
    tapTimes.current.push(now)

    // Hou alleen de laatste 5 taps
    if (tapTimes.current.length > 5) {
      tapTimes.current.shift()
    }

    // Bereken gemiddelde interval
    if (tapTimes.current.length >= 2) {
      let totalInterval = 0
      for (let i = 1; i < tapTimes.current.length; i++) {
        totalInterval += tapTimes.current[i] - tapTimes.current[i - 1]
      }
      const avgInterval = totalInterval / (tapTimes.current.length - 1)
      const calculatedBpm = Math.round(60000 / avgInterval)

      // Reset als tap te lang geleden was
      if (now - tapTimes.current[tapTimes.current.length - 2] > 2000) {
        tapTimes.current = [now]
      } else {
        updateBpm(calculatedBpm)
      }
    }
  }, [updateBpm])

  // Count-in voor recording
  const countIn = useCallback((onComplete) => {
    return new Promise(async (resolve) => {
      const ctx = initAudioContext()

      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      let count = 0
      const secondsPerBeat = 60.0 / bpm
      const startTime = ctx.currentTime

      const doCount = () => {
        if (count < timeSignature.beats) {
          scheduleBeat(count, ctx.currentTime)
          setCurrentBeat(count)
          count++
          setTimeout(doCount, secondsPerBeat * 1000)
        } else {
          setCurrentBeat(0)
          if (onComplete) onComplete()
          resolve()
        }
      }

      doCount()
    })
  }, [bpm, timeSignature.beats, initAudioContext, scheduleBeat])

  return {
    isActive,
    bpm,
    timeSignature,
    currentBeat,
    volume,
    setVolume,
    start,
    stop,
    toggle,
    updateBpm,
    updateTimeSignature,
    tapTempo,
    countIn
  }
}
