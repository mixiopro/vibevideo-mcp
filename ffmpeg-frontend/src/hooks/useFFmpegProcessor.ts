import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = "http://localhost:8200";

// Define types for the different command payloads
export type SingleFileCommandPayload = { // Exported
  command: string;
  inputFile: string;
};

export type JoinOperationPayload = { // Exported
  operation: "join";
  filenames: string[];
  output: string;
};

// Define the new payload type for GIF palette creation
export type GifPalettePayload = { // Exported
    operation: "gif_palette";
    inputFile: string;
    output: string;
    scale_height: number;
    fps: number;
    start_time?: string; // Optional
    duration?: number; // Optional
};

// ---- New payload for the 'analyze' operation ----
export type AnalyzeOperationPayload = {
  operation: "analyze";
  inputFile: string;
};

// Extend the union to include analyze
export type RunCommandPayload =
  | SingleFileCommandPayload
  | JoinOperationPayload
  | GifPalettePayload
  | AnalyzeOperationPayload;

// Define type for supported capture modes
export type SupportedCaptureMode = {
    resolution: string;
    framerate: string;
};


export function useFFmpegProcessor() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  // uploadedFilename is now only used for the default single-file upload triggered by handleFileSelect
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  // New state to store filenames returned after a multi-file upload for join
  const [uploadedFilenamesForJoin, setUploadedFilenamesForJoin] = useState<string[] | null>(null);
  const [analysisOutput, setAnalysisOutput] = useState<string>("");   // ← NEW

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [outputFile, setOutputFile] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<boolean>(false);
  const [generatedCommand, setGeneratedCommand] = useState<string>(""); // State for the generated command

  // New state for capture functionality
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  // New state for supported capture modes
  const [supportedModes, setSupportedModes] = useState<SupportedCaptureMode[]>([]);
  // New state for FFmpeg error output
  const [ffmpegErrorOutput, setFFmpegErrorOutput] = useState<string | null>(null);
const [commandOutput, setCommandOutput] = useState<string>("");


  // Handler for file selection in FileUploader
  const handleFileSelect = (files: File[]) => {
    console.log("[useFFmpegProcessor] Files selected:", files);
    setSelectedFiles(files);
    // Reset states when new files are selected
    setUploadedFilename(null);
    setUploadedFilenamesForJoin(null);
    setOutputFile(null);
    setMediaError(false);
    setGeneratedCommand(""); // Use internal setter
    setFFmpegErrorOutput(null); // Clear previous errors
  };

  // Function to upload a single file
  const uploadSingleFile = async (file: File): Promise<string | null> => {
      console.log("[useFFmpegProcessor] Attempting to upload single file:", file.name);
      setIsUploading(true);
      setFFmpegErrorOutput(null); // Clear previous errors before upload
      try {
          const formData = new FormData();
          formData.append('file', file);

          const response = await axios.post(`${BACKEND_URL}/upload`, formData, {
              headers: {
                  'Content-Type': 'multipart/form-data',
              },
          });

          setIsUploading(false);
          if (
            response.data &&
            Array.isArray(response.data.filenames) &&
            response.data.filenames.length > 0
            ) {
            const filename = response.data.filenames[0];
            console.log("[useFFmpegProcessor] Single file uploaded successfully:", filename);
            setUploadedFilename(filename);
            toast.success(`File uploaded: ${filename}`);
            return filename; // Return the uploaded filename
            } else {
            console.error("[useFFmpegProcessor] Single file upload failed: No filename in response", response.data);
            toast.error("File upload failed: No filename returned.");
            setFFmpegErrorOutput("File upload failed: No filename returned from backend.");
            return null;
}
      } catch (error: any) {
          setIsUploading(false);
          console.error("[useFFmpegProcessor] Error uploading single file:", error);
          const errorMessage = error.response?.data?.error || error.message || "Failed to connect to local server for upload. Is your backend running on http://localhost:8200?";
          toast.error(`Upload failed: ${errorMessage}`);
          setFFmpegErrorOutput(`Upload failed: ${errorMessage}`);
          return null;
      }
  };

   // Function to upload multiple files for joining
   const uploadFilesForJoin = async (files: File[]): Promise<string[] | null> => {
       console.log("[useFFmpegProcessor] Attempting to upload multiple files for join:", files.map(f => f.name));
       setIsUploading(true);
       setFFmpegErrorOutput(null); // Clear previous errors before upload
       try {
           const formData = new FormData();
           files.forEach(file => {
               formData.append('files', file); // Use 'files' for multiple files
           });

           const response = await axios.post(`${BACKEND_URL}/upload-multiple`, formData, {
               headers: {
                   'Content-Type': 'multipart/form-data',
               },
           });

           setIsUploading(false);
           if (response.data && Array.isArray(response.data.filenames) && response.data.filenames.length > 0) {
               console.log("[useFFmpegProcessor] Multiple files uploaded successfully:", response.data.filenames);
               setUploadedFilenamesForJoin(response.data.filenames);
               toast.success(`${response.data.filenames.length} files uploaded.`);
               return response.data.filenames; // Return the list of uploaded filenames
           } else {
               console.error("[useFFmpegProcessor] Multi-file upload failed: No filenames in response", response.data);
               toast.error("Multi-file upload failed: No filenames returned.");
               setFFmpegErrorOutput("Multi-file upload failed: No filenames returned from backend.");
               return null;
           }
       } catch (error: any) {
           setIsUploading(false);
           console.error("[useFFmpegProcessor] Error uploading multiple files:", error);
           const errorMessage = error.response?.data?.error || error.message || "Failed to connect to local server for upload. Is your backend running on http://localhost:8200?";
           toast.error(`Upload failed: ${errorMessage}`);
           setFFmpegErrorOutput(`Upload failed: ${errorMessage}`);
           return null;
       }
   };

//    const runCommand = async (payload: RunCommandPayload) => {
//   console.log("[useFFmpegProcessor] runCommand payload:", payload);

//   setIsProcessing(true);
//   setOutputFile(null);
//   setMediaError(false);
//   setFFmpegErrorOutput(null);
//   setAnalysisOutput("");

//   // Determine whether this is an analyze request
//   const isAnalyze =
//     "operation" in payload && payload.operation === "analyze";

//   // **Always** post to /run — your Flask app only defines `/run`
//   const endpoint = "/run";

//   try {
//     const response = await axios.post(
//       `${BACKEND_URL}${endpoint}`,
//       payload
//     );
//     setIsProcessing(false);

//     if (isAnalyze) {
//       // ── ANALYZE BRANCH ──
//       if (response.data.success) {
//         setAnalysisOutput(response.data.output || "");
//         toast.success("Analysis complete!");
//       } else {
//         toast.error(response.data.message || "Analysis failed");
//         setFFmpegErrorOutput(response.data.output || response.data.error);
//       }
//       return;
//     }

//     // ── STANDARD FFmpeg BRANCH ──
//     if (response.data.output_file) {
//       setOutputFile(response.data.output_file);
//       toast.success("FFmpeg command executed successfully!");
//       if (response.data.stderr) {
//         console.warn("[useFFmpegProcessor] ffmpeg stderr:", response.data.stderr);
//       }
//     } else if (response.data.error || response.data.stderr) {
//       const err = response.data.error || response.data.stderr;
//       toast.error(`FFmpeg failed: ${err}`);
//       setFFmpegErrorOutput(err);
//     } else {
//       toast.error("Unknown response from backend");
//       setFFmpegErrorOutput("Unknown response from backend");
//     }
//   } catch (e: any) {
//     setIsProcessing(false);
//     const msg =
//       e.response?.data?.error ||
//       e.message ||
//       "Could not reach backend";
//     toast.error(msg);
//     setFFmpegErrorOutput(msg);
//   }
// };


//   const runCommand = async (payload: RunCommandPayload) => {
//   console.log("[useFFmpegProcessor] runCommand payload:", payload);

//   setIsProcessing(true);
//   setOutputFile(null);
//   setMediaError(false);
//   setFFmpegErrorOutput(null);
//   setAnalysisOutput(""); // clear old analysis

//   // Detect analyze vs ffmpeg paths
//   const isAnalyze =
//     "operation" in payload && payload.operation === "analyze";

//   // choose the correct endpoint
//   const endpoint = isAnalyze ? "/run" : "/run-ffmpeg";

//   try {
//     const response = await axios.post(
//       `${BACKEND_URL}${endpoint}`,
//       payload
//     );

//     setIsProcessing(false);

//     if (isAnalyze) {
//       // ── ANALYZE BRANCH ──
//       if (response.data.success) {
//         setAnalysisOutput(response.data.output || "");
//         toast.success("Analysis complete!");
//       } else {
//         toast.error(response.data.message || "Analysis failed");
//         setFFmpegErrorOutput(response.data.output || response.data.error);
//       }
//       return;
//     }

//     // ── STANDARD FFmpeg BRANCH ──
//     if (response.data && response.data.outputFile) {
//       setOutputFile(response.data.outputFile);
//       toast.success("FFmpeg command executed successfully!");
//       if (response.data.stderr) {
//         console.warn("[useFFmpegProcessor] ffmpeg stderr:", response.data.stderr);
//       }
//     } else if (response.data.error || response.data.stderr) {
//       const err = response.data.error || response.data.stderr;
//       toast.error(`FFmpeg failed: ${err}`);
//       setFFmpegErrorOutput(err);
//     } else {
//       toast.error("Unknown response from backend");
//       setFFmpegErrorOutput("Unknown response from backend");
//     }
//   } catch (e: any) {
//     setIsProcessing(false);
//     const msg =
//       e.response?.data?.error ||
//       e.message ||
//       "Could not reach backend";
//     toast.error(msg);
//     setFFmpegErrorOutput(msg);
//   }
// };


const runCommand = async (payload: RunCommandPayload) => {
  console.log("[useFFmpegProcessor] runCommand payload:", payload);

  setIsProcessing(true);
  setOutputFile(null);
  setMediaError(false);
  setFFmpegErrorOutput(null);
  setAnalysisOutput("");
  setCommandOutput(""); // <---- clear previous output

  const isAnalyze = "operation" in payload && payload.operation === "analyze";
  const endpoint = "/run";

  try {
    const response = await axios.post(`${BACKEND_URL}${endpoint}`, payload);
    setIsProcessing(false);

    if (isAnalyze) {
      if (response.data.success) {
        setAnalysisOutput(response.data.output || "");
        setCommandOutput(response.data.output || ""); // <--- add this
        toast.success("Analysis complete!");
      } else {
        toast.error(response.data.message || "Analysis failed");
        setFFmpegErrorOutput(response.data.output || response.data.error);
        setCommandOutput(response.data.output || response.data.error || ""); // <--- add this
      }
      return;
    }

    // ── STANDARD FFmpeg BRANCH ──
    if (response.data.output) {
      setCommandOutput(response.data.output); // <--- this will display logs, even if no output_file
    }

    if (response.data.output_file) {
      setOutputFile(response.data.output_file);
      toast.success("FFmpeg command executed successfully!");
      if (response.data.stderr) {
        console.warn("[useFFmpegProcessor] ffmpeg stderr:", response.data.stderr);
      }
    } else if (response.data.error || response.data.stderr) {
      const err = response.data.error || response.data.stderr;
      toast.error(`FFmpeg failed: ${err}`);
      setFFmpegErrorOutput(err);
      setCommandOutput(err || "");
    } else if (!response.data.output_file) {
      // If we didn't get an output file, but have logs, that's still useful
      toast.success("FFmpeg command executed. See logs for details.");
    }
        return response.data;

  } catch (e: any) {
    setIsProcessing(false);
    const msg =
      e.response?.data?.error ||
      e.message ||
      "Could not reach backend";
    toast.error(msg);
    setFFmpegErrorOutput(msg);
    setCommandOutput(msg); // <--- error message to output
        return { success: false, error: msg };

  }
};


// Function to start a capture process (might be long-running)
  const startCapture = async (command: string, outputFile: string) => {
      console.log("[useFFmpegProcessor] Attempting to start capture with command:", command, "Output file:", outputFile);
      setIsCapturing(true);
      setIsProcessing(true); // Indicate processing is happening (starting capture)
      setOutputFile(null); // Clear previous output file
      setMediaError(false); // Reset media error state
      setFFmpegErrorOutput(null); // Clear previous errors before starting capture

      try {
          // Send the command to the backend to start the capture process
          // The backend needs to handle this as a potentially long-running process
        const response = await axios.post(`${BACKEND_URL}/api/capture/start`, {
        command,
        output_file: outputFile  // use _ not camelCase!
        });

          setIsProcessing(false); // Processing state might end once capture is confirmed started
            if (response.data && response.data.status === "recording_started") {
              console.log("[useFFmpegProcessor] Capture started successfully.");
              toast.success("Recording started!");
              // The backend should ideally provide a way to get the final output file name later
              // For now, we'll assume the output file name sent in the request is the final one
          } else if (response.data && response.data.error) {
             console.error("[useFFmpegProcessor] Failed to start capture:", response.data.error);
             toast.error(`Failed to start recording: ${response.data.error}`);
             setFFmpegErrorOutput(response.data.error); // Display the specific FFmpeg error
             setIsCapturing(false); // Stop capturing state if it failed to start
          }
           else if (response.data && response.data.stderr) {
             console.error("[useFFmpegProcessor] Failed to start capture with stderr:", response.data.stderr);
             toast.error(`Failed to start recording. Check FFmpeg Output below.`);
             setFFmpegErrorOutput(response.data.stderr); // Display stderr if no explicit error message
             setIsCapturing(false); // Stop capturing state if it failed to start
          }
          else {
              console.error("[useFFmpegProcessor] Failed to start capture: Unknown response", response.data);
              toast.error("Failed to start recording: Unknown response from backend.");
              setFFmpegErrorOutput("An unknown error occurred on the backend while starting capture.");
              setIsCapturing(false); // Stop capturing state if it failed to start
          }
      } catch (error: any) {
          setIsProcessing(false);
          setIsCapturing(false); // Ensure capturing is false on error
          console.error("[useFFmpegProcessor] Error sending start capture command:", error);
          const errorMessage = error.response?.data?.error || error.message || "Failed to connect to local server to start capture. Is your backend running on http://localhost:8200?";
          toast.error(`Failed to start recording: ${errorMessage}`);
          setFFmpegErrorOutput(`Failed to start recording: ${errorMessage}`);
      }
  };

  // Function to stop a capture process
  const stopCapture = async () => {
      console.log("[useFFmpegProcessor] Attempting to stop capture.");
      setIsProcessing(true); // Indicate processing is happening (stopping capture)
      setFFmpegErrorOutput(null); // Clear previous errors before stopping capture

      try {
          // Send a request to the backend to stop the capture process
          const response = await axios.post(`${BACKEND_URL}/api/capture/stop`);

          setIsProcessing(false);
          setIsCapturing(false); // Always set capturing to false after attempting to stop

          if (response.data && response.data.status === "recording_stopped") {
              console.log("[useFFmpegProcessor] Capture stopped successfully.");
              toast.success("Recording stopped!");
              // *** Set the output file using the filename from the backend response ***
              if (response.data.filename) {
                  setOutputFile(response.data.filename);
                  console.log("[useFFmpegProcessor] Output file received from backend:", response.data.filename);
              } else {
                  console.warn("[useFFmpegProcessor] Stop capture response did not contain a filename.");
                  // Optionally clear outputFile if backend doesn't return it on stop
                  // setOutputFile(null);
              }

               if (response.data.stderr) {
                   console.warn("[useFFmpegProcessor] FFmpeg stderr output during stop:", response.data.stderr);
                   // Optionally display stderr in the UI
                   // setFFmpegErrorOutput(response.data.stderr); // Decide if we want to show stderr on success
               }
          } else if (response.data && response.data.error) {
             console.error("[useFFmpegProcessor] Failed to stop capture:", response.data.error);
             toast.error(`Failed to stop recording: ${response.data.error}`);
             setFFmpegErrorOutput(response.data.error); // Display the specific FFmpeg error
          }
           else if (response.data && response.data.stderr) {
             console.error("[useFFmpegProcessor] Failed to stop capture with stderr:", response.data.stderr);
             toast.error(`Failed to stop recording. Check FFmpeg Output below.`);
             setFFmpegErrorOutput(response.data.stderr); // Display stderr if no explicit error message
          }
          else {
              console.error("[useFFmpegProcessor] Failed to stop capture: Unknown response", response.data);
              toast.error("Failed to stop recording: Unknown response from backend.");
              setFFmpegErrorOutput("An unknown error occurred on the backend while stopping capture.");
          }
      } catch (error: any) {
          setIsProcessing(false);
          setIsCapturing(false); // Ensure capturing is false on error
          console.error("[useFFmpegProcessor] Error sending stop capture command:", error);
          const errorMessage = error.response?.data?.error || error.message || "Failed to connect to local server to stop capture. Is your backend running on http://localhost:8200?";
          toast.error(`Failed to stop recording: ${errorMessage}`);
          setFFmpegErrorOutput(`Failed to stop recording: ${errorMessage}`);
      }
  };

const probeDevice = async (deviceValue: string) => {
    console.log("[useFFmpegProcessor] Attempting to probe device:", deviceValue);

    if (!deviceValue) {
        console.log("[useFFmpegProcessor] probeDevice: deviceValue is empty, clearing modes and error output.");
        setSupportedModes([]);
        setFFmpegErrorOutput(null);
        return;
    }

    setIsProcessing(true);
    setSupportedModes([]);
    setFFmpegErrorOutput(null);

    try {
        // Parse format and input from the device string
        const parts = deviceValue.split(',');
        if (parts.length < 2) {
            console.error("[useFFmpegProcessor] probeDevice: Invalid device value format:", deviceValue);
            setFFmpegErrorOutput("Error: Invalid device value format.");
            setIsProcessing(false);
            return;
        }
        const format = parts[0];
        let input = parts.slice(1).join(',').trim();

        // Build the FFmpeg probe command
        let probeCommand = "";
        if (format === 'dshow') {
            probeCommand = `ffmpeg -list_options true -f dshow -i ${input}`;
        } else if (format === 'v4l2') {
            probeCommand = `ffmpeg -f v4l2 -list_formats all -i ${input}`;
        } else if (format === 'avfoundation') {
            let probeInput = input.trim();

            // If input is a single digit (camera), use video:audio
            if (/^\d+$/.test(probeInput)) {
                probeInput = `${probeInput}:0`;
            }
            // If input is "N:none" (screen only), leave as-is.
            // If input is "N:M" (video:audio), leave as-is.

            if (!probeInput) {
                setFFmpegErrorOutput("Device probing failed: avfoundation input is empty.");
                setIsProcessing(false);
                return;
            }

            // Use 30 fps for camera, but allow screen (e.g., '3:none') to also use framerate.
            // If screen index, could be e.g. 3:none (screen capture, no audio)
            probeCommand = `ffmpeg -f avfoundation -framerate 30 -i "${probeInput}" -frames:v 1 -hide_banner -f null -`;
        } else {
            console.warn("[useFFmpegProcessor] probeDevice: Unsupported format for probing:", format);
            setFFmpegErrorOutput(`Probing not supported for format: ${format}`);
            setIsProcessing(false);
            return;
        }

        console.log("[useFFmpegProcessor] Sending probe command to backend:", probeCommand);
        const response = await axios.post(`${BACKEND_URL}/api/capture/probe`, { command: probeCommand });
        setIsProcessing(false);

        // === Parse Backend Response ===
        if (response.data) {
            const stdout = response.data.stdout || "";
            const stderr = response.data.stderr || "";
            const fullOutput = stdout + stderr;

            const modes: SupportedCaptureMode[] = [];

            // --- AVFoundation mode parsing (macOS): e.g. 1920x1080@[15.000000 30.000000]fps
            const avfModeRegex = /(\d+x\d+)@\[(.*?)\]fps/g;
            let avfMatch;
            while ((avfMatch = avfModeRegex.exec(fullOutput)) !== null) {
                const resolution = avfMatch[1];
                const framerates = avfMatch[2].split(' ').filter(Boolean);
                framerates.forEach(fps => {
                    const fpsClean = String(Number(fps)); // drop decimals (e.g. "30" from "30.000000")
                    if (!modes.some(m => m.resolution === resolution && m.framerate === fpsClean)) {
                        modes.push({ resolution, framerate: fpsClean });
                    }
                });
            }
            if (modes.length === 0) {
                // Try to find the currently active mode if no mode list was parsed
                const currentModeMatch = fullOutput.match(/Video: [^\s]+ \([^)]+\), ([a-z0-9_]+), (\d+x\d+)/i);
                if (currentModeMatch) {
                    const resolution = currentModeMatch[2];
                    // No fps reported; you may want to default to 30 or 'unknown'
                    modes.push({ resolution, framerate: '30' });
                }
            }
            // --- Fallbacks for dshow/v4l2 ---
            const modeRegex = /(\d+x\d+)\s+.*?fps:\s*(\d+(\.\d+)?)/g;
            let match;
            while ((match = modeRegex.exec(fullOutput)) !== null) {
                const resolution = match[1];
                const framerate = match[2];
                if (!modes.some(m => m.resolution === resolution && m.framerate === framerate)) {
                    modes.push({ resolution, framerate });
                }
            }
            const fallbackModeRegex = /(\d+x\d+)\s+@?\s*(\d+(\.\d+)?)\s*fps/g;
            while ((match = fallbackModeRegex.exec(fullOutput)) !== null) {
                const resolution = match[1];
                const framerate = match[2];
                if (!modes.some(m => m.resolution === resolution && m.framerate === framerate)) {
                    modes.push({ resolution, framerate });
                }
            }

            if (modes.length > 0) {
                setSupportedModes(modes);
                setFFmpegErrorOutput(null);
            } else {
                setSupportedModes([]);
                setFFmpegErrorOutput("Probe command ran, but no supported video modes were parsed. Full output:\n\n" + fullOutput);
            }
        } else if (response.data && response.data.error) {
            // Backend explicit error
            console.error("[useFFmpegProcessor] Probe command failed with error:", response.data.error);
            toast.error(`Device probing failed: ${response.data.error}`);
            setFFmpegErrorOutput(response.data.error);
            setSupportedModes([]);
        } else if (response.data && response.data.stderr) {
            // stderr as error
            console.error("[useFFmpegProcessor] Probe command failed with stderr:", response.data.stderr);
            toast.error(`Device probing failed. Check FFmpeg Output below.`);
            setFFmpegErrorOutput(response.data.stderr);
            setSupportedModes([]);
        } else {
            // Unknown/unexpected
            console.error("[useFFmpegProcessor] Probe command failed: Unknown response", response.data);
            toast.error("Device probing failed: Unknown response from backend.");
            setFFmpegErrorOutput("An unknown error occurred during probing.");
            setSupportedModes([]);
        }
    } catch (error: any) {
        setIsProcessing(false);
        console.error("[useFFmpegProcessor] Error sending probe command:", error);
        const errorMessage = error.response?.data?.error || error.message || "Failed to connect to local server for probing. Is your backend running on http://localhost:8200?";
        toast.error(`Device probing failed: ${errorMessage}`);
        setFFmpegErrorOutput(`Device probing failed: ${errorMessage}`);
        setSupportedModes([]);
    }
};

  return {
    selectedFiles,
    analysisOutput,
    uploadedFilename,
    uploadedFilenamesForJoin,
    outputFile, 
    commandOutput,
    isUploading,
    isProcessing,
    mediaError, 
    generatedCommand, 
    isCapturing, 
    supportedModes, 
    ffmpegErrorOutput,
    handleFileSelect,
    uploadSingleFile,
    uploadFilesForJoin,
    runCommand,
    setCommand: setGeneratedCommand,
    setMediaError,
    startCapture, 
    stopCapture,
    probeDevice, 
    setSupportedModes, 
    setFFmpegErrorOutput,
  };
}