// mediaClipJoinCommand.js

/**
 * Generate FFmpeg command to trim a media file.
 * @param {string} inputFilename - Source file (e.g. "input.mp4").
 * @param {string} start - Start time ("00:01:23" or "83.0"), optional.
 * @param {string} end - End time ("00:02:00" or "120.0"), optional.
 * @returns {string} FFmpeg trim command or empty string if parameters are missing.
 */
function generateTrimCommand(inputFilename, start, end) {
  if (!inputFilename || (!start && !end)) return "";
  const ext = inputFilename.split('.').pop();
  const base = inputFilename.replace(/\.[^/.]+$/, '');
  const outputFile = `${base}_trimmed.${ext}`;
  let command = `ffmpeg -i "${inputFilename}"`;
  if (start) command += ` -ss ${start}`;
  if (end) command += ` -to ${end}`;
  command += ` -c copy "${outputFile}"`;
  return command;
}

/**
 * Generate example FFmpeg join command using concat demuxer.
 * Real joining requires a file list, which is created backend-side.
 * @returns {string} Example FFmpeg join command.
 */
function generateJoinCommandExample() {
  return `ffmpeg -y -f concat -safe 0 -i file_list.txt -c:v libx264 -c:a aac -movflags +faststart output.mp4`;
}

export { generateTrimCommand, generateJoinCommandExample };


// import { generateTrimCommand, generateJoinCommandExample } from './mediaClipJoinCommand';

// // For trimming
// const trimCmd = generateTrimCommand("movie.mp4", "00:00:10", "00:00:25");
// // ffmpeg -i "movie.mp4" -ss 00:00:10 -to 00:00:25 -c copy "movie_trimmed.mp4"

// // For joining (display/example)
// const joinCmd = generateJoinCommandExample();
// // ffmpeg -y -f concat -safe 0 -i file_list.txt -c:v libx264 -c:a aac -movflags +faststart output.mp4
