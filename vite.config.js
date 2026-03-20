import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    proxy: {
      '/proxy/omdb': {
        target: 'https://www.omdbapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/omdb/, ''),
        secure: false,
      },
      '/proxy/tvmaze': {
        target: 'https://api.tvmaze.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/tvmaze/, ''),
        secure: false,
      },
      '/proxy/jikan': {
        target: 'https://api.jikan.moe/v4',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/jikan/, ''),
        secure: false,
      },
      '/proxy/scorebat': {
        target: 'https://www.scorebat.com/video-api/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/scorebat/, ''),
        secure: false,
      },
      '/stream-proxy': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
