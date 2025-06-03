// streamExtractionCommand.js

/**
 * Generate FFmpeg command to extract audio or video stream.
 * @param {string} inputFilename - Original file name (e.g. "movie.mp4")
 * @param {"audio"|"video"} extractionType - Extraction type ("audio" or "video")
 * @param {string} outputFormat - Output format (e.g. "mp3", "mp4", "mkv")
 * @returns {string} FFmpeg command or empty string if params invalid
 */
function generateStreamExtractionCommand(inputFilename, extractionType, outputFormat) {
  if (
    !inputFilename ||
    !extractionType ||
    !outputFormat
  ) {
    return "";
  }

  const base = inputFilename.split(".")[0];
  const outputFile = `${base}_extracted.${outputFormat}`;
  let command = `ffmpeg -i "${inputFilename}"`;

  if (extractionType === "audio") {
    command += " -vn";
    switch (outputFormat) {
      case "mp3":
        command += " -acodec libmp3lame -ab 192k";
        break;
      case "wav":
        command += " -acodec pcm_s16le";
        break;
      case "aac":
        command += " -acodec aac";
        break;
      case "flac":
        command += " -acodec flac";
        break;
      default:
        return "";
    }
  } else if (extractionType === "video") {
    command += " -an -vcodec copy";
  } else {
    return "";
  }

  command += ` "${outputFile}"`;
  return command;
}

export { generateStreamExtractionCommand };
