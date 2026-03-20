import { useState, useCallback } from 'react'
import './App.css'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import MoviesSection from './components/MoviesSection'
import DramaSection from './components/DramaSection'
import AnimeSection from './components/AnimeSection'
import LiveSports from './components/LiveSports'
import DeveloperPage from './components/DeveloperPage'
import PlayerModal from './components/PlayerModal'

export default function App() {
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
        {tab === 'sports' && <LiveSports />}
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
