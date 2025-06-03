// ffmpegGifWebpCommand.js

/**
 * Generate FFmpeg commands for GIF (palette workflow) or WebP.
 * @param {string} inputFilename  Original file name, e.g. "video.mp4"
 * @param {string} startTime      Start time (e.g. "00:00:03" or "3"), optional
 * @param {string} duration       Duration in seconds (e.g. "8" or "00:00:08"), optional
 * @param {"gif"|"webp"} format   "gif" for palette workflow, "webp" for animated webp
 * @param {string|number} scaleHeight  Height in pixels (e.g. "320"), maintains aspect
 * @param {string|number} fps     Output frames per second (e.g. "10")
 * @returns {string}              Displayable FFmpeg command (or empty string on invalid input)
 */
function generateGifWebpCommand(inputFilename, startTime, duration, format, scaleHeight, fps) {
  if (!inputFilename || !format || !scaleHeight || !fps) return "";

  const base = inputFilename.split('.').slice(0, -1).join('.') || inputFilename;
  let commonOptions = "";
  if (startTime) commonOptions += ` -ss ${startTime}`;
  if (duration)  commonOptions += ` -t ${duration}`;
  const videoFilter = `fps=${fps},scale=-1:${scaleHeight}:flags=lanczos`;

  if (format === "gif") {
    // Two-step palette workflow
    const palette = `${base}_palette.png`;
    const output  = `${base}_clip.gif`;
    const step1 = `ffmpeg${commonOptions} -i "${inputFilename}" -vf "${videoFilter},palettegen" -y "${palette}"`;
    const step2 = `ffmpeg${commonOptions} -i "${inputFilename}" -i "${palette}" -filter_complex "${videoFilter}[x];[x][1:v]paletteuse" -y "${output}"`;
    return `## Step 1: Generate Palette\n${step1}\n\n## Step 2: Create GIF using Palette\n${step2}`;
  }

  if (format === "webp") {
    // Animated WebP (lossy, Q80, can tweak)
    const output = `${base}_clip.webp`;
    return `ffmpeg${commonOptions} -i "${inputFilename}" -vf "${videoFilter}" -vcodec libwebp -lossless 0 -q:v 80 -y "${output}"`;
  }

  return "";
}

export { generateGifWebpCommand };

// import { generateGifWebpCommand } from './ffmpegGifWebpCommand';

// const cmd = generateGifWebpCommand(
//   "video.mp4",
//   "00:00:05", // startTime
//   "10",       // duration
//   "gif",      // format
//   320,        // scaleHeight
//   12          // fps
// );
// console.log(cmd);
