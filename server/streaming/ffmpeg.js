/**
 * FFmpeg integration helpers.
 *
 * These functions generate ready-to-run shell commands for:
 *   - Transcoding uploaded video to multiple quality levels
 *   - Generating HLS playlists (master + variant)
 *   - Generating MPEG-DASH manifests
 *   - Creating thumbnail/poster frames
 *
 * In production: spawn FFmpeg as a child process or hand commands
 * to a job queue (Bull, BullMQ, AWS MediaConvert, etc.)
 *
 * Supported output:
 *   360p  @ 800 kbps video,  128 kbps audio
 *   480p  @ 1400 kbps video, 128 kbps audio
 *   720p  @ 2800 kbps video, 192 kbps audio
 *   1080p @ 5000 kbps video, 320 kbps audio
 */

export const QUALITY_PRESETS = {
  '360p':  { width: 640,  height: 360,  vbitrate: '800k',  abitrate: '128k', crf: 28 },
  '480p':  { width: 854,  height: 480,  vbitrate: '1400k', abitrate: '128k', crf: 26 },
  '720p':  { width: 1280, height: 720,  vbitrate: '2800k', abitrate: '192k', crf: 24 },
  '1080p': { width: 1920, height: 1080, vbitrate: '5000k', abitrate: '320k', crf: 22 },
}

/* ── Generate HLS multi-bitrate encode command ── */
export function hlsEncodeCommand(inputFile, outputDir, movieId) {
  const presets = Object.entries(QUALITY_PRESETS)
  const filterComplex = presets.map((_, i) => `[v:0]split=${presets.length}${presets.map((_, j) => `[v${j}]`).join('')}`).slice(0, 1)[0]
    .replace(`split=${presets.length}`, `split=${presets.length}`)

  const scaleFilters = presets.map(([q, p], i) =>
    `[v${i}]scale=${p.width}:${p.height}:force_original_aspect_ratio=decrease,pad=${p.width}:${p.height}:(ow-iw)/2:(oh-ih)/2,setsar=1[vout${i}]`
  ).join('; ')

  const maps = presets.map(([q, p], i) =>
    `-map [vout${i}] -map a:0 -c:v:${i} libx264 -b:v:${i} ${p.vbitrate} -maxrate:v:${i} ${p.vbitrate} -bufsize:v:${i} ${parseInt(p.vbitrate) * 2}k -c:a:${i} aac -b:a:${i} ${p.abitrate}`
  ).join(' ')

  const streamMaps = presets.map(([_, __], i) => `v:${i},a:${i}`).join(' ')

  const variantStreams = presets.map(([q, p], i) =>
    `${outputDir}/${movieId}/${q}/segment%03d.ts:${outputDir}/${movieId}/${q}/playlist.m3u8`
  ).join(' ')

  return `ffmpeg -i "${inputFile}" \\
  -filter_complex "[v:0]split=${presets.length}${presets.map((_, i) => `[v${i}]`).join('')}; ${scaleFilters}" \\
  ${maps} \\
  -f hls \\
  -hls_time 6 \\
  -hls_playlist_type vod \\
  -hls_flags independent_segments \\
  -hls_segment_type mpegts \\
  -hls_segment_filename "${outputDir}/${movieId}/%v/segment%03d.ts" \\
  -master_pl_name master.m3u8 \\
  -var_stream_map "${streamMaps}" \\
  "${outputDir}/${movieId}/%v/playlist.m3u8"`
}

/* ── Generate HLS master playlist content ── */
export function generateMasterPlaylist(baseUrl, qualities = Object.keys(QUALITY_PRESETS)) {
  const lines = ['#EXTM3U', '#EXT-X-VERSION:3', '']

  for (const q of qualities) {
    const p = QUALITY_PRESETS[q]
    if (!p) continue
    const bw = parseInt(p.vbitrate) * 1000 + parseInt(p.abitrate) * 1000
    lines.push(`#EXT-X-STREAM-INF:BANDWIDTH=${bw},RESOLUTION=${p.width}x${p.height},CODECS="avc1.640028,mp4a.40.2",NAME="${q}"`)
    lines.push(`${baseUrl}/${q}/playlist.m3u8`)
    lines.push('')
  }

  return lines.join('\n')
}

/* ── DASH encoding command ── */
export function dashEncodeCommand(inputFile, outputDir, movieId) {
  const presets = Object.entries(QUALITY_PRESETS)

  const videoOutputs = presets.map(([q, p]) =>
    `-vf scale=${p.width}:${p.height} -b:v ${p.vbitrate} -maxrate ${p.vbitrate} "${outputDir}/${movieId}/${q}/video.mp4"`
  ).join(' \\\n  ')

  return `# Step 1: Encode video tracks
ffmpeg -i "${inputFile}" \\
  ${presets.map(([q, p]) =>
    `-vf "scale=${p.width}:${p.height}:force_original_aspect_ratio=decrease" -c:v libx264 -b:v ${p.vbitrate} -an "${outputDir}/${movieId}/${q}/video.mp4"`
  ).join(' \\\n  ')}

# Step 2: Encode audio track
ffmpeg -i "${inputFile}" -vn -c:a aac -b:a 192k "${outputDir}/${movieId}/audio.mp4"

# Step 3: Package with mp4box (GPAC)
MP4Box \\
  ${presets.map(([q]) => `  -add "${outputDir}/${movieId}/${q}/video.mp4":id=${q} `).join('\\\n')} \\
  -add "${outputDir}/${movieId}/audio.mp4" \\
  -dash 6000 -frag 6000 -rap \\
  -profile onDemand \\
  "${outputDir}/${movieId}/manifest.mpd"`
}

/* ── Generate poster thumbnail ── */
export function thumbnailCommand(inputFile, outputFile, timestampSeconds = 60) {
  const ts = new Date(timestampSeconds * 1000).toISOString().substr(11, 8)
  return `ffmpeg -i "${inputFile}" -ss ${ts} -vframes 1 -vf "scale=1280:720:force_original_aspect_ratio=decrease" -q:v 2 "${outputFile}"`
}

/* ── Get video metadata (probe) ── */
export function probeCommand(inputFile) {
  return `ffprobe -v quiet -print_format json -show_streams -show_format "${inputFile}"`
}

/* ── Watermark overlay ── */
export function watermarkCommand(inputFile, logoFile, outputFile) {
  return `ffmpeg -i "${inputFile}" -i "${logoFile}" \\
  -filter_complex "[1:v]scale=120:60[logo]; [0:v][logo]overlay=W-w-20:20" \\
  -c:a copy "${outputFile}"`
}

/* ── Build complete encoding pipeline summary ── */
export function getEncodingPipeline(inputFile, outputDir, movieId) {
  return {
    probe:      probeCommand(inputFile),
    thumbnail:  thumbnailCommand(inputFile, `${outputDir}/${movieId}/poster.jpg`),
    hls:        hlsEncodeCommand(inputFile, outputDir, movieId),
    dash:       dashEncodeCommand(inputFile, outputDir, movieId),
    masterHls:  generateMasterPlaylist(`/streams/${movieId}`),
  }
}
