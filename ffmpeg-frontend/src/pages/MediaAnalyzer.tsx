import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import FileUploader from "@/components/shared/FileUploader";
import FFmpegCommandDisplay from "@/components/shared/FFmpegCommandDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useFFmpegProcessor } from "@/hooks/useFFmpegProcessor";
import { toast } from "sonner";

// --- ffprobe output parser ---
function parseFFprobeOutput(output: string) {
  const sections: Record<string, any[]> = {};
  let currentSection: string | null = null;
  output.split('\n').forEach(line => {
    line = line.trim();
    if (line.startsWith('[') && line.endsWith(']')) {
      if (line.startsWith('[/')) {
        currentSection = null;
      } else {
        currentSection = line.slice(1, -1);
        if (!sections[currentSection]) sections[currentSection] = [];
        if (currentSection === 'STREAM') sections[currentSection].push({});
      }
    } else if (currentSection && line && line.includes('=') && !line.startsWith('DISPOSITION:')) {
      const [k, ...rest] = line.split('=');
      const v = rest.join('=');
      if (currentSection === 'STREAM') {
        const lastIdx = sections.STREAM.length - 1;
        sections.STREAM[lastIdx][k] = v;
      } else {
        if (!sections[currentSection][0]) sections[currentSection][0] = {};
        sections[currentSection][0][k] = v;
      }
    }
  });
  return sections;
}

const MediaAnalyzer = () => {
  const {
    selectedFiles,
    uploadedFilename,
    isUploading,
    isProcessing,
    generatedCommand,
    handleFileSelect,
    uploadSingleFile,
    setCommand,
  } = useFFmpegProcessor();

  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  useEffect(() => {
    if (selectedFiles.length === 1) {
      generateDisplayCommandString(selectedFiles[0].name);
    } else {
      setCommand("");
    }
  }, [selectedFiles, setCommand]);

  const handleFileSelectAndClear = (files: File[]) => {
  setAnalysisResult(null); // Clear the previous analysis
  handleFileSelect(files); // Call the original handler from the hook
};

  const generateDisplayCommandString = (inputFilename: string) => {
    if (!inputFilename) return "";
    const command = `ffprobe -v error -show_format -show_streams "${inputFilename}"`;
    setCommand(command);
    return command;
  };

  const handleRunClick = async () => {
    if (selectedFiles.length === 0) {
      toast.warning("Please select a file first.");
      return;
    }
    if (selectedFiles.length > 1) {
      toast.warning("Media Analyzer currently only supports a single file. Please select only one file.");
      return;
    }
    const uploadResult = uploadedFilename
      ? { filenames: [uploadedFilename], success: true }
      : await uploadSingleFile(selectedFiles[0]);
    let filename = '';
    if (typeof uploadResult === "string") {
      filename = uploadResult;
    } else if (uploadResult && uploadResult.filenames && uploadResult.filenames.length) {
      filename = uploadResult.filenames[0];
    }
    if (filename) {
      await analyzeMedia(filename);
    } else {
      toast.error("Failed to extract filename from upload result.");
    }
  };

  const analyzeMedia = async (uploadedFile: string) => {
    setAnalysisResult(null);
    const resp = await fetch("http://localhost:8200/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "analyze",
        inputFile: uploadedFile,
      }),
    });
    const result = await resp.json();
    if (result.success) {
      setAnalysisResult(result.output);
    } else {
      setAnalysisResult(null);
      toast.error("Analysis failed");
    }
  };

  // --- In-page structured result display ---
  let parsed;
  if (analysisResult) {
    try {
      parsed = parseFFprobeOutput(analysisResult);
    } catch {
      parsed = null;
    }
  }
  const format = parsed?.FORMAT?.[0];
  const streams = parsed?.STREAM || [];

  return (
    <MainLayout>
      <div className="flex-1 space-y-6 p-8 pt-6 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold tracking-tight">Media Analyzer</h2>
        <p className="text-muted-foreground">
          Analyze media files to display detailed information.
        </p>
        <FileUploader onFileSelect={handleFileSelectAndClear} />

        {/* Inline analysis display */}
        {analysisResult && (
          <Card className="w-full mt-6">
            <CardHeader>
              <CardTitle>Media Details</CardTitle>
            </CardHeader>
            <CardContent>
              {!parsed ? (
                <pre className="text-xs text-red-600">{analysisResult}</pre>
              ) : (
                <>
                  {format && (
                    <div className="mb-6">
                      <div className="font-semibold mb-2">File Format</div>
                      <table className="w-full text-sm mb-2">
                        <tbody>
                          <tr>
                            <td className="font-medium pr-2">Filename:</td>
                            <td>{format.filename}</td>
                          </tr>
                          <tr>
                            <td className="font-medium pr-2">Format:</td>
                            <td>{format.format_long_name} ({format.format_name})</td>
                          </tr>
                          <tr>
                            <td className="font-medium pr-2">Duration:</td>
                            <td>{Number(format.duration).toFixed(2)} sec</td>
                          </tr>
                          <tr>
                            <td className="font-medium pr-2">Size:</td>
                            <td>{Number(format.size / 1024 / 1024).toFixed(2)} MB</td>
                          </tr>
                          <tr>
                            <td className="font-medium pr-2">Bitrate:</td>
                            <td>
                              {format.bit_rate ? `${(format.bit_rate / 1000).toFixed(0)} kbps` : "—"}
                            </td>
                          </tr>
                          <tr>
                            <td className="font-medium pr-2">Streams:</td>
                            <td>{format.nb_streams}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                  {streams.length > 0 && (
                    <div>
                      <div className="font-semibold mb-2">Streams</div>
                      <div className="space-y-3">
                        {streams.map((stream, i) => (
                          <div
                            key={i}
                            className="border rounded-lg p-3 bg-white/80"
                          >
                            <div className="font-semibold mb-1">
                              {stream.codec_type?.toUpperCase() || "Unknown"} Stream
                              {stream.codec_name ? ` (${stream.codec_name})` : ""}
                            </div>
                            <table className="text-xs">
                              <tbody>
                                {stream.codec_type === "video" && (
                                  <>
                                    <tr>
                                      <td className="pr-2 font-medium">Resolution:</td>
                                      <td>
                                        {stream.width}×{stream.height}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="pr-2 font-medium">Frame rate:</td>
                                      <td>{stream.r_frame_rate}</td>
                                    </tr>
                                    <tr>
                                      <td className="pr-2 font-medium">Pixel format:</td>
                                      <td>{stream.pix_fmt}</td>
                                    </tr>
                                    <tr>
                                      <td className="pr-2 font-medium">Bit rate:</td>
                                      <td>
                                        {stream.bit_rate ? `${(stream.bit_rate / 1000).toFixed(0)} kbps` : "—"}
                                      </td>
                                    </tr>
                                  </>
                                )}
                                {stream.codec_type === "audio" && (
                                  <>
                                    <tr>
                                      <td className="pr-2 font-medium">Sample rate:</td>
                                      <td>{stream.sample_rate} Hz</td>
                                    </tr>
                                    <tr>
                                      <td className="pr-2 font-medium">Channels:</td>
                                      <td>{stream.channels}</td>
                                    </tr>
                                    <tr>
                                      <td className="pr-2 font-medium">Channel layout:</td>
                                      <td>{stream.channel_layout}</td>
                                    </tr>
                                    <tr>
                                      <td className="pr-2 font-medium">Bit rate:</td>
                                      <td>
                                        {stream.bit_rate ? `${(stream.bit_rate / 1000).toFixed(0)} kbps` : "—"}
                                      </td>
                                    </tr>
                                  </>
                                )}
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {selectedFiles.length > 0 && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Analysis Command</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isUploading && (
                <p className="text-sm text-blue-600">Uploading file...</p>
              )}
              {!isUploading && selectedFiles.length > 0 && (
                <>
                  <div>
                    <h4 className="text-md font-semibold mb-2">
                      Selected File(s):
                    </h4>
                    <ul>
                      {selectedFiles.map((file, index) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          {file.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {selectedFiles.length > 1 && (
                    <p className="text-sm text-yellow-600">
                      Note: Analysis currently only applies to the first selected file.
                    </p>
                  )}
                  <Button
                    onClick={handleRunClick}
                    disabled={
                      selectedFiles.length === 0 ||
                      isProcessing ||
                      isUploading
                    }
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Run Analysis Command"
                    )}
                  </Button>
                  <p className="text-sm text-yellow-600">
                    Note: Clicking "Run" will first upload the selected file and then send the command to your local backend server running on http://localhost:8200.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <FFmpegCommandDisplay command={generatedCommand} />


      </div>
    </MainLayout>
  );
};

export default MediaAnalyzer;


// import { useState, useEffect } from "react";
// import { MainLayout } from "@/components/layout/MainLayout";
// import FileUploader from "@/components/shared/FileUploader";
// import FFmpegCommandDisplay from "@/components/shared/FFmpegCommandDisplay"; // Added back
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button"; // Import Button
// import { Loader2 } from "lucide-react"; // Import Loader2 icon
// import { useFFmpegProcessor } from "@/hooks/useFFmpegProcessor"; // Import the new hook
// import OutputMediaPlayer from "@/components/shared/OutputMediaPlayer"; // Keep for consistency, though no media output
// import { toast } from "sonner"; // Import toast
// import type { SingleFileCommandPayload } from "@/hooks/useFFmpegProcessor"; // Import payload type


// const MediaAnalyzer = () => {
//   // Use the new hook
//   const {
//     selectedFiles, // Keep selectedFiles from hook for UI logic
//     uploadedFilename, // Keep for potential display/debugging, but logic relies on return values from upload functions
//     outputFile, // Keep for consistency, though no media output
//     isUploading,
//     isProcessing,
//     mediaError, // Keep for consistency
//     generatedCommand, // Get the generated command from the hook
//     handleFileSelect, // Use the hook's file select handler
//     runCommand, // Use the hook's run command handler
//     setCommand, // Use the hook's set command function
//     setMediaError, // Keep for consistency
//     uploadSingleFile, // Import the explicit upload function
//   } = useFFmpegProcessor();

//   // Effect to generate command string for display whenever selectedFiles changes
//   // This command string uses the *local* file name for display purposes.
//   useEffect(() => {
//       if (selectedFiles.length === 1) {
//           generateDisplayCommandString(selectedFiles[0].name);
//       } else {
//           setCommand(""); // Clear command if requirements aren't met
//       }
//   }, [selectedFiles, setCommand]); // Add setCommand to dependencies


  
//   // Function to generate the command string for display (used by useEffect)
//   // This uses the *local* file name for display purposes.
//   const generateDisplayCommandString = (inputFilename: string) => {
//     if (!inputFilename) {
//       return ""; // Return empty string if command cannot be generated
//     }

//     // Use ffprobe to show format and stream information
//     const command = `ffprobe -v error -show_format -show_streams "${inputFilename}"`;

//     setCommand(command); // Set the command using the hook's function
//     return command; // Return the generated command string
//   };

//   // New handler for the Run button
// const handleRunClick = async () => {
//   if (selectedFiles.length === 0) {
//     toast.warning("Please select a file first.");
//     return;
//   }
//   if (selectedFiles.length > 1) {
//     toast.warning("Media Analyzer currently only supports a single file. Please select only one file.");
//     return;
//   }

//   const uploadResult = uploadedFilename
//     ? { filenames: [uploadedFilename], success: true }
//     : await uploadSingleFile(selectedFiles[0]);

//   let filename = '';
//   if (typeof uploadResult === "string") {
//     filename = uploadResult;
//   } else if (uploadResult && uploadResult.filenames && uploadResult.filenames.length) {
//     filename = uploadResult.filenames[0];
//   }
// console.log(uploadResult);
//   if (filename) {
//     await analyzeMedia(filename);
//   } else {
//     toast.error("Failed to extract filename from upload result.");
//   }
// };


//   const analyzeMedia = async (uploadedFile) => {
//   const resp = await fetch("http://localhost:8200/run", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       operation: "analyze",
//       inputFile: uploadedFile
//     }),
//   });
//   const result = await resp.json();
//   if (result.success) {
//     // Show result.output in your UI
//   } else {
//     // Show error
//   }
// };


//   return (
//     <MainLayout>
//       <div className="flex-1 space-y-4 p-8 pt-6">
//         <h2 className="text-3xl font-bold tracking-tight">Media Analyzer</h2>
//         <p className="text-muted-foreground">Analyze media files to display detailed information.</p>

//         {/* Use the hook's file select handler */}
//         <FileUploader onFileSelect={handleFileSelect} />

//         {selectedFiles.length > 0 && ( // Use hook's selectedFiles for UI visibility
//           <Card className="w-full">
//             <CardHeader>
//               <CardTitle>Analysis Command</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">

//                {isUploading && (
//                    <p className="text-sm text-blue-600">Uploading file...</p>
//                )}

//                {/* Render options only after initial file selection and not uploading */}
//                {!isUploading && selectedFiles.length > 0 && (
//                    <>
//                        {/* Display selected files */}
//                        <div>
//                            <h4 className="text-md font-semibold mb-2">Selected File(s):</h4>
//                            <ul>
//                                {selectedFiles.map((file, index) => (
//                                    <li key={index} className="text-sm text-muted-foreground">{file.name}</li>
//                                ))}
//                            </ul>
//                        </div>

//                        {selectedFiles.length > 1 && (
//                            <p className="text-sm text-yellow-600">Note: Analysis currently only applies to the first selected file.</p>
//                        )}

//                        <p className="text-sm text-muted-foreground">
//                            Select a file above to generate the `ffprobe` command to analyze it.
//                        </p>

//                        {/* Run Button - uses the new handleRunClick */}
//                        <Button
//                            onClick={handleRunClick} // Use the new handler
//                            disabled={selectedFiles.length === 0 || isProcessing || isUploading} // Disable if no file, processing, or uploading
//                        >
//                            {isProcessing ? (
//                                <>
//                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                                    Analyzing...
//                                </>
//                            ) : isUploading ? (
//                                <>
//                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                                    Uploading...
//                                </>
//                            ) : (
//                                "Run Analysis Command"
//                            )}
//                        </Button>
//                        <p className="text-sm text-yellow-600">
//                            Note: Clicking "Run" will first upload the selected file and then send the command to your local backend server running on http://localhost:8200.
//                            Ensure your backend is running and has access to the selected file and `ffprobe`. The output of the command will appear in your backend's console/terminal, not here.
//                        </p>
//                    </>
//                )}

//             </CardContent>
//           </Card>
//         )}

//         {/* Use the new OutputMediaPlayer component - less relevant here */}
//         {/* <OutputMediaPlayer outputFile={outputFile} mediaError={mediaError} setMediaError={setMediaError} /> */}

//         {/* FFmpegCommandDisplay component is now added back */}
//         <FFmpegCommandDisplay command={generatedCommand} />

//       </div>
//     </MainLayout>
//   );
// };

// export default MediaAnalyzer;


// const FFprobeResults = ({ output }) => {
//   if (!output) return null;
//   let parsed;
//   try {
//     parsed = parseFFprobeOutput(output);
//   } catch (e) {
//     return <pre className="text-red-600">Failed to parse analysis output.</pre>;
//   }

//   const format = parsed?.FORMAT?.[0];
//   const streams = parsed?.STREAM || [];

//   return (
//     <div className="space-y-4">
//       {format && (
//         <div className="border p-4 rounded-xl bg-muted">
//           <div className="font-bold text-lg mb-2">File Format</div>
//           <table className="w-full text-sm">
//             <tbody>
//               <tr>
//                 <td className="font-medium pr-2">Filename:</td>
//                 <td>{format.filename}</td>
//               </tr>
//               <tr>
//                 <td className="font-medium pr-2">Format:</td>
//                 <td>{format.format_long_name} ({format.format_name})</td>
//               </tr>
//               <tr>
//                 <td className="font-medium pr-2">Duration:</td>
//                 <td>{Number(format.duration).toFixed(2)} sec</td>
//               </tr>
//               <tr>
//                 <td className="font-medium pr-2">Size:</td>
//                 <td>{Number(format.size / 1024 / 1024).toFixed(2)} MB</td>
//               </tr>
//               <tr>
//                 <td className="font-medium pr-2">Bitrate:</td>
//                 <td>{format.bit_rate ? `${(format.bit_rate / 1000).toFixed(0)} kbps` : "—"}</td>
//               </tr>
//               <tr>
//                 <td className="font-medium pr-2">Streams:</td>
//                 <td>{format.nb_streams}</td>
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       )}

//       {streams.length > 0 && (
//         <div className="space-y-3">
//           <div className="font-bold text-lg">Streams</div>
//           {streams.map((stream, i) => (
//             <div key={i} className="border rounded-lg p-3 bg-white/50">
//               <div className="font-semibold">
//                 {stream.codec_type?.toUpperCase() || "Unknown"} Stream
//                 {stream.codec_name ? ` (${stream.codec_name})` : ""}
//               </div>
//               <table className="text-xs">
//                 <tbody>
//                   {stream.codec_type === "video" && (
//                     <>
//                       <tr>
//                         <td className="pr-2 font-medium">Resolution:</td>
//                         <td>{stream.width}×{stream.height}</td>
//                       </tr>
//                       <tr>
//                         <td className="pr-2 font-medium">Frame rate:</td>
//                         <td>{stream.r_frame_rate}</td>
//                       </tr>
//                       <tr>
//                         <td className="pr-2 font-medium">Pixel format:</td>
//                         <td>{stream.pix_fmt}</td>
//                       </tr>
//                       <tr>
//                         <td className="pr-2 font-medium">Bit rate:</td>
//                         <td>{stream.bit_rate ? `${(stream.bit_rate / 1000).toFixed(0)} kbps` : "—"}</td>
//                       </tr>
//                     </>
//                   )}
//                   {stream.codec_type === "audio" && (
//                     <>
//                       <tr>
//                         <td className="pr-2 font-medium">Sample rate:</td>
//                         <td>{stream.sample_rate} Hz</td>
//                       </tr>
//                       <tr>
//                         <td className="pr-2 font-medium">Channels:</td>
//                         <td>{stream.channels}</td>
//                       </tr>
//                       <tr>
//                         <td className="pr-2 font-medium">Channel layout:</td>
//                         <td>{stream.channel_layout}</td>
//                       </tr>
//                       <tr>
//                         <td className="pr-2 font-medium">Bit rate:</td>
//                         <td>{stream.bit_rate ? `${(stream.bit_rate / 1000).toFixed(0)} kbps` : "—"}</td>
//                       </tr>
//                     </>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default FFprobeResults;