import { useState, useCallback } from 'react'
import './App.css'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import MoviesSection from './components/MoviesSection'
import DramaSection from './components/DramaSection'
import AnimeSection from './components/AnimeSection'
import LiveSports from './components/LiveSports'
import LiveFootball from './components/LiveFootball'
import RadioSection from './components/RadioSection'
import PremiumAccess from './components/PremiumAccess'
import RankingsSection from './components/RankingsSection'
import FmoviesSection from './components/FmoviesSection'
import PlayerModal from './components/PlayerModal'
import RadioMiniPlayer from './components/RadioMiniPlayer'
import { RadioProvider } from './context/RadioContext'

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
    <RadioProvider>
      <div className="app">
        <Header onSearch={handleSearch} activeTab={tab} />
        <div className="page-content">
          {tab === 'movies' && (
            <MoviesSection searchQuery={searchQuery} onPlay={handlePlay} />
          )}
          {tab === 'fmovies' && (
            <FmoviesSection onPlay={handlePlay} />
          )}
          {tab === 'drama' && (
            <DramaSection searchQuery={searchQuery} onPlay={handlePlay} />
          )}
          {tab === 'anime' && (
            <AnimeSection searchQuery={searchQuery} onPlay={handlePlay} />
          )}
          {tab === 'rankings' && <RankingsSection onPlay={handlePlay} />}
          {tab === 'football' && <LiveFootball />}
          {tab === 'sports' && <LiveSports />}
          {tab === 'radio' && <RadioSection />}
          {tab === 'premium' && <PremiumAccess />}
        </div>
        <RadioMiniPlayer />
        <BottomNav active={tab} onChange={handleTabChange} />
        {player && (
          <PlayerModal
            item={player.item}
            type={player.type}
            onClose={() => setPlayer(null)}
          />
        )}
      </div>
    </RadioProvider>
  )
}
