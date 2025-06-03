// metadataCommand.js

/**
 * Generate FFmpeg command for updating basic metadata on a media file.
 * @param {string} inputFilename - Original file name, e.g. "input.mp3"
 * @param {object} metadata - Metadata object, e.g. { title: "Song", artist: "Artist", album: "Album" }
 * @returns {string} FFmpeg command or empty string if no metadata is provided
 */
function generateMetadataCommand(inputFilename, metadata) {
  if (
    !inputFilename ||
    (!metadata.title && !metadata.artist && !metadata.album)
  ) {
    return "";
  }

  // Derive output filename (e.g., input_metadata.mp3)
  const parts = inputFilename.split(".");
  const base = parts.slice(0, -1).join(".");
  const ext = parts.length > 1 ? parts[parts.length - 1] : "mp3";
  const outputFile = `${base}_metadata.${ext}`;

  let command = `ffmpeg -i "${inputFilename}" -c copy`;

  if (metadata.title) {
    command += ` -metadata title="${metadata.title}"`;
  }
  if (metadata.artist) {
    command += ` -metadata artist="${metadata.artist}"`;
  }
  if (metadata.album) {
    command += ` -metadata album="${metadata.album}"`;
  }

  command += ` "${outputFile}"`;

  return command;
}

export { generateMetadataCommand };

// import { generateMetadataCommand } from './metadataCommand';

// const metaCmd = generateMetadataCommand("track01.mp3", {
//   title: "New Title",
//   artist: "New Artist",
//   album: "New Album"
// });
// // ffmpeg -i "track01.mp3" -c copy -metadata title="New Title" -metadata artist="New Artist" -metadata album="New Album" "track01_metadata.mp3"

