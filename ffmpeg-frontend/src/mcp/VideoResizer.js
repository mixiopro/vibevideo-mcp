// videoResizerCommand.js

/**
 * Generate FFmpeg command for video resizing/scaling.
 * @param {string} inputFilename - Source video file (e.g., "video.mp4")
 * @param {string} resolution - Target resolution ("1920x1080", "custom", etc.)
 * @param {string} [customWidth] - Custom width (used if resolution === "custom")
 * @param {string} [customHeight] - Custom height (used if resolution === "custom")
 * @returns {string} FFmpeg command or empty string if invalid params
 */
function generateVideoResizerCommand(inputFilename, resolution, customWidth = "", customHeight = "") {
  if (!inputFilename || !resolution || resolution === "original") return "";

  let scale = resolution;
  if (resolution === "custom") {
    if (!customWidth || !customHeight) return "";
    scale = `${customWidth}x${customHeight}`;
  }

  const parts = inputFilename.split(".");
  const base = parts.slice(0, -1).join(".");
  const ext = parts.length > 1 ? parts[parts.length - 1] : "mp4";
  const outputFile = `${base}_resized.${ext}`;

  // -vf scale: Resize video
  // -c:v libx264, -c:a aac: Standard browser-compatible codecs
  // -strict experimental: May be needed for AAC in some builds
  const command = `ffmpeg -i "${inputFilename}" -vf scale=${scale} -c:v libx264 -c:a aac -strict experimental "${outputFile}"`;
  return command;
}

export { generateVideoResizerCommand };
