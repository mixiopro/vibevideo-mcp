// speedChangeCommand.js

/**
 * Generate FFmpeg command to change playback speed for both video and audio.
 * Output is always MP4 for max compatibility.
 * @param {string} inputFilename - File name, e.g. "video.mp4"
 * @param {number} speed - Playback speed (0.25–4.0, where 1.0 is normal)
 * @returns {string} FFmpeg command or empty string if params invalid
 */
function generateSpeedChangeCommand(inputFilename, speed) {
  if (!inputFilename || typeof speed !== "number" || speed <= 0) {
    return "";
  }

  const base = inputFilename.split(".")[0];
  const outputFile = `${base}_${speed.toFixed(2).replace(".", "p")}x.mp4`;
  const setpts = (1 / speed).toFixed(3);

  // Construct audio filter chain for atempo (supports up to 2x or down to 0.5x per filter)
  let audioFilter = "aresample=async=1";
  let tempo = speed;
  if (tempo > 2.0) {
    while (tempo > 2.0) {
      audioFilter += `,atempo=2.0`;
      tempo /= 2.0;
    }
    audioFilter += `,atempo=${tempo.toFixed(3)}`;
  } else if (tempo < 0.5) {
    while (tempo < 0.5) {
      audioFilter += `,atempo=0.5`;
      tempo *= 2.0;
    }
    audioFilter += `,atempo=${tempo.toFixed(3)}`;
  } else {
    audioFilter += `,atempo=${tempo.toFixed(3)}`;
  }

  // Filter_complex for both video and audio
  return `ffmpeg -fflags +genpts -i "${inputFilename}" -filter_complex "[0:v]setpts=${setpts}*PTS[v];[0:a]${audioFilter}[a]" -map "[v]" -map "[a]" -c:v libx264 -c:a aac -ar 48000 -movflags +faststart -shortest "${outputFile}"`;
}

export { generateSpeedChangeCommand };
