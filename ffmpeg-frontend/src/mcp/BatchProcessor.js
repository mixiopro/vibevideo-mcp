// batchProcessorCommands.js

/**
 * Supported batch operations for FFmpeg batch processing.
 */
const BATCH_OPS = [
  { label: "Convert to MP4 (libx264)", value: "convert_mp4" },
  { label: "Convert to MP3 (libmp3lame)", value: "convert_mp3" },
  { label: "Resize to 720p (1280x720)", value: "resize_720p" },
];

/**
 * Generates an array of FFmpeg commands for the selected files and batch operation.
 *
 * @param {string[]} filenames - Array of filenames (string, not File objects).
 * @param {string} operation - Batch operation (one of: "convert_mp4", "convert_mp3", "resize_720p").
 * @returns {string[]} - Array of FFmpeg command strings.
 */
function generateBatchFFmpegCommands(filenames, operation) {
  if (!operation) return [];

  return filenames.map((name) => {
    const base = name.replace(/\.[^/.]+$/, "");
    let cmd = `ffmpeg -i "${name}"`;
    let out = "";

    if (operation === "convert_mp4") {
      cmd += " -c:v libx264 -c:a aac";
      out = `${base}_converted.mp4`;
    } else if (operation === "convert_mp3") {
      cmd += " -vn -acodec libmp3lame -ab 192k";
      out = `${base}_converted.mp3`;
    } else if (operation === "resize_720p") {
      cmd += " -vf scale=1280:720 -c:a copy";
      const ext = name.split(".").pop();
      out = `${base}_720p.${ext}`;
    }
    return `${cmd} "${out}"`;
  });
}

export { BATCH_OPS, generateBatchFFmpegCommands };
