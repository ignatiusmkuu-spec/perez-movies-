import { createContext, useContext, useState, useCallback } from 'react'

const VideoPlayerCtx = createContext(null)

export function VideoPlayerProvider({ children }) {
  const [video, setVideo] = useState(null)
  const [mode, setMode]   = useState('none')

  const playMini = useCallback((v) => {
    setVideo(v)
    setMode('mini')
  }, [])

  const playFull = useCallback((v) => {
    setVideo(v)
    setMode('full')
  }, [])

  const minimize = useCallback(() => setMode('mini'), [])
  const expand   = useCallback(() => setMode('full'), [])

  const close = useCallback(() => {
    setVideo(null)
    setMode('none')
  }, [])

  return (
    <VideoPlayerCtx.Provider value={{ video, mode, playMini, playFull, minimize, expand, close }}>
      {children}
    </VideoPlayerCtx.Provider>
  )
}

export function useVideoPlayer() {
  const ctx = useContext(VideoPlayerCtx)
  if (!ctx) throw new Error('useVideoPlayer must be inside VideoPlayerProvider')
  return ctx
}
