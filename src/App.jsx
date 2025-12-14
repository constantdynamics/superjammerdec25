import { useState, useEffect, useCallback } from 'react'

// Hooks
import { useAudioRecording } from './hooks/useAudioRecording'
import { useAudioPlayback } from './hooks/useAudioPlayback'
import { useMetronome } from './hooks/useMetronome'
import { useProjectData } from './hooks/useProjectData'

// Components
import {
  RecordingControls,
  SaveTrackModal,
  AudioVisualizer,
  InputLevelMeter,
  MetronomeControl,
  MetronomeCompact
} from './components/AudioRecorder'

import {
  TrackList,
  MixingConsole
} from './components/TrackManagement'

import {
  ChatPanel,
  ChatToggleButton
} from './components/Communication'

import {
  ProjectSelector,
  ProjectSettings
} from './components/ProjectManagement'

function App() {
  // State
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [pendingRecording, setPendingRecording] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showMetronome, setShowMetronome] = useState(false)
  const [waveforms, setWaveforms] = useState({})
  const [activeTab, setActiveTab] = useState('record') // 'record' | 'tracks' | 'mix'

  // Hooks
  const recording = useAudioRecording()
  const playback = useAudioPlayback()
  const metronome = useMetronome()
  const projectData = useProjectData()

  // Load tracks into playback when tracks change
  useEffect(() => {
    const loadTracks = async () => {
      for (const track of projectData.tracks) {
        if (track.audioBlob && !waveforms[track.id]) {
          try {
            const result = await playback.loadTrack(track.id, track.audioBlob)
            if (result?.waveform) {
              setWaveforms(prev => ({ ...prev, [track.id]: result.waveform }))
            }
          } catch (error) {
            console.error('Error loading track:', error)
          }
        }
      }
    }
    loadTracks()
  }, [projectData.tracks])

  // Handle recording stop
  const handleStopRecording = useCallback(async () => {
    const result = await recording.stopRecording()
    if (result?.blob) {
      setPendingRecording(result)
      setShowSaveModal(true)
    }
  }, [recording])

  // Save track
  const handleSaveTrack = useCallback((name, instrument) => {
    if (pendingRecording) {
      projectData.addTrack(
        pendingRecording.blob,
        pendingRecording.duration,
        name,
        instrument
      )
      setPendingRecording(null)
      setShowSaveModal(false)
    }
  }, [pendingRecording, projectData])

  // Cancel save
  const handleCancelSave = useCallback(() => {
    setPendingRecording(null)
    setShowSaveModal(false)
  }, [])

  // Handle track rename
  const handleTrackRename = useCallback((trackId, newName) => {
    projectData.updateTrack(trackId, { name: newName })
  }, [projectData])

  // Handle delete track
  const handleDeleteTrack = useCallback((trackId) => {
    if (window.confirm('Weet je zeker dat je deze track wilt verwijderen?')) {
      playback.unloadTrack(trackId)
      projectData.removeTrack(trackId)
      setWaveforms(prev => {
        const newWaveforms = { ...prev }
        delete newWaveforms[trackId]
        return newWaveforms
      })
    }
  }, [playback, projectData])

  // Handle play/pause
  const handleTogglePlayback = useCallback(() => {
    playback.togglePlayback(projectData.tracks)
  }, [playback, projectData.tracks])

  // Handle seek
  const handleSeek = useCallback((time) => {
    playback.seekTo(time, projectData.tracks)
  }, [playback, projectData.tracks])

  // Handle timestamp click from chat
  const handleTimestampClick = useCallback((time) => {
    handleSeek(time)
    setShowChat(false)
  }, [handleSeek])

  // Loading state
  if (projectData.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col safe-area-top safe-area-bottom">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-700/50">
        <ProjectSelector
          projects={projectData.projects}
          currentProject={projectData.currentProject}
          onSelectProject={projectData.selectProject}
          onCreateProject={projectData.createProject}
          onDeleteProject={projectData.removeProject}
        />

        <div className="flex items-center gap-2">
          {/* Settings button */}
          <button
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Chat button */}
          <ChatToggleButton
            onClick={() => setShowChat(true)}
            unreadCount={0}
          />
        </div>
      </header>

      {/* Collaborators */}
      {projectData.currentProject?.collaborators?.length > 0 && (
        <div className="px-4 py-2 flex items-center gap-2 text-sm text-gray-400 border-b border-gray-700/30">
          <span>Met:</span>
          {projectData.currentProject.collaborators.map((collab, i) => (
            <span key={i} className="px-2 py-0.5 bg-gray-800 rounded-full text-xs">
              {collab}
            </span>
          ))}
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('record')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'record'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Opnemen
          </button>
          <button
            onClick={() => setActiveTab('tracks')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'tracks'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Tracks ({projectData.tracks.length})
          </button>
          <button
            onClick={() => setActiveTab('mix')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'mix'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Mix
          </button>
        </div>

        {/* Record tab */}
        {activeTab === 'record' && (
          <div className="space-y-4">
            {/* Audio visualizer */}
            <AudioVisualizer
              audioLevel={recording.audioLevel}
              isRecording={recording.isRecording}
            />

            {/* Input level */}
            {recording.hasPermission && (
              <InputLevelMeter level={recording.audioLevel} />
            )}

            {/* Recording controls */}
            <RecordingControls
              isRecording={recording.isRecording}
              isPaused={recording.isPaused}
              recordingTime={recording.recordingTime}
              countdown={recording.countdown}
              hasPermission={recording.hasPermission}
              onStartRecording={recording.startRecording}
              onStopRecording={handleStopRecording}
              onPauseRecording={recording.pauseRecording}
              onResumeRecording={recording.resumeRecording}
              onDiscardRecording={recording.discardRecording}
              onCancelCountdown={recording.cancelCountdown}
              onRequestPermission={recording.requestPermission}
            />

            {/* Compact metronome */}
            <div className="flex items-center justify-between">
              <MetronomeCompact
                isActive={metronome.isActive}
                bpm={metronome.bpm}
                currentBeat={metronome.currentBeat}
                beatsPerMeasure={metronome.timeSignature.beats}
                onToggle={metronome.toggle}
                onBpmChange={metronome.updateBpm}
              />
              <button
                onClick={() => setShowMetronome(!showMetronome)}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {showMetronome ? 'Verbergen' : 'Meer opties'}
              </button>
            </div>

            {/* Full metronome (expanded) */}
            {showMetronome && (
              <MetronomeControl
                isActive={metronome.isActive}
                bpm={metronome.bpm}
                timeSignature={metronome.timeSignature}
                currentBeat={metronome.currentBeat}
                volume={metronome.volume}
                onToggle={metronome.toggle}
                onBpmChange={metronome.updateBpm}
                onTimeSignatureChange={metronome.updateTimeSignature}
                onVolumeChange={metronome.setVolume}
                onTapTempo={metronome.tapTempo}
              />
            )}

            {/* Error display */}
            {recording.error && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm">
                {recording.error}
              </div>
            )}
          </div>
        )}

        {/* Tracks tab */}
        {activeTab === 'tracks' && (
          <TrackList
            tracks={projectData.tracks}
            waveforms={waveforms}
            currentTime={playback.currentTime}
            duration={playback.duration}
            isPlaying={playback.isPlaying}
            onVolumeChange={projectData.setTrackVolume}
            onMuteToggle={projectData.toggleTrackMute}
            onSoloToggle={projectData.toggleTrackSolo}
            onDelete={handleDeleteTrack}
            onRename={handleTrackRename}
            onSeek={handleSeek}
          />
        )}

        {/* Mix tab */}
        {activeTab === 'mix' && (
          <div className="space-y-4">
            <MixingConsole
              tracks={projectData.tracks}
              isPlaying={playback.isPlaying}
              currentTime={playback.currentTime}
              duration={playback.duration}
              masterVolume={playback.masterVolume}
              onPlay={handleTogglePlayback}
              onStop={playback.stopPlayback}
              onSeek={handleSeek}
              onMasterVolumeChange={playback.setMasterVolume}
            />

            {/* Quick track overview */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-400">Tracks in mix</h3>
              {projectData.tracks.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nog geen tracks. Ga naar "Opnemen" om te beginnen.
                </p>
              ) : (
                <div className="space-y-1">
                  {projectData.tracks.map(track => (
                    <div
                      key={track.id}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                        track.muted ? 'opacity-40' : ''
                      }`}
                      style={{ borderLeft: `3px solid ${track.color}` }}
                    >
                      <span className="flex-1 text-sm truncate">{track.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => projectData.toggleTrackMute(track.id)}
                          className={`w-6 h-6 rounded text-xs font-bold ${
                            track.muted ? 'bg-red-500/30 text-red-400' : 'bg-gray-700 text-gray-500'
                          }`}
                        >
                          M
                        </button>
                        <button
                          onClick={() => projectData.toggleTrackSolo(track.id)}
                          className={`w-6 h-6 rounded text-xs font-bold ${
                            track.solo ? 'bg-yellow-500/30 text-yellow-400' : 'bg-gray-700 text-gray-500'
                          }`}
                        >
                          S
                        </button>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={track.volume * 100}
                        onChange={(e) => projectData.setTrackVolume(track.id, parseInt(e.target.value) / 100)}
                        className="w-20"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Mini transport (always visible when tracks exist) */}
      {projectData.tracks.length > 0 && !recording.isRecording && activeTab !== 'mix' && (
        <div className="p-4 border-t border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={handleTogglePlayback}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                playback.isPlaying ? 'bg-purple-600' : 'bg-green-600'
              }`}
            >
              {playback.isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <div className="flex-1">
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all"
                  style={{
                    width: playback.duration > 0
                      ? `${(playback.currentTime / playback.duration) * 100}%`
                      : '0%'
                  }}
                />
              </div>
            </div>

            <span className="text-sm text-gray-400 font-mono">
              {Math.floor(playback.currentTime / 60)}:{String(Math.floor(playback.currentTime % 60)).padStart(2, '0')}
            </span>
          </div>
        </div>
      )}

      {/* Modals */}
      <SaveTrackModal
        isOpen={showSaveModal}
        onClose={handleCancelSave}
        onSave={handleSaveTrack}
        duration={pendingRecording?.duration || 0}
      />

      <ChatPanel
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        messages={projectData.messages}
        onSendMessage={projectData.addMessage}
        onTimestampClick={handleTimestampClick}
        currentTime={playback.currentTime}
      />

      <ProjectSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        project={projectData.currentProject}
        onUpdateInfo={projectData.updateProjectInfo}
        onUpdateSettings={projectData.updateProjectSettings}
        onAddCollaborator={projectData.addCollaborator}
      />
    </div>
  )
}

export default App
