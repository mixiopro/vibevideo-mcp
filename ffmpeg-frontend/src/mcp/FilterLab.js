// filterLab.js

/**
 * Find filter definition by value.
 * @param {string} filterValue
 * @param {Array} availableFilters
 * @returns {object|undefined}
 */
function findFilterDefinition(filterValue, availableFilters) {
  for (const category of availableFilters) {
    const filter = category.filters.find((f) => f.value === filterValue);
    if (filter) return filter;
  }
  return undefined;
}

/**
 * Generate FFmpeg command string for the selected filters and their parameters.
 * @param {string} inputFilename
 * @param {string[]} filters
 * @param {Object} parameterValues  // { [filterValue]: { [paramName]: value } }
 * @param {Array} availableFilters  // Array of filter categories
 * @returns {string} FFmpeg command
 */
function generateFilterLabCommand(inputFilename, filters, parameterValues, availableFilters) {
  if (typeof inputFilename !== "string" || !inputFilename) return "";
  if (!Array.isArray(filters) || filters.length === 0) return "";

  const parts = inputFilename.split(".");
  const baseName = parts.slice(0, -1).join(".") || inputFilename;
  const outputExtension = parts.length > 1 ? parts[parts.length - 1] : "mp4";
  const outputFile = `${baseName}_filtered.${outputExtension}`;

  let useFilterComplex = false;
  let isAudioToVideo = false;
  let audioToVideoFilterValue = undefined;

  for (const filterValue of filters) {
    const filterDef = findFilterDefinition(filterValue, availableFilters);
    if (
      filterDef &&
      filterDef.ffmpeg_type === "audio" &&
      filterDef.complex_filter === true &&
      (
        filterDef.default_extension === "mp4" ||
        (filterDef.description && filterDef.description.toLowerCase().includes("video output")) ||
        filterValue === "showfreqs" ||
        filterValue === "aspectrum" ||
        filterValue === "showwaves"
      )
    ) {
      isAudioToVideo = true;
      audioToVideoFilterValue = filterValue;
      useFilterComplex = true;
      break;
    }
    if (filterDef && filterDef.complex_filter === true) useFilterComplex = true;
  }

  // Helper: build filter string from params
  function filterString(filterValue) {
    const def = findFilterDefinition(filterValue, availableFilters);
    if (!def) return filterValue;
    const params = parameterValues[filterValue] || {};
    if (!def.parameters || def.parameters.length === 0) return filterValue;

    const paramStr = def.parameters
      .map((param) => {
        let value = (params[param.name] !== undefined ? params[param.name] : param.default);
        if (
          value === undefined ||
          value === null ||
          (typeof value === "string" && value === "" && param.type !== "string")
        ) {
          return null;
        }
        if (param.type === "string" || param.type === "enum") {
          value = String(value).replace(/'/g, "'\\''");
          return `${param.name}='${value}'`;
        }
        if (param.type === "boolean") return `${param.name}=${value ? 1 : 0}`;
        return `${param.name}=${value}`;
      })
      .filter(Boolean)
      .join(":");
    return paramStr ? `${filterValue}=${paramStr}` : filterValue;
  }

  // 1. Audio-to-video filter: only process that one
  if (isAudioToVideo && audioToVideoFilterValue) {
    const fg = filterString(audioToVideoFilterValue);
    const out = `${baseName}_filtered.mp4`;
    return `ffmpeg -i "${inputFilename}" -filter_complex "[0:a]${fg}[v]" -map "[v]" -map 0:a -c:v libx264 -c:a aac -strict experimental "${out}"`;
  }

  // 2. Other complex filter (e.g. drawtext, overlay)
  if (useFilterComplex) {
    // Find all non-audio-to-video complex filters
    const complexFilters = filters.filter((fv) => {
      const def = findFilterDefinition(fv, availableFilters);
      return (
        def &&
        def.complex_filter === true &&
        !(
          def.ffmpeg_type === "audio" &&
          def.complex_filter === true &&
          (
            def.default_extension === "mp4" ||
            (def.description && def.description.toLowerCase().includes("video output")) ||
            fv === "showfreqs" ||
            fv === "aspectrum" ||
            fv === "showwaves"
          )
        )
      );
    });
    if (complexFilters.length) {
      const fg = complexFilters.map(filterString).join(",");
      const out = `${baseName}_filtered.mp4`;
      return `ffmpeg -i "${inputFilename}" -filter_complex "[0:v]${fg}[v_out]" -map "[v_out]" -map 0:a -c:v libx264 -c:a copy "${out}"`;
    }
    return ""; // Should not reach here
  }

  // 3. Simple video/audio filters (-vf, -af)
  const videoFilters = filters.filter((fv) => {
    const def = findFilterDefinition(fv, availableFilters);
    return def && def.ffmpeg_type === "video" && !def.complex_filter;
  });
  const audioFilters = filters.filter((fv) => {
    const def = findFilterDefinition(fv, availableFilters);
    return def && def.ffmpeg_type === "audio" && !def.complex_filter;
  });

  const videoFilterStr = videoFilters.map(filterString).join(",");
  const audioFilterStr = audioFilters.map(filterString).join(",");

  let cmd = `ffmpeg -i "${inputFilename}"`;
  if (videoFilterStr) cmd += ` -vf "${videoFilterStr}"`;
  if (audioFilterStr) cmd += ` -af "${audioFilterStr}"`;

  if (videoFilterStr && audioFilterStr)
    cmd += " -c:v libx264 -c:a aac -strict experimental";
  else if (videoFilterStr)
    cmd += " -c:v libx264 -c:a copy";
  else if (audioFilterStr)
    cmd += " -c:v copy -c:a aac -strict experimental";
  else cmd += " -c copy";

  cmd += ` "${outputFile}"`;
  return cmd;
}

export { findFilterDefinition, generateFilterLabCommand };


// import { generateFilterLabCommand } from './filterLabCommand';
// import availableFiltersData from '@/data/ffmpegFilters.json';

// const ffmpegCmd = generateFilterLabCommand(
//   "input.mp4",
//   ["hue", "volume"],
//   {
//     hue: { s: 0.5, h: 30 },
//     volume: { volume: 2 }
//   },
//   availableFiltersData // must be an array of FilterCategory
// );

// // ffmpegCmd will contain the exact FFmpeg command to run.
