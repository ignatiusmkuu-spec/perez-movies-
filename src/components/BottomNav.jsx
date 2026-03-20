import './BottomNav.css'

const TABS = [
  { id: 'movies', icon: '🎬', label: 'Movies' },
  { id: 'drama', icon: '📺', label: 'Drama' },
  { id: 'anime', icon: '⚡', label: 'Anime' },
  { id: 'sports', icon: '⚽', label: 'Live TV', live: true },
  { id: 'developer', icon: '👨‍💻', label: 'Developer' },
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
