import { useState, useEffect, useRef } from "react"; // Import useRef
import { MainLayout } from "@/components/layout/MainLayout";
import FileUploader from "@/components/shared/FileUploader";
import FFmpegCommandDisplay from "@/components/shared/FFmpegCommandDisplay"; // Added back
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; // Import Button
import { Loader2 } from "lucide-react"; // Import Loader2 icon
import { useFFmpegProcessor } from "@/hooks/useFFmpegProcessor"; // Import the new hook
import OutputMediaPlayer from "@/components/shared/OutputMediaPlayer"; // Import the new component
import { toast } from "sonner"; // Import toast
import type { SingleFileCommandPayload, GifPalettePayload } from "@/hooks/useFFmpegProcessor"; // Import payload types


const GifWebpCreator = () => {
  // Use the new hook
  const {
    selectedFiles, // Keep selectedFiles from hook for UI logic
    uploadedFilename, // Keep for potential display/debugging, but logic relies on return values from upload functions
    outputFile,
    isUploading,
    isProcessing,
    mediaError,
    generatedCommand, // Get the generated command from the hook
    handleFileSelect, // Use the hook's file select handler
    runCommand, // Use the hook's run command handler
    setCommand, // Use the hook's set command function
    setMediaError, // Pass the hook's setMediaError to the player
    uploadSingleFile, // Import the explicit upload function
  } = useFFmpegProcessor();

  const [startTime, setStartTime] = useState<string>("");
  const [duration, setDuration] = useState<string>(""); // Duration state
  const [outputFormat, setOutputFormat] = useState<"gif" | "webp" | "">("");
  const [scaleHeight, setScaleHeight] = useState<string>("320"); // Default scale height
  const [outputFps, setOutputFps] = useState<string>("10"); // Default output FPS for GIF/WebP

  const formatOptions = ["gif", "webp"];

  // State and Ref for duration detection
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);


  // Effect to handle file selection and create object URL for duration detection
  useEffect(() => {
      // Revoke previous URL if it exists
      if (fileUrl) {
          URL.revokeObjectURL(fileUrl);
          setFileUrl(null); // Clear state
      }

      // If a single file is selected, create a new URL
      if (selectedFiles.length === 1) {
          const file = selectedFiles[0];
          const url = URL.createObjectURL(file);
          setFileUrl(url);
          // Reset duration when a new file is selected
          setDuration("");
          setMediaError(false); // Reset media error
      } else {
          // If no file or multiple files, clear duration
          setDuration("");
          setMediaError(false); // Reset media error
      }

      // Cleanup function
      return () => {
          if (fileUrl) {
              URL.revokeObjectURL(fileUrl);
          }
      };
  }, [selectedFiles]); // Re-run effect when selectedFiles changes


  // Effect to load video metadata and detect duration
  useEffect(() => {
      const videoElement = videoRef.current;

      if (fileUrl && videoElement) {
          // Event handler for successful metadata loading
          const onLoadedMetadata = () => {
              if (videoElement.duration && isFinite(videoElement.duration) && videoElement.duration > 0) {
                  // Set duration state, rounded to 2 decimal places
                  setDuration(videoElement.duration.toFixed(2));
                  console.log("Detected video duration:", videoElement.duration);
              } else {
                  console.warn("Could not detect valid video duration.");
                  setDuration(""); // Clear duration if detection fails
              }
          };

          // Event handler for errors
          const onError = (event: Event) => {
              console.error("Error loading media for duration detection:", event);
              toast.warning("Could not load media for duration detection. Please enter duration manually.");
              setDuration(""); // Clear duration on error
          };

          // Add event listeners
          videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
          videoElement.addEventListener('error', onError);

          // Set the source to trigger loading metadata
          videoElement.src = fileUrl;

          // Cleanup function
          return () => {
              videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
              videoElement.removeEventListener('error', onError);
              videoElement.src = ''; // Clear source
          };
      }
  }, [fileUrl]); // Re-run effect when fileUrl changes


  // Effect to generate command string for display whenever selectedFiles, time, format, scale, or fps changes
  // This command string uses the *local* file name for display purposes.
  useEffect(() => {
      if (selectedFiles.length === 1 && (startTime || duration) && outputFormat && scaleHeight && outputFps) {
          generateDisplayCommandString(selectedFiles[0].name, startTime, duration, outputFormat, scaleHeight, outputFps);
      } else {
          setCommand(""); // Clear command if requirements aren't met
      }
  }, [selectedFiles, startTime, duration, outputFormat, scaleHeight, outputFps, setCommand]); // Add setCommand to dependencies


  const handleTimeChange = (start: string, dur: string) => {
    setStartTime(start);
    setDuration(dur);
    // Command will be regenerated by the useEffect hook
  };

  const handleFormatChange = (value: "gif" | "webp") => {
    setOutputFormat(value);
    // Command will be regenerated by the useEffect hook
  };

  const handleScaleHeightChange = (value: string) => {
      setScaleHeight(value);
      // Command will be regenerated by the useEffect hook
  }

  const handleOutputFpsChange = (value: string) => {
      setOutputFps(value);
      // Command will be regenerated by the useEffect hook
  }


  // Function to generate the command string for display (used by useEffect)
  // This uses the *local* file name for display purposes.
  const generateDisplayCommandString = (inputFilename: string, start: string, dur: string, format: "gif" | "webp" | "", height: string, fps: string) => {
    if (!inputFilename || !format || (!start && !dur) || !height || !fps) {
      return ""; // Return empty string if command cannot be generated
    }

    const baseName = inputFilename.split('.')[0];
    let command = "";
    let outputFileName = "";

    // Common options for both GIF and WebP
    let commonOptions = "";
    if (start) {
      commonOptions += ` -ss ${start}`;
    }
    if (dur) {
      commonOptions += ` -t ${dur}`;
    }

    // Common video filter string
    const videoFilter = `fps=${fps},scale=-1:${height}:flags=lanczos`; // scale=-1:height maintains aspect ratio

    if (format === "gif") {
        // Two-step palette workflow for GIF
        const paletteFileName = `${baseName}_palette.png`;
        outputFileName = `${baseName}_clip.gif`;

        // Step 1: Generate palette
        const command1 = `ffmpeg${commonOptions} -i "${inputFilename}" -vf "${videoFilter},palettegen" -y "${paletteFileName}"`;

        // Step 2: Create GIF using palette
        const command2 = `ffmpeg${commonOptions} -i "${inputFilename}" -i "${paletteFileName}" -filter_complex "${videoFilter}[x];[x][1:v]paletteuse" -y "${outputFileName}"`;

        // Combine commands for display
        command = `## Step 1: Generate Palette\n${command1}\n\n## Step 2: Create GIF using Palette\n${command2}`;

    } else if (format === "webp") {
        // Single command for WebP (basic example)
        outputFileName = `${baseName}_clip.webp`;
        // Use -vcodec libwebp and -lossless 0 for lossy WebP, or -lossless 1 for lossless
        // -q:v quality (0-100)
        command = `ffmpeg${commonOptions} -i "${inputFilename}" -vf "${videoFilter}" -vcodec libwebp -lossless 0 -q:v 80 -y "${outputFileName}"`;
    } else {
        setCommand("");
        return "";
    }

    setCommand(command); // Set the command using the hook's function
    return command; // Return the generated command string
  };

  // New handler for the Run button
  const handleRunClick = async () => {
      if (selectedFiles.length === 0) {
          toast.warning("Please select a video file first.");
          return;
      }
      if (selectedFiles.length > 1) {
          toast.warning("GIF & WebP Creator currently only supports a single file. Please select only one file.");
          return;
      }
      if (!startTime && !duration) {
          toast.warning("Please specify a start time or duration.");
          return;
      }
      if (!outputFormat) {
          toast.warning("Please select an output format (GIF or WebP).");
          return;
      }
      if (!scaleHeight || parseInt(scaleHeight) <= 0) {
           toast.warning("Please enter a valid scale height (greater than 0).");
           return;
      }
       if (!outputFps || parseInt(outputFps) <= 0) {
           toast.warning("Please enter a valid output FPS (greater than 0).");
           return;
      }

      // Parse duration to number for the payload if it's not empty
      const durationNumber = duration ? parseFloat(duration) : undefined;
      if (duration && (isNaN(durationNumber!) || durationNumber! <= 0)) {
           toast.warning("Please enter a valid duration in seconds.");
           return;
      }


      // Explicitly trigger single file upload
      const uploadedFile = await uploadSingleFile(selectedFiles[0]);

      if (uploadedFile) {
          const baseName = uploadedFile.split('.')[0];

          if (outputFormat === "gif") {
              // Construct the new GIF palette payload
              const payload: GifPalettePayload = {
                  operation: "gif_palette",
                  inputFile: uploadedFile,
                  output: `${baseName}_clip.gif`, // Define output filename
                  scale_height: parseInt(scaleHeight), // Ensure number type
                  fps: parseInt(outputFps), // Ensure number type
                  ...(startTime && { start_time: startTime }), // Add if not empty
                  ...(durationNumber !== undefined && { duration: durationNumber }), // Add if valid number
              };
              runCommand(payload); // Run the command via the hook
          } else if (outputFormat === "webp") {
              // Keep existing logic for WebP (single command payload)
              const actualCommand = generateDisplayCommandString(uploadedFile, startTime, duration, outputFormat, scaleHeight, outputFps); // Reuse logic, but pass uploadedFile

              const payload: SingleFileCommandPayload = {
                  command: actualCommand,
                  inputFile: uploadedFile, // Use the uploaded filename
              };
              runCommand(payload); // Run the command via the hook
          }
      }
  };


  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">GIF & WebP Creator</h2>
        <p className="text-muted-foreground">Convert video segments into animated GIF or WebP files.</p>

        {/* Hidden video element for duration detection */}
        <video ref={videoRef} style={{ display: 'none' }} preload="metadata" />

        {/* Use the hook's file select handler */}
        <FileUploader onFileSelect={handleFileSelect} />

        {selectedFiles.length > 0 && ( // Use hook's selectedFiles for UI visibility
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Creation Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

               {isUploading && (
                   <p className="text-sm text-blue-600">Uploading file...</p>
               )}

               {/* Render options only after initial file selection and not uploading */}
               {!isUploading && selectedFiles.length > 0 && (
                   <>
                       {/* Display selected files */}
                       <div>
                           <h4 className="text-md font-semibold mb-2">Selected File(s):</h4>
                           <ul>
                               {selectedFiles.map((file, index) => (
                                   <li key={index} className="text-sm text-muted-foreground">{file.name}</li>
                               ))}
                           </ul>
                       </div>

                       {selectedFiles.length > 1 && (
                           <p className="text-sm text-yellow-600">Note: GIF & WebP Creation currently only supports a single file. Only the first file will be processed.</p>
                       )}

                       <div className="flex space-x-4 w-full max-w-md">
                           <div className="grid gap-1.5 w-1/2">
                               <Label htmlFor="start-time">Start Time (e.g., 00:00:05 or 5)</Label>
                               <Input
                                   id="start-time"
                                   type="text"
                                   placeholder="HH:MM:SS or seconds"
                                   value={startTime}
                                   onChange={(e) => handleTimeChange(e.target.value, duration)}
                                   disabled={isProcessing || isUploading}
                               />
                           </div>
                           <div className="grid gap-1.5 w-1/2">
                               <Label htmlFor="duration">Duration (seconds)</Label>
                               <Input
                                   id="duration"
                                   type="text" // Keep as text to allow HH:MM:SS if needed, but pre-fill with seconds
                                   placeholder="e.g., 10.5"
                                   value={duration}
                                   onChange={(e) => handleTimeChange(startTime, e.target.value)}
                                   disabled={isProcessing || isUploading}
                               />
                           </div>
                       </div>
                        {selectedFiles.length === 1 && fileUrl && !isUploading && !isProcessing && (
                            <p className="text-sm text-muted-foreground">
                                Duration detected: {duration || 'Detecting...'} seconds.
                            </p>
                        )}


                       <div className="grid w-full max-w-sm items-center gap-1.5">
                         <Label htmlFor="output-format">Output Format</Label>
                         <Select onValueChange={handleFormatChange} value={outputFormat} disabled={isProcessing || isUploading}>
                           <SelectTrigger id="output-format">
                             <SelectValue placeholder="Select output format" />
                           </SelectTrigger>
                           <SelectContent>
                             {formatOptions.map(format => (
                               <SelectItem key={format} value={format}>{format.toUpperCase()}</SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </div>

                        <div className="flex space-x-4 w-full max-w-md">
                           <div className="grid gap-1.5 w-1/2">
                               <Label htmlFor="scale-height">Scale Height (px)</Label>
                               <Input
                                   id="scale-height"
                                   type="number"
                                   placeholder="e.g., 320"
                                   value={scaleHeight}
                                   onChange={(e) => handleScaleHeightChange(e.target.value)}
                                   min="1"
                                   disabled={isProcessing || isUploading}
                               />
                           </div>
                           <div className="grid gap-1.5 w-1/2">
                               <Label htmlFor="output-fps">Output FPS</Label>
                               <Input
                                   id="output-fps"
                                   type="number"
                                   placeholder="e.g., 10"
                                   value={outputFps}
                                   onChange={(e) => handleOutputFpsChange(e.target.value)}
                                   min="1"
                                   disabled={isProcessing || isUploading}
                               />
                           </div>
                       </div>


                       {/* Run Button - uses the new handleRunClick */}
                       <Button
                           onClick={handleRunClick} // Use the new handler
                           disabled={(!startTime && !duration) || !outputFormat || selectedFiles.length === 0 || isProcessing || isUploading || !scaleHeight || parseInt(scaleHeight) <= 0 || !outputFps || parseInt(outputFps) <= 0} // Disable if options not selected, no file, processing, or uploading
                       >
                           {isProcessing ? (
                               <>
                                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                   Processing...
                               </>
                           ) : isUploading ? (
                               <>
                                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                   Uploading...
                               </>
                           ) : (
                               `Run Creation`
                           )}
                       </Button>
                       <p className="text-sm text-yellow-600">
                           Note: Clicking "Run" will first upload the selected file and then send the command/operation details to your local backend server running on http://localhost:8200.
                           Ensure your backend is running and has access to the selected file.
                       </p>
                        {outputFormat === 'gif' && (
                            <p className="text-sm text-yellow-600">
                                Note: GIF creation now uses the two-step palette workflow handled automatically by the backend. The commands displayed below show the steps the backend performs.
                            </p>
                        )}
                         {outputFormat === 'webp' && (
                            <p className="text-sm text-yellow-600">
                                Note: WebP creation uses a single command.
                            </p>
                        )}
                   </>
               )}

            </CardContent>
          </Card>
        )}

        {/* Use the new OutputMediaPlayer component */}
        <OutputMediaPlayer outputFile={outputFile} mediaError={mediaError} setMediaError={setMediaError} />

        {/* FFmpegCommandDisplay component is now added back */}
        <FFmpegCommandDisplay command={generatedCommand} />

      </div>
    </MainLayout>
  );
};

export default GifWebpCreator;