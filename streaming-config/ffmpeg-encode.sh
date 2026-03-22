#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  Ignite Movies — FFmpeg Encoding Pipeline
#
#  Usage:
#    chmod +x ffmpeg-encode.sh
#    ./ffmpeg-encode.sh /path/to/input.mp4 movie-id
#
#  Requirements:
#    - FFmpeg 6+ with libx264, libx265, aac support
#    - MP4Box (GPAC) for DASH packaging
#    sudo apt install ffmpeg gpac
#
#  Outputs per movie:
#    /var/www/streams/{movieId}/
#      master.m3u8          — HLS master playlist
#      360p/playlist.m3u8   — variant stream
#      480p/playlist.m3u8
#      720p/playlist.m3u8
#      1080p/playlist.m3u8
#      360p/segment*.ts     — TS segments
#      ...
#      manifest.mpd         — DASH manifest
#      poster.jpg           — thumbnail poster
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

INPUT="${1:-}"
MOVIE_ID="${2:-movie-$(date +%s)}"
OUTPUT_DIR="/var/www/streams"

if [[ -z "$INPUT" ]]; then
    echo "Usage: $0 <input_file> [movie-id]"
    exit 1
fi

if ! command -v ffmpeg &>/dev/null; then
    echo "Error: ffmpeg is not installed. Run: sudo apt install ffmpeg"
    exit 1
fi

MOVIE_DIR="${OUTPUT_DIR}/${MOVIE_ID}"
mkdir -p "${MOVIE_DIR}"/{360p,480p,720p,1080p}

echo "═══════════════════════════════════════════════"
echo "  Ignite Movies — FFmpeg Encoding Pipeline"
echo "  Input:    $INPUT"
echo "  Movie ID: $MOVIE_ID"
echo "  Output:   $MOVIE_DIR"
echo "═══════════════════════════════════════════════"

# ── Step 1: Probe input ──────────────────────────────────────
echo ""
echo "[1/5] Probing input file..."
ffprobe -v quiet -print_format json -show_streams -show_format "$INPUT" \
    | python3 -m json.tool 2>/dev/null || true

# ── Step 2: Generate poster thumbnail ───────────────────────
echo ""
echo "[2/5] Generating poster thumbnail..."
ffmpeg -y -i "$INPUT" \
    -ss 00:01:00 \
    -vframes 1 \
    -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" \
    -q:v 2 \
    "${MOVIE_DIR}/poster.jpg"
echo "  → poster.jpg created"

# ── Step 3: HLS multi-bitrate encode ────────────────────────
echo ""
echo "[3/5] Encoding HLS multi-bitrate streams (this may take a while)..."
ffmpeg -y -i "$INPUT" \
    -filter_complex \
    "[v:0]split=4[v1][v2][v3][v4];
     [v1]scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2,setsar=1[vout1];
     [v2]scale=854:480:force_original_aspect_ratio=decrease,pad=854:480:(ow-iw)/2:(oh-ih)/2,setsar=1[vout2];
     [v3]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1[vout3];
     [v4]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[vout4]" \
    -map [vout1] -map a:0 -c:v:0 libx264 -b:v:0 800k  -maxrate:v:0 800k  -bufsize:v:0 1600k -c:a:0 aac -b:a:0 128k \
    -map [vout2] -map a:0 -c:v:1 libx264 -b:v:1 1400k -maxrate:v:1 1400k -bufsize:v:1 2800k -c:a:1 aac -b:a:1 128k \
    -map [vout3] -map a:0 -c:v:2 libx264 -b:v:2 2800k -maxrate:v:2 2800k -bufsize:v:2 5600k -c:a:2 aac -b:a:2 192k \
    -map [vout4] -map a:0 -c:v:3 libx264 -b:v:3 5000k -maxrate:v:3 5000k -bufsize:v:3 10000k -c:a:3 aac -b:a:3 320k \
    -f hls \
    -hls_time 6 \
    -hls_playlist_type vod \
    -hls_flags independent_segments+split_by_time \
    -hls_segment_type mpegts \
    -hls_segment_filename "${MOVIE_DIR}/%v/segment%03d.ts" \
    -master_pl_name master.m3u8 \
    -var_stream_map "v:0,a:0,name:360p v:1,a:1,name:480p v:2,a:2,name:720p v:3,a:3,name:1080p" \
    "${MOVIE_DIR}/%v/playlist.m3u8"

echo "  → HLS streams created"

# ── Step 4: DASH encode (MPEG-DASH) ─────────────────────────
if command -v MP4Box &>/dev/null; then
    echo ""
    echo "[4/5] Encoding MPEG-DASH streams..."

    # Encode separate video tracks
    for quality in 360p 480p 720p 1080p; do
        case $quality in
            360p)  W=640;  H=360;  BR=800k  ;;
            480p)  W=854;  H=480;  BR=1400k ;;
            720p)  W=1280; H=720;  BR=2800k ;;
            1080p) W=1920; H=1080; BR=5000k ;;
        esac
        ffmpeg -y -i "$INPUT" \
            -vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2" \
            -c:v libx264 -b:v "$BR" -an \
            "${MOVIE_DIR}/${quality}/video_dash.mp4"
    done

    # Encode audio
    ffmpeg -y -i "$INPUT" -vn -c:a aac -b:a 192k "${MOVIE_DIR}/audio.mp4"

    # Package with MP4Box
    MP4Box \
        -add "${MOVIE_DIR}/360p/video_dash.mp4":id=1:role=main \
        -add "${MOVIE_DIR}/480p/video_dash.mp4":id=2:role=main \
        -add "${MOVIE_DIR}/720p/video_dash.mp4":id=3:role=main \
        -add "${MOVIE_DIR}/1080p/video_dash.mp4":id=4:role=main \
        -add "${MOVIE_DIR}/audio.mp4":role=main \
        -dash 6000 -frag 6000 -rap \
        -profile onDemand \
        -out "${MOVIE_DIR}/manifest.mpd"

    echo "  → DASH manifest created"
else
    echo "[4/5] MP4Box not found — skipping DASH packaging"
    echo "      Install with: sudo apt install gpac"
fi

# ── Step 5: Generate stream info JSON ───────────────────────
echo ""
echo "[5/5] Writing stream info..."
cat > "${MOVIE_DIR}/stream-info.json" <<EOF
{
  "movieId": "${MOVIE_ID}",
  "encodedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "hls": {
    "master":  "/streams/${MOVIE_ID}/master.m3u8",
    "360p":    "/streams/${MOVIE_ID}/360p/playlist.m3u8",
    "480p":    "/streams/${MOVIE_ID}/480p/playlist.m3u8",
    "720p":    "/streams/${MOVIE_ID}/720p/playlist.m3u8",
    "1080p":   "/streams/${MOVIE_ID}/1080p/playlist.m3u8"
  },
  "dash": {
    "manifest": "/streams/${MOVIE_ID}/manifest.mpd"
  },
  "rtmp": {
    "stream": "rtmp://your-server/vod/${MOVIE_ID}"
  },
  "poster":  "/streams/${MOVIE_ID}/poster.jpg"
}
EOF

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✓ Encoding complete!"
echo ""
echo "  HLS master:    https://stream.yourdomain.com/streams/${MOVIE_ID}/master.m3u8"
echo "  DASH manifest: https://stream.yourdomain.com/streams/${MOVIE_ID}/manifest.mpd"
echo "  RTMP stream:   rtmp://stream.yourdomain.com/vod/${MOVIE_ID}"
echo "  Poster:        https://stream.yourdomain.com/streams/${MOVIE_ID}/poster.jpg"
echo "═══════════════════════════════════════════════"
