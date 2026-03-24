import { useState, useEffect, useRef, useCallback } from 'react'
import './IgnatiusStreamSection.css'

const CATEGORIES = {
  tv: [
    { value: 'all', label: 'All' },
    { value: 'news', label: 'News' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'local', label: 'Local' },
    { value: 'international', label: 'International' },
    { value: 'education', label: 'Education' },
    { value: 'kids', label: 'Kids' },
    { value: 'religious', label: 'Religious' },
    { value: 'music', label: 'Music' },
  ],
  radio: [
    { value: 'all', label: 'All' },
    { value: 'mainstream', label: 'Mainstream' },
    { value: 'local', label: 'Local' },
    { value: 'religious', label: 'Religious' },
  ],
}

const FALLBACK_TIMEOUT_MS = 8000

function ChannelCard({ item, type, onClick, isActive, isNontongo }) {
  const [imgErr, setImgErr] = useState(false)
  const id = isNontongo ? item.id : item.slug
  return (
    <button
      className={`ist-card ${isActive ? 'ist-card--active' : ''}`}
      onClick={() => onClick(item)}
      title={`Watch ${item.name} live`}
    >
      <div className="ist-card__img-wrap">
        {!imgErr ? (
          <img
            src={item.img}
            alt={item.name}
            onError={() => setImgErr(true)}
            loading="lazy"
          />
        ) : (
          <div className="ist-card__img-fallback">
            {type === 'radio' ? '📻' : '📺'}
          </div>
        )}
        {isActive && <span className="ist-card__live-dot">● LIVE</span>}
      </div>
      <p className="ist-card__name">{item.name}</p>
    </button>
  )
}

function NontongoPlayer({ channel, onClose }) {
  return (
    <div className="ist-player">
      <div className="ist-player__header">
        <img src={channel.img} alt={channel.name} className="ist-player__logo" onError={e => e.target.style.display='none'} />
        <div>
          <h2 className="ist-player__title">{channel.name}</h2>
          <span className="ist-player__badge ist-player__badge--nontongo">📺 NontonGo Live</span>
        </div>
        <button className="ist-player__close" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <div className="ist-player__frame-wrap">
        <iframe
          src={channel.embedUrl}
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          className="ist-player__frame"
          title={channel.name}
        />
      </div>
    </div>
  )
}

function TVPlayer({ channel, onClose, onFallback }) {
  const [streamData, setStreamData] = useState(channel.ytId ? { ytId: channel.ytId } : null)
  const [loading, setLoading] = useState(!channel.ytId)
  const [error, setError] = useState(null)
  const [iframeError, setIframeError] = useState(false)
  const fallbackTimerRef = useRef(null)

  useEffect(() => {
    if (channel.ytId) { setStreamData({ ytId: channel.ytId }); setLoading(false); return }
    setLoading(true)
    fetch(`/api/kenya-stream?slug=${channel.slug}&type=tv`, { signal: AbortSignal.timeout(10000) })
      .then(r => r.json())
      .then(d => { setStreamData(d); setLoading(false) })
      .catch(() => { setError('Stream not available'); setLoading(false) })
  }, [channel.slug, channel.ytId])

  useEffect(() => {
    if (error && onFallback) {
      fallbackTimerRef.current = setTimeout(() => onFallback(), 2000)
    }
    return () => clearTimeout(fallbackTimerRef.current)
  }, [error, onFallback])

  const ytSrc = streamData?.ytId
    ? `https://www.youtube.com/embed/live_stream?channel=${streamData.ytId}&autoplay=1&mute=0&rel=0`
    : null

  return (
    <div className="ist-player">
      <div className="ist-player__header">
        <img src={channel.img} alt={channel.name} className="ist-player__logo" onError={e => e.target.style.display='none'} />
        <div>
          <h2 className="ist-player__title">{channel.name}</h2>
          <span className="ist-player__badge">● LIVE</span>
        </div>
        <button className="ist-player__close" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <div className="ist-player__frame-wrap">
        {loading ? (
          <div className="ist-player__loading">Loading stream…</div>
        ) : error ? (
          <div className="ist-player__error">
            Stream unavailable — switching to backup…
          </div>
        ) : ytSrc && !iframeError ? (
          <iframe
            src={ytSrc}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            className="ist-player__frame"
            title={channel.name}
          />
        ) : (
          <div className="ist-player__error">
            Stream not available.{' '}
            <a href={`https://kenyalivetv.co.ke/tv/${channel.slug}`} target="_blank" rel="noreferrer">Watch on source ↗</a>
          </div>
        )}
      </div>
    </div>
  )
}

function RadioPlayer({ station, onClose }) {
  const [streamData, setStreamData] = useState(station.stream ? { stream: station.stream } : null)
  const [loading, setLoading] = useState(!station.stream)
  const [error, setError] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [loadingAudio, setLoadingAudio] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    if (station.stream) { setStreamData({ stream: station.stream }); setLoading(false); return }
    setLoading(true)
    fetch(`/api/kenya-stream?slug=${station.slug}&type=radio`, { signal: AbortSignal.timeout(10000) })
      .then(r => r.json())
      .then(d => { setStreamData(d); setLoading(false) })
      .catch(() => { setError('Stream not available'); setLoading(false) })
  }, [station.slug, station.stream])

  const handlePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else { setLoadingAudio(true); audio.play().then(() => setPlaying(true)).finally(() => setLoadingAudio(false)) }
  }

  const m3u8Url = streamData?.stream
  const ytId = streamData?.ytId

  return (
    <div className="ist-player ist-player--radio">
      <div className="ist-player__header">
        <img src={station.img} alt={station.name} className="ist-player__logo" onError={e => e.target.style.display='none'} />
        <div>
          <h2 className="ist-player__title">{station.name}</h2>
          <span className="ist-player__badge">📻 RADIO</span>
        </div>
        <button className="ist-player__close" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <div className="ist-player__radio-body">
        {loading ? (
          <div className="ist-player__loading">Loading stream…</div>
        ) : error ? (
          <div className="ist-player__error">{error}</div>
        ) : m3u8Url ? (
          <>
            <div className="ist-radio__art">
              <img src={station.img} alt={station.name} onError={e => e.target.style.display='none'} />
              <div className={`ist-radio__pulse ${playing ? 'ist-radio__pulse--active' : ''}`} />
            </div>
            <div className="ist-radio__controls">
              <button
                className={`ist-radio__play-btn ${playing ? 'ist-radio__play-btn--pause' : ''}`}
                onClick={handlePlayPause}
                disabled={loadingAudio}
              >
                {loadingAudio ? '⏳' : playing ? '⏸' : '▶'}
              </button>
              <span className="ist-radio__status">{playing ? '● Playing live' : 'Press play to stream'}</span>
            </div>
            <audio
              ref={audioRef}
              src={m3u8Url}
              onEnded={() => setPlaying(false)}
              onError={() => setError('Audio stream failed')}
            />
          </>
        ) : ytId ? (
          <iframe
            src={`https://www.youtube.com/embed/live_stream?channel=${ytId}&autoplay=1&mute=0&rel=0`}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            className="ist-player__frame"
            title={station.name}
          />
        ) : (
          <div className="ist-player__error">
            Stream not available.{' '}
            <a href={`https://kenyalivetv.co.ke/radio/${station.slug}`} target="_blank" rel="noreferrer">Listen on source ↗</a>
          </div>
        )}
      </div>
    </div>
  )
}

function NontongoFallback({ onRetry }) {
  const [ntChannels, setNtChannels] = useState([])
  const [ntLoading, setNtLoading] = useState(true)
  const [ntSearch, setNtSearch] = useState('')
  const [activeNt, setActiveNt] = useState(null)
  const [ntLoadErr, setNtLoadErr] = useState(false)
  const autoPlayedRef = useRef(false)

  useEffect(() => {
    fetch('/api/nontongo-live', { signal: AbortSignal.timeout(15000) })
      .then(r => r.json())
      .then(d => {
        const chs = d.channels || []
        setNtChannels(chs)
        setNtLoading(false)
        if (chs.length > 0 && !autoPlayedRef.current) {
          autoPlayedRef.current = true
          const preferred = chs.find(c => /bbc.news|cnn|al.?jaz|france.?24/i.test(c.name)) || chs[0]
          setActiveNt(preferred)
        }
      })
      .catch(() => { setNtLoadErr(true); setNtLoading(false) })
  }, [])

  const filtered = ntSearch
    ? ntChannels.filter(c => c.name.toLowerCase().includes(ntSearch.toLowerCase()))
    : ntChannels

  return (
    <div className="ist-wrap">
      <div className="ist-fallback-banner">
        <span>⚠️ IgnatiusStream is temporarily unavailable — streaming from <strong>NontonGo Live TV</strong> (850+ channels)</span>
        <button className="ist-retry-btn" onClick={onRetry}>Retry IgnatiusStream</button>
      </div>

      {activeNt && (
        <NontongoPlayer channel={activeNt} onClose={() => setActiveNt(null)} />
      )}

      <div className="ist-nt-search-wrap">
        <input
          className="ist-nt-search"
          type="search"
          placeholder="Search 850+ live channels…"
          value={ntSearch}
          onChange={e => setNtSearch(e.target.value)}
        />
      </div>

      {ntLoading ? (
        <div className="ist-skeleton-grid">
          {Array(12).fill(0).map((_, i) => <div key={i} className="ist-skeleton-card" />)}
        </div>
      ) : ntLoadErr ? (
        <div className="ist-empty">Failed to load backup channels. <button className="ist-retry-btn" onClick={onRetry}>Retry</button></div>
      ) : (
        <div className="ist-grid">
          {filtered.map(ch => (
            <ChannelCard
              key={ch.id}
              item={ch}
              type="tv"
              onClick={setActiveNt}
              isActive={activeNt?.id === ch.id}
              isNontongo
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function IgnatiusStreamSection() {
  const [tab, setTab] = useState('tv')
  const [category, setCategory] = useState('all')
  const [channels, setChannels] = useState([])
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeItem, setActiveItem] = useState(null)
  const [fallbackMode, setFallbackMode] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const fallbackTimerRef = useRef(null)

  const activateFallback = useCallback(() => {
    clearTimeout(fallbackTimerRef.current)
    setFallbackMode(true)
    setLoading(false)
    setActiveItem(null)
  }, [])

  useEffect(() => {
    setLoading(true)
    setFallbackMode(false)
    setChannels([])
    setStations([])
    setActiveItem(null)

    fallbackTimerRef.current = setTimeout(activateFallback, FALLBACK_TIMEOUT_MS)

    Promise.all([
      fetch('/api/kenya-tv', { signal: AbortSignal.timeout(7000) })
        .then(r => r.json())
        .catch(() => ({ channels: [], sourceHealthy: false })),
      fetch('/api/kenya-radio', { signal: AbortSignal.timeout(7000) })
        .then(r => r.json())
        .catch(() => ({ stations: [] })),
    ]).then(([tv, radio]) => {
      clearTimeout(fallbackTimerRef.current)
      const tvChannels = tv.channels || []
      const radioStations = radio.stations || []

      if (!tv.sourceHealthy && tvChannels.length === 0) {
        activateFallback()
        return
      }

      setChannels(tvChannels)
      setStations(radioStations)
      setLoading(false)

      if (!tv.sourceHealthy) {
        fallbackTimerRef.current = setTimeout(activateFallback, 3000)
      }
    }).catch(() => {
      clearTimeout(fallbackTimerRef.current)
      activateFallback()
    })

    return () => clearTimeout(fallbackTimerRef.current)
  }, [retryKey, activateFallback])

  const handleRetry = () => {
    setFallbackMode(false)
    setRetryKey(k => k + 1)
  }

  const handleTabSwitch = (t) => { setTab(t); setCategory('all'); setActiveItem(null) }

  if (fallbackMode) {
    return <NontongoFallback onRetry={handleRetry} />
  }

  const currentList = tab === 'tv' ? channels : stations
  const filtered = category === 'all' ? currentList : currentList.filter(c => c.category === category)

  return (
    <div className="ist-wrap">
      <div className="ist-header">
        <div className="ist-brand">
          <span className="ist-brand__logo">📡</span>
          <div>
            <div className="ist-brand__name">IgnatiusStream</div>
            <div className="ist-brand__sub">TV &amp; Radio</div>
          </div>
        </div>
        <div className="ist-tabs">
          <button
            className={`ist-tab-btn ${tab === 'tv' ? 'ist-tab-btn--active' : ''}`}
            onClick={() => handleTabSwitch('tv')}
          >
            📺 Live TV
          </button>
          <button
            className={`ist-tab-btn ${tab === 'radio' ? 'ist-tab-btn--active' : ''}`}
            onClick={() => handleTabSwitch('radio')}
          >
            📻 Radio
          </button>
        </div>
      </div>

      {activeItem && (
        tab === 'tv'
          ? <TVPlayer
              channel={activeItem}
              onClose={() => setActiveItem(null)}
              onFallback={activateFallback}
            />
          : <RadioPlayer station={activeItem} onClose={() => setActiveItem(null)} />
      )}

      <div className="ist-cats">
        {CATEGORIES[tab].map(c => (
          <button
            key={c.value}
            className={`ist-cat-btn ${category === c.value ? 'ist-cat-btn--active' : ''}`}
            onClick={() => setCategory(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="ist-skeleton-grid">
          {Array(12).fill(0).map((_, i) => <div key={i} className="ist-skeleton-card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="ist-empty">No {tab === 'tv' ? 'channels' : 'stations'} found.</div>
      ) : (
        <div className="ist-grid">
          {filtered.map(item => (
            <ChannelCard
              key={item.slug}
              item={item}
              type={tab}
              onClick={setActiveItem}
              isActive={activeItem?.slug === item.slug}
            />
          ))}
        </div>
      )}
    </div>
  )
}
