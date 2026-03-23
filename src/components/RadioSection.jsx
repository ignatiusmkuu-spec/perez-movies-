import { useState, useEffect } from 'react'
import { useRadio } from '../context/RadioContext'
import './RadioSection.css'

const RADIO_COUNTRIES = [
  { id: 'all',           label: 'All',          flag: '🌍' },
  { id: 'kenya',         label: 'Kenya',        flag: '🇰🇪' },
  { id: 'nigeria',       label: 'Nigeria',      flag: '🇳🇬' },
  { id: 'south africa',  label: 'South Africa', flag: '🇿🇦' },
  { id: 'ghana',         label: 'Ghana',        flag: '🇬🇭' },
  { id: 'uganda',        label: 'Uganda',       flag: '🇺🇬' },
  { id: 'tanzania',      label: 'Tanzania',     flag: '🇹🇿' },
  { id: 'ethiopia',      label: 'Ethiopia',     flag: '🇪🇹' },
  { id: 'international', label: 'International',flag: '🌐' },
]

const INT_STATIONS = [
  { stationuuid: 'bbc-world', name: 'BBC World Service', country: 'International', tags: 'news,english', bitrate: 128, codec: 'MP3', url_resolved: 'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service', favicon: '' },
  { stationuuid: 'voa-africa', name: 'VOA Africa', country: 'International', tags: 'news,africa', bitrate: 128, codec: 'MP3', url_resolved: 'https://playerservices.streamtheworld.com/api/livestream-redirect/VOA_AFRIQUE_SC', favicon: '' },
  { stationuuid: 'dw-english', name: 'DW Radio English', country: 'International', tags: 'news,english', bitrate: 128, codec: 'MP3', url_resolved: 'https://dw.live/p/s7VKw', favicon: '' },
  { stationuuid: 'france24-radio', name: 'France 24 Radio', country: 'International', tags: 'news,french', bitrate: 128, codec: 'MP3', url_resolved: 'https://live.france24.com/radio/fr/stream-fr', favicon: '' },
  { stationuuid: 'rfi-en', name: 'RFI English', country: 'International', tags: 'news,africa', bitrate: 64, codec: 'MP3', url_resolved: 'https://rfienglishlive.akamaized.net/i/RFIANGLAIS_all@156260/index_48_a-p.m3u8', favicon: '' },
]

const CACHE = {}

async function fetchStations(country) {
  if (CACHE[country]) return CACHE[country]

  if (country === 'international') {
    CACHE[country] = INT_STATIONS
    return INT_STATIONS
  }

  const api = 'https://de1.api.radio-browser.info/json/stations/bycountry'
  const url = `${api}/${encodeURIComponent(country)}?limit=60&hidebroken=true&order=votes&reverse=true`

  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'IgnatiusStreaming/1.0' } })
    if (!r.ok) throw new Error('API error')
    const data = await r.json()
    const filtered = data.filter(s => s.url_resolved && s.url_resolved.startsWith('http'))
    CACHE[country] = filtered
    return filtered
  } catch {
    return []
  }
}

async function fetchAllAfrican() {
  const countries = ['kenya', 'nigeria', 'south africa', 'ghana', 'uganda', 'tanzania', 'ethiopia']
  const results = await Promise.all(countries.map(c => fetchStations(c)))
  const all = results.flat()
  const seen = new Set()
  const deduped = all.filter(s => {
    if (seen.has(s.stationuuid)) return false
    seen.add(s.stationuuid)
    return true
  })
  CACHE['all'] = deduped
  return deduped
}

function StationCard({ station, isPlaying, isLoading, onClick }) {
  const initials = station.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  const hue = Math.abs(station.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 360
  const bgColor = `hsl(${hue}, 55%, 28%)`

  return (
    <div
      className={`radio-card ${isPlaying ? 'radio-card-active' : ''} ${isLoading ? 'radio-card-loading' : ''}`}
      onClick={onClick}
    >
      <div className="radio-card-logo" style={{ background: bgColor }}>
        {station.favicon ? (
          <img src={station.favicon} alt="" onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
        ) : null}
        <span style={{ display: station.favicon ? 'none' : 'flex' }}>{initials}</span>
      </div>

      <div className="radio-card-body">
        <div className="radio-card-name">{station.name}</div>
        <div className="radio-card-meta">
          {station.tags?.split(',')[0]?.trim() || 'Radio'}
          {station.bitrate > 0 && ` · ${station.bitrate}kbps`}
        </div>
      </div>

      <div className={`radio-card-play ${isPlaying ? 'playing' : ''}`}>
        {isPlaying ? (
          isLoading ? (
            <span className="radio-spinner" />
          ) : (
            <span className="radio-wave">
              <span/><span/><span/><span/>
            </span>
          )
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </div>
    </div>
  )
}

export default function RadioSection() {
  const { playing, audioLoading, audioError, volume, muted, playStation, stopPlaying, toggleMute, handleVolume } = useRadio()

  const [country, setCountry] = useState('kenya')
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    setError(null)
    setStations([])

    const load = country === 'all' ? fetchAllAfrican() : fetchStations(country)
    load.then(data => {
      setStations(data)
      setLoading(false)
      if (data.length === 0) setError('No stations found. Try another region.')
    }).catch(() => {
      setError('Failed to load stations.')
      setLoading(false)
    })
  }, [country])

  const filtered = search.trim()
    ? stations.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.tags?.toLowerCase().includes(search.toLowerCase()))
    : stations

  return (
    <div className="radio-section">
      {/* Header */}
      <div className="radio-hero">
        <div className="radio-hero-left">
          <div className="radio-hero-icon">📻</div>
          <div>
            <div className="radio-hero-title">Ignatius Radio</div>
            <div className="radio-hero-sub">Live radio from Africa & the World</div>
          </div>
        </div>
        <div className="radio-signal">
          <span/><span/><span/><span/><span/>
        </div>
      </div>

      {/* Now Playing Bar */}
      {playing && (
        <div className="radio-nowplaying">
          <div className="radio-np-left">
            <div className="radio-np-wave">
              {audioLoading
                ? <span className="radio-spinner small" />
                : <><span/><span/><span/><span/></>
              }
            </div>
            <div className="radio-np-info">
              <div className="radio-np-label">NOW PLAYING</div>
              <div className="radio-np-name">{playing.name}</div>
              {playing.country !== 'International' && <div className="radio-np-country">{playing.country}</div>}
            </div>
          </div>
          <div className="radio-np-controls">
            <button className="radio-vol-btn" onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'}>
              {muted ? '🔇' : volume > 0.5 ? '🔊' : '🔉'}
            </button>
            <input
              type="range"
              min="0" max="1" step="0.05"
              value={muted ? 0 : volume}
              onChange={e => handleVolume(parseFloat(e.target.value))}
              className="radio-vol-slider"
            />
            <button className="radio-stop-btn" onClick={stopPlaying}>■ Stop</button>
          </div>
          {audioError && <div className="radio-np-error">{audioError}</div>}
        </div>
      )}

      {/* Country Filter */}
      <div className="radio-country-filter">
        {RADIO_COUNTRIES.map(c => (
          <button
            key={c.id}
            className={`radio-country-btn ${country === c.id ? 'active' : ''}`}
            onClick={() => setCountry(c.id)}
          >
            {c.flag} {c.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="radio-search-wrap">
        <div className="radio-search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search stations by name or genre…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="radio-search-input"
          />
          {search && <button className="radio-search-clear" onClick={() => setSearch('')}>✕</button>}
        </div>
        {!loading && <div className="radio-count">{filtered.length} station{filtered.length !== 1 ? 's' : ''}</div>}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="radio-grid">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="radio-card radio-card-skel">
              <div className="radio-skel-logo" />
              <div className="radio-card-body">
                <div className="radio-skel-line long" />
                <div className="radio-skel-line short" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && !loading && <div className="radio-error">⚠ {error}</div>}

      {!loading && !error && filtered.length === 0 && search && (
        <div className="radio-error">No stations match "{search}"</div>
      )}

      {/* Station Grid */}
      {!loading && filtered.length > 0 && (
        <div className="radio-grid">
          {filtered.map(station => (
            <StationCard
              key={station.stationuuid}
              station={station}
              isPlaying={playing?.stationuuid === station.stationuuid}
              isLoading={playing?.stationuuid === station.stationuuid && audioLoading}
              onClick={() => playStation(station)}
            />
          ))}
        </div>
      )}

      <div className="radio-footer">
        📡 Streaming from radio-browser.info · 40,000+ stations worldwide · Ignatius Streaming
      </div>
    </div>
  )
}
