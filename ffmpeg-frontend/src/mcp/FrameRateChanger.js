// frameRateCommand.js

/**
 * Generate FFmpeg command for changing video frame rate.
 * @param {string} inputFilename - Original file name, e.g. "input.mp4"
 * @param {string|number} frameRate - Desired frame rate ("24", "30", etc.)
 * @returns {string} FFmpeg command or empty string if params invalid
 */
function generateFrameRateCommand(inputFilename, frameRate) {
  if (!inputFilename || !frameRate) return "";

  const parts = inputFilename.split(".");
  const base = parts.slice(0, -1).join(".");
  const ext = parts.length > 1 ? parts[parts.length - 1] : "mp4";
  const outputFile = `${base}_${frameRate}fps.${ext}`;

  // Always re-encode for frame rate changes for compatibility
  return `ffmpeg -i "${inputFilename}" -r ${frameRate} -c:v libx264 -c:a aac -strict experimental "${outputFile}"`;
}

export { generateFrameRateCommand };
