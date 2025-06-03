// ffprobeCommand.js

/**
 * Generate an ffprobe command for analyzing a media file.
 * @param {string} inputFilename - Path or name of the media file (e.g., "movie.mp4").
 * @returns {string} FFprobe command string, or empty string if input is invalid.
 */
function generateFFprobeCommand(inputFilename) {
  if (!inputFilename) return "";
  // -v error: only show errors
  // -show_format: show container/format info
  // -show_streams: show audio/video streams
  return `ffprobe -v error -show_format -show_streams "${inputFilename}"`;
}

export { generateFFprobeCommand };

// import { generateFFprobeCommand } from './ffprobeCommand';

// const cmd = generateFFprobeCommand("movie.mp4");
// console.log(cmd);
// // ffprobe -v error -show_format -show_streams "movie.mp4"
