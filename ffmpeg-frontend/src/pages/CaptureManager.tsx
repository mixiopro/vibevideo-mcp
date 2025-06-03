import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import FFmpegCommandDisplay from "@/components/shared/FFmpegCommandDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; // Import Button
import { Loader2, CircleDot, Square } from "lucide-react"; // Import icons for recording state
import { useFFmpegProcessor, SupportedCaptureMode } from "@/hooks/useFFmpegProcessor"; // Import the hook and SupportedCaptureMode type
import { toast } from "sonner"; // Import toast
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert components
import { Terminal } from "lucide-react"; // Import Terminal icon
import OutputMediaPlayer from "@/components/shared/OutputMediaPlayer"; // Import OutputMediaPlayer


const CaptureManager = () => {
  // Use the hook, including the new capture state and functions
  const {
    generatedCommand, // Get the generated command from the hook
    isCapturing, // Get the capture state
    setCommand, // Use the hook's set command function
    startCapture, // Use the new start capture function
    stopCapture, // Use the new stop capture function
    probeDevice, // New function to probe device capabilities
    supportedModes, // New state for supported modes
    ffmpegErrorOutput, // New state for FFmpeg error output
    isProcessing, // Use isProcessing from hook for probe loading state
    outputFile, // Get outputFile from the hook
    mediaError, // Get mediaError from the hook
    setMediaError, // Get setMediaError from the hook
    setSupportedModes, // <-- Added back
    setFFmpegErrorOutput, // <-- Added back
  } = useFFmpegProcessor();

  // Let's add the requested log for setCommand right here
  // console.log("CaptureManager: setCommand from hook is:", setCommand); // <-- Added log


  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [selectedMode, setSelectedMode] = useState<string>(""); // State to hold selected mode string "resolution@framerate"
  const prevDeviceRef = useRef(selectedDevice);


  // Placeholder device options - Added the specific macOS screen option
  const deviceOptions = [
    { label: "Select Device", value: "" }, // Added a default empty option
    { label: "Webcam (Windows - dshow)", value: "dshow,video=\"Integrated Camera\"" },
    { label: "Screen (Windows - gdigrab)", value: "gdigrab,title=\"Desktop\"" },
    { label: "Webcam (Linux - v4l2)", value: "v4l2,/dev/video0" },
    { label: "Screen (Linux - x11grab)", value: "x11grab,:0.0" },
    { label: "Webcam (FaceTime HD, macOS)", value: "avfoundation,0:0" },
    // { label: "Webcam (Griddy Grow Desk, macOS)", value: "avfoundation,1:0" },
    { label: "Screen (macOS - Capture screen 0)", value: "avfoundation,3:none" }, // Added the specific macOS screen option
    // Add more platform/device examples
  ];

  // Effect to probe device when selectedDevice changes
  useEffect(() => {
    if (prevDeviceRef.current !== selectedDevice) {

    console.log("[CaptureManager] useEffect [selectedDevice] triggered:", selectedDevice);
    setSelectedMode("");
    setCommand("");
    setMediaError(false); // Reset media error on device change
    if (!selectedDevice) return;

    // Only probe if not mac screen device
    if (selectedDevice !== "avfoundation,3:none") {
      probeDevice(selectedDevice);
    } else {
        // If mac screen device, do NOT probe (we use static modes)
        // Clear supported modes as probe won't run
        setSupportedModes([]);
    }
  }
    // If mac screen device, do NOT probe (we use static modes)
  }, [selectedDevice]); // Added dependencies


  // Effect to generate command string for display whenever selectedDevice or selectedMode changes
  useEffect(() => {
      console.log("[CaptureManager] useEffect [command generation] triggered.", { selectedDevice, selectedMode });
      // --- Guard against generating command when device or mode is empty ---
      if (!selectedDevice || !selectedMode) {
          console.log("[CaptureManager] useEffect [command generation]: device or mode is empty, clearing command.");
          setCommand(""); // Clear command if requirements aren't met
          return; // Exit early
      }
      // --- End Guard ---

      // Parse resolution and framerate from the selected mode string
      const [res, fps] = selectedMode.split('@');
      if (res && fps) {
          generateCommand(selectedDevice, res, fps);
      } else {
          console.log("[CaptureManager] useEffect [command generation]: Invalid mode string, clearing command.");
          setCommand(""); // Clear command if mode string is invalid
      }
  }, [selectedDevice, selectedMode, setCommand]); // Add setCommand to dependencies


  const handleDeviceChange = (value: string) => {
    console.log("[CaptureManager] handleDeviceChange called with:", value);
    setSelectedDevice(value);
    // The useEffect hook will now handle probing and state resets based on the new value
  };

  const handleModeChange = (value: string) => {
      console.log("[CaptureManager] handleModeChange called with:", value);
      setSelectedMode(value);
      // The useEffect hook will now handle command generation based on the new value
  }


  const generateCommand = (device: string, res: string, fps: string): { command: string, outputFile: string } => {
  console.log("[CaptureManager] generateCommand called with:", { device, res, fps });
  if (!device || !res || !fps) {
    console.log("[CaptureManager] generateCommand: Missing parameters, returning empty.");
    return { command: "", outputFile: "" };
  }

  // Extract format and input from the device value string
  const parts = device.split(',');
  if (parts.length < 2) {
    console.error("[CaptureManager] generateCommand: Invalid device value format:", device);
    return { command: "Error: Invalid device value format.", outputFile: "" };
  }
  const format = parts[0];
  const input = parts.slice(1).join(',');

  // Output file (timestamped)
  const outputFileName = `capture_${Date.now()}.mp4`;

  let command = "";

  if (format === 'avfoundation') {
    // macOS screen/webcam capture, output H.264 for browser compatibility
    command = `ffmpeg -f ${format} -framerate ${fps} -video_size ${res} -i "${input}" -c:v libx264 -pix_fmt yuv420p -preset ultrafast -crf 23 "${outputFileName}"`;
    // If you want audio: use input "3:0" and add: -c:a aac -b:a 128k
  } else {
    // Other formats/platforms: (still consider browser compatibility if you add audio)
    command = `ffmpeg -f ${format} ${res ? `-s ${res}` : ''} ${fps ? `-r ${fps}` : ''} -i "${input}" -c:v libx264 -pix_fmt yuv420p -preset ultrafast -crf 23 "${outputFileName}"`;
  }

  setCommand(command);
  console.log("[CaptureManager] generateCommand: Generated command:", command, "Output file:", outputFileName);
  return { command, outputFile: outputFileName };
};

  // // Function to generate the command string and output filename
  // const generateCommand = (device: string, res: string, fps: string): { command: string, outputFile: string } => {
  //   console.log("[CaptureManager] generateCommand called with:", { device, res, fps });
  //   if (!device || !res || !fps) {
  //     // Return empty strings if command cannot be generated
  //     console.log("[CaptureManager] generateCommand: Missing parameters, returning empty.");
  //     // setCommand("") is handled by the useEffect guard
  //     return { command: "", outputFile: "" };
  //   }

  //   // Extract format and input from the device value string
  //   const parts = device.split(',');
  //   if (parts.length < 2) {
  //       console.error("[CaptureManager] generateCommand: Invalid device value format:", device);
  //       // setCommand("Error: Invalid device value format.") is handled by the useEffect guard
  //       return { command: "Error: Invalid device value format.", outputFile: "" };
  //   }
  //   const format = parts[0];
  //   // The input part is everything after the first comma
  //   const input = parts.slice(1).join(',');


  //   let command = `ffmpeg -f ${format} -i "${input}"`; // Quote the input string

  //   // Use -video_size and -framerate for avfoundation, -s and -r for others
  //   // Note: For avfoundation screen capture, -video_size and -framerate might be required
  //   // and the input format is "video_device_index:audio_device_index".
  //   // The current logic correctly puts "3:none" into the input variable.
  //   // We need to ensure -video_size and -framerate are added correctly.
  //   if (format === 'avfoundation') {
  //       // Add video_size and framerate options
  //       command = `ffmpeg -f ${format} -framerate ${fps} -video_size ${res} -i "${input}"`;
  //   } else {
  //       // Existing logic for other formats
  //       if (res) {
  //           command += ` -s ${res}`; // -s for resolution
  //       }
  //       if (fps) {
  //           command += ` -r ${fps}`; // -r for frame rate
  //       }
  //        command = `ffmpeg -f ${format} ${res ? `-s ${res}` : ''} ${fps ? `-r ${fps}` : ''} -i "${input}"`; // Reconstruct for clarity
  //   }


  //   // Example output format and filename
  //   // Use a timestamp in the filename to avoid overwriting
  //   const outputFileName = `capture_${Date.now()}.mp4`;
  //   command += ` "${outputFileName}"`;

  //   setCommand(command); // Use hook's setCommand to update the display
  //   console.log("[CaptureManager] generateCommand: Generated command:", command, "Output file:", outputFileName);
  //   return { command, outputFile: outputFileName }; // Return both
  // };

  // Handler for the Start Recording button
  const handleStartRecording = () => {
      console.log("[CaptureManager] handleStartRecording called.");
      // Generate the command and get the output filename right before starting
      // Use the current state values
      const [res, fps] = selectedMode.split('@');
      const { command, outputFile } = generateCommand(selectedDevice, res, fps);

      if (!command || !outputFile || command.startsWith("Error:") || command === "FFmpeg command will appear here...") {
          toast.warning("No valid FFmpeg command or output file generated. Please select device and options.");
          return;
      }

      // The command state is already set by generateCommand, no need to set it again here

      // Call the new startCapture function from the hook, passing both
      startCapture(command, outputFile);
  };

  // Handler for the Stop Recording button
  const handleStopRecording = () => {
      console.log("[CaptureManager] handleStopRecording called.");
      // Call the new stopCapture function from the hook
      stopCapture();
  };

  // Filter supported modes for the preview environment
  // Note: For "avfoundation,3:none", the probe might not return modes.
  // We might need to manually add common screen resolutions/framerates here
  // or allow the user to input them if probing fails for this device type.
  // For now, let's keep the filtering logic but be aware it might result in an empty list.
  const isPreviewDevice = selectedDevice === "avfoundation,1"; // Assuming this is the preview device value
  const isMacScreenDevice = selectedDevice === "avfoundation,3:none"; // Check for the specific Mac screen device

  // If it's the Mac screen device, provide some common screen modes manually
  const macScreenModes: SupportedCaptureMode[] = [
      { resolution: "1920x1080", framerate: "30" },
      { resolution: "1920x1080", framerate: "60" },
      { resolution: "2560x1440", framerate: "30" }, // Example QHD
      { resolution: "3840x2160", framerate: "30" }, // Example 4K
      // Add other common screen resolutions/framerates as needed
  ];

  const modesToDisplay = isMacScreenDevice ? macScreenModes : (isPreviewDevice
      ? supportedModes.filter(mode => mode.resolution === "1920x1440" && mode.framerate === "30")
      : supportedModes);


  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Capture Devices & Screen</h2>
        <p className="text-muted-foreground">Generate FFmpeg commands for capturing from webcams or screens.</p>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Capture Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="device-select">Input Device</Label>
              {/* Use placeholder prop on SelectValue */}
              <Select onValueChange={handleDeviceChange} value={selectedDevice} disabled={isCapturing || isProcessing}>
                <SelectTrigger id="device-select">
                  <SelectValue placeholder="Select device" />
                </SelectTrigger>
                <SelectContent>
                  {/* Filter out the empty value option */}
                  {deviceOptions
                    .filter(option => option.value !== "")
                    .map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Display loading state while probing */}
            {isProcessing && selectedDevice && !isMacScreenDevice && ( // Only show probing message for devices that are actually probed for modes
                 <p className="text-sm text-blue-600">Probing device capabilities...</p>
            )}

            {/* Display supported modes select only if modes are available and not processing */}
            {modesToDisplay.length > 0 && ( // Use modesToDisplay
                 <div className="grid w-full max-w-sm items-center gap-1.5">
                   <Label htmlFor="mode-select">Supported Modes (Resolution @ Frame Rate)</Label>
                   <Select onValueChange={handleModeChange} value={selectedMode} disabled={isCapturing}>
                     <SelectTrigger id="mode-select">
                       <SelectValue placeholder="Select mode" />
                     </SelectTrigger>
                     <SelectContent>
                       {modesToDisplay.map(mode => ( // Use modesToDisplay
                         <SelectItem key={`${mode.resolution}@${mode.framerate}`} value={`${mode.resolution}@${mode.framerate}`}>
                           {`${mode.resolution} @ ${mode.framerate}fps`}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
            )}

             {/* Display message if no modes found after probing (for non-Mac screen) */}
             {!isProcessing && selectedDevice && !isMacScreenDevice && modesToDisplay.length === 0 && (
                 <p className="text-sm text-yellow-600">No supported modes found for this device or probe failed. Check FFmpeg Output below for details.</p>
             )}
              {/* Display message if Mac screen is selected but no mode is chosen */}
             {isMacScreenDevice && !selectedMode && (
                  <p className="text-sm text-yellow-600">Select a resolution and frame rate for screen capture.</p>
             )}


             <p className="text-sm text-yellow-600">
                 Note: Device names and input formats (`-f`) are highly dependent on your operating system and installed devices. The options above are examples. You may need to run `ffmpeg -list_devices true -f dshow -i dummy` (Windows), `ffmpeg -f v4l2 -list_formats all -i /dev/video0` (Linux), or `ffmpeg -f avfoundation -list_devices true -i ""` (macOS) in your terminal to find actual device names and supported formats.
             </p>
              {isMacScreenDevice && (
                  <p className="text-sm text-yellow-600">
                      Specific macOS screen input is `avfoundation,3:none` (video device 3, no audio). Select a mode (resolution/framerate) from the dropdown above.
                  </p>
              )}
             <p className="text-sm text-yellow-600">
                 This tool only generates the FFmpeg command. Executing the command requires FFmpeg installed on your system and appropriate device permissions.
             </p>

          </CardContent>
        </Card>

        {/* Add Start/Stop Recording Buttons */}
        <div className="flex space-x-4">
            <Button
                onClick={handleStartRecording}
                disabled={!selectedMode || isCapturing || isProcessing} // Disable if no mode selected, capturing, or probing
            >
                {isCapturing ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting...
                    </>
                ) : (
                    <>
                        <CircleDot className="mr-2 h-4 w-4 text-red-500" />
                        Start Recording
                    </>
                )}
            </Button>
             <Button
                onClick={handleStopRecording}
                disabled={!isCapturing} // Only enable if currently capturing
                variant="destructive"
            >
                 <Square className="mr-2 h-4 w-4" />
                 Stop Recording
            </Button>
        </div>
         {isCapturing && (
             <p className="text-sm text-blue-600">Recording is active. Check your backend terminal for FFmpeg output.</p>
         )}

        {/* Display FFmpeg Error Output */}
        {ffmpegErrorOutput && (
             <Alert variant="destructive">
               <Terminal className="h-4 w-4" />
               <AlertTitle>FFmpeg Output / Error</AlertTitle>
               <AlertDescription>
                 <pre className="whitespace-pre-wrap text-xs font-mono">{ffmpegErrorOutput}</pre>
               </AlertDescription>
             </Alert>
        )}

        {/* Add the OutputMediaPlayer component here */}
        <OutputMediaPlayer outputFile={outputFile} mediaError={mediaError} setMediaError={setMediaError} />


        {/* FFmpegCommandDisplay component is now added back */}
        <FFmpegCommandDisplay command={generatedCommand} />
      </div>
    </MainLayout>
  );
};

export default CaptureManager;