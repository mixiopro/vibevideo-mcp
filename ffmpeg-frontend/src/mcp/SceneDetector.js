/**
 * Generate FFmpeg command for scene detection in video.
 * @param {string} inputFilename - Original file name, e.g. "video.mp4"
 * @param {number} sensitivity - Scene sensitivity, 0.0 (most scenes) to 1.0 (fewest scenes)
 * @returns {string} FFmpeg command or empty string if params invalid
 */
function generateSceneDetectCommand(inputFilename, sensitivity) {
  if (!inputFilename || typeof sensitivity !== "number") return "";
  // Clamp and format sensitivity for FFmpeg
  const v = Math.max(0, Math.min(1, sensitivity)).toFixed(2);
  // This does NOT produce an output file; scenes are detected and results printed to stderr/stdout
  return `ffmpeg -i "${inputFilename}" -vf "select='gt(scene,${v})',showinfo" -f null -`;
}

export { generateSceneDetectCommand };
