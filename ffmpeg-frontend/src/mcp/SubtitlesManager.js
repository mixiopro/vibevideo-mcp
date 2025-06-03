// subtitlesCommand.js

/**
 * Generate FFmpeg command for subtitle actions (burn-in, extract, remove).
 * @param {string} inputFilename - The video file (e.g., "movie.mp4")
 * @param {string|null} subtitleFilename - Subtitle file name if burning in (e.g., "movie.srt"), otherwise null
 * @param {"burn-in"|"extract"|"remove"|""} actionType - The action to perform
 * @returns {string} FFmpeg command or empty string if invalid
 */
function generateSubtitlesCommand(inputFilename, subtitleFilename, actionType) {
  if (!inputFilename || !actionType) return "";

  const baseName = inputFilename.split(".")[0];
  let command = `ffmpeg -i "${inputFilename}"`;
  let outputFileName = "";

  if (actionType === "burn-in") {
    if (!subtitleFilename) return "";
    outputFileName = `${baseName}_burned-in.${inputFilename.split(".").pop()}`;
    command += ` -vf subtitles='${subtitleFilename}' "${outputFileName}"`;
  } else if (actionType === "extract") {
    outputFileName = `${baseName}.srt`;
    command = `ffmpeg -i "${inputFilename}" -map 0:s:0 "${outputFileName}"`;
  } else if (actionType === "remove") {
    outputFileName = `${baseName}_no-subs.${inputFilename.split(".").pop()}`;
    command += ` -c copy -sn "${outputFileName}"`;
  } else {
    return "";
  }

  return command;
}

export { generateSubtitlesCommand };
