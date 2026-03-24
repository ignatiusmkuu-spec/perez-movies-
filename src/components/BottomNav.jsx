import './BottomNav.css'

const TABS = [
  { id: 'movies',   icon: '🎬', label: 'Movies' },
  { id: 'fmovies',  icon: '🌐', label: 'FMovies' },
  { id: 'drama',    icon: '📺', label: 'Drama' },
  { id: 'anime',    icon: '⚡', label: 'Anime' },
  { id: 'rankings', icon: '🏆', label: 'Charts' },
  { id: 'football', icon: '⚽', label: 'Football', live: true },
  { id: 'sports',   icon: '📡', label: 'Live TV',  live: true },
  { id: 'radio',    icon: '📻', label: 'Radio',    live: true },
  { id: 'premium',  icon: '💎', label: 'Premiums' },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`nav-tab ${active === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="nav-icon">{tab.icon}</span>
          {tab.live && <span className="live-badge">LIVE</span>}
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
