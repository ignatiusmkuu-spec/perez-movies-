# IgnatiusMovies

A Netflix-style streaming platform with React/Vite frontend and Express backend. Formerly "Ignatius Streaming Site" — rebranded to **IgnatiusMovies**.

## Developer
Made by **Ignatius** · Contact: +254 706 535 581

## Tech Stack
- **Frontend**: React 18 + Vite 5 (port 5000)
- **Backend**: Express.js proxy server (port 3001)
- **Styling**: CSS (component-level, CSS variables defined in `src/index.css`)
- **Content APIs**: MovieBox (`h5-api.aoneroom.com`), YTS.mx (movies), OMDB (search/fallback), Jikan (anime), TVMaze (drama), Scorebat (football), kenyalivetv.co.ke (live TV & radio)
- **Streaming**: 22 iframe player servers (movie) / 20 (TV); all listed in PlayerModal.jsx
- **IgnatiusStream**: Live Kenya TV (25 channels via YouTube embeds) + Radio (20 stations, 4 with M3U8 HLS streams)

## Vercel Deployment
- `vercel.json` configured with `@vercel/static-build` (frontend) + `@vercel/node` (backend)
- `vercel-build` script runs `vite build` → outputs to `dist/`
- Express server exports `default app` and skips `listen()` when `VERCEL=1`
- All proxy routes (`/api/*`, `/stream-proxy`, `/proxy/*`) routed to `server/index.js`
- No hardcoded localhost URLs in frontend — all calls use relative paths

## Project Structure
```
server/
  index.js            # Express: /api/moviebox/* proxy + /api/imgproxy + /api/flixer/movies (YTS) + /api/flixer/tv + /stream-proxy + /proxy/omdb
src/
  api/
    moviebox.js       # MovieBox API wrapper (fetchHomeData, normalizeMbItem, omdbSearch, getImdbId)
    flixer.js         # YTS API client (fetchFlixerMovies) — calls /api/flixer/movies
    omdb.js           # OMDB detail lookup
    jikan.js          # Jikan anime API (genre browse)
    tvmaze.js         # TVMaze (drama season/episode lookup)
  components/
    Header.jsx/css          # Logo + search bar
    BottomNav.jsx/css       # Bottom tab navigation
    HeroBanner.jsx/css      # Featured movie (MovieBox banner API)
    SectionHeader.jsx/css   # Genre filter tabs
    MediaCard.jsx/css       # Movie/TV/anime card
    MediaGrid.css           # Grid + skeleton loaders
    PlayerModal.jsx/css     # Multi-server iframe player (22 servers for movies, 20 for TV)
    MoviesSection.jsx       # Movies tab (MovieBox primary, YTS secondary, OMDB tertiary fallback)
    DramaSection.jsx        # Drama tab (K-Drama, C-Drama, Thai, SA, Turkish, Nollywood)
    AnimeSection.jsx        # Anime tab (MovieBox + Jikan)
    LiveSports.jsx/css      # Live sports/football + TV channels
    DeveloperPage.jsx/css   # Developer contact info
  App.jsx / App.css / index.css / main.jsx
vite.config.js     # Proxies: /proxy/omdb, /proxy/tvmaze, /proxy/jikan, /proxy/scorebat, /api, /stream-proxy
```

## CSS Variables (defined in src/index.css)
All component CSS variables are defined in the `:root` block in `src/index.css`:
- `--bg` / `--bg2` / `--bg3` — dark background levels
- `--card-bg` — card background color
- `--text` / `--text2` / `--text3` — text colors (light → muted → dim)
- `--accent` — red accent (`#e50914`)
- `--border` — subtle border (`rgba(255,255,255,0.1)`)
- `--gold` — gold for ratings (`#f5c518`)
- `--header-h` — header height (`60px`)
- `--nav-h` — bottom nav height (`65px`)

## Data Flow: Movies Tab
1. **"All" genre**: Parallel fetch of MovieBox + YTS + OMDB seeds
   - OMDB seeds (marvel, batman, fast furious) always included as primary results (reliable in all environments)
   - MovieBox `fetchHomeData()` filtered to `subjectType === 1` (actual movies only, not TV shows)
   - YTS `fetchFlixerMovies()` appended if accessible (works on Vercel, DNS-blocked in Replit dev sandbox)
   - If total < 10, additional OMDB seeds fetched
2. **Genre tabs (action/horror/romance/sci-fi/thriller/animation/crime)**: YTS.mx genre filter
   - OMDB fallback if YTS fails (dev environment)
3. **New Releases**: YTS sorted by `date_added`; OMDB 'man' search fallback in dev
4. **Nollywood**: OMDB search for 'Nigeria film'
5. **Search**: OMDB title search

## Data Flow: Other APIs
- **OMDB key**: `trilogy` (free tier, search + title lookup)
- **MovieBox auth**: Uses `origin: https://moviebox.ph` + `referer` headers (required)
- **Image proxy**: `/api/imgproxy?src=<url>` — proxies MovieBox CDN images (CORS issue without referer)
- **Anime**: Jikan.moe (free, no key)
- **Drama**: TVMaze (free, no key)
- **Football**: Scorebat (free video API)

## Player: Servers
22 movie servers in PlayerModal.jsx. Default: 123Movies (index 0).
Key servers: VidSrc.to, EmbedSU, MultiEmbed, 2Embed, 123Movies, VidSrc.me, MoviesAPI, etc.
VidLink removed (required TMDB IDs but app uses IMDB IDs).

## Development Notes
- YTS.mx is blocked in Replit's sandbox (DNS resolution fails). Works on Vercel production.
- MovieBox CDN (`pbcdnw.aoneroom.com`) is accessible from both Replit and Vercel.
- OMDB proxy works in all environments via Vite's proxy config (`/proxy/omdb` → `omdbapi.com`).
- `npm run dev` starts both servers concurrently: Express on 3001, Vite on 5000

## Deployment
- Build: `npm run build` → `dist/`
- Vercel: `vercel.json` routes all API calls to Express serverless function
