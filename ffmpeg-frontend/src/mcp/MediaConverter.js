// mediaConvertCommand.js

/**
 * Generate FFmpeg command for converting a media file to a different format and codec.
 * @param {string} inputFilename - Original file name (e.g., "input.mov")
 * @param {string} format - Output format (e.g., "mp4", "mp3", "gif", etc.)
 * @param {string} codec - Codec (e.g., "libx264", "aac"). Optional.
 * @returns {string} FFmpeg command or empty string if params invalid
 */
function generateConvertCommand(inputFilename, format, codec) {
  if (!inputFilename || !format) return "";

  const outputFile = `${inputFilename.replace(/\.[^/.]+$/, '')}.${format}`;
  let command = `ffmpeg -i "${inputFilename}"`;

  if (codec) {
    // Video and audio codec separation
    const videoCodecs = ["libx264", "libx265", "vp9", "mpeg4", "libxvid"];
    const audioCodecs = ["libmp3lame", "aac"];

    if (videoCodecs.includes(codec)) {
      command += ` -c:v ${codec}`;
    } else if (audioCodecs.includes(codec)) {
      command += ` -c:a ${codec}`;
    }

    // Add stream copy or disable streams based on output type
    if (["mp4", "avi", "mkv", "mov", "gif", "webp"].includes(format) && videoCodecs.includes(codec)) {
      command += ` -c:a copy`;
    } else if (["mp3", "wav", "aac", "flac"].includes(format) && audioCodecs.includes(codec)) {
      command += ` -c:v copy`;
    } else if (videoCodecs.includes(codec) && ["mp3", "wav", "aac", "flac"].includes(format)) {
      command += ` -vn`; // Video-to-audio: disable video
    } else if (audioCodecs.includes(codec) && ["mp4", "avi", "mkv", "mov"].includes(format)) {
      command += ` -an`; // Audio-to-video: disable audio
    }
  } else {
    // Default behavior when no codec is selected or for formats that require re-encoding
    if (!["gif", "webp", "wav", "flac"].includes(format)) {
      command += ` -c copy`;
    } else if (["gif", "webp"].includes(format)) {
      command += ` -vf "fps=10,scale=320:-1:flags=lanczos"`;
    }
  }

  command += ` "${outputFile}"`;
  return command;
}

export { generateConvertCommand };


// import { generateConvertCommand } from './mediaConvertCommand';

// const convertCmd1 = generateConvertCommand("myvideo.mov", "mp4", "libx264");
// // ffmpeg -i "myvideo.mov" -c:v libx264 -c:a copy "myvideo.mp4"

// const convertCmd2 = generateConvertCommand("song.wav", "mp3", "libmp3lame");
// // ffmpeg -i "song.wav" -c:a libmp3lame -c:v copy "song.mp3"

// const convertCmd3 = generateConvertCommand("movie.mkv", "gif", "");
// // ffmpeg -i "movie.mkv" -vf "fps=10,scale=320:-1:flags=lanczos" "movie.gif"

