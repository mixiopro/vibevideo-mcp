// channelMixerCommand.js

/**
 * Generate FFmpeg command for changing audio channel count.
 * @param {string} inputFilename - Original file name, e.g. "input.wav"
 * @param {string|number} channels - Desired channel count ("1", "2", "6", etc.)
 * @returns {string} FFmpeg command or empty string if params invalid
 */
function generateChannelMixCommand(inputFilename, channels) {
  if (
    !inputFilename ||
    !channels ||
    channels === "original"
  ) {
    return "";
  }

  // Derive output filename
  const parts = inputFilename.split(".");
  const base = parts.slice(0, -1).join(".");
  const ext = parts.length > 1 ? parts[parts.length - 1] : "mp3";
  const outputFile = `${base}_${channels}ch.${ext}`;

  // Compose FFmpeg command: always re-encode audio for channel changes
  // Uses libmp3lame for maximum compatibility (you can switch to aac, pcm_s16le, etc.)
  return `ffmpeg -i "${inputFilename}" -ac ${channels} -c:a libmp3lame "${outputFile}"`;
}

export { generateChannelMixCommand };
