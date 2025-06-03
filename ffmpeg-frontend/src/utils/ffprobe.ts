function parseFFprobeOutput(output) {
  // Split into sections ([STREAM]...[/STREAM], [FORMAT]...[/FORMAT])
  const sections = {};
  let currentSection = null;
  output.split('\n').forEach(line => {
    line = line.trim();
    if (line.startsWith('[') && line.endsWith(']')) {
      if (line.startsWith('[/')) {
        currentSection = null;
      } else {
        currentSection = line.slice(1, -1);
        if (!sections[currentSection]) sections[currentSection] = [];
        // For STREAM, multiple
        if (currentSection === 'STREAM') sections[currentSection].push({});
      }
    } else if (currentSection && line && line.includes('=') && !line.startsWith('DISPOSITION:')) {
      const [k, ...rest] = line.split('=');
      const v = rest.join('=');
      if (currentSection === 'STREAM') {
        // always push into the last stream obj
        const lastIdx = sections.STREAM.length - 1;
        sections.STREAM[lastIdx][k] = v;
      } else {
        // FORMAT or others
        if (!sections[currentSection][0]) sections[currentSection][0] = {};
        sections[currentSection][0][k] = v;
      }
    }
  });
  return sections;
}
