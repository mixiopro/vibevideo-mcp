// watermarkRemoverCommand.js

/**
 * Generate FFmpeg command to remove a logo/watermark using delogo or inpaint filter.
 * @param {string} inputFilename - Source video file (e.g., "video.mp4")
 * @param {number} x - X coordinate of top-left corner
 * @param {number} y - Y coordinate of top-left corner
 * @param {number} width - Width of logo region
 * @param {number} height - Height of logo region
 * @param {'delogo'|'inpaint'} filterType - Removal filter
 * @returns {string} FFmpeg command or empty string if params invalid
 */
function generateWatermarkRemoverCommand(inputFilename, x, y, width, height, filterType) {
  if (
    !inputFilename ||
    typeof x !== "number" || typeof y !== "number" ||
    typeof width !== "number" || typeof height !== "number" ||
    !filterType
  ) {
    return "";
  }

  const parts = inputFilename.split(".");
  const base = parts.slice(0, -1).join(".");
  const ext = parts.length > 1 ? parts[parts.length - 1] : "mp4";
  const outputFile = `${base}_no_watermark.${ext}`;

  let filter = "";
  if (filterType === "delogo") {
    filter = `delogo=x=${x}:y=${y}:w=${width}:h=${height}:show=0`;
  } else if (filterType === "inpaint") {
    filter = `inpaint=x=${x}:y=${y}:w=${width}:h=${height}:radius=15:iterations=5`;
  } else {
    return "";
  }

  return `ffmpeg -i "${inputFilename}" -vf "${filter}" -c:a copy "${outputFile}"`;
}

export { generateWatermarkRemoverCommand };
