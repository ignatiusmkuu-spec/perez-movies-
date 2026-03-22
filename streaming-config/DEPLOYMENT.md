# Ignite Movies — Complete Streaming System Deployment Guide

## Architecture Overview

```
Browser
  │
  ├─ GET /stream/hls/{token}/master.m3u8   ← Proxy HLS (hidden URL)
  ├─ GET /stream/seg/{token}/{base64url}   ← Proxied segment (cached)
  ├─ GET /stream/dash/{token}/manifest.mpd ← Proxy DASH
  └─ GET /api/*                            ← REST API
          │
          ▼
      Nginx (80/443/1935)
          │
          ├── Proxy cache (Nginx disk cache: /var/cache/nginx)
          │
          ▼
      Node.js Express API (port 3001)
          │
          ├── server/streaming/proxy.js   ← Fetches real stream, rewrites URLs
          ├── server/streaming/token.js   ← JWT auth
          ├── server/streaming/servers.js ← Health checks, failover
          └── server/streaming/db.js      ← Movie/source metadata
          │
          ▼
      External Stream Servers (hidden from client)
          ├── CDN Server 1 (PRIMARY_STREAM_URL)
          ├── CDN Server 2 (BACKUP_STREAM_URL)
          └── DASH Server  (DASH_STREAM_URL)
```

---

## Environment Variables

Create a `.env` file (never commit to git):

```env
# JWT signing secret — CHANGE THIS in production
STREAM_SECRET=your-very-long-random-secret-here

# Streaming server URLs
PRIMARY_STREAM_URL=https://cdn1.yourstream.com
BACKUP_STREAM_URL=https://cdn2.yourstream.com
DASH_STREAM_URL=https://dash.yourstream.com
CDN_BASE_URL=https://cdn.yourstream.com

# CORS (comma-separated allowed origins)
CORS_ORIGINS=https://yourdomain.com,https://stream.yourdomain.com

# Health check interval
HEALTH_CHECK_INTERVAL_MS=30000

# OMDB API key (for IMDB lookups)
OMDB_API_KEY=your-omdb-key
```

Generate a strong `STREAM_SECRET`:
```bash
openssl rand -hex 64
```

---

## Option A: VPS Deployment (Ubuntu 22.04)

### 1. Server Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU      | 2 vCPU  | 4–8 vCPU   |
| RAM      | 2 GB    | 8–16 GB    |
| Disk     | 50 GB   | 500 GB SSD  |
| Bandwidth| 1 Gbps  | 10 Gbps    |
| OS       | Ubuntu 22.04 | Ubuntu 22.04 |

### 2. Install System Dependencies

```bash
# System update
sudo apt update && sudo apt upgrade -y

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# Nginx with RTMP module
sudo apt install -y nginx libnginx-mod-rtmp

# FFmpeg (video encoding)
sudo apt install -y ffmpeg

# GPAC / MP4Box (DASH packaging)
sudo apt install -y gpac

# PM2 (process manager)
sudo npm install -g pm2

# Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx

# Create cache directories
sudo mkdir -p /var/cache/nginx/segments /var/cache/nginx/playlists
sudo chown -R www-data:www-data /var/cache/nginx

# Create stream directories
sudo mkdir -p /var/www/streams/{hls,dash,vod} /var/www/public/uploads
sudo chown -R $USER:$USER /var/www
```

### 3. Deploy Application

```bash
# Clone / upload your project
git clone https://github.com/yourrepo/ignite-movies /opt/ignite-movies
cd /opt/ignite-movies

# Install Node dependencies
npm install

# Set environment variables
cp .env.example .env
nano .env    # Fill in all values

# Build frontend
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name:     'ignite-api',
      script:   'server/index.js',
      env:      { NODE_ENV: 'production', PORT: 3001 },
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      error_file: '/var/log/ignite/api-error.log',
      out_file:   '/var/log/ignite/api-out.log',
    }
  ]
};
```

### 4. Configure Nginx

```bash
# Copy config
sudo cp streaming-config/nginx-rtmp.conf /etc/nginx/nginx.conf

# Edit domain names
sudo sed -i 's/yourdomain.com/YOUR_ACTUAL_DOMAIN.com/g' /etc/nginx/nginx.conf

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d stream.yourdomain.com

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

### 5. Firewall

```bash
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw allow 1935/tcp   # RTMP (live streaming)
sudo ufw allow 3478/udp   # STUN/TURN (WebRTC)
sudo ufw enable
```

---

## Option B: Docker Compose Deployment

```bash
# Install Docker
curl -fsSL https://get.docker.com | bash

# Copy and configure
cd streaming-config
cp .env.example .env
nano .env   # Edit all values

# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f api

# Check status
docker compose ps
```

Services started:
- `nginx-rtmp`  — Nginx streaming server (ports 80, 443, 1935)
- `api`         — Node.js Express API (port 3001)
- `frontend`    — React/Vite frontend (port 5000)
- `postgres`    — Database (port 5432)
- `redis`       — Rate limiting cache (port 6379)
- `coturn`      — WebRTC TURN/STUN (port 3478)
- `encoder`     — FFmpeg worker

---

## Option C: Kubernetes Deployment

```bash
# Apply all manifests
kubectl apply -f streaming-config/kubernetes.yml

# Check status
kubectl get pods -n ignite-movies
kubectl get svc  -n ignite-movies

# View logs
kubectl logs -f deployment/ignite-api -n ignite-movies

# Scale API replicas
kubectl scale deployment ignite-api --replicas=5 -n ignite-movies

# Update secrets
kubectl edit secret ignite-secrets -n ignite-movies
```

---

## API Usage Examples

### 1. Add a movie with HLS source

```bash
# Create movie
curl -X POST https://yourdomain.com/api/movies \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Interstellar",
    "year": 2014,
    "genre": "Sci-Fi",
    "imdbId": "tt0816692"
  }'

# Response: { "success": true, "data": { "id": "abc-123", ... } }

# Add HLS streaming source
curl -X POST https://yourdomain.com/api/movies/abc-123/sources \
  -H "Content-Type: application/json" \
  -d '{
    "protocol": "hls",
    "url": "https://yourcdn.com/movies/interstellar/master.m3u8",
    "quality": "auto",
    "isPrimary": true
  }'
```

### 2. Generate a tokenized proxy stream URL

```bash
curl -X POST https://yourdomain.com/api/stream/token \
  -H "Content-Type: application/json" \
  -d '{
    "movieId": "abc-123",
    "quality": "auto",
    "protocol": "hls",
    "bindIp": false,
    "ttl": 14400
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "token": "eyJhbGci...",
#     "streamUrl": "https://yourdomain.com/stream/hls/eyJhbGci.../master.m3u8",
#     "expiresIn": 14400,
#     "server": "Primary HLS"
#   }
# }
```

### 3. Use proxy URL in the player

```
https://yourdomain.com/player.html
  ?t=Interstellar
  &y=2014
  &proxy=1
  &s0=/stream/hls/eyJhbGci.../master.m3u8
  &n0=Server+1
```

### 4. Get full stream manifest (all qualities + protocols)

```bash
curl https://yourdomain.com/api/stream/manifest/abc-123
```

### 5. Check server health

```bash
curl https://yourdomain.com/api/stream/health

# Response:
# {
#   "success": true,
#   "allHealthy": true,
#   "servers": [
#     { "id": "primary", "healthy": true, "failCount": 0 },
#     { "id": "backup1", "healthy": true, "failCount": 0 }
#   ]
# }
```

### 6. Trigger manual server failover

```bash
curl -X POST https://yourdomain.com/api/stream/failover \
  -H "Content-Type: application/json" \
  -d '{ "fromServerId": "primary" }'
```

### 7. Get FFmpeg encoding pipeline for a movie

```bash
curl "https://yourdomain.com/api/encode/pipeline/abc-123?input=/uploads/movie.mp4"
```

---

## FFmpeg Encoding Guide

### Single movie — all qualities + HLS master

```bash
chmod +x streaming-config/ffmpeg-encode.sh
./streaming-config/ffmpeg-encode.sh /path/to/input.mp4 abc-123
```

Outputs:
```
/var/www/streams/abc-123/
  master.m3u8          ← HLS master (serve this URL)
  360p/playlist.m3u8
  480p/playlist.m3u8
  720p/playlist.m3u8
  1080p/playlist.m3u8
  360p/segment000.ts ... (6s segments)
  manifest.mpd         ← DASH manifest
  poster.jpg
  stream-info.json
```

### Manual FFmpeg — single quality

```bash
# 720p HLS
ffmpeg -i input.mp4 \
  -vf "scale=1280:720" -c:v libx264 -b:v 2800k \
  -c:a aac -b:a 192k \
  -f hls -hls_time 6 -hls_playlist_type vod \
  -hls_segment_filename /var/www/streams/MOVIE_ID/720p/seg%03d.ts \
  /var/www/streams/MOVIE_ID/720p/playlist.m3u8
```

### Live RTMP streaming (OBS → Nginx)

OBS settings:
- Server: `rtmp://yourdomain.com/live`
- Stream key: `your-stream-key`

The stream becomes available at:
- HLS:  `https://yourdomain.com/streams/hls/live/your-stream-key/playlist.m3u8`
- DASH: `https://yourdomain.com/streams/dash/live/your-stream-key/manifest.mpd`

---

## Security Configuration

### JWT Token Security

Tokens expire after 4 hours by default. Configure via:
- `ttl` parameter in `/api/stream/token` request
- `STREAM_SECRET` env var (must be long and random)
- `bindIp: true` to pin token to client IP

### Rate Limiting

| Endpoint | Limit |
|----------|-------|
| All routes | 200 req/min |
| `/api/stream/*` | 60 req/min |
| `/stream/` (proxy) | 600 req/min |

### Anti-Hotlinking (Nginx)

Add to your Nginx `server` block:
```nginx
location /streams/ {
    valid_referers none blocked yourdomain.com *.yourdomain.com;
    if ($invalid_referer) {
        return 403;
    }
}
```

---

## Performance Tuning

### Speed Targets

| Metric | Target |
|--------|--------|
| Time to first frame | < 1.5s |
| Buffering (after start) | < 0.1% of sessions |
| Segment cache hit rate | > 80% |
| API p99 latency | < 200ms |

### Nginx Cache Monitoring

```bash
# Cache hit rate
grep -c "HIT" /var/log/nginx/ignite_access.log

# Cache size
du -sh /var/cache/nginx/segments

# Clear cache (force re-fetch from upstream)
sudo rm -rf /var/cache/nginx/segments/*
```

### Node.js Memory Monitor

```bash
pm2 monit

# Increase Node heap if needed
NODE_OPTIONS="--max-old-space-size=4096" pm2 restart ignite-api
```

---

## Monitoring & Logs

```bash
# Application logs
pm2 logs ignite-api

# Nginx access log (streaming)
sudo tail -f /var/log/nginx/ignite_access.log

# Check segment cache stats
curl https://yourdomain.com/stream/cache/stats

# Server health
curl https://yourdomain.com/api/stream/health

# RTMP statistics (internal only)
curl http://localhost/rtmp-stat
```

---

## CDN Integration (CloudFlare / AWS CloudFront)

1. Point CloudFront/CloudFlare to your origin: `stream.yourdomain.com`
2. Set cache rules:
   - `*.ts`, `*.m4s`, `*.mp4` → Cache 24h
   - `*.m3u8`, `*.mpd` → Cache 10s (or no-cache for live)
   - `/api/*` → No cache, pass through
   - `/stream/*` → Short cache (10s) or no-cache

```bash
# AWS CloudFront example distribution config
# Set origin to: stream.yourdomain.com
# Behaviors:
#   /streams/*.ts     → Cache TTL: 86400s
#   /streams/*.m3u8   → Cache TTL: 10s
#   /api/*            → No cache, forward all headers
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Stream token required (401)` | Generate a token first via `/api/stream/token` |
| `Stream denied: token_not_found (403)` | Token expired or invalid — regenerate |
| `No HLS source found (404)` | Add a source via `/api/movies/{id}/sources` |
| Player shows "Stream unavailable" | Check `/api/stream/health` — servers may be down |
| High buffering | Increase Nginx cache zone size; check upstream CDN latency |
| CORS errors | Add your domain to `CORS_ORIGINS` env var |
| Nginx 502 | Check PM2 process: `pm2 status ignite-api` |
| m3u8 segments failing | Check Nginx error log; may be upstream auth issue |
