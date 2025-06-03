// motionInterpolationCommand.js

/**
 * Generate FFmpeg command for motion interpolation (frame rate upscaling).
 * @param {string} inputFilename - Original file name, e.g. "video.mp4"
 * @param {string|number} fps - Desired output frame rate, e.g. "60"
 * @param {string} mode - Interpolation mode, e.g. "blend", "dup"
 * @returns {string} FFmpeg command or empty string if params invalid
 */
function generateMotionInterpolationCommand(inputFilename, fps, mode) {
  if (
    !inputFilename ||
    !fps ||
    !mode ||
    mode === "Select Mode"
  ) {
    return "";
  }

  // Derive output filename, e.g., video_60fps_blend.mp4
  const parts = inputFilename.split(".");
  const base = parts.slice(0, -1).join(".");
  const ext = parts.length > 1 ? parts[parts.length - 1] : "mp4";
  const outputFile = `${base}_${fps}fps_${mode}.${ext}`;

  // Use minterpolate filter
  const command = `ffmpeg -i "${inputFilename}" -vf "minterpolate=fps=${fps}:mi_mode=${mode}" -c:a copy "${outputFile}"`;

  return command;
}

export { generateMotionInterpolationCommand };


// import { generateMotionInterpolationCommand } from './motionInterpolationCommand';

// const interpCmd = generateMotionInterpolationCommand("sample.mov", "120", "blend");
// // ffmpeg -i "sample.mov" -vf "minterpolate=fps=120:mi_mode=blend" -c:a copy "sample_120fps_blend.mov"
