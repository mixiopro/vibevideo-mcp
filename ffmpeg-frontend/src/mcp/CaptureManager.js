// captureCommandGenerator.js

/**
 * Device options for capture (sample list, not exhaustive).
 * Values are in the format: "ffmpeg_format,input"
 */
const DEVICE_OPTIONS = [
  { label: "Webcam (Windows - dshow)", value: "dshow,video=\"Integrated Camera\"" },
  { label: "Screen (Windows - gdigrab)", value: "gdigrab,title=\"Desktop\"" },
  { label: "Webcam (Linux - v4l2)", value: "v4l2,/dev/video0" },
  { label: "Screen (Linux - x11grab)", value: "x11grab,:0.0" },
  { label: "Webcam (FaceTime HD, macOS)", value: "avfoundation,0:0" },
  { label: "Screen (macOS - Capture screen 0)", value: "avfoundation,3:none" },
  // Add more as needed
];

/**
 * Generate FFmpeg command for screen or webcam capture.
 * @param {string} deviceValue - E.g. "avfoundation,3:none"
 * @param {string} resolution - E.g. "1920x1080"
 * @param {string} framerate - E.g. "30"
 * @returns {string} The FFmpeg command.
 */
function generateCaptureCommand(deviceValue, resolution, framerate) {
  if (!deviceValue || !resolution || !framerate) return "";

  const parts = deviceValue.split(",");
  if (parts.length < 2) return "";

  const format = parts[0];
  const input = parts.slice(1).join(",");
  const outputFile = `capture_${Date.now()}.mp4`;

  let cmd = "";
  if (format === "avfoundation") {
    cmd = `ffmpeg -f avfoundation -framerate ${framerate} -video_size ${resolution} -i "${input}" -c:v libx264 -pix_fmt yuv420p -preset ultrafast -crf 23 "${outputFile}"`;
  } else {
    cmd = `ffmpeg -f ${format} -s ${resolution} -r ${framerate} -i "${input}" -c:v libx264 -pix_fmt yuv420p -preset ultrafast -crf 23 "${outputFile}"`;
  }
  return cmd;
}

/**
 * Example: generateCaptureCommand("avfoundation,3:none", "1920x1080", "30")
 * Returns a full FFmpeg command to capture the Mac screen.
 */

export { DEVICE_OPTIONS, generateCaptureCommand };
