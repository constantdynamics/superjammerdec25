import { useRef, useEffect } from 'react'

export function AudioVisualizer({ audioLevel, isRecording, waveformData }) {
  const canvasRef = useRef(null)

  // Live input level visualisatie
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    if (isRecording) {
      // Live recording visualisatie
      const barCount = 32
      const barWidth = width / barCount - 2
      const maxHeight = height * 0.8

      for (let i = 0; i < barCount; i++) {
        // Simuleer frequentie bars met variatie
        const variance = Math.random() * 0.3 + 0.7
        const barHeight = audioLevel * maxHeight * variance

        const x = i * (barWidth + 2)
        const y = (height - barHeight) / 2

        // Gradient kleur gebaseerd op niveau
        const hue = 270 - (audioLevel * 60) // Paars naar rood
        ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.8)`

        ctx.beginPath()
        ctx.roundRect(x, y, barWidth, barHeight, 2)
        ctx.fill()
      }
    } else if (waveformData && waveformData.length > 0) {
      // Statische waveform visualisatie
      const barWidth = width / waveformData.length
      const maxHeight = height * 0.8

      waveformData.forEach((value, i) => {
        const barHeight = Math.max(value * maxHeight, 2)
        const x = i * barWidth
        const y = (height - barHeight) / 2

        ctx.fillStyle = 'rgba(168, 85, 247, 0.6)'
        ctx.fillRect(x, y, barWidth - 1, barHeight)
      })
    } else {
      // Idle state - lijn in het midden
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, height / 2)
      ctx.lineTo(width, height / 2)
      ctx.stroke()
    }
  }, [audioLevel, isRecording, waveformData])

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      const ctx = canvas.getContext('2d')
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  return (
    <div className="w-full h-24 glass rounded-xl overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}

export function InputLevelMeter({ level }) {
  const percentage = Math.min(level * 100, 100)
  const isClipping = level > 0.9

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-12">Niveau</span>
      <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-75 rounded-full ${
            isClipping
              ? 'bg-red-500'
              : level > 0.7
              ? 'bg-yellow-500'
              : 'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`text-xs w-8 ${isClipping ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
        {isClipping ? 'CLIP' : `${Math.round(percentage)}%`}
      </span>
    </div>
  )
}

export function WaveformDisplay({ waveform, currentTime, duration, color = '#a855f7', onClick }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !waveform) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

    const barWidth = width / waveform.length
    const maxHeight = height * 0.8

    // Bereken playback positie
    const playPosition = duration > 0 ? (currentTime / duration) * width : 0

    waveform.forEach((value, i) => {
      const barHeight = Math.max(value * maxHeight, 2)
      const x = i * barWidth
      const y = (height - barHeight) / 2

      // Kleur op basis van playback positie
      const isPast = x < playPosition
      ctx.fillStyle = isPast ? color : `${color}44`
      ctx.fillRect(x, y, barWidth - 1, barHeight)
    })

    // Playhead lijn
    if (duration > 0) {
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(playPosition, 0)
      ctx.lineTo(playPosition, height)
      ctx.stroke()
    }
  }, [waveform, currentTime, duration, color])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      const ctx = canvas.getContext('2d')
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  const handleClick = (e) => {
    if (!onClick || !duration) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    onClick(percentage * duration)
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-12 cursor-pointer rounded"
      style={{ width: '100%', height: '48px' }}
      onClick={handleClick}
    />
  )
}
