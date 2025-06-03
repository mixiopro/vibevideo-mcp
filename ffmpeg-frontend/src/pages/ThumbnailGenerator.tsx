import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import FileUploader from "@/components/shared/FileUploader";
import FFmpegCommandDisplay from "@/components/shared/FFmpegCommandDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useFFmpegProcessor } from "@/hooks/useFFmpegProcessor";
import OutputMediaPlayer from "@/components/shared/OutputMediaPlayer";
import { toast } from "sonner";
import type { SingleFileCommandPayload } from "@/hooks/useFFmpegProcessor";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox


const ThumbnailGenerator = () => {
  const {
    selectedFiles,
    outputFile,
    isUploading,
    isProcessing,
    mediaError,
    generatedCommand,
    handleFileSelect: handleFileSelectHook,
    runCommand,
    setCommand,
    setMediaError,
    uploadSingleFile,
  } = useFFmpegProcessor();

  const [activeTab, setActiveTab] = useState<"single" | "sheet">("single");
  const [timestamp, setTimestamp] = useState<string>(""); // For single thumbnail
  const [gridCols, setGridCols] = useState<string>(""); // For thumbnail sheet
  const [gridRows, setGridRows] = useState<string>(""); // For thumbnail sheet

  // New states for multiple sheets and interval
  const [generateMultipleSheets, setGenerateMultipleSheets] = useState<boolean>(false);
  const [thumbnailInterval, setThumbnailInterval] = useState<string>("10"); // Interval in seconds

  // State and Ref for duration detection
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<number | null>(null); // Store duration as number


  // Effect to handle file selection and create object URL for duration detection
  useEffect(() => {
      console.log("[ThumbnailGenerator] useEffect [selectedFiles] triggered. selectedFiles:", selectedFiles);
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
          setDuration(null); // Clear duration
          setMediaError(false); // Reset media error
      } else {
          // If no file or multiple files, clear duration
          setDuration(null); // Clear duration
          setMediaError(false); // Reset media error
      }

      // Cleanup function
      return () => {
          console.log("[ThumbnailGenerator] useEffect [selectedFiles] cleanup");
          if (fileUrl) {
              URL.revokeObjectURL(fileUrl);
          }
      };
  }, [selectedFiles]); // Re-run effect when selectedFiles changes


  // Effect to load video metadata and detect duration
  useEffect(() => {
      console.log("[ThumbnailGenerator] useEffect [fileUrl] triggered. fileUrl:", fileUrl);
      const videoElement = videoRef.current;

      if (fileUrl && videoElement) {
          // Event handler for successful metadata loading
          const onLoadedMetadata = () => {
              console.log("[ThumbnailGenerator] loadedmetadata event fired. Duration:", videoElement.duration);
              if (videoElement.duration && isFinite(videoElement.duration) && videoElement.duration > 0) {
                  // Set duration state as number
                  setDuration(videoElement.duration);
                  console.log("[ThumbnailGenerator] Detected video duration:", videoElement.duration);
              } else {
                  console.warn("[ThumbnailGenerator] Could not detect valid video duration.");
                  setDuration(null); // Clear duration if detection fails
              }
          };

          // Event handler for errors
          const onError = (event: Event) => {
              console.error("[ThumbnailGenerator] Error loading media for duration detection:", event);
              toast.warning("Could not load media for duration detection. Sheet generation based on total duration will be disabled.");
              setDuration(null); // Clear duration on error
          };

          // Add event listeners
          videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
          videoElement.addEventListener('error', onError);

          // Set the source to trigger loading metadata
          videoElement.src = fileUrl;

          // Cleanup function
          return () => {
              console.log("[ThumbnailGenerator] useEffect [fileUrl] cleanup");
              videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
              videoElement.removeEventListener('error', onError);
              videoElement.src = ''; // Clear source
          };
      }
  }, [fileUrl]); // Re-run effect when fileUrl changes


  // Effect to generate command string for display whenever relevant states change
  useEffect(() => {
      console.log("[ThumbnailGenerator] useEffect [command generation] triggered.", { selectedFilesLength: selectedFiles.length, activeTab, timestamp, gridCols, gridRows, generateMultipleSheets, thumbnailInterval, duration });
      if (selectedFiles.length === 1) {
          generateDisplayCommandString(
              selectedFiles[0].name,
              activeTab,
              timestamp,
              gridCols,
              gridRows,
              generateMultipleSheets,
              thumbnailInterval,
              duration
          );
      } else {
          setCommand(""); // Clear command if no file selected
      }
  }, [selectedFiles, activeTab, timestamp, gridCols, gridRows, generateMultipleSheets, thumbnailInterval, duration, setCommand]); // Add all dependencies


  // Use the hook's file select handler directly, but add state reset logic here
  const handleFileSelect = (files: File[]) => {
      console.log("[ThumbnailGenerator] handleFileSelect called with files:", files);
      handleFileSelectHook(files); // Call the hook's handler first

      // Reset tab and options when new files are selected
      setActiveTab("single");
      setTimestamp("");
      setGridCols("");
      setGridRows("");
      setGenerateMultipleSheets(false); // Reset multiple sheets option
      setThumbnailInterval("10"); // Reset interval
      setCommand(""); // Clear command display
      setMediaError(false); // Reset media error
      setDuration(null); // Reset duration
  };


  const handleTabChange = (value: "single" | "sheet") => {
       console.log("[ThumbnailGenerator] handleTabChange called with value:", value, "isUploading:", isUploading, "isProcessing:", isProcessing);
       if (isUploading || isProcessing) {
           toast.warning("Cannot switch tabs while processing or uploading.");
           return;
       }
       setActiveTab(value);
       // Clear options specific to the other tab
       if (value === "single") {
           setGridCols("");
           setGridRows("");
           setGenerateMultipleSheets(false); // Reset multiple sheets option
           setThumbnailInterval("10"); // Reset interval
       } else { // value === "sheet"
           setTimestamp("");
       }
       setMediaError(false); // Reset media error
       // Command will be regenerated by the useEffect hook
   }

  const handleTimestampChange = (value: string) => {
      console.log("[ThumbnailGenerator] handleTimestampChange called with value:", value);
      setTimestamp(value);
      // Command will be regenerated by the useEffect hook
  }

   const handleGridChange = (cols: string, rows: string) => {
       console.log("[ThumbnailGenerator] handleGridChange called with cols:", cols, "rows:", rows);
       setGridCols(cols);
       setGridRows(rows);
       // Command will be regenerated by the useEffect hook
   }

   const handleMultipleSheetsChange = (checked: boolean) => {
       console.log("[ThumbnailGenerator] handleMultipleSheetsChange called with checked:", checked);
       setGenerateMultipleSheets(checked);
       // Command will be regenerated by the useEffect hook
   }

   const handleThumbnailIntervalChange = (value: string) => {
       console.log("[ThumbnailGenerator] handleThumbnailIntervalChange called with value:", value);
       setThumbnailInterval(value);
       // Command will be regenerated by the useEffect hook
   }


  // Function to generate the command string for display (used by useEffect)
  // This uses the *local* file name for display purposes.
  const generateDisplayCommandString = (
      inputFilename: string,
      tab: "single" | "sheet",
      time: string,
      cols: string,
      rows: string,
      multipleSheets: boolean,
      interval: string,
      videoDuration: number | null
  ) => {
       console.log("[ThumbnailGenerator] generateDisplayCommandString called", { inputFilename, tab, time, cols, rows, multipleSheets, interval, videoDuration });
       if (!inputFilename) {
           console.log("[ThumbnailGenerator] generateDisplayCommandString: No inputFilename, returning empty.");
           setCommand("");
           return ""; // Cannot generate command without input file
       }

       const baseName = inputFilename.split('.')[0];
       let command = `ffmpeg -i "${inputFilename}"`;
       let outputFileName = "";
       let filterString = "";
       let extraOptions = "";

       if (tab === "single") {
           if (!time) {
               console.log("[ThumbnailGenerator] generateDisplayCommandString: Single tab, no timestamp, returning empty.");
               setCommand("");
               return ""; // Cannot generate single thumbnail command without timestamp
           }
           outputFileName = `${baseName}_thumb_${time.replace(/:/g, '-')}.png`; // Simple output naming
           // Use -ss for timestamp, -vframes 1 to capture one frame
           command += ` -ss ${time} -vframes 1 "${outputFileName}"`;
       } else { // tab === "sheet"
           const numCols = parseInt(cols);
           const numRows = parseInt(rows);
           const intervalSeconds = parseFloat(interval);

           if (isNaN(numCols) || isNaN(numRows) || numCols <= 0 || numRows <= 0) {
               console.log("[ThumbnailGenerator] generateDisplayCommandString: Sheet tab, invalid cols/rows, returning empty.");
               setCommand("");
               return ""; // Cannot generate sheet command without valid grid dimensions
           }

           const tileFilter = `tile=${numCols}x${numRows}`;

           if (!multipleSheets) { // Single Sheet
               if (videoDuration === null || videoDuration <= 0) {
                   console.log("[ThumbnailGenerator] generateDisplayCommandString: Single sheet requires duration, returning empty.");
                   setCommand("Video duration not detected. Cannot generate a single sheet evenly spaced.");
                   return ""; // Cannot calculate interval without duration
               }
               const totalThumbnailsOnSheet = numCols * numRows;
               // Use the thumbnail filter to get exactly totalThumbnailsOnSheet evenly spaced frames
               filterString = `thumbnail=${totalThumbnailsOnSheet},${tileFilter}`;
               outputFileName = `${baseName}_sheet_${cols}x${rows}.png`;
               extraOptions = `-frames:v 1`; // Output only one frame (the tiled sheet)

           } else { // Multiple Sheets
               if (isNaN(intervalSeconds) || intervalSeconds <= 0) {
                   console.log("[ThumbnailGenerator] generateDisplayCommandString: Multiple sheets requires valid interval, returning empty.");
                   setCommand("");
                   return ""; // Cannot generate multiple sheets without valid interval
               }
               // Use select filter to get frames at a fixed time interval
               filterString = `select='gte(t,n*${intervalSeconds.toFixed(2)})',${tileFilter}`;
               outputFileName = `${baseName}_sheet_%02d.png`; // Output pattern
               // No -frames:v 1 for multiple outputs
           }

           command += ` -vf "${filterString}" ${extraOptions} "${outputFileName}"`;
       }

       console.log("[ThumbnailGenerator] generateDisplayCommandString: Generated command:", command);
       setCommand(command); // Set the command using the hook's function
       return command; // Return the generated command string
   };

  // New handler for the Run button
  const handleRunClick = async () => {
      console.log("[ThumbnailGenerator] handleRunClick called.", { selectedFilesLength: selectedFiles.length, activeTab, timestamp, gridCols, gridRows, generateMultipleSheets, thumbnailInterval, duration });
      if (selectedFiles.length === 0) {
          toast.warning("Please select a video file first.");
          return;
      }
      if (selectedFiles.length > 1) {
          toast.warning("Thumbnail Generation currently only supports a single file. Please select only one file.");
          return;
      }

      if (activeTab === "single" && !timestamp) {
          toast.warning("Please enter a timestamp for the single thumbnail.");
          return;
      }
      if (activeTab === "sheet") {
          const numCols = parseInt(gridCols);
          const numRows = parseInt(gridRows);
          if (isNaN(numCols) || isNaN(numRows) || numCols <= 0 || numRows <= 0) {
              toast.warning("Please enter valid columns and rows for the thumbnail sheet.");
              return;
          }
          if (!generateMultipleSheets && (duration === null || duration <= 0)) {
               toast.warning("Video duration not detected. Cannot generate a single sheet evenly spaced. Try generating multiple sheets with a fixed interval instead.");
               return;
          }
          if (generateMultipleSheets) {
              const intervalSeconds = parseFloat(thumbnailInterval);
              if (isNaN(intervalSeconds) || intervalSeconds <= 0) {
                  toast.warning("Please enter a valid positive interval in seconds for multiple sheets.");
                  return;
              }
          }
      }

      // Explicitly trigger single file upload
      console.log("[ThumbnailGenerator] handleRunClick: Calling uploadSingleFile...");
      const uploadedFile = await uploadSingleFile(selectedFiles[0]);
      console.log("[ThumbnailGenerator] handleRunClick: uploadSingleFile returned:", uploadedFile);


      if (uploadedFile) {
          // Construct the actual command payload using the *uploaded* filename
          const actualCommand = generateDisplayCommandString(
              uploadedFile,
              activeTab,
              timestamp,
              gridCols,
              gridRows,
              generateMultipleSheets,
              thumbnailInterval,
              duration // Pass the detected duration
          );
          console.log("[ThumbnailGenerator] handleRunClick: Actual command generated for backend:", actualCommand);

          // Check if command was successfully generated (e.g., if required fields were missing)
          if (!actualCommand || actualCommand.startsWith("Video duration not detected.")) { // Check for the specific error message too
              toast.error("Could not generate command. Please check your options.");
              return;
          }

          const payload: SingleFileCommandPayload = {
              command: actualCommand,
              inputFile: uploadedFile, // Use the uploaded filename
          };
          console.log("[ThumbnailGenerator] handleRunClick: Running command with payload:", payload);
          runCommand(payload); // Run the command via the hook
      }
  };

  // Determine if sheet options should be disabled (e.g., if no file selected or processing)
  const isSheetDisabled = selectedFiles.length === 0 || isProcessing || isUploading;
  // Determine if the "Generate multiple sheets" checkbox should be disabled
  const isGenerateMultipleSheetsDisabled = isProcessing || isUploading;
  // Determine if the Interval input should be disabled
  const isIntervalInputDisabled = isProcessing || isUploading || !generateMultipleSheets;
  // Determine if the Run button should be disabled based on the active tab and inputs
  const isRunButtonDisabled =
       selectedFiles.length === 0 ||
       isProcessing ||
       isUploading ||
       (activeTab === 'single' && !timestamp) || // Disable single if no timestamp
       (activeTab === 'sheet' && (!gridCols || !gridRows || parseInt(gridCols) <= 0 || parseInt(gridRows) <= 0)) || // Disable sheet if no grid dimensions
       (activeTab === 'sheet' && !generateMultipleSheets && (duration === null || duration <= 0)) || // Disable single sheet if no duration
       (activeTab === 'sheet' && generateMultipleSheets && (!thumbnailInterval || parseFloat(thumbnailInterval) <= 0)); // Disable multiple sheets if no valid interval


  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Thumbnail Generator</h2>
        <p className="text-muted-foreground">Capture single screenshots or generate thumbnail sheets from videos.</p>

        {/* Hidden video element for duration detection */}
        <video ref={videoRef} style={{ display: 'none' }} preload="metadata" />

        {/* Use the hook's file select handler */}
        <FileUploader onFileSelect={handleFileSelect} />

        {selectedFiles.length > 0 && ( // Use hook's selectedFiles for UI visibility
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Generation Options</CardTitle>
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
                           <p className="text-sm text-yellow-600">Note: Thumbnail Generation currently only supports a single file. Only the first file will be processed.</p>
                       )}

                       <Tabs value={activeTab} onValueChange={(value: "single" | "sheet") => handleTabChange(value)} className="w-full">
                           <TabsList className="grid w-full grid-cols-2 max-w-sm">
                               <TabsTrigger value="single" disabled={isProcessing || isUploading}>Single Thumbnail</TabsTrigger>
                               <TabsTrigger value="sheet" disabled={isSheetDisabled}>Thumbnail Sheet</TabsTrigger> {/* Disable sheet tab if no file or processing */}
                           </TabsList>
                           <TabsContent value="single" className="space-y-4 pt-4">
                               <p className="text-sm text-muted-foreground">Capture a single frame at a specific timestamp.</p>
                               <div className="grid w-full max-w-sm items-center gap-1.5">
                                   <Label htmlFor="timestamp">Timestamp (e.g., 00:00:05 or 5)</Label>
                                   <Input
                                       id="timestamp"
                                       type="text"
                                       placeholder="HH:MM:SS or seconds"
                                       value={timestamp}
                                       onChange={(e) => handleTimestampChange(e.target.value)}
                                       disabled={isProcessing || isUploading}
                                   />
                               </div>
                           </TabsContent>
                           <TabsContent value="sheet" className="space-y-4 pt-4">
                                <p className="text-sm text-muted-foreground">Generate a grid of thumbnails from the video.</p>

                                {/* Multiple Sheets Checkbox */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="generate-multiple-sheets"
                                        checked={generateMultipleSheets}
                                        onCheckedChange={(checked: boolean) => handleMultipleSheetsChange(checked)}
                                        disabled={isGenerateMultipleSheetsDisabled}
                                    />
                                    <Label htmlFor="generate-multiple-sheets">Generate multiple sheets (for long videos)</Label>
                                </div>

                                {/* Interval Input (shown only for multiple sheets) */}
                                {generateMultipleSheets && (
                                    <div className="grid w-full max-w-sm items-center gap-1.5">
                                        <Label htmlFor="thumbnail-interval">Interval between thumbnails (seconds)</Label>
                                        <Input
                                            id="thumbnail-interval"
                                            type="number"
                                            placeholder="e.g., 10"
                                            value={thumbnailInterval}
                                            onChange={(e) => handleThumbnailIntervalChange(e.target.value)}
                                            min="0.1"
                                            step="0.1"
                                            disabled={isIntervalInputDisabled}
                                        />
                                         <p className="text-sm text-muted-foreground">Captures a thumbnail every X seconds.</p>
                                    </div>
                                )}

                                {/* Grid Dimensions */}
                                <div className="flex space-x-4 w-full max-w-md">
                                   <div className="grid gap-1.5 w-1/2">
                                       <Label htmlFor="grid-cols">Columns per sheet</Label>
                                       <Input
                                           id="grid-cols"
                                           type="number"
                                           placeholder="e.g., 5"
                                           value={gridCols}
                                           onChange={(e) => handleGridChange(e.target.value, gridRows)}
                                           min="1"
                                           disabled={isProcessing || isUploading}
                                       />
                                   </div>
                                   <div className="grid gap-1.5 w-1/2">
                                       <Label htmlFor="grid-rows">Rows per sheet</Label>
                                       <Input
                                           id="grid-rows"
                                           type="number"
                                           placeholder="e.g., 4"
                                           value={gridRows}
                                           onChange={(e) => handleGridChange(gridCols, e.target.value)}
                                           min="1"
                                           disabled={isProcessing || isUploading}
                                       />
                                   </div>
                               </div>

                                {/* Duration Info / Warning */}
                                {!generateMultipleSheets && (
                                    <p className="text-sm text-yellow-600">
                                        Note: Generating a single sheet evenly spaced requires knowing the video duration. Duration detected: {duration !== null ? `${duration.toFixed(2)} seconds` : 'Detecting...'}
                                        {duration === null && " (Cannot generate single sheet evenly spaced without duration)"}
                                    </p>
                                )}
                                {generateMultipleSheets && (
                                     <p className="text-sm text-yellow-600">
                                         Note: Generating multiple sheets uses a fixed interval. Ensure the interval is appropriate for your video length and desired number of thumbnails.
                                     </p>
                                )}

                           </TabsContent>
                       </Tabs>

                       {/* Run Button - uses the new handleRunClick */}
                       <Button
                           onClick={handleRunClick} // Use the new handler
                           disabled={isRunButtonDisabled}
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
                           Note: Clicking "Run" will first upload the selected file and then send the command to your local backend server running on http://localhost:8200.
                           Ensure your backend is running and has access to the selected file.
                       </p>
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

export default ThumbnailGenerator;