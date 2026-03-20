# Ignatius Movie Stream

A full-featured movie streaming platform built with React + Vite.

## Tech Stack
- **Frontend**: React 18 + Vite 5
- **Styling**: CSS (component-level, CSS variables)
- **APIs**: OMDB (movies), TVMaze (drama/TV), Jikan (anime) — all via Vite server-side proxy
- **Streaming**: vidsrc.to, vidsrc.me, 2embed.cc (iframe embeds)

## Project Structure
```
src/
  api/
    omdb.js         # OMDB movie search API (proxied)
    tvmaze.js       # TVMaze TV shows API (proxied)
    jikan.js        # Jikan anime API (proxied)
  components/
    Header.jsx/css          # Logo + search bar
    BottomNav.jsx/css       # 5-tab navigation
    HeroBanner.jsx/css      # Featured movie hero
    SectionHeader.jsx/css   # Genre filter tabs
    MediaCard.jsx/css       # Movie/TV/anime card
    MediaGrid.css           # Grid + skeleton loaders
    PlayerModal.jsx/css     # Multi-server iframe player
    MoviesSection.jsx       # Movies tab
    DramaSection.jsx        # Drama/TV shows tab
    AnimeSection.jsx        # Anime tab
    LiveSports.jsx/css      # Live sports + TV channels
    DeveloperPage.jsx/css   # Developer contact info
  App.jsx / App.css / index.css / main.jsx
vite.config.js     # Proxies: /proxy/omdb, /proxy/tvmaze, /proxy/jikan
```

## Tabs
1. **Movies** — Latest & genre-filtered movies via OMDB, hero banner
2. **Drama** — TV shows via TVMaze with genre filters
3. **Anime** — Top airing & genre anime via Jikan API
4. **Live TV** — Live football/cricket/TV channel streams (embedded)
5. **Developer** — Contact: Ignatius, WhatsApp/Phone +254706535581

## Development
- `npm run dev` — starts on port 5000 (0.0.0.0)

## Deployment
- Target: Static  
- Build: `npm run build` → `dist/`

## Developer
Made by **Ignatius** · Contact: +254 706 535 581
