// apiIntegrationCommands.js
/**
 * Generate an API code snippet in the requested language.
 * @param {string} command - The shell command to wrap.
 * @param {string} language - One of 'bash', 'python', 'nodejs', 'go'.
 * @returns {string} Code snippet for the given language.
 */

export const generateCodeSnippet = (command, language) => {
  const escapedCommand = command.replace(/"/g, '\\"');
  
  switch (language) {
    case "bash":
      return `#!/bin/bash\n\n${command}`;

    case "python":
      return `import subprocess\n\ncommand = \"${escapedCommand}\"\nsubprocess.run(command, shell=True, check=True)`;

    case "nodejs":
      return `const { exec } = require('child_process');\n\nconst command = \"${escapedCommand}\";\n\nexec(command, (error, stdout, stderr) => {\n  if (error) {\n    console.error(\`exec error: \${error}\`);\n    return;\n  }\n  console.log(\`stdout: \${stdout}\`);\n  console.error(\`stderr: \${stderr}\`);\n});`;

    case "go":
      return `package main\n\nimport (\n\t\"log\"\n\t\"os/exec\"\n)\n\nfunc main() {\n\tcmd := exec.Command(\"bash\", \"-c\", \"${escapedCommand}\")\n\tstdoutStderr, err := cmd.CombinedOutput()\n\tif err != nil {\n\t\tlog.Fatalf(\"Error executing command: %v\\nOutput: %s\", err, stdoutStderr)\n\t}\n\tlog.Printf(\"Command executed successfully:\\n%s\", stdoutStderr)\n}`;

    default:
      throw new Error("Unsupported language selected.");
  }
};
