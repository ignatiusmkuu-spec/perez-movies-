import { useState } from 'react'
import './PremiumAccess.css'

const SECTIONS = [
  {
    id: 'movies',
    icon: '🎬',
    label: 'Movies & Shows',
    links: [
      { url: 'https://flixer.su/', label: 'Flixer', desc: 'Most Popular · No Ads' },
      { url: 'https://www.cineby.app/', label: 'Cineby', desc: 'Netflix-style UI' },
      { url: 'https://www.bitcine.app/', label: 'BitCine', desc: 'Netflix-style UI' },
      { url: 'https://veloratv.ru/', label: 'VeloraTV', desc: 'Netflix-style UI' },
      { url: 'https://xprime.tv/', label: 'XPrime TV', desc: 'Netflix-style UI' },
      { url: 'https://www.fmovies.gd/', label: 'FMovies', desc: 'Movies & TV Shows' },
      { url: 'https://cinegram.net/home', label: 'Cinegram', desc: 'Bollywood & Hollywood' },
      { url: 'https://1337x.to/home/', label: '1337x', desc: 'Torrents' },
      { url: 'https://www.docplus.com/', label: 'DocPlus', desc: 'Documentaries' },
      { url: 'https://www.documentaryarea.com/', label: 'Documentary Area', desc: 'Documentaries' },
      { url: 'https://pstream.mov/', label: 'PStream', desc: 'Watch in 4K · See Tutorial' },
      { url: 'https://vimeo.com/1059834885/c3ab398d42', label: 'PStream Tutorial', desc: '4K Setup Guide' },
    ],
  },
  {
    id: 'streaming',
    icon: '📺',
    label: 'Live Streaming',
    links: [
      { url: 'https://gostreameast.link/', label: 'StreamEast', desc: 'All Mirrors · Live Sports' },
      { url: 'https://sportyhunter.com/', label: 'SportyHunter', desc: 'Live Sports' },
      { url: 'https://watchsports.to/', label: 'WatchSports', desc: '10+ Sports Channels' },
      { url: 'https://streamed.su/', label: 'Streamed', desc: 'Live Sports' },
      { url: 'https://tvpass.org/', label: 'TVPass', desc: 'USA Live TV' },
      { url: 'https://rivestream.org/livesports', label: 'RiveLive', desc: 'Live Sports' },
      { url: 'https://www.livehdtv.com/', label: 'LiveHDTV', desc: 'HD Live TV' },
      { url: 'https://zhangboheng.github.io/Easy-Web-TV-M3u8/routes/countries.html', label: 'EasyWebTV', desc: 'All Countries M3U8' },
    ],
  },
  {
    id: 'games',
    icon: '🎮',
    label: 'Games',
    links: [
      { url: 'https://fitgirl-repacks.site/', label: 'Fitgirl Repacks', desc: 'Popular Game Repacks' },
      { url: 'https://gog-games.to/', label: 'GOGgames', desc: 'Free DRM-Free Games' },
      { url: 'https://dodi-repacks.download/', label: 'Dodi Repacks', desc: 'Game Repacks' },
      { url: 'https://ankergames.net/', label: 'AnkerGames', desc: 'Wide Selection' },
      { url: 'https://steamgg.net/', label: 'SteamGG', desc: 'Preinstalled Steam Games' },
      { url: 'https://steamrip.com/', label: 'SteamRip', desc: 'Preinstalled Steam Games' },
      { url: 'https://m4ckd0ge-repacks.site/', label: 'M4ckdoge Repacks', desc: 'Game Repacks' },
      { url: 'https://elamigos.site/', label: 'Elamigos', desc: 'Spanish Games' },
      { url: 'https://online-fix.me/', label: 'Online-Fix', desc: 'Online for Cracked Games' },
      { url: 'https://retrogametalk.com/repository/', label: 'CDRomance', desc: 'Retro Games' },
      { url: 'https://www.emuparadise.me/', label: 'Emuparadise', desc: 'Emulator & ROMs' },
      { url: 'https://www.wemod.com/', label: 'WeMod', desc: 'Game Trainers App' },
      { url: 'https://fearlessrevolution.com/', label: 'FearlessRevolution', desc: 'Cheat Tables & Trainers' },
      { url: 'https://flingtrainer.com/', label: 'FLiNGTrainer', desc: 'Separate Trainers' },
    ],
  },
  {
    id: 'software',
    icon: '💻',
    label: 'Software',
    links: [
      { url: 'https://appdoze.net/', label: 'Appdoze', desc: 'Latest Software' },
      { url: 'https://scloud.ws/', label: 'Scloud', desc: 'Windows Software' },
      { url: 'https://www.downloadpirate.com/', label: 'DownloadPirate', desc: 'VFX & Much More' },
      { url: 'https://aedownload.com/', label: 'AeDownload', desc: 'Premiere & After Effects Plugins' },
      { url: 'https://audioz.download/', label: 'Audioz', desc: 'Music Production Software' },
      { url: 'https://diakov.net/', label: 'DAIKOV', desc: 'Software · Russian' },
      { url: 'https://www.downloadha.com/', label: 'DownloadHa', desc: 'Software · Persian' },
    ],
  },
  {
    id: 'books',
    icon: '📚',
    label: 'Books',
    links: [
      { url: 'https://z-lib.gd/', label: 'Z-Lib', desc: 'E-books Library' },
      { url: 'https://rivestream.org/manga', label: 'RiveManga', desc: 'Manga' },
      { url: 'https://libgen.li/', label: 'Libgen', desc: 'E-books' },
      { url: 'https://annas-archive.li/', label: "Anna's Archive", desc: 'E-books & Research Papers' },
      { url: 'https://liber3.eth.limo/', label: 'Liber3', desc: 'E-books' },
      { url: 'https://audiobookbay.lu/', label: 'Audiobookbay', desc: 'Audiobooks' },
      { url: 'https://fulllengthaudiobooks.net/', label: 'Full Length Audiobooks', desc: 'No Account Required' },
      { url: 'https://tokybook.com/', label: 'Tokybook', desc: 'Audiobooks · Smaller Catalog' },
    ],
  },
  {
    id: 'music',
    icon: '🎵',
    label: 'Music',
    links: [
      { url: 'https://shailen.dedyn.io/racoon/', label: 'Racoon', desc: 'Multi Media Downloader' },
      { url: 'https://azmp3.cc/', label: 'AZMP3', desc: 'YouTube to MP3' },
      { url: 'https://ezmp3.lat/en/', label: 'Ezmp3', desc: 'YouTube to MP3' },
      { url: 'https://cobalt.tools/', label: 'Cobalt', desc: 'YT, IG, Twitch Downloader' },
      { url: 'https://lucida.to/', label: 'Lucida', desc: 'HiFi Music Downloader' },
      { url: 'https://doubledouble.top/', label: 'DoubleDouble', desc: 'HiFi Music Download' },
      { url: 'https://ncs.io/', label: 'NCS', desc: 'Non-Copyrighted Music' },
      { url: 'https://downloadmusicschool.com/bandcamp/', label: 'Music School', desc: 'Bandcamp to MP3' },
      { url: 'https://cnvmp3.com/', label: 'CnvMP3', desc: 'Media Downloader' },
      { url: 'https://github.com/MoonWalker440/Music-Megathread/', label: 'Music Megathread', desc: 'Everything Music Related' },
    ],
  },
  {
    id: 'anime',
    icon: '🌸',
    label: 'Anime',
    links: [
      { url: 'https://animekai.to/', label: 'AnimeKai', desc: 'Hard-sub Anime' },
      { url: 'https://xprime.tv/', label: 'XPrime TV', desc: 'Anime, Movies & TV' },
      { url: 'https://kaa.mx/', label: 'KickAssAnime', desc: 'Anime' },
      { url: 'https://hianimez.to/', label: 'HiAnime', desc: 'Anime Dub & Sub' },
      { url: 'https://animenosub.to/', label: 'AnimeNoSub', desc: 'Anime' },
      { url: 'https://rivestream.org/', label: 'RiveStream', desc: 'Anime, Movies & Live TV' },
    ],
  },
  {
    id: 'vpn',
    icon: '🔒',
    label: 'VPN',
    links: [
      { url: 'https://www.kqzyfj.com/click-101692308-15877167', label: 'NordVPN', desc: 'Top-rated VPN' },
      { url: 'https://www.dpbolvw.net/click-101452304-14349299', label: 'ExpressVPN', desc: 'Fast & Secure' },
      { url: 'https://www.dpbolvw.net/click-101452304-13944080', label: 'CyberGhost', desc: 'Privacy VPN' },
      { url: 'https://www.tkqlhce.com/click-101452304-14570828', label: 'Private Internet Access', desc: 'No-log VPN' },
      { url: 'https://www.kqzyfj.com/click-101692308-15438547', label: 'Surfshark VPN', desc: 'Unlimited Devices' },
      { url: 'https://www.tkqlhce.com/click-101452304-17147795', label: 'SafeShell VPN', desc: 'Stream Friendly' },
    ],
  },
  {
    id: 'adblockers',
    icon: '🛡️',
    label: 'AdBlockers',
    links: [
      { url: 'https://adguard.com?aid=135720', label: 'AdGuard', desc: 'AdBlocker · Browser & App' },
      { url: 'https://adblockplus.org/', label: 'Adblock Plus', desc: 'Classic AdBlocker' },
      { url: 'https://ublockorigin.com/', label: 'uBlock Origin', desc: 'Content Blocker · Ads & More' },
    ],
  },
]

export default function PremiumAccess() {
  const [activeSection, setActiveSection] = useState('movies')

  const section = SECTIONS.find(s => s.id === activeSection)

  return (
    <div className="pa-page">
      <div className="pa-header">
        <div className="pa-header-inner">
          <span className="pa-header-icon">💎</span>
          <div>
            <div className="pa-header-title">Premium Access</div>
            <div className="pa-header-sub">Curated collection of the best sites on the web</div>
          </div>
        </div>
      </div>

      <div className="pa-category-nav">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            className={`pa-cat-btn ${activeSection === s.id ? 'pa-cat-active' : ''}`}
            onClick={() => setActiveSection(s.id)}
          >
            <span className="pa-cat-icon">{s.icon}</span>
            <span className="pa-cat-label">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="pa-content">
        {section && (
          <>
            <div className="pa-section-header">
              <span className="pa-section-icon">{section.icon}</span>
              <span className="pa-section-title">{section.label}</span>
              <span className="pa-section-count">{section.links.length} sites</span>
            </div>
            <div className="pa-links-grid">
              {section.links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="pa-link-card"
                >
                  <div className="pa-link-num">{i + 1}</div>
                  <div className="pa-link-body">
                    <div className="pa-link-name">{link.label}</div>
                    <div className="pa-link-desc">{link.desc}</div>
                  </div>
                  <div className="pa-link-arrow">↗</div>
                </a>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="pa-footer">
        <span>💎 Premium Access</span>
        <span>·</span>
        <span>Powered by Perez Stream</span>
      </div>
    </div>
  )
}
