import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react'

const RadioContext = createContext(null)

export function RadioProvider({ children }) {
  const [playing, setPlaying]           = useState(null)
  const [audioLoading, setAudioLoading] = useState(false)
  const [audioError, setAudioError]     = useState(null)
  const [volume, setVolume]             = useState(0.8)
  const [muted, setMuted]               = useState(false)
  const audioRef   = useRef(null)
  const stopRef    = useRef(null)

  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio()
      audio.preload = 'none'
      audioRef.current = audio

      audio.addEventListener('canplay', () => setAudioLoading(false))
      audio.addEventListener('playing', () => setAudioLoading(false))
      audio.addEventListener('waiting', () => setAudioLoading(true))
      audio.addEventListener('error', () => {
        setAudioError('Stream error. Try another station.')
        setAudioLoading(false)
      })
      audio.addEventListener('ended', () => setPlaying(null))
    }
  }, [])

  const clearMediaSession = useCallback(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = null
    navigator.mediaSession.playbackState = 'none'
    navigator.mediaSession.setActionHandler('play', null)
    navigator.mediaSession.setActionHandler('pause', null)
    navigator.mediaSession.setActionHandler('stop', null)
  }, [])

  const stopPlaying = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.src = ''
    }
    setPlaying(null)
    setAudioError(null)
    clearMediaSession()
  }, [clearMediaSession])

  useEffect(() => {
    stopRef.current = stopPlaying
  }, [stopPlaying])

  const updateMediaSession = useCallback((station) => {
    if (!('mediaSession' in navigator)) return

    const artwork = station.favicon
      ? [{ src: station.favicon, sizes: '96x96', type: 'image/png' }]
      : []

    navigator.mediaSession.metadata = new MediaMetadata({
      title: station.name,
      artist: station.country || 'Radio',
      album: 'Ignatius Radio',
      artwork,
    })

    navigator.mediaSession.setActionHandler('play', () => {
      audioRef.current?.play().catch(() => {})
      navigator.mediaSession.playbackState = 'playing'
    })
    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current?.pause()
      navigator.mediaSession.playbackState = 'paused'
    })
    navigator.mediaSession.setActionHandler('stop', () => {
      stopRef.current?.()
    })

    navigator.mediaSession.playbackState = 'playing'
  }, [])

  const playStation = useCallback((station) => {
    const audio = audioRef.current
    if (!audio) return

    if (playing?.stationuuid === station.stationuuid) {
      audio.pause()
      audio.src = ''
      setPlaying(null)
      setAudioError(null)
      clearMediaSession()
      return
    }

    setPlaying(station)
    setAudioLoading(true)
    setAudioError(null)

    audio.pause()
    audio.src = station.url_resolved
    audio.volume = muted ? 0 : volume
    audio.play().catch(() => {
      setAudioError('Could not connect to stream. Try another station.')
      setAudioLoading(false)
    })

    updateMediaSession(station)
  }, [playing, volume, muted, updateMediaSession, clearMediaSession])

  const toggleMute = useCallback(() => {
    setMuted(m => {
      const audio = audioRef.current
      if (audio) audio.volume = m ? volume : 0
      return !m
    })
  }, [volume])

  const handleVolume = useCallback((v) => {
    setVolume(v)
    const audio = audioRef.current
    if (audio && !muted) audio.volume = v
  }, [muted])

  const value = {
    playing,
    audioLoading,
    audioError,
    volume,
    muted,
    playStation,
    stopPlaying,
    toggleMute,
    handleVolume,
    setAudioError,
  }

  return (
    <RadioContext.Provider value={value}>
      {children}
    </RadioContext.Provider>
  )
}

export function useRadio() {
  const ctx = useContext(RadioContext)
  if (!ctx) throw new Error('useRadio must be used inside RadioProvider')
  return ctx
}
