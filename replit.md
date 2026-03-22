# Ignite Movies

A Netflix-style movie streaming platform with real content powered by MovieBox.

## Developer
Made by **Ignatius** · Contact: +254 706 535 581

## Tech Stack
- **Frontend**: React 18 + Vite 5 (port 5000)
- **Backend**: Express.js proxy server (port 3001)
- **Styling**: CSS (component-level, CSS variables)
- **Content APIs**: MovieBox (`h5-api.aoneroom.com`), OMDB (search), Jikan (anime browse)
- **Streaming**: 123movienow.cc (MovieBox primary), VidSrc, EmbedSU, MultiEmbed, 2Embed, Smashy, VidSrc.me, MoviesAPI, VidLink
- **Downloads**: apibay.org (Pirate Bay API) — real torrent/magnet links by quality (4K/1080p/720p/480p)
- **YouTube**: `ytsr` npm package (search + categories) + `iv.melmac.space` Invidious API (trending); 5-min cache; 22 movie / 20 TV servers (all verified)

## Vercel Deployment
- `vercel.json` configured with `@vercel/static-build` (frontend) + `@vercel/node` (backend)
- `vercel-build` script runs `vite build` → outputs to `dist/`
- Express server exports `default app` and skips `listen()` when `VERCEL=1`
- All proxy routes (`/api/*`, `/stream-proxy`, `/proxy/*`) routed to `server/index.js`
- No hardcoded localhost URLs in frontend — all calls use relative paths

## Project Structure
```
server/
  index.js            # Express: /api/moviebox/* proxy + /api/imgproxy + /stream-proxy
src/
  api/
    moviebox.js       # MovieBox API wrapper with 8-min cache
    omdb.js           # OMDB search (for IMDB ID lookup + search feature)
    jikan.js          # Jikan anime API (genre browse)
    tvmaze.js         # TVMaze (drama season/episode lookup)
  components/
    Header.jsx/css          # Logo + search bar
    BottomNav.jsx/css       # 5-tab navigation
    HeroBanner.jsx/css      # Featured movie (MovieBox banner API)
    SectionHeader.jsx/css   # Genre filter tabs
    MediaCard.jsx/css       # Movie/TV/anime card (supports moviebox, moviebox-tv, omdb, jikan types)
    MediaGrid.css           # Grid + skeleton loaders
    PlayerModal.jsx/css     # Multi-server iframe player (6 servers for movies, 5 for TV)
    MoviesSection.jsx       # Movies tab (MovieBox sections, 272+ movies)
    DramaSection.jsx        # Drama tab (K-Drama, C-Drama, Thai, SA, Turkish, etc.)
    AnimeSection.jsx        # Anime tab (MovieBox + Jikan)
    LiveSports.jsx/css      # Live sports/football + TV channels
    DeveloperPage.jsx/css   # Developer contact info
  App.jsx / App.css / index.css / main.jsx
vite.config.js     # Proxies: /proxy/omdb, /proxy/tvmaze, /proxy/jikan, /api, /stream-proxy
```

## Data Flow
1. **Browser** → Vite proxy (`/api/moviebox/home`) → Express server → MovieBox API
2. **Express** adds `origin: https://moviebox.ph` + `referer` headers (required by MovieBox CDN)
3. **Image proxy**: `/api/imgproxy?src=<url>` proxies MovieBox CDN images (CDN blocks direct browser requests without referer)
4. **MovieBox response key**: `data.operatingList` (NOT `data.sections`) — 33 sections, 272+ movies
5. **Search**: OMDB via Vite proxy with key "trilogy"
6. **Streaming**: PlayerModal looks up IMDB ID via OMDB for MovieBox/Flixer items, then builds embed URL
7. **TheFlixer**: Express scrapes `theflixertv.to/movie` HTML (server-side), parses movie list, returns JSON; cached 10 min

## Key API Facts
- MovieBox base URL: `https://h5-api.aoneroom.com` (proxied as `/api/moviebox`)
- Image CDN: `pbcdnw.aoneroom.com` (proxied as `/api/imgproxy?src=...`)
- Section types: `SUBJECTS_MOVIE` (subjectType=1 movie, subjectType=2 TV)
- 123movienow.cc: `https://123movienow.cc/embed/movie/{imdb}` and `/embed/tv/{imdb}/{s}/{e}`
- TheFlixer scraper: `/api/flixer/movies` → 32 latest movies; posters from `f.woowoowoowoo.net` (no proxy needed)
- TheFlixer URL pattern: `/movie/watch-{slug}-full-{id}` (SAMEORIGIN on their pages — embed not possible)

## Tabs
1. **Movies** — 322+ movies (32 from TheFlixer + 290 from MovieBox), genre filter tabs including "New Releases", hero banner
2. **Drama** — K-Drama, C-Drama, Thai-Drama, SA Drama, Turkish, Nollywood, Must-watch Black Shows
3. **Anime** — MovieBox Anime (English Dubbed) + Jikan top airing + genre browse
4. **Live TV** — 4 sub-tabs:
   - 🎬 **Highlights & Replays** — Scorebat football match highlights with inline player
   - 🔴 **Live Streams** — 8 football stream sites (SportSurge, StreamEast, VIPBox, etc.)
   - 📺 **Live TV** — 37 channels across Kenya, Nigeria, South Africa, Ghana, International, Sports; YouTube Live inline player; category filter; channel cards with colored logo, country flag, StarTimes package badge
   - 📡 **StarTimes Guide** — Nova/Smart/Classic/Super packages with channel listings + subscribe links; featured StarTimes channels; StarTimes Kenya contact info
5. **Developer** — Contact: Ignatius, WhatsApp/Phone +254706535581

## Live TV Channels (37)
- **Kenya (9)**: NTV, Citizen TV, KBC, KTN News, K24, Ebru TV, Inooro TV, Ramogi TV, Hot96 FM TV
- **Nigeria (5)**: Channels TV, Arise News, TVC, NTA Network, Wazobia TV
- **South Africa (4)**: SABC News, eNCA, Newzroom Afrika, 3Talk SA
- **Ghana (3)**: JoyNews, TV3 Ghana, GTV Ghana
- **International News (11)**: Al Jazeera, DW News, France 24, BBC News, CNN, TRT World, Sky News, NHK World, Africa News, CGTN Africa, RT News, Euronews
- **Sports (6)**: SuperSport, ESPN FC, Sky Sports, BT Sport/TNT, beIN Sports, DAZN, Eurosport
- All channels use `youtube.com/embed/live_stream?channel={YOUTUBE_CHANNEL_ID}` — no CORS issues

## Development
- `npm run dev` — starts both servers (concurrently): Express on 3001, Vite on 5000

## Deployment
- Build: `npm run build` → `dist/`
- Server: Node.js (Express) must run alongside Vite/static build
