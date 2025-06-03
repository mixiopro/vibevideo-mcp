// videoStabilizerCommand.js

/**
 * Generate FFmpeg commands for video stabilization (two-pass process).
 * @param {string} inputFilename - Source video file (e.g., "video.mp4")
 * @param {string} strength - "low", "medium", or "high"
 * @returns {string} Combined (multi-line) FFmpeg commands for analyze + stabilize, or empty string if params invalid
 */
function generateVideoStabilizerCommand(inputFilename, strength) {
  if (!inputFilename || !strength || strength === "none") return "";

  const parts = inputFilename.split(".");
  const base = parts.slice(0, -1).join(".");
  const ext = parts.length > 1 ? parts[parts.length - 1] : "mp4";
  const outputFile = `${base}_stabilized.${ext}`;

  // Parameters mapped per strength
  let detectParams = "";
  let transformParams = "";
  switch (strength) {
    case "low":
      detectParams = "shakiness=5:accuracy=5";
      transformParams = "smoothing=5";
      break;
    case "medium":
      detectParams = "shakiness=8:accuracy=8";
      transformParams = "smoothing=10";
      break;
    case "high":
      detectParams = "shakiness=10:accuracy=10";
      transformParams = "smoothing=20";
      break;
    default:
      return "";
  }

  const command1 = `ffmpeg -i "${inputFilename}" -vf "vidstabdetect=${detectParams}" -f null -`;
  const command2 = `ffmpeg -i "${inputFilename}" -vf "vidstabtransform=${transformParams}" -c:a copy "${outputFile}"`;

  // Return both steps as markdown-style steps for UI display
  return `## Step 1: Analyze (creates vidstab.log)\n${command1}\n\n## Step 2: Stabilize (uses vidstab.log)\n${command2}`;
}

export { generateVideoStabilizerCommand };
