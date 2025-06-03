// segmentHlsCommand.js

/**
 * Generate FFmpeg command for segmenting media into HLS playlist and segments.
 * @param {string} inputFilename - Original file name, e.g. "video.mp4"
 * @param {number|string} segmentDuration - Duration (seconds) for each segment, e.g. 10
 * @returns {string} FFmpeg command or empty string if params invalid
 */
function generateSegmentHlsCommand(inputFilename, segmentDuration) {
  if (
    !inputFilename ||
    (!segmentDuration && segmentDuration !== 0) ||
    isNaN(Number(segmentDuration)) ||
    Number(segmentDuration) <= 0
  ) {
    return "";
  }

  const parts = inputFilename.split(".");
  const base = parts.slice(0, -1).join(".");
  const outputFile = `${base}.m3u8`;

  // Basic command for HLS segmentation
  // -hls_time: segment duration in seconds
  // -hls_list_size 0: keep all segments in the playlist (for VOD)
  // -f hls: output format
  // -c copy: fast, copies codec streams if compatible
  return `ffmpeg -i "${inputFilename}" -c copy -hls_time ${segmentDuration} -hls_list_size 0 -f hls "${outputFile}"`;
}

export { generateSegmentHlsCommand };
