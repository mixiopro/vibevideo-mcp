// thumbnailCommand.js

/**
 * Generate FFmpeg command for video thumbnail(s) creation.
 * @param {string} inputFilename - Source video file (e.g., "video.mp4")
 * @param {"single"|"sheet"} tab - Single thumbnail or sheet
 * @param {string} timestamp - Timestamp for single thumbnail (e.g., "00:01:05" or "65")
 * @param {string} cols - Columns for sheet
 * @param {string} rows - Rows for sheet
 * @param {boolean} multipleSheets - If true, generate multiple sheets at interval
 * @param {string} interval - Interval between thumbnails (in seconds) for multi-sheet
 * @param {number|null} duration - Video duration (required for single evenly spaced sheet)
 * @returns {string} FFmpeg command, or empty string if invalid
 */
function generateThumbnailCommand(
  inputFilename,
  tab,
  timestamp,
  cols,
  rows,
  multipleSheets,
  interval,
  duration
) {
  if (!inputFilename) return "";

  const baseName = inputFilename.split(".")[0];
  let command = `ffmpeg -i "${inputFilename}"`;
  let outputFileName = "";
  let filterString = "";
  let extraOptions = "";

  if (tab === "single") {
    if (!timestamp) return "";
    outputFileName = `${baseName}_thumb_${timestamp.replace(/:/g, "-")}.png`;
    command += ` -ss ${timestamp} -vframes 1 "${outputFileName}"`;
  } else if (tab === "sheet") {
    const numCols = parseInt(cols);
    const numRows = parseInt(rows);
    const intervalSeconds = parseFloat(interval);

    if (isNaN(numCols) || isNaN(numRows) || numCols <= 0 || numRows <= 0) return "";

    const tileFilter = `tile=${numCols}x${numRows}`;

    if (!multipleSheets) {
      // Evenly spaced, single sheet (requires duration)
      if (duration === null || duration <= 0) return "";
      const totalThumbs = numCols * numRows;
      filterString = `thumbnail=${totalThumbs},${tileFilter}`;
      outputFileName = `${baseName}_sheet_${cols}x${rows}.png`;
      extraOptions = `-frames:v 1`;
    } else {
      // Multiple sheets at fixed interval
      if (isNaN(intervalSeconds) || intervalSeconds <= 0) return "";
      filterString = `select='gte(t,n*${intervalSeconds.toFixed(2)})',${tileFilter}`;
      outputFileName = `${baseName}_sheet_%02d.png`;
      // No -frames:v 1 for multiple outputs
    }
    command += ` -vf "${filterString}" ${extraOptions} "${outputFileName}"`;
  } else {
    return "";
  }

  return command;
}

export { generateThumbnailCommand };
