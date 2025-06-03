// noiseReductionCommand.js

/**
 * Generate FFmpeg command for video noise reduction.
 * @param {string} inputFilename - Original file name, e.g. "video.mp4"
 * @param {string} filterType - Filter to use: "hqdn3d" or "nlmeans"
 * @param {number} strength - Strength, mapped from 0.0–1.0 (e.g. 0.5)
 * @returns {string} FFmpeg command or empty string if params invalid
 */
function generateNoiseReductionCommand(inputFilename, filterType, strength) {
  if (
    !inputFilename ||
    !filterType ||
    typeof strength !== "number"
  ) {
    return "";
  }

  const parts = inputFilename.split(".");
  const base = parts.slice(0, -1).join(".");
  const ext = parts.length > 1 ? parts[parts.length - 1] : "mp4";
  const outputFile = `${base}_denoised.${ext}`;

  // Map strength (0-1) to filter parameter range (here 0–10 for demo)
  const mappedStrength = (strength * 10).toFixed(2);

  let filter = "";
  switch (filterType) {
    case "hqdn3d":
      // hqdn3d=luma_spatial:chroma_spatial:luma_tmp:chroma_tmp
      filter = `hqdn3d=${mappedStrength}:${mappedStrength}:${mappedStrength}:${mappedStrength}`;
      break;
    case "nlmeans":
      // nlmeans=s=strength
      filter = `nlmeans=s=${mappedStrength}`;
      break;
    default:
      return "";
  }

  return `ffmpeg -i "${inputFilename}" -vf "${filter}" -c:a copy "${outputFile}"`;
}

export { generateNoiseReductionCommand };


// import { generateNoiseReductionCommand } from './noiseReductionCommand';

// const denoiseCmd = generateNoiseReductionCommand("sample.mp4", "hqdn3d", 0.6);
// // ffmpeg -i "sample.mp4" -vf "hqdn3d=6.00:6.00:6.00:6.00" -c:a copy "sample_denoised.mp4"
