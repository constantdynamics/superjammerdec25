import { useState, useRef, useCallback, useEffect } from 'react'
import {
  requestMicrophoneAccess,
  stopMediaStream,
  getSupportedMimeType,
  createAudioContext,
  calculateRMS
} from '../utils/audioUtils'

export function useAudioRecording() {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [error, setError] = useState(null)
  const [countdown, setCountdown] = useState(null)
  const [hasPermission, setHasPermission] = useState(false)

  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const animationRef = useRef(null)
  const countdownRef = useRef(null)
  const startTimeRef = useRef(0)
  const pausedTimeRef = useRef(0)

  // Cleanup functie
  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    if (countdownRef.current) {
      clearTimeout(countdownRef.current)
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    stopMediaStream(streamRef.current)
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
    }
  }, [])

  // Cleanup bij unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  // Request microfoon permissie
  const requestPermission = useCallback(async () => {
    try {
      setError(null)
      const stream = await requestMicrophoneAccess()
      streamRef.current = stream
      setHasPermission(true)

      // Setup audio analyser voor level metering
      audioContextRef.current = createAudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)

      return true
    } catch (err) {
      setError(err.message)
      setHasPermission(false)
      return false
    }
  }, [])

  // Update audio level
  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current || !isRecording) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteTimeDomainData(dataArray)
    const rms = calculateRMS(dataArray)
    setAudioLevel(Math.min(rms * 3, 1)) // Scale voor betere visualisatie

    animationRef.current = requestAnimationFrame(updateAudioLevel)
  }, [isRecording])

  // Start countdown en dan opname
  const startRecording = useCallback(async (useCountdown = true) => {
    try {
      setError(null)

      // Zorg dat we permissie hebben
      if (!hasPermission || !streamRef.current) {
        const granted = await requestPermission()
        if (!granted) return null
      }

      // Resume audio context indien nodig
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume()
      }

      const doStart = () => {
        chunksRef.current = []
        const mimeType = getSupportedMimeType()

        mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
          mimeType,
          audioBitsPerSecond: 128000
        })

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data)
          }
        }

        mediaRecorderRef.current.start(100) // Chunk elke 100ms
        setIsRecording(true)
        setIsPaused(false)
        startTimeRef.current = Date.now()
        pausedTimeRef.current = 0

        // Start timer
        timerRef.current = setInterval(() => {
          if (!isPaused) {
            const elapsed = (Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000
            setRecordingTime(elapsed)
          }
        }, 100)

        // Start audio level monitoring
        updateAudioLevel()
      }

      if (useCountdown) {
        // 3-2-1 countdown
        setCountdown(3)
        countdownRef.current = setTimeout(() => {
          setCountdown(2)
          countdownRef.current = setTimeout(() => {
            setCountdown(1)
            countdownRef.current = setTimeout(() => {
              setCountdown(null)
              doStart()
            }, 1000)
          }, 1000)
        }, 1000)
      } else {
        doStart()
      }

      return true
    } catch (err) {
      setError(`Opname fout: ${err.message}`)
      return null
    }
  }, [hasPermission, requestPermission, updateAudioLevel, isPaused])

  // Cancel countdown
  const cancelCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearTimeout(countdownRef.current)
      countdownRef.current = null
    }
    setCountdown(null)
  }, [])

  // Pause opname
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      pausedTimeRef.current = Date.now()
    }
  }, [isRecording, isPaused])

  // Resume opname
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      const pauseDuration = Date.now() - pausedTimeRef.current
      pausedTimeRef.current = pauseDuration
      mediaRecorderRef.current.resume()
      setIsPaused(false)
    }
  }, [isRecording, isPaused])

  // Stop opname en return blob
  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        resolve(null)
        return
      }

      mediaRecorderRef.current.onstop = () => {
        const mimeType = getSupportedMimeType()
        const blob = new Blob(chunksRef.current, { type: mimeType })
        chunksRef.current = []

        setIsRecording(false)
        setIsPaused(false)
        setAudioLevel(0)

        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }

        const duration = recordingTime
        setRecordingTime(0)

        resolve({ blob, duration })
      }

      mediaRecorderRef.current.stop()
    })
  }, [recordingTime])

  // Discard opname
  const discardRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    chunksRef.current = []
    setIsRecording(false)
    setIsPaused(false)
    setRecordingTime(0)
    setAudioLevel(0)

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return {
    isRecording,
    isPaused,
    recordingTime,
    audioLevel,
    error,
    countdown,
    hasPermission,
    requestPermission,
    startRecording,
    cancelCountdown,
    pauseRecording,
    resumeRecording,
    stopRecording,
    discardRecording,
    cleanup
  }
}
