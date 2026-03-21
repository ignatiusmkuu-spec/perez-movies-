import { useState, useCallback, useEffect } from 'react'
import './App.css'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import MoviesSection from './components/MoviesSection'
import DramaSection from './components/DramaSection'
import AnimeSection from './components/AnimeSection'
import LiveSports from './components/LiveSports'
import LiveFootball from './components/LiveFootball'
import RadioSection from './components/RadioSection'
import DeveloperPage from './components/DeveloperPage'
import PlayerModal from './components/PlayerModal'
import VideoTemplate from './VideoTemplate'

function useHash() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return hash
}

export default function App() {
  const hash = useHash()

  // ── Video route ──────────────────────────────────────────────
  if (hash === '#video') {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#000' }}>
        <button
          onClick={() => { window.location.hash = '' }}
          style={{
            position: 'fixed', top: 12, right: 14, zIndex: 9999,
            background: 'rgba(229,9,20,0.85)', border: 'none',
            color: '#fff', fontWeight: 800, fontSize: '0.75rem',
            padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
        >
          ← Back to Ignatius Stream
        </button>
        <VideoTemplate />
      </div>
    )
  }

  // ── Main streaming site ──────────────────────────────────────
  return <IgnatiusStream />
}

function IgnatiusStream() {
  const [tab, setTab] = useState('movies')
  const [searchQuery, setSearchQuery] = useState('')
  const [player, setPlayer] = useState(null)

  const handleTabChange = (newTab) => {
    setTab(newTab)
    setSearchQuery('')
  }

  const handleSearch = useCallback((q) => {
    setSearchQuery(q)
  }, [])

  const handlePlay = useCallback((item, cardType) => {
    let type
    if (cardType && cardType !== 'movie') {
      type = cardType
    } else if (tab === 'drama') {
      type = 'tv'
    } else if (tab === 'anime') {
      type = 'anime'
    } else {
      type = 'movie'
    }
    setPlayer({ item, type })
  }, [tab])

  return (
    <div className="app">
      <Header onSearch={handleSearch} activeTab={tab} />
      <div className="page-content">
        {tab === 'movies' && (
          <MoviesSection searchQuery={searchQuery} onPlay={handlePlay} />
        )}
        {tab === 'drama' && (
          <DramaSection searchQuery={searchQuery} onPlay={handlePlay} />
        )}
        {tab === 'anime' && (
          <AnimeSection searchQuery={searchQuery} onPlay={handlePlay} />
        )}
        {tab === 'football' && <LiveFootball />}
        {tab === 'sports' && <LiveSports />}
        {tab === 'radio' && <RadioSection />}
        {tab === 'developer' && <DeveloperPage />}
      </div>
      <BottomNav active={tab} onChange={handleTabChange} />
      {player && (
        <PlayerModal
          item={player.item}
          type={player.type}
          onClose={() => setPlayer(null)}
        />
      )}
    </div>
  )
}
