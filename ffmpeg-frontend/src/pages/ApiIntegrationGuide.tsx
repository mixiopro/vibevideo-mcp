import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import FFmpegCommandDisplay from "@/components/shared/FFmpegCommandDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

const languageOptions = [
  { label: "Bash", value: "bash" },
  { label: "Python", value: "python" },
  { label: "Node.js", value: "nodejs" },
  { label: "Go", value: "go" },
  // Add more if you want
];

const defaultCommand = "ffmpeg -i input.mp4 output.mp4";

const ApiIntegrationGuide = () => {
  const [exampleFFmpegCommand, setExampleFFmpegCommand] = useState<string>(defaultCommand);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("bash");
  const [codeSnippet, setCodeSnippet] = useState<string>("");

  useEffect(() => {
    generateCodeSnippet(exampleFFmpegCommand, selectedLanguage);
  }, [exampleFFmpegCommand, selectedLanguage]);

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
  };

  const handleCommandChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setExampleFFmpegCommand(e.target.value);
  };

  const generateCodeSnippet = (command: string, language: string) => {
    const escapedCommand = command.replace(/"/g, '\\"');
    let snippet = "";
    switch (language) {
      case "bash":
        snippet = `#!/bin/bash\n\n${command}`;
        break;
      case "python":
        snippet = `import subprocess\n\ncommand = "${escapedCommand}"\nsubprocess.run(command, shell=True, check=True)`;
        break;
      case "nodejs":
        snippet = `const { exec } = require('child_process');\n\nconst command = "${escapedCommand}";\n\nexec(command, (error, stdout, stderr) => {\n  if (error) {\n    console.error(\`exec error: \${error}\`);\n    return;\n  }\n  console.log(\`stdout: \${stdout}\`);\n  console.error(\`stderr: \${stderr}\`);\n});`;
        break;
      case "go":
        snippet = `package main\n\nimport (\n\t"log"\n\t"os/exec"\n)\n\nfunc main() {\n\tcmd := exec.Command("bash", "-c", "${escapedCommand}")\n\tstdoutStderr, err := cmd.CombinedOutput()\n\tif err != nil {\n\t\tlog.Fatalf("Error executing command: %v\\nOutput: %s", err, stdoutStderr)\n\t}\n\tlog.Printf("Command executed successfully:\\n%s", stdoutStderr)\n}`;
        break;
      default:
        snippet = "// Select a language to see the code snippet";
    }
    setCodeSnippet(snippet);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(codeSnippet).then(() => {
      toast.success("Code snippet copied to clipboard!");
    }).catch(err => {
      toast.error("Failed to copy code snippet.");
    });
  };

  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">API Integration Helper</h2>
        <p className="text-muted-foreground">
          Paste your FFmpeg command below and generate ready-to-use integration code in Bash, Python, Node.js, or Go.
        </p>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Integration Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="ffmpeg-command">FFmpeg Command</Label>
              <textarea
                id="ffmpeg-command"
                className="font-mono text-xs w-full p-2 border rounded-md bg-muted text-muted-foreground resize-none"
                rows={3}
                value={exampleFFmpegCommand}
                onChange={handleCommandChange}
                placeholder="Paste your FFmpeg command here..."
              />
              {/* <FFmpegCommandDisplay command={exampleFFmpegCommand} /> */}
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="language-select">Programming Language</Label>
              <Select onValueChange={handleLanguageChange} value={selectedLanguage}>
                <SelectTrigger id="language-select">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {codeSnippet && (
              <div className="grid w-full items-center gap-1.5">
                <Label>Code Snippet</Label>
                <div className="relative">
                  <textarea
                    readOnly
                    value={codeSnippet}
                    className="font-mono text-xs w-full p-2 border rounded-md bg-muted text-muted-foreground resize-none"
                    rows={10}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={copyToClipboard}
                    aria-label="Copy code snippet"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            <p className="text-sm text-yellow-600">
              Note: These are basic examples. Complex commands, async handling, and platform compatibility may require additional code. FFmpeg must be installed where the script is run.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ApiIntegrationGuide;



// import { useState, useEffect } from "react";
// import { MainLayout } from "@/components/layout/MainLayout";
// import FFmpegCommandDisplay from "@/components/shared/FFmpegCommandDisplay"; // Added back
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Button } from "@/components/ui/button";
// import { Copy } from "lucide-react";
// import { toast } from "sonner"; // Assuming sonner is used for toasts
// import { useFFmpegProcessor } from "@/hooks/useFFmpegProcessor"; // Import the new hook
// import OutputMediaPlayer from "@/components/shared/OutputMediaPlayer"; // Keep for consistency, though no media output
// import type { SingleFileCommandPayload } from "@/hooks/useFFmpegProcessor"; // Import payload type
// import FileUploader from "@/components/shared/FileUploader";


// const ApiIntegrationGuide = () => {
//   // Use the new hook
//   const {
//     selectedFiles, // Keep selectedFiles from hook for UI logic
//     uploadedFilename, // Keep for potential display/debugging, but logic relies on return values from upload functions
//     outputFile, // Keep for consistency, though no media output
//     isUploading,
//     isProcessing, // Keep for consistency
//     mediaError, // Keep for consistency
//     generatedCommand, // Get the generated command from the hook
//     handleFileSelect, // Use the hook's file select handler
//     runCommand, // Use the hook's run command handler
//     setCommand, // Use the hook's set command function
//     setMediaError, // Keep for consistency
//     uploadSingleFile, // Import the explicit upload function
//   } = useFFmpegProcessor();

//   const [selectedLanguage, setSelectedLanguage] = useState<string>("bash");
//   // The example command is now static here, but could be dynamic based on other pages
//   const [exampleFFmpegCommand, setExampleFFmpegCommand] = useState<string>("ffmpeg -i input.mp4 output.mp4");
//   const [codeSnippet, setCodeSnippet] = useState<string>("");

//   const languageOptions = [
//     { label: "Bash", value: "bash" },
//     { label: "Python", value: "python" },
//     { label: "Node.js", value: "nodejs" },
//     { label: "Go", value: "go" },
//     // Add more languages
//   ];

//   // Effect to generate code snippet whenever exampleFFmpegCommand or selectedLanguage changes
//   useEffect(() => {
//       generateCodeSnippet(exampleFFmpegCommand, selectedLanguage);
//   }, [exampleFFmpegCommand, selectedLanguage]);


//   const handleLanguageChange = (value: string) => {
//     setSelectedLanguage(value);
//     // Code snippet will be regenerated by the useEffect hook
//   };

//   const generateCodeSnippet = (command: string, language: string) => {
//     let snippet = "";
//     const escapedCommand = command.replace(/"/g, '\\"'); // Basic escaping

//     switch (language) {
//       case "bash":
//         snippet = `#!/bin/bash\n\n${command}`;
//         break;
//       case "python":
//         snippet = `import subprocess\n\ncommand = "${escapedCommand}"\nsubprocess.run(command, shell=True, check=True)`;
//         break;
//       case "nodejs":
//         snippet = `const { exec } = require('child_process');\n\nconst command = "${escapedCommand}";\n\nexec(command, (error, stdout, stderr) => {\n  if (error) {\n    console.error(\`exec error: \${error}\`);\n    return;\n  }\n  console.log(\`stdout: \${stdout}\`);\n  console.error(\`stderr: \${stderr}\`);\n});`;
//         break;
//       case "go":
//         snippet = `package main\n\nimport (\n\t"log"\n\t"os/exec"\n)\n\nfunc main() {\n\tcmd := exec.Command("bash", "-c", "${escapedCommand}")\n\tstdoutStderr, err := cmd.CombinedOutput()\n\tif err != nil {\n\t\tlog.Fatalf("Error executing command: %v\\nOutput: %s", err, stdoutStderr)\n\t}\n\tlog.Printf("Command executed successfully:\\n%s", stdoutStderr)\n}`;
//         break;
//       default:
//         snippet = `// Select a language to see the code snippet`;
//     }
//     setCodeSnippet(snippet);
//   };

//   const copyToClipboard = () => {
//     navigator.clipboard.writeText(codeSnippet).then(() => {
//       toast.success("Code snippet copied to clipboard!");
//     }).catch(err => {
//       console.error("Failed to copy: ", err);
//       toast.error("Failed to copy code snippet.");
//     });
//   };

//   // Note: This page doesn't typically run an FFmpeg command itself,
//   // it just displays how to run one. The FileUploader and Run button
//   // are less relevant here unless we add functionality to analyze a file
//   // and then show integration code for *that* file's properties.
//   // For now, we'll keep the FileUploader but disable the Run button
//   // as the primary action is generating code snippets for a *given* command.

//   // If we wanted to make the example command dynamic based on an uploaded file,
//   // we would need to analyze the file first (e.g., using ffprobe via the backend)
//   // and then update the exampleFFmpegCommand state. This is a more complex feature.

//   return (
//     <MainLayout>
//       <div className="flex-1 space-y-4 p-8 pt-6">
//         <h2 className="text-3xl font-bold tracking-tight">API Integration Helper</h2>
//         <p className="text-muted-foreground">Get code snippets to integrate FFmpeg commands into your scripts.</p>

//         <Card className="w-full">
//           <CardHeader>
//             <CardTitle>Integration Options</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-4">
//              <p className="text-sm text-muted-foreground">
//                  Select a programming language to get a basic code snippet for running an FFmpeg command.
//                  The example command below is static, but in a real application, it could reflect a command generated by other tools in this app or derived from an uploaded file's properties.
//              </p>
//              {/* Display the example FFmpeg command */}
//              <div className="grid w-full items-center gap-1.5">
//                  <Label>Example FFmpeg Command</Label>
//                  {/* Use the local state for the example command display */}
//                  <FFmpegCommandDisplay command={exampleFFmpegCommand} />
//              </div>

//             <div className="grid w-full max-w-sm items-center gap-1.5">
//               <Label htmlFor="language-select">Programming Language</Label>
//               <Select onValueChange={handleLanguageChange} value={selectedLanguage}>
//                 <SelectTrigger id="language-select">
//                   <SelectValue placeholder="Select language" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {languageOptions.map(option => (
//                     <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>

//             {codeSnippet && (
//                 <div className="grid w-full items-center gap-1.5">
//                     <Label>Code Snippet</Label>
//                     <div className="relative">
//                         <textarea
//                             readOnly
//                             value={codeSnippet}
//                             className="font-mono text-xs w-full p-2 border rounded-md bg-muted text-muted-foreground resize-none"
//                             rows={10}
//                         />
//                         <Button
//                             variant="ghost"
//                             size="sm"
//                             className="absolute top-2 right-2"
//                             onClick={copyToClipboard}
//                             aria-label="Copy code snippet"
//                         >
//                             <Copy className="h-4 w-4" />
//                         </Button>
//                     </div>
//                 </div>
//             )}

//              <p className="text-sm text-yellow-600">
//                  Note: These are basic examples. Error handling, progress monitoring, and handling complex commands may require more sophisticated code depending on the language and libraries used. Executing these commands requires FFmpeg installed on the system where the script is run.
//              </p>

//           </CardContent>
//         </Card>

//         {/* File Uploader is kept but its primary purpose here is informational or for future features */}
//         <FileUploader onFileSelect={handleFileSelect} />

//         {/* The Run button is disabled as this page focuses on generating code snippets, not running commands */}
//         {/* <Button disabled>Run Command (Not applicable on this page)</Button> */}

//         {/* OutputMediaPlayer is less relevant here */}
//         {/* <OutputMediaPlayer outputFile={outputFile} mediaError={mediaError} setMediaError={setMediaError} /> */}

//         {/* FFmpegCommandDisplay is already used to show the example command */}
//         {/* <FFmpegCommandDisplay command={generatedCommand} /> */}

//       </div>
//     </MainLayout>
//   );
// };

// export default ApiIntegrationGuide;