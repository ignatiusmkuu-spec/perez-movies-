# Perez Movies

A React-based movie browsing web application.

## Tech Stack
- **Frontend**: React 18 + Vite 5
- **Language**: JavaScript (JSX)
- **Styling**: Plain CSS (component-level)
- **Package Manager**: npm

## Project Structure
```
perez-movies/
├── src/
│   ├── components/
│   │   ├── MovieCard.jsx       # Individual movie card component
│   │   ├── MovieCard.css
│   │   ├── SearchBar.jsx       # Search input component
│   │   └── SearchBar.css
│   ├── App.jsx                 # Main app with filtering logic
│   ├── App.css
│   ├── main.jsx                # React entry point
│   └── index.css               # Global styles
├── index.html
├── vite.config.js              # Vite config (host: 0.0.0.0, port: 5000, allowedHosts: true)
└── package.json
```

## Development
- Run: `npm run dev` — starts Vite dev server on port 5000
- Build: `npm run build` — outputs to `dist/`

## Features
- Browse a curated list of movies
- Filter by genre (All, Action, Crime, Drama, Sci-Fi)
- Search movies by title
- Movie cards show title, year, genre, rating, and description

## Deployment
- Target: Static
- Build command: `npm run build`
- Public dir: `dist`
