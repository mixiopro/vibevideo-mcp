// bitstreamExtractorCommand.js

/**
 * Supported stream types for extraction.
 */
const STREAM_TYPE_OPTIONS = [
  { label: "Video Stream", value: "video" },
  { label: "Audio Stream", value: "audio" },
  { label: "Subtitle Stream", value: "subtitles" },
];

/**
 * Generate an FFmpeg command to extract a bitstream (video, audio, or subtitles).
 * @param {string} inputFilename - The name of the file to extract from.
 * @param {"video" | "audio" | "subtitles"} streamType - Type of stream to extract.
 * @returns {string} The FFmpeg command or an empty string if invalid.
 */
function generateBitstreamExtractCommand(inputFilename, streamType) {
  if (!inputFilename || !streamType) return "";

  const baseName = inputFilename.replace(/\.[^/.]+$/, "");
  let mapOption, outputExtension;

  switch (streamType) {
    case "video":
      mapOption = "0:v";
      outputExtension = "h264";
      break;
    case "audio":
      mapOption = "0:a";
      outputExtension = "aac";
      break;
    case "subtitles":
      mapOption = "0:s";
      outputExtension = "srt";
      break;
    default:
      return "";
  }

  const outputFileName = `${baseName}_extracted.${outputExtension}`;
  return `ffmpeg -i "${inputFilename}" -map ${mapOption} -c copy "${outputFileName}"`;
}

export { STREAM_TYPE_OPTIONS, generateBitstreamExtractCommand };
