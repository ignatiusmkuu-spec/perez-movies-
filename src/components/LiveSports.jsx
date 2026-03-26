import { useState, useEffect, useRef } from 'react'
import Logo from './Logo'
import './LiveSports.css'

// Featured inline streams — play directly inside the site
const IGNATIUS_STREAMS = [
  {
    id: 'ign-stream-1',
    name: 'Ignatius Stream 1',
    sub: 'Live Football • Powered by CricFy',
    icon: '📡',
    color: '#10b981',
    embedUrl: 'https://cricfy.tv/football-streams',
    extUrl: 'https://cricfy.tv/football-streams',
  },
  {
    id: 'ign-stream-2',
    name: 'Ignatius Stream 2',
    sub: 'Sports & Entertainment • Powered by ShowMax',
    icon: '🎬',
    color: '#1d4ed8',
    embedUrl: '/proxy/showmax',
    extUrl: 'https://showmax.com',
  },
]

const LIVE_STREAM_SITES = [
  { name: 'SportSurge',   icon: '⚡', url: 'https://sportsurge.net/#Soccer',          color: '#f97316' },
  { name: 'StreamEast',   icon: '🔴', url: 'https://streameast.to/soccer',             color: '#ef4444' },
  { name: 'VIPBox',       icon: '📺', url: 'https://vipboxtv.se/soccer/',              color: '#8b5cf6' },
  { name: 'Footybite',    icon: '⚽', url: 'https://www.footybite.do',                 color: '#22c55e' },
  { name: 'LiveSoccerTV', icon: '🎯', url: 'https://www.livesoccertv.com',             color: '#3b82f6' },
  { name: 'DaddyLive',    icon: '🏆', url: 'https://daddylive.mp/schedule/soccer.php', color: '#f59e0b' },
  { name: 'SportsBay',    icon: '🌐', url: 'https://www.sportsbay.org/soccer',         color: '#06b6d4' },
  { name: 'CrackStreams', icon: '🔥', url: 'https://crackstreams.io',                  color: '#ec4899' },
]

const COMP_FILTERS = [
  'All', 'Champions League', 'Europa League', 'Premier League',
  'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'World Cup',
]

const TV_CAT_FILTERS = ['All', 'Kenya', 'Nigeria', 'South Africa', 'Ghana', 'International', 'News', 'Sports', 'StarTimes']

const TV_CHANNELS = [
  // Kenya
  { id: 'ntv-ke',     name: 'NTV Kenya',        abbr: 'NTV',   country: 'Kenya',    flag: '🇰🇪', cat: ['Kenya','StarTimes'], ytId: 'UCp9mEKDpxH7lQIMYbcPqnXQ', color: '#003f7f', pkg: 'StarTimes Nova' },
  { id: 'ctv-ke',     name: 'Citizen TV',        abbr: 'CTV',   country: 'Kenya',    flag: '🇰🇪', cat: ['Kenya','StarTimes'], ytId: 'UCQpAQA96xZlrEHfKm2Ai2Lg', color: '#c00',    pkg: 'StarTimes Nova' },
  { id: 'kbc-ke',     name: 'KBC Kenya',         abbr: 'KBC',   country: 'Kenya',    flag: '🇰🇪', cat: ['Kenya','StarTimes'], ytId: 'UCq8jIY7wFInfEyVi0Qy48PQ', color: '#006400', pkg: 'StarTimes Nova' },
  { id: 'ktn-ke',     name: 'KTN News',          abbr: 'KTN',   country: 'Kenya',    flag: '🇰🇪', cat: ['Kenya','News'],      ytId: 'UCrUYMBo8-C6LMvJwBJqp3XA', color: '#1a2d59', pkg: '' },
  { id: 'k24-ke',     name: 'K24 TV',            abbr: 'K24',   country: 'Kenya',    flag: '🇰🇪', cat: ['Kenya','News'],      ytId: 'UCbkVMOKzfJbz1kHDd6iyL8A', color: '#d4a017', pkg: '' },
  { id: 'ebru-ke',    name: 'Ebru TV Kenya',     abbr: 'EBRU',  country: 'Kenya',    flag: '🇰🇪', cat: ['Kenya'],            ytId: 'UCddiUEpeqJcYeBxX1IVBKvQ', color: '#e91e63', pkg: '' },
  { id: 'inooro-ke',  name: 'Inooro TV',         abbr: 'INOORO',country: 'Kenya',    flag: '🇰🇪', cat: ['Kenya','StarTimes'], ytId: 'UC9FzEE3YAXU7XCTN1TP_AOQ', color: '#8d4b00', pkg: 'StarTimes Nova' },
  { id: 'ramogi-ke',  name: 'Ramogi TV',         abbr: 'RAMOGI',country: 'Kenya',    flag: '🇰🇪', cat: ['Kenya','StarTimes'], ytId: 'UCqkjpL2cXh4OqAlBNBxvczQ', color: '#2e7d32', pkg: 'StarTimes Nova' },
  { id: 'hot96-ke',   name: 'Hot 96 FM TV',      abbr: 'HOT96', country: 'Kenya',    flag: '🇰🇪', cat: ['Kenya'],            ytId: 'UCfwWBtKLsYWt-eCHBTIgFMQ', color: '#ff5722', pkg: '' },
  { id: 'shifu-ke',   name: 'Shifu TV',          abbr: 'SHIFU', country: 'Kenya',    flag: '🇰🇪', cat: ['Kenya'],            ytId: 'UCGToqevJvEbpFjXJZGXE-NA', color: '#7b1fa2', pkg: '' },
  { id: 'swahili-ke', name: 'Swahili TV',        abbr: 'SWH',   country: 'Kenya',    flag: '🇰🇪', cat: ['Kenya'],            ytId: 'UChBQgieUidXV1CmDxSdRm3g', color: '#00838f', pkg: '' },
  { id: 'rembo-ke',   name: 'Rembo TV',          abbr: 'REMBO', country: 'Kenya',    flag: '🇰🇪', cat: ['Kenya'],            ytId: 'UC660YaiakYmU1AfOW3sabvQ', color: '#ad1457', pkg: '' },
  { id: 'kids-ke',    name: 'Kids TV Kenya',     abbr: 'KIDS',  country: 'Kenya',    flag: '🇰🇪', cat: ['Kenya'],            ytId: 'UCHBIm_ITwYy_FG9iIfIZxGQ', color: '#f9a825', pkg: '' },
  { id: 'kungfu-ke',  name: 'Kungfu TV',         abbr: 'KUNG',  country: 'Kenya',    flag: '🇰🇪', cat: ['Kenya'],            ytId: 'UCw1QvdRwo7G-VskoLd5xaLg', color: '#c62828', pkg: '' },
  { id: 'triplep-ke', name: 'Triple P TV',       abbr: '3P',    country: 'Kenya',    flag: '🇰🇪', cat: ['Kenya'],            ytId: 'UCCtBJ9MP1PE_A1Qz4AUi46Q', color: '#1565c0', pkg: '' },
  // Nigeria
  { id: 'ch-ng',      name: 'Channels TV',       abbr: 'CHS',   country: 'Nigeria',  flag: '🇳🇬', cat: ['Nigeria','News','StarTimes'], ytId: 'UCBkeCHBPrTNBL1R4TBRRzfA', color: '#006633', pkg: 'StarTimes Smart' },
  { id: 'arise-ng',   name: 'Arise News',        abbr: 'ARISE', country: 'Nigeria',  flag: '🇳🇬', cat: ['Nigeria','News'],   ytId: 'UCzH2kgVBSuuvkqzFwYmpHMw', color: '#b71c1c', pkg: '' },
  { id: 'tvc-ng',     name: 'TVC Nigeria',       abbr: 'TVC',   country: 'Nigeria',  flag: '🇳🇬', cat: ['Nigeria','News'],   ytId: 'UCqE1VXIaZEFoakZ4DFIcKkQ', color: '#1565c0', pkg: '' },
  { id: 'nta-ng',     name: 'NTA Network',       abbr: 'NTA',   country: 'Nigeria',  flag: '🇳🇬', cat: ['Nigeria'],          ytId: 'UCNJm3R3wkn2xJk4OFxrfEkA', color: '#006400', pkg: '' },
  { id: 'wazobia-ng', name: 'Wazobia TV',        abbr: 'WAZ',   country: 'Nigeria',  flag: '🇳🇬', cat: ['Nigeria'],          ytId: 'UCHkEBiW1FYv4pXhQEq8H7TQ', color: '#e65100', pkg: '' },
  // South Africa
  { id: 'sabc-za',    name: 'SABC News',         abbr: 'SABC',  country: 'South Africa', flag: '🇿🇦', cat: ['South Africa','News'], ytId: 'UCGE-PNUK-iU6MF6jPUJMmZA', color: '#1b5e20', pkg: '' },
  { id: 'enca-za',    name: 'eNCA',              abbr: 'eNCA',  country: 'South Africa', flag: '🇿🇦', cat: ['South Africa','News'], ytId: 'UCGpMRQH1t4Fwpf30cMl_R8Q', color: '#1a237e', pkg: '' },
  { id: 'nrz-za',     name: 'Newzroom Afrika',   abbr: 'NRZ',   country: 'South Africa', flag: '🇿🇦', cat: ['South Africa','News'], ytId: 'UCGJrn1wPqeJd3cJLGgPPvKg', color: '#37474f', pkg: '' },
  { id: '3talk-za',   name: '3Talk SA',          abbr: '3TALK', country: 'South Africa', flag: '🇿🇦', cat: ['South Africa'],   ytId: 'UCd7qiSGOmRm9jH3kW5YU-EA', color: '#880e4f', pkg: '' },
  // Ghana
  { id: 'joy-gh',     name: 'JoyNews Ghana',     abbr: 'JOY',   country: 'Ghana',    flag: '🇬🇭', cat: ['Ghana','News'],     ytId: 'UCGbbWrSk1UcBmAIhFPWnzrA', color: '#e65100', pkg: '' },
  { id: 'tv3-gh',     name: 'TV3 Ghana',         abbr: 'TV3',   country: 'Ghana',    flag: '🇬🇭', cat: ['Ghana'],            ytId: 'UCbPOWZ0fqn1e4bHkE7GYt4Q', color: '#c62828', pkg: '' },
  { id: 'gtv-gh',     name: 'GTV Ghana',         abbr: 'GTV',   country: 'Ghana',    flag: '🇬🇭', cat: ['Ghana'],            ytId: 'UC1k3BN79kE_6DmWnMM7HyLQ', color: '#1b5e20', pkg: '' },
  // International News
  { id: 'alj-int',    name: 'Al Jazeera English',abbr: 'AJE',   country: 'Int\'l',   flag: '🌍', cat: ['International','News','StarTimes'], ytId: 'UCNye-wNBqNL5ZzHSJj3l8Bg', color: '#00573f', pkg: 'StarTimes Smart' },
  { id: 'dw-int',     name: 'DW News',           abbr: 'DW',    country: 'Int\'l',   flag: '🌍', cat: ['International','News'], ytId: 'UCknLrEdhRCp1aegoMqRaCZg', color: '#1565c0', pkg: '' },
  { id: 'f24-int',    name: 'France 24 English', abbr: 'F24',   country: 'Int\'l',   flag: '🌍', cat: ['International','News'], ytId: 'UCQfwfsi5VrQ8yKZ-UWmAoBg', color: '#1a2d5e', pkg: '' },
  { id: 'bbc-int',    name: 'BBC News',          abbr: 'BBC',   country: 'Int\'l',   flag: '🌍', cat: ['International','News','StarTimes'], ytId: 'UC16niRr50-MSBwiO3He1MXQ', color: '#bb1919', pkg: 'StarTimes Classic' },
  { id: 'cnn-int',    name: 'CNN International', abbr: 'CNN',   country: 'Int\'l',   flag: '🌍', cat: ['International','News','StarTimes'], ytId: 'UCupvZG-5ko_eiXAupbDfxWw', color: '#cc0000', pkg: 'StarTimes Classic' },
  { id: 'trt-int',    name: 'TRT World',         abbr: 'TRT',   country: 'Int\'l',   flag: '🌍', cat: ['International','News'], ytId: 'UC7fWeaHhqgM4Ry-RMpM2YYw', color: '#c62828', pkg: '' },
  { id: 'sky-int',    name: 'Sky News',          abbr: 'SKY',   country: 'Int\'l',   flag: '🌍', cat: ['International','News'], ytId: 'UCoMdktPbSTixAyNGwb-UYkQ', color: '#004b87', pkg: '' },
  { id: 'nhk-int',    name: 'NHK World',         abbr: 'NHK',   country: 'Int\'l',   flag: '🌍', cat: ['International','News'], ytId: 'UCmDMuFRFHFEBtKaW1n4yCcA', color: '#6d1414', pkg: '' },
  { id: 'africa-int', name: 'Africa News',       abbr: 'AFR',   country: 'Africa',   flag: '🌍', cat: ['International','News'], ytId: 'UCE4dRwPIL7eXEtMqvgB0J1A', color: '#1b5e20', pkg: '' },
  { id: 'cgtn-int',   name: 'CGTN Africa',       abbr: 'CGTN',  country: 'Int\'l',   flag: '🌍', cat: ['International','News'], ytId: 'UC-JHMexnCJrAK5eYNFQ3pXw', color: '#c62828', pkg: '' },
  { id: 'rt-int',     name: 'RT News',           abbr: 'RT',    country: 'Int\'l',   flag: '🌍', cat: ['International','News'], ytId: 'UCpwvZwUam-URkxB7g4USKpg', color: '#ba0000', pkg: '' },
  { id: 'euro-int',   name: 'Euronews English',  abbr: 'EURO',  country: 'Int\'l',   flag: '🌍', cat: ['International','News'], ytId: 'UCSb5E4yRBR4KFz6QQhYNGnw', color: '#0055a4', pkg: '' },
  // Music
  { id: 'trace-muz',  name: 'Trace Muziki',      abbr: 'TRMUZ', country: 'Africa',   flag: '🌍', cat: ['International'],    ytId: 'UCQbbxLP4yfIIy9exVtdipUQ', color: '#00bcd4', pkg: '' },
  // Sports
  { id: 'ss-sport',   name: 'SuperSport',        abbr: 'SPSRT', country: 'Sports',   flag: '⚽', cat: ['Sports','StarTimes'], ytId: 'UCTVPTzKI7sEX7AhJeGfNkTQ', color: '#1a1a5e', pkg: 'StarTimes Super' },
  { id: 'espn-sport', name: 'ESPN FC',           abbr: 'ESPN',  country: 'Sports',   flag: '🏆', cat: ['Sports'],             ytId: 'UCiWLfSweyRNmLpgEHekhoAg', color: '#cc0000', pkg: '' },
  { id: 'sky-sport',  name: 'Sky Sports',        abbr: 'SSKY',  country: 'Sports',   flag: '🏆', cat: ['Sports'],             ytId: 'UCNAf1k0yIjyGu3k9BwAg3lg', color: '#00b2ff', pkg: '' },
  { id: 'bt-sport',   name: 'BT Sport / TNT',    abbr: 'BT',    country: 'Sports',   flag: '🏆', cat: ['Sports'],             ytId: 'UCTJQVOymhCBEH1gxcx3mL6g', color: '#ff6600', pkg: '' },
  { id: 'bein-sport',  name: 'beIN Sports',      abbr: 'BEIN',  country: 'Sports',   flag: '⚽', cat: ['Sports','StarTimes'], ytId: 'UCkh0RFG8nAVFnbdRExo0LuQ', color: '#004b87', pkg: 'StarTimes Super' },
  { id: 'dazn-sport',  name: 'DAZN',            abbr: 'DAZN',  country: 'Sports',   flag: '⚽', cat: ['Sports'],             ytId: 'UC8q7PymvHJ5n6IIhMrJK4bA', color: '#ff0000', pkg: '' },
  { id: 'euro-sport',  name: 'Eurosport',        abbr: 'EUR',   country: 'Sports',   flag: '⚽', cat: ['Sports'],             ytId: 'UCnkPYp_-vW_0JlcZb3ZFY7Q', color: '#ff6600', pkg: '' },
]

const STARTIMES_PACKAGES = [
  {
    name: 'Nova',
    price: 'KES 150/month',
    color: '#2e7d32',
    channels: ['KBC', 'NTV Kenya', 'Citizen TV', 'Inooro TV', 'Ramogi TV', 'K24 TV', 'Hot TV', 'QTV', 'Ebru TV', 'KTN Home', 'KTN News', 'Kameme TV', 'Baraka TV', 'Switch TV']
  },
  {
    name: 'Smart',
    price: 'KES 300/month',
    color: '#1565c0',
    channels: ['All Nova +', 'Al Jazeera', 'Channels TV', 'Telemundo', 'Africa Magic Family', 'Zuku One', 'Star Life', 'Discovery', 'Fashion TV']
  },
  {
    name: 'Classic',
    price: 'KES 700/month',
    color: '#6a1b9a',
    channels: ['All Smart +', 'CNN', 'BBC World', 'StarTimes Sport 1 & 2', 'MTV Base', 'National Geographic', 'Animal Planet', 'Fox News', 'TRACE Urban']
  },
  {
    name: 'Super',
    price: 'KES 1,500/month',
    color: '#b71c1c',
    channels: ['All Classic +', 'SuperSport 1-8', 'beIN Sports 1-3', 'Premier League', 'LaLiga TV', 'NBA TV', 'StarTimes Sport 3 & 4', 'Fox Sports']
  },
]

function extractEmbed(embedHtml) {
  if (!embedHtml) return null
  const m = embedHtml.match(/src='([^']+)'/) || embedHtml.match(/src="([^"]+)"/)
  return m ? m[1] : null
}

function teamNames(title) {
  const parts = title.split(' - ')
  return { home: parts[0] || title, away: parts[1] || '' }
}

function MatchCard({ match, onClick, active }) {
  const { home, away } = teamNames(match.title)
  const embedUrl = match.videos?.[0] ? extractEmbed(match.videos[0].embed) : null
  const thumbnail = match.thumbnail
  const compName = typeof match.competition === 'string'
    ? match.competition
    : match.competition?.name || ''

  return (
    <div className={`match-card ${active ? 'match-active' : ''}`} onClick={onClick}>
      <div
        className="match-thumb"
        style={thumbnail ? { backgroundImage: `url(${thumbnail})` } : {}}
      >
        {!thumbnail && (
          <div className="match-no-thumb">
            <span>⚽</span>
          </div>
        )}
        <div className="match-overlay">
          <div className="match-play-circle">▶</div>
        </div>
        <span className="match-badge">{compName.split(':')[0]?.trim() || 'Football'}</span>
      </div>
      <div className="match-info">
        <div className="match-teams-row">
          <span className="match-team">{home}</span>
          <span className="match-vs">vs</span>
          <span className="match-team">{away}</span>
        </div>
        <div className="match-comp-name">{compName}</div>
        {match.videos?.length > 1 && (
          <div className="match-video-count">{match.videos.length} angles</div>
        )}
      </div>
    </div>
  )
}

function ChannelCard({ ch, active, onClick }) {
  const isStarTimes = ch.cat.includes('StarTimes')
  return (
    <div
      className={`tv-channel-card ${active ? 'tv-ch-active' : ''}`}
      style={{ '--ch-accent': ch.color }}
      onClick={onClick}
    >
      <div className="tv-ch-logo" style={{ background: ch.color }}>
        <span className="tv-ch-abbr">{ch.abbr}</span>
      </div>
      <div className="tv-ch-body">
        <div className="tv-ch-name">{ch.name}</div>
        <div className="tv-ch-meta">
          <span className="tv-ch-flag">{ch.flag}</span>
          <span className="tv-ch-country">{ch.country}</span>
        </div>
        {isStarTimes && ch.pkg && (
          <div className="tv-ch-st-badge">📡 {ch.pkg}</div>
        )}
      </div>
      <div className="tv-ch-live-dot">
        <span className="tv-live-pulse" />
        LIVE
      </div>
    </div>
  )
}

const YT_CATS = [
  { id: 'trending', label: '🔥 Trending' },
  { id: 'music',    label: '🎵 Music' },
  { id: 'gaming',   label: '🎮 Gaming' },
  { id: 'sports',   label: '⚽ Sports' },
  { id: 'news',     label: '📰 News' },
  { id: 'movies',   label: '🎬 Movies' },
]

function fmtDuration(d) {
  if (!d) return ''
  return d
}

function YtVideoCard({ v, active, onClick }) {
  return (
    <div className={`yt-card ${active ? 'yt-card-active' : ''}`} onClick={onClick}>
      <div className="yt-thumb-wrap">
        <img src={v.thumb} alt={v.title} className="yt-thumb" loading="lazy" />
        {v.duration && <span className="yt-duration">{fmtDuration(v.duration)}</span>}
        {v.isLive && <span className="yt-live-badge">● LIVE</span>}
        <div className="yt-play-overlay"><div className="yt-play-btn">▶</div></div>
      </div>
      <div className="yt-card-body">
        <div className="yt-card-title">{v.title}</div>
        <div className="yt-card-meta">
          <span className="yt-channel">{v.channel}</span>
          {v.views && <span className="yt-views">{v.views}</span>}
          {v.published && <span className="yt-pub">{v.published}</span>}
        </div>
      </div>
    </div>
  )
}

export default function LiveSports() {
  const [tab, setTab]               = useState('highlights')
  const [matches, setMatches]       = useState([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [filter, setFilter]         = useState('All')
  const [activeMatch, setActiveMatch] = useState(null)
  const [activeVideo, setActiveVideo] = useState(null)
  const [playerLoading, setPlayerLoading] = useState(false)
  const playerRef = useRef(null)

  // Ignatius inline stream player state
  const [activeIgnStream, setActiveIgnStream] = useState(null)
  const [ignStreamLoading, setIgnStreamLoading] = useState(false)
  const ignStreamRef = useRef(null)

  // TV Channels state
  const [tvCat, setTvCat]             = useState('All')
  const [activeChannel, setActiveChannel] = useState(null)
  const [tvPlayerLoading, setTvPlayerLoading] = useState(false)
  const [tvLiveVideoId, setTvLiveVideoId] = useState(null)
  const [tvOffline, setTvOffline] = useState(false)
  const tvPlayerRef = useRef(null)

  // YouTube state
  const [ytVideos, setYtVideos]           = useState([])
  const [ytLoading, setYtLoading]         = useState(false)
  const [ytError, setYtError]             = useState(null)
  const [ytCat, setYtCat]                 = useState('trending')
  const [ytSearchInput, setYtSearchInput] = useState('')
  const [ytSearchQuery, setYtSearchQuery] = useState('')
  const [ytActiveVideo, setYtActiveVideo] = useState(null)
  const [ytPlayerLoading, setYtPlayerLoading] = useState(false)
  const [ytVideoBlocked, setYtVideoBlocked] = useState(false)
  const ytPlayerRef = useRef(null)
  const ytSearchRef = useRef(null)

  // Live Matches state (xcasper live feed)
  const [liveMatches, setLiveMatches]         = useState([])
  const [liveMatchLoading, setLiveMatchLoading] = useState(false)
  const [liveMatchError, setLiveMatchError]   = useState(null)
  const [activeMatch2, setActiveMatch2]       = useState(null)
  const liveMatchPlayerRef                    = useRef(null)

  useEffect(() => {
    if (tab !== 'highlights') return
    setLoading(true)
    setError(null)
    fetch('/proxy/scorebat/')
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data
          : data.response ? data.response
          : []
        setMatches(arr.filter(m => m.videos?.length > 0))
        setLoading(false)
      })
      .catch(() => {
        setError('Could not load match data.')
        setLoading(false)
      })
  }, [tab])

  const filtered = filter === 'All'
    ? matches
    : matches.filter(m => {
        const c = typeof m.competition === 'string' ? m.competition : m.competition?.name || ''
        return c.toLowerCase().includes(filter.toLowerCase())
      })

  const filteredChannels = tvCat === 'All'
    ? TV_CHANNELS
    : TV_CHANNELS.filter(ch => ch.cat.includes(tvCat))

  const handleMatchClick = (match) => {
    const firstEmbed = extractEmbed(match.videos?.[0]?.embed)
    setActiveMatch(match)
    setActiveVideo(firstEmbed)
    setPlayerLoading(true)
    setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

  const handleChannelClick = async (ch) => {
    if (activeChannel?.id === ch.id) {
      setActiveChannel(null)
      setTvLiveVideoId(null)
      setTvOffline(false)
      return
    }
    setActiveChannel(ch)
    setTvLiveVideoId(null)
    setTvOffline(false)
    setTvPlayerLoading(true)
    setTimeout(() => tvPlayerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    try {
      const res = await fetch(`/api/yt-live?channel=${ch.ytId}`)
      const data = await res.json()
      if (data.live && data.videoId) {
        setTvLiveVideoId(data.videoId)
        setTvOffline(false)
      } else {
        setTvLiveVideoId(null)
        setTvOffline(true)
      }
    } catch {
      setTvLiveVideoId(null)
      setTvOffline(true)
    }
    setTvPlayerLoading(false)
  }

  // Live Matches: fetch from xcasper live-feed
  useEffect(() => {
    if (tab !== 'livematches') return
    setLiveMatchLoading(true)
    setLiveMatchError(null)
    fetch('/api/live-feed')
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : data.data || []
        setLiveMatches(arr)
        setLiveMatchLoading(false)
      })
      .catch(() => {
        setLiveMatchError('Could not load live matches.')
        setLiveMatchLoading(false)
      })
  }, [tab])

  const handleLiveMatchClick = (match) => {
    if (activeMatch2?.id === match.id) { setActiveMatch2(null); return }
    setActiveMatch2(match)
    setTimeout(() => liveMatchPlayerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

  // YouTube: detect embedding errors via postMessage (error 101/150 = not embeddable)
  useEffect(() => {
    const handleYtMessage = (event) => {
      if (!event.origin.includes('youtube.com')) return
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        if (data?.event === 'infoDelivery' && data?.info?.playerState === 5) return
        if (data?.event === 'onError' && (data?.info === 101 || data?.info === 150)) {
          setYtVideoBlocked(true)
          setYtPlayerLoading(false)
        }
      } catch (_) {}
    }
    window.addEventListener('message', handleYtMessage)
    return () => window.removeEventListener('message', handleYtMessage)
  }, [])

  // YouTube: fetch trending or search results
  useEffect(() => {
    if (tab !== 'youtube') return
    if (ytSearchQuery.trim()) {
      setYtLoading(true); setYtError(null)
      fetch(`/api/youtube/search?q=${encodeURIComponent(ytSearchQuery)}`)
        .then(r => r.json())
        .then(d => {
          const videos = d.videos || []
          setYtVideos(videos)
          if (videos.length === 0) setYtError('No results found. Try a different search.')
          setYtLoading(false)
        })
        .catch(() => { setYtError('Search failed. Please try again.'); setYtLoading(false) })
    } else {
      setYtLoading(true); setYtError(null)
      fetch(`/api/youtube/trending?category=${ytCat}`)
        .then(r => r.json())
        .then(d => {
          const videos = d.videos || []
          setYtVideos(videos)
          if (videos.length === 0) setYtError('Could not load videos. Please retry.')
          setYtLoading(false)
        })
        .catch(() => { setYtError('Could not load YouTube content. Please retry.'); setYtLoading(false) })
    }
  }, [tab, ytCat, ytSearchQuery])

  const handleYtSearch = (e) => {
    e.preventDefault()
    setYtSearchQuery(ytSearchInput.trim())
    setYtActiveVideo(null)
  }

  const handleYtVideoClick = (v) => {
    if (ytActiveVideo?.vid === v.vid) { setYtActiveVideo(null); return }
    setYtActiveVideo(v)
    setYtPlayerLoading(true)
    setYtVideoBlocked(false)
    setTimeout(() => ytPlayerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

  const handleYtCat = (id) => {
    setYtCat(id)
    setYtSearchQuery('')
    setYtSearchInput('')
    setYtActiveVideo(null)
  }

  return (
    <div className="sports-section">
      <div className="sports-header">
        <div className="live-dot" />
        <h2>Football Streams</h2>
        <span className="live-label">LIVE</span>
      </div>

      <div className="sports-tabs">
        <button className={`sport-tab ${tab === 'highlights' ? 'active' : ''}`} onClick={() => { setTab('highlights'); setActiveMatch(null) }}>
          🎬 Highlights & Replays
        </button>
        <button className={`sport-tab ${tab === 'live' ? 'active' : ''}`} onClick={() => setTab('live')}>
          🔴 Live Streams
        </button>
        <button className={`sport-tab ${tab === 'livetv' ? 'active' : ''}`} onClick={() => { setTab('livetv'); setActiveChannel(null) }}>
          📺 Live TV
        </button>
        <button className={`sport-tab ${tab === 'startimes' ? 'active' : ''}`} onClick={() => setTab('startimes')}>
          📡 StarTimes Guide
        </button>
        <button className={`sport-tab yt-tab-btn ${tab === 'youtube' ? 'active' : ''}`} onClick={() => setTab('youtube')}>
          ▶ Ignatius Watch
        </button>
        <button className={`sport-tab ${tab === 'livematches' ? 'active' : ''}`} onClick={() => { setTab('livematches'); setActiveMatch2(null) }}>
          🏟️ Live Matches
        </button>
      </div>

      {/* ==================== HIGHLIGHTS TAB ==================== */}
      {tab === 'highlights' && (
        <>
          {activeMatch && activeVideo && (
            <div className="match-player" ref={playerRef}>
              <div className="match-player-header">
                <div>
                  <div className="match-player-title">{activeMatch.title}</div>
                  <div className="match-player-comp">
                    {typeof activeMatch.competition === 'string'
                      ? activeMatch.competition
                      : activeMatch.competition?.name || ''}
                  </div>
                </div>
                <button className="match-player-close" onClick={() => { setActiveMatch(null); setActiveVideo(null) }}>✕</button>
              </div>
              <div className="match-player-frame">
                {playerLoading && (
                  <div className="match-player-loading">
                    <div className="nf-spinner-arc" style={{ width: 40, height: 40, border: '3px solid #222', borderTopColor: '#e50914', borderRadius: '50%', animation: 'nf-spin 0.8s linear infinite', display: 'block' }} />
                  </div>
                )}
                <iframe
                  key={activeVideo}
                  src={activeVideo}
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                  onLoad={() => setPlayerLoading(false)}
                />
              </div>
              {activeMatch.videos?.length > 1 && (
                <div className="match-player-actions">
                  <span className="sources-label">Angles:</span>
                  {activeMatch.videos.map((v, i) => {
                    const u = extractEmbed(v.embed)
                    return (
                      <button
                        key={i}
                        className={`source-btn ${activeVideo === u ? 'active' : ''}`}
                        onClick={() => { setActiveVideo(u); setPlayerLoading(true) }}
                      >
                        {v.title || `Angle ${i + 1}`}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div className="comp-filter-row">
            {COMP_FILTERS.map(f => (
              <button
                key={f}
                className={`comp-filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {loading && (
            <div className="match-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="match-card">
                  <div className="match-thumb match-skeleton-thumb" />
                  <div className="match-info">
                    <div className="skel-line long" />
                    <div className="skel-line short" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <div className="match-error">⚠ {error}</div>}
          {!loading && !error && filtered.length === 0 && (
            <div className="match-error">No matches found for "{filter}"</div>
          )}
          {!loading && !error && (
            <div className="match-grid">
              {filtered.map((m, i) => (
                <MatchCard
                  key={i}
                  match={m}
                  active={activeMatch?.title === m.title}
                  onClick={() => handleMatchClick(m)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ==================== LIVE STREAMS TAB ==================== */}
      {tab === 'live' && (
        <div className="live-streams-section">

          {/* ── Ignatius Inline Stream Players ── */}
          <div className="ign-streams-header">
            <div className="live-dot" />
            <span>Ignatius Stream — Playing In-Site</span>
          </div>
          <div className="ign-streams-row">
            {IGNATIUS_STREAMS.map(s => (
              <div
                key={s.id}
                className={`ign-stream-card ${activeIgnStream?.id === s.id ? 'ign-active' : ''}`}
                style={{ '--ign-color': s.color }}
                onClick={() => {
                  if (activeIgnStream?.id === s.id) {
                    setActiveIgnStream(null)
                  } else {
                    setActiveIgnStream(s)
                    setIgnStreamLoading(true)
                    setTimeout(() => ignStreamRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
                  }
                }}
              >
                <div className="ign-card-pulse" />
                <div className="ign-card-icon">{s.icon}</div>
                <div className="ign-card-body">
                  <div className="ign-card-name">{s.name}</div>
                  <div className="ign-card-sub">{s.sub}</div>
                </div>
                <div className="ign-card-play">
                  {activeIgnStream?.id === s.id ? '▼ Close' : '▶ Play'}
                </div>
              </div>
            ))}
          </div>

          {/* ── Inline Player ── */}
          {activeIgnStream && (
            <div className="ign-player-wrap" ref={ignStreamRef}>
              <div className="ign-player-bar">
                <div className="ign-player-info">
                  <span className="ign-player-dot" />
                  <span className="ign-player-name">{activeIgnStream.name}</span>
                  <span className="ign-player-src">{activeIgnStream.sub}</span>
                </div>
                <div className="ign-player-actions">
                  <a href={activeIgnStream.extUrl} target="_blank" rel="noreferrer" className="ign-ext-btn">↗ Open Tab</a>
                  <button className="ign-close-btn" onClick={() => setActiveIgnStream(null)}>✕</button>
                </div>
              </div>
              <div className="ign-player-frame">
                {ignStreamLoading && (
                  <div className="match-player-loading">
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                      <div style={{ width:40, height:40, border:'3px solid #222', borderTopColor: activeIgnStream.color, borderRadius:'50%', animation:'nf-spin 0.8s linear infinite' }} />
                      <span style={{ color:'#888', fontSize:'0.75rem' }}>Loading {activeIgnStream.name}…</span>
                    </div>
                  </div>
                )}
                <iframe
                  key={activeIgnStream.id}
                  src={activeIgnStream.embedUrl}
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; fullscreen; encrypted-media; clipboard-write"
                  style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}
                  onLoad={() => setIgnStreamLoading(false)}
                />
              </div>
              <div className="tv-player-note">
                {activeIgnStream.name} is playing in-site. Use ↗ Open Tab for full-screen experience.
              </div>
            </div>
          )}

          {/* ── More Stream Sources ── */}
          <div className="live-streams-more-label">More Sources</div>
          <div className="live-streams-grid">
            {LIVE_STREAM_SITES.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="stream-site-card"
                style={{ '--site-color': s.color }}
              >
                <div className="stream-site-icon">{s.icon}</div>
                <div className="stream-site-name">{s.name}</div>
                <div className="stream-live-pill">
                  <span className="stream-live-dot" />
                  LIVE
                </div>
                <div className="stream-watch-label">Opens in new tab →</div>
              </a>
            ))}
          </div>
          <div className="live-tip-box">
            <span>💡 Tip:</span> Use Ignatius Stream 1 or 2 above to watch without leaving this page. VPN recommended if blocked.
          </div>
        </div>
      )}

      {/* ==================== LIVE TV TAB ==================== */}
      {tab === 'livetv' && (
        <div className="livetv-section">
          <div className="livetv-banner">
            <div className="livetv-banner-icon">📺</div>
            <div>
              <div className="livetv-banner-title">Live TV Channels</div>
              <div className="livetv-banner-sub">{TV_CHANNELS.length} channels • Africa & International • Click to watch inline</div>
            </div>
          </div>

          {/* Inline Player */}
          {activeChannel && (
            <div className="tv-player-wrap" ref={tvPlayerRef}>
              <div className="tv-player-header">
                <div className="tv-player-chinfo">
                  <div className="tv-player-logo" style={{ background: activeChannel.color }}>
                    {activeChannel.abbr}
                  </div>
                  <div>
                    <div className="tv-player-chname">{activeChannel.name}</div>
                    <div className="tv-player-chmeta">{activeChannel.flag} {activeChannel.country} • YouTube Live</div>
                  </div>
                </div>
                <div className="tv-player-actions-row">
                  <a
                    href={`https://www.youtube.com/channel/${activeChannel.ytId}/live`}
                    target="_blank"
                    rel="noreferrer"
                    className="tv-open-yt-btn"
                  >
                    ↗ YouTube
                  </a>
                  <button className="tv-player-close" onClick={() => setActiveChannel(null)}>✕</button>
                </div>
              </div>
              <div className="tv-player-frame">
                {tvPlayerLoading && (
                  <div className="match-player-loading">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, border: '3px solid #222', borderTopColor: '#e50914', borderRadius: '50%', animation: 'nf-spin 0.8s linear infinite' }} />
                      <span style={{ color: '#888', fontSize: '0.75rem' }}>Checking live stream…</span>
                    </div>
                  </div>
                )}
                {tvOffline && !tvPlayerLoading && (
                  <div className="tv-offline-screen">
                    <div className="tv-offline-icon">📡</div>
                    <div className="tv-offline-title">{activeChannel.name} is not live right now</div>
                    <div className="tv-offline-sub">This channel may be off-air or has no active stream at this moment.</div>
                    <a
                      href={`https://www.youtube.com/channel/${activeChannel.ytId}/live`}
                      target="_blank"
                      rel="noreferrer"
                      className="tv-offline-yt-btn"
                    >
                      ▶ Try on YouTube
                    </a>
                  </div>
                )}
                {tvLiveVideoId && !tvPlayerLoading && (
                  <iframe
                    key={tvLiveVideoId}
                    src={`https://www.youtube.com/embed/${tvLiveVideoId}?autoplay=1&rel=0`}
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; fullscreen; encrypted-media"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                    onLoad={() => setTvPlayerLoading(false)}
                  />
                )}
              </div>
              <div className="tv-player-note">
                Streams are verified live before loading. If a channel shows offline, it is not broadcasting on YouTube right now — click "Try on YouTube" to check.
              </div>
            </div>
          )}

          {/* Category Filter */}
          <div className="tv-cat-filter">
            {TV_CAT_FILTERS.map(cat => (
              <button
                key={cat}
                className={`tv-cat-btn ${tvCat === cat ? 'active' : ''}`}
                onClick={() => setTvCat(cat)}
              >
                {cat === 'Kenya' && '🇰🇪 '}
                {cat === 'Nigeria' && '🇳🇬 '}
                {cat === 'South Africa' && '🇿🇦 '}
                {cat === 'Ghana' && '🇬🇭 '}
                {cat === 'StarTimes' && '📡 '}
                {cat}
              </button>
            ))}
          </div>

          {/* Channel Grid */}
          <div className="tv-channels-grid">
            {filteredChannels.map(ch => (
              <ChannelCard
                key={ch.id}
                ch={ch}
                active={activeChannel?.id === ch.id}
                onClick={() => handleChannelClick(ch)}
              />
            ))}
          </div>

          <div className="livetv-footer-note">
            📡 All channels stream via YouTube Live. Channel availability depends on whether the broadcaster is currently live.
          </div>
        </div>
      )}

      {/* ==================== STARTIMES GUIDE TAB ==================== */}
      {tab === 'startimes' && (
        <div className="startimes-section">
          <div className="st-header-banner">
            <div className="st-logo-wrap">
              <span className="st-logo-icon">📡</span>
              <div>
                <div className="st-title">StarTimes Africa</div>
                <div className="st-subtitle">Kenya Channel Packages & Guide</div>
              </div>
            </div>
            <a href="https://www.startimes.com" target="_blank" rel="noreferrer" className="st-visit-btn">
              Visit StarTimes ↗
            </a>
          </div>

          <div className="st-packages-label">Available Packages</div>
          <div className="st-packages-grid">
            {STARTIMES_PACKAGES.map(pkg => (
              <div className="st-package-card" key={pkg.name} style={{ '--pkg-color': pkg.color }}>
                <div className="st-pkg-header">
                  <div className="st-pkg-name">{pkg.name}</div>
                  <div className="st-pkg-price">{pkg.price}</div>
                </div>
                <div className="st-pkg-channels">
                  {pkg.channels.map((ch, i) => (
                    <div key={i} className="st-pkg-ch">{ch}</div>
                  ))}
                </div>
                <a
                  href={`https://www.startimes.com/subscribe`}
                  target="_blank"
                  rel="noreferrer"
                  className="st-pkg-subscribe"
                  style={{ background: pkg.color }}
                >
                  Subscribe
                </a>
              </div>
            ))}
          </div>

          <div className="st-featured-label">StarTimes Channels You Can Watch Now</div>
          <div className="tv-channels-grid">
            {TV_CHANNELS.filter(ch => ch.cat.includes('StarTimes')).map(ch => (
              <ChannelCard
                key={ch.id}
                ch={ch}
                active={false}
                onClick={() => { setTab('livetv'); setTvCat('StarTimes'); handleChannelClick(ch) }}
              />
            ))}
          </div>

          <div className="st-footer-info">
            <div className="st-info-item">📞 StarTimes Kenya: <strong>0800 723 050</strong> (Toll Free)</div>
            <div className="st-info-item">🌐 Website: <a href="https://www.startimes.com/kenya" target="_blank" rel="noreferrer">startimes.com/kenya</a></div>
            <div className="st-info-item">📧 Email: <a href="mailto:ke@startimes.com">ke@startimes.com</a></div>
          </div>
        </div>
      )}

      {/* ==================== YOUTUBE TAB ==================== */}
      {tab === 'youtube' && (
        <div className="yt-section">

          {/* Header */}
          <div className="yt-header">
            <div className="yt-header-left">
              <div className="yt-logo-wrap">
                <Logo className="yt-inline-logo" />
              </div>
              <span className="yt-header-sub">Watch inside Ignatius Stream — no redirects</span>
            </div>
          </div>

          {/* Search Bar */}
          <form className="yt-search-bar" onSubmit={handleYtSearch}>
            <input
              ref={ytSearchRef}
              type="text"
              className="yt-search-input"
              placeholder="Search YouTube videos..."
              value={ytSearchInput}
              onChange={e => setYtSearchInput(e.target.value)}
            />
            {ytSearchInput && (
              <button type="button" className="yt-search-clear" onClick={() => { setYtSearchInput(''); setYtSearchQuery(''); setYtActiveVideo(null) }}>✕</button>
            )}
            <button type="submit" className="yt-search-btn">
              <svg viewBox="0 0 24 24" fill="currentColor" height="16" width="16"><path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
            </button>
          </form>

          {/* Category Filters */}
          {!ytSearchQuery && (
            <div className="yt-cats">
              {YT_CATS.map(c => (
                <button
                  key={c.id}
                  className={`yt-cat-btn ${ytCat === c.id ? 'active' : ''}`}
                  onClick={() => handleYtCat(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {ytSearchQuery && (
            <div className="yt-search-result-label">
              Results for "<strong>{ytSearchQuery}</strong>"
              <button className="yt-clear-search" onClick={() => { setYtSearchQuery(''); setYtSearchInput(''); setYtActiveVideo(null) }}>
                ✕ Clear
              </button>
            </div>
          )}

          {/* Embedded Player */}
          {ytActiveVideo && (
            <div className="yt-player-wrap" ref={ytPlayerRef}>
              <div className="yt-player-bar">
                <div className="yt-player-info">
                  <div className="yt-player-title">{ytActiveVideo.title}</div>
                  <div className="yt-player-channel">{ytActiveVideo.channel}</div>
                </div>
                <div className="yt-player-actions">
                  <a
                    href={`https://www.youtube.com/watch?v=${ytActiveVideo.vid}`}
                    target="_blank"
                    rel="noreferrer"
                    className="yt-open-btn"
                  >
                    ↗ YouTube
                  </a>
                  <button className="yt-player-close" onClick={() => setYtActiveVideo(null)}>✕</button>
                </div>
              </div>
              <div className="yt-player-frame">
                {ytPlayerLoading && !ytVideoBlocked && (
                  <div className="match-player-loading">
                    <div style={{ width:40, height:40, border:'3px solid #222', borderTopColor:'#FF0000', borderRadius:'50%', animation:'nf-spin 0.8s linear infinite' }} />
                  </div>
                )}
                {ytVideoBlocked ? (
                  <div className="yt-blocked-overlay">
                    <div className="yt-blocked-icon">🚫</div>
                    <div className="yt-blocked-title">Video can't be played here</div>
                    <div className="yt-blocked-sub">The owner of this video has disabled playback on third-party sites.</div>
                    <a
                      href={`https://www.youtube.com/watch?v=${ytActiveVideo.vid}`}
                      target="_blank"
                      rel="noreferrer"
                      className="yt-blocked-btn"
                    >
                      ▶ Watch on YouTube
                    </a>
                  </div>
                ) : (
                  <iframe
                    key={ytActiveVideo.vid}
                    src={`https://www.youtube.com/embed/${ytActiveVideo.vid}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; fullscreen; encrypted-media; accelerometer; gyroscope; picture-in-picture"
                    style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}
                    onLoad={() => setYtPlayerLoading(false)}
                  />
                )}
              </div>
            </div>
          )}

          {/* Loading Skeletons */}
          {ytLoading && (
            <div className="yt-grid">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="yt-card yt-card-skel">
                  <div className="yt-thumb-skel" />
                  <div className="yt-card-body">
                    <div className="skel-line long" />
                    <div className="skel-line short" style={{ marginTop:6 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {ytError && !ytLoading && (
            <div className="yt-error">
              <div className="yt-error-icon">⚠</div>
              <div>{ytError}</div>
              <button className="yt-retry-btn" onClick={() => { setYtError(null); setYtLoading(true); fetch(`/api/youtube/trending?category=${ytCat}`).then(r=>r.json()).then(d=>{setYtVideos(d.videos||[]);setYtLoading(false)}).catch(()=>setYtLoading(false)) }}>Retry</button>
            </div>
          )}

          {/* Video Grid */}
          {!ytLoading && !ytError && ytVideos.length > 0 && (
            <div className="yt-grid">
              {ytVideos.map(v => (
                <YtVideoCard
                  key={v.vid}
                  v={v}
                  active={ytActiveVideo?.vid === v.vid}
                  onClick={() => handleYtVideoClick(v)}
                />
              ))}
            </div>
          )}

          {/* Empty */}
          {!ytLoading && !ytError && ytVideos.length === 0 && (
            <div className="yt-empty">
              <div className="yt-empty-icon">▶</div>
              <div>No videos found. Try a different search.</div>
            </div>
          )}

          <div className="yt-footer-note">
            📺 All videos play inside Ignatius Stream using the official YouTube embed player.
          </div>
        </div>
      )}

      {/* ==================== LIVE MATCHES TAB ==================== */}
      {tab === 'livematches' && (
        <div className="live-matches-tab">
          <p className="lm-subtitle">Streaming live sports from xcasper — click a match to watch.</p>

          {liveMatchLoading && (
            <div className="lm-loading">
              <div className="lm-spinner" />
              <span>Loading live matches…</span>
            </div>
          )}

          {liveMatchError && !liveMatchLoading && (
            <div className="lm-error">{liveMatchError}</div>
          )}

          {!liveMatchLoading && !liveMatchError && liveMatches.length === 0 && (
            <div className="lm-empty">
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🏟️</div>
              <div>No live matches right now. Check back soon!</div>
            </div>
          )}

          {activeMatch2 && (
            <div className="lm-player-wrap" ref={liveMatchPlayerRef}>
              <div className="lm-player-header">
                <span className="lm-live-badge">🔴 LIVE</span>
                <span className="lm-match-title-big">
                  {activeMatch2.team1?.name || 'Team 1'} vs {activeMatch2.team2?.name || 'Team 2'}
                </span>
                <button className="lm-close-player" onClick={() => setActiveMatch2(null)}>✕</button>
              </div>
              <iframe
                className="lm-iframe"
                src={`/api/live-stream?url=${encodeURIComponent(activeMatch2.playPath || '')}`}
                allowFullScreen
                allow="autoplay; fullscreen"
                title="Live Match Stream"
              />
              <div className="lm-player-note">Stream via Ignitus Live — may require a moment to buffer.</div>
            </div>
          )}

          <div className="lm-grid">
            {liveMatches.map((match, i) => (
              <div
                key={match.id || i}
                className={`lm-card ${activeMatch2?.id === match.id ? 'lm-card-active' : ''}`}
                onClick={() => handleLiveMatchClick(match)}
              >
                <div className="lm-card-teams">
                  <div className="lm-team">
                    {match.team1?.avatar && <img src={match.team1.avatar} alt="" className="lm-avatar" />}
                    <span className="lm-team-name">{match.team1?.name || 'Team 1'}</span>
                  </div>
                  <div className="lm-score-box">
                    {match.team1?.score != null && match.team2?.score != null
                      ? <span className="lm-score">{match.team1.score} – {match.team2.score}</span>
                      : <span className="lm-vs">VS</span>
                    }
                    <span className="lm-live-tag">🔴 LIVE</span>
                  </div>
                  <div className="lm-team lm-team-right">
                    {match.team2?.avatar && <img src={match.team2.avatar} alt="" className="lm-avatar" />}
                    <span className="lm-team-name">{match.team2?.name || 'Team 2'}</span>
                  </div>
                </div>
                {match.league && <div className="lm-league">{match.league}</div>}
                <div className="lm-watch-btn">▶ Watch Live</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
