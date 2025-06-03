// audioEnhancerCommands.js

export const generateAudioEnhancementCommand = (inputFilename, selectedFilters, parameterValues, availableFiltersData) => {
  const baseName = inputFilename.split('.')[0];
  let outputExtension = inputFilename.split('.').pop();
  let forceVideoOutput = false;

  let command = '';
  let filtergraph = "";
  let useFilterComplex = false;
  let isAudioToVideoFilterPresent = false;
  let audioToVideoFilterValue;

  const findFilterDefinition = (filterValue) => {
    for (const category of availableFiltersData) {
      const filter = category.filters.find(f => f.value === filterValue);
      if (filter) return filter;
    }
    return undefined;
  };

  for (const filterValue of selectedFilters) {
    const filterDef = findFilterDefinition(filterValue);
    if (filterDef) {
      const isAudioToVideo = filterDef.ffmpeg_type === "audio" && filterDef.complex_filter &&
                             ["showfreqs", "aspectrum", "showwaves"].includes(filterValue);

      if (isAudioToVideo) {
        isAudioToVideoFilterPresent = true;
        audioToVideoFilterValue = filterValue;
        useFilterComplex = true;
        forceVideoOutput = true;
        outputExtension = 'mp4';
        break;
      }

      if (filterDef.complex_filter) {
        useFilterComplex = true;
      }
    }
  }

  const outputFile = `${baseName}_enhanced.${outputExtension}`;

  const filtersToProcess = isAudioToVideoFilterPresent && audioToVideoFilterValue ? [audioToVideoFilterValue] : selectedFilters;

  filtergraph = filtersToProcess.map(filterValue => {
    const filterDef = findFilterDefinition(filterValue);
    if (!filterDef) return filterValue;

    const params = parameterValues[filterValue] || {};

    if (!filterDef.parameters || filterDef.parameters.length === 0) {
      return filterValue;
    }

    const paramString = filterDef.parameters.map(paramDef => {
      const value = params[paramDef.name] !== undefined ? params[paramDef.name] : paramDef.default;
      if (value === undefined || value === null || (typeof value === 'string' && value === '' && paramDef.type !== 'string')) {
        if (paramDef.type === 'boolean' && value === false && (!paramDef.default || paramDef.default === false)) {
          return null;
        }
        return null;
      }

      let formattedValue = value;
      if (paramDef.type === 'string' || paramDef.type === 'enum') {
        formattedValue = `'${String(value).replace(/'/g, "'\\''")}'`;
      } else if (paramDef.type === 'boolean') {
        formattedValue = value ? 1 : 0;
      }

      return `${paramDef.name}=${formattedValue}`;
    }).filter(param => param !== null).join(':');

    return paramString ? `${filterValue}=${paramString}` : filterValue;
  }).join(',');

  if (isAudioToVideoFilterPresent && audioToVideoFilterValue) {
    command = `ffmpeg -i \"${inputFilename}\" -filter_complex \"[0:a]${filtergraph}[v]\" -map \"[v]\" -map 0:a -c:v libx264 -c:a aac -strict experimental \"${outputFile}\"`;
  } else if (useFilterComplex) {
    command = `ffmpeg -i \"${inputFilename}\" -filter_complex \"[0:a]${filtergraph}[a_out]\" -map 0:v -map \"[a_out]\" -c:v copy -c:a aac -strict experimental \"${outputFile}\"`;
  } else {
    command = `ffmpeg -i \"${inputFilename}\" -af \"${filtergraph}\" -c:v copy \"${outputFile}\"`;
  }

  return command;
};