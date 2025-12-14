import { useState, useRef, useCallback, useEffect } from 'react'
import { createAudioContext, decodeAudioBlob, getWaveformData, normalizeWaveform } from '../utils/audioUtils'

export function useAudioPlayback() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [masterVolume, setMasterVolume] = useState(0.8)

  const audioContextRef = useRef(null)
  const sourceNodesRef = useRef({})
  const gainNodesRef = useRef({})
  const masterGainRef = useRef(null)
  const buffersRef = useRef({})
  const waveformsRef = useRef({})
  const startTimeRef = useRef(0)
  const pauseTimeRef = useRef(0)
  const timerRef = useRef(null)

  // Initialize audio context
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = createAudioContext()
      masterGainRef.current = audioContextRef.current.createGain()
      masterGainRef.current.connect(audioContextRef.current.destination)
      masterGainRef.current.gain.value = masterVolume
    }
    return audioContextRef.current
  }, [masterVolume])

  // Cleanup bij unmount
  useEffect(() => {
    return () => {
      stopPlayback()
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Update master volume
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = masterVolume
    }
  }, [masterVolume])

  // Load track audio
  const loadTrack = useCallback(async (trackId, blob) => {
    try {
      const ctx = initAudioContext()

      // Resume indien gesuspend
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      const buffer = await decodeAudioBlob(ctx, blob)
      buffersRef.current[trackId] = buffer

      // Genereer waveform data
      const waveform = getWaveformData(buffer, 200)
      waveformsRef.current[trackId] = normalizeWaveform(waveform)

      // Update duration naar langste track
      if (buffer.duration > duration) {
        setDuration(buffer.duration)
      }

      // Maak gain node voor deze track
      if (!gainNodesRef.current[trackId]) {
        gainNodesRef.current[trackId] = ctx.createGain()
        gainNodesRef.current[trackId].connect(masterGainRef.current)
      }

      return {
        duration: buffer.duration,
        waveform: waveformsRef.current[trackId]
      }
    } catch (error) {
      console.error('Error loading track:', error)
      throw error
    }
  }, [duration, initAudioContext])

  // Unload track
  const unloadTrack = useCallback((trackId) => {
    if (sourceNodesRef.current[trackId]) {
      try {
        sourceNodesRef.current[trackId].stop()
      } catch (e) {}
      delete sourceNodesRef.current[trackId]
    }
    if (gainNodesRef.current[trackId]) {
      gainNodesRef.current[trackId].disconnect()
      delete gainNodesRef.current[trackId]
    }
    delete buffersRef.current[trackId]
    delete waveformsRef.current[trackId]

    // Recalculate duration
    const maxDuration = Object.values(buffersRef.current).reduce(
      (max, buf) => Math.max(max, buf.duration),
      0
    )
    setDuration(maxDuration)
  }, [])

  // Set track volume
  const setTrackVolume = useCallback((trackId, volume) => {
    if (gainNodesRef.current[trackId]) {
      gainNodesRef.current[trackId].gain.value = volume
    }
  }, [])

  // Mute/unmute track
  const setTrackMuted = useCallback((trackId, muted) => {
    if (gainNodesRef.current[trackId]) {
      gainNodesRef.current[trackId].gain.value = muted ? 0 : 1
    }
  }, [])

  // Play all tracks
  const startPlayback = useCallback(async (tracks, fromTime = 0) => {
    try {
      const ctx = initAudioContext()

      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      // Stop bestaande sources
      Object.values(sourceNodesRef.current).forEach(source => {
        try {
          source.stop()
        } catch (e) {}
      })
      sourceNodesRef.current = {}

      // Start alle tracks
      tracks.forEach(track => {
        if (!track.muted && buffersRef.current[track.id]) {
          const source = ctx.createBufferSource()
          source.buffer = buffersRef.current[track.id]

          // Maak gain node indien nodig
          if (!gainNodesRef.current[track.id]) {
            gainNodesRef.current[track.id] = ctx.createGain()
            gainNodesRef.current[track.id].connect(masterGainRef.current)
          }

          source.connect(gainNodesRef.current[track.id])
          gainNodesRef.current[track.id].gain.value = track.solo
            ? track.volume
            : (tracks.some(t => t.solo) ? 0 : track.volume)

          const offset = Math.min(fromTime, source.buffer.duration)
          source.start(0, offset)
          sourceNodesRef.current[track.id] = source

          // Handle track end
          source.onended = () => {
            delete sourceNodesRef.current[track.id]
            if (Object.keys(sourceNodesRef.current).length === 0) {
              setIsPlaying(false)
              setCurrentTime(0)
              if (timerRef.current) {
                clearInterval(timerRef.current)
              }
            }
          }
        }
      })

      setIsPlaying(true)
      startTimeRef.current = ctx.currentTime - fromTime
      pauseTimeRef.current = fromTime

      // Update current time
      timerRef.current = setInterval(() => {
        const time = ctx.currentTime - startTimeRef.current
        setCurrentTime(Math.min(time, duration))
        if (time >= duration) {
          stopPlayback()
        }
      }, 50)

    } catch (error) {
      console.error('Playback error:', error)
    }
  }, [duration, initAudioContext])

  // Stop playback
  const stopPlayback = useCallback(() => {
    Object.values(sourceNodesRef.current).forEach(source => {
      try {
        source.stop()
      } catch (e) {}
    })
    sourceNodesRef.current = {}

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    setIsPlaying(false)
    pauseTimeRef.current = currentTime
  }, [currentTime])

  // Toggle play/pause
  const togglePlayback = useCallback((tracks) => {
    if (isPlaying) {
      stopPlayback()
    } else {
      startPlayback(tracks, pauseTimeRef.current)
    }
  }, [isPlaying, startPlayback, stopPlayback])

  // Seek to position
  const seekTo = useCallback((time, tracks) => {
    pauseTimeRef.current = time
    setCurrentTime(time)
    if (isPlaying) {
      stopPlayback()
      startPlayback(tracks, time)
    }
  }, [isPlaying, startPlayback, stopPlayback])

  // Reset playback
  const resetPlayback = useCallback(() => {
    stopPlayback()
    setCurrentTime(0)
    pauseTimeRef.current = 0
  }, [stopPlayback])

  // Get waveform for track
  const getWaveform = useCallback((trackId) => {
    return waveformsRef.current[trackId] || null
  }, [])

  // Play single track for preview
  const playTrackPreview = useCallback(async (trackId, blob) => {
    try {
      const ctx = initAudioContext()

      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      // Load indien nog niet geladen
      if (!buffersRef.current[trackId]) {
        await loadTrack(trackId, blob)
      }

      // Stop eventuele preview
      if (sourceNodesRef.current['preview']) {
        try {
          sourceNodesRef.current['preview'].stop()
        } catch (e) {}
      }

      const source = ctx.createBufferSource()
      source.buffer = buffersRef.current[trackId]
      source.connect(masterGainRef.current)
      source.start()
      sourceNodesRef.current['preview'] = source

      source.onended = () => {
        delete sourceNodesRef.current['preview']
      }

      return () => {
        try {
          source.stop()
        } catch (e) {}
      }
    } catch (error) {
      console.error('Preview error:', error)
    }
  }, [initAudioContext, loadTrack])

  return {
    isPlaying,
    currentTime,
    duration,
    masterVolume,
    setMasterVolume,
    loadTrack,
    unloadTrack,
    setTrackVolume,
    setTrackMuted,
    startPlayback,
    stopPlayback,
    togglePlayback,
    seekTo,
    resetPlayback,
    getWaveform,
    playTrackPreview
  }
}
