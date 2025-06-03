// audioVisualizerCommands.js

/**
 * Generate an FFmpeg command for audio visualization (showfreqs, aspectrum, etc.).
 *
 * @param {string} inputFilename - The name of the input file.
 * @param {"showfreqs"|"aspectrum"|""} type - The type of visualization.
 * @param {string} size - The output video size, e.g., "1280x720".
 * @param {string} mode - The visualization mode ("line", "bar", "dot", etc.).
 * @returns {string} The generated FFmpeg command, or an empty string if invalid.
 */
export function generateAudioVisualizationCommand(inputFilename, type, size, mode) {
  if (!inputFilename || !type || !size || !mode) {
    return "";
  }

  const baseName = inputFilename.split('.')[0];
  const outputFileName = `${baseName}_${type}.mp4`;

  // Build the filter string
  const filterString = `${type}=s=${size}:mode=${mode}`;

  // Compose the FFmpeg command
  return `ffmpeg -i "${inputFilename}" -filter_complex "[0:a]${filterString}[v]" -map "[v]" -map 0:a -c:v libx264 -c:a aac -strict experimental "${outputFileName}"`;
}
