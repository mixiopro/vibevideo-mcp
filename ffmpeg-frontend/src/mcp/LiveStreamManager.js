// // ffmpegLiveStreamCommand.js

/**
 * Generate FFmpeg command for streaming a file via RTMP.
 * @param {string} inputFilename - Name of the media file, e.g., "myvideo.mp4"
 * @param {string} rtmpUrl - RTMP server URL, e.g., "rtmp://my-server/live/key"
 * @returns {string} - FFmpeg command string or empty string if params are invalid
 */
function generateLiveStreamCommand(inputFilename, rtmpUrl) {
  if (!inputFilename || !rtmpUrl) return "";
  // -re: read input at native rate (important for streaming)
  // -c copy: stream copy if compatible (fastest), otherwise may need transcoding
  // -f flv: FLV is required for most RTMP servers
  return `ffmpeg -re -i "${inputFilename}" -c copy -f flv "${rtmpUrl}"`;
}

export { generateLiveStreamCommand };


// import { generateLiveStreamCommand } from './ffmpegLiveStreamCommand';

// const cmd = generateLiveStreamCommand(
//   "myvideo.mp4",
//   "rtmp://localhost/live/test"
// );
// console.log(cmd);
// // ffmpeg -re -i "myvideo.mp4" -c copy -f flv "rtmp://localhost/live/test"
