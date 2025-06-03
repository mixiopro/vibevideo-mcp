import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import FileUploader from "@/components/shared/FileUploader";
import FFmpegCommandDisplay from "@/components/shared/FFmpegCommandDisplay"; // Added back
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useFFmpegProcessor } from "@/hooks/useFFmpegProcessor";
import OutputMediaPlayer from "@/components/shared/OutputMediaPlayer";
import { toast } from "sonner"; // Import toast
import type { SingleFileCommandPayload } from "@/hooks/useFFmpegProcessor"; // Import payload type


const MediaConverter = () => {
  // Use the new hook
  const {
    selectedFiles,
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

  const [outputFormat, setOutputFormat] = useState<string>("");
  const [codec, setCodec] = useState<string>("");

  // Placeholder options - replace with actual logic later
  const formatOptions = ["mp4", "avi", "mkv", "mov", "gif", "webp", "mp3", "wav", "aac", "flac"];
  const codecOptions: { [key: string]: string[] } = {
    mp4: ["libx264", "libx265", "vp9"],
    avi: ["mpeg4", "libxvid"],
    mkv: ["libx264", "libx265", "vp9"],
    mov: ["libx264"],
    gif: [], // GIF doesn't typically use codecs in the same way
    webp: [], // WebP doesn't typically use codecs in the same way
    mp3: ["libmp3lame"],
    wav: [], // WAV is often uncompressed
    aac: ["aac"],
    flac: [], // FLAC is lossless
  };

  // Effect to generate command string for display whenever selectedFiles, format, or codec changes
  // This command string uses the *local* file name for display purposes.
  useEffect(() => {
      if (selectedFiles.length === 1 && outputFormat) {
          generateDisplayCommandString(selectedFiles[0].name, outputFormat, codec);
      } else {
          setCommand(""); // Clear command if requirements aren't met
      }
  }, [selectedFiles, outputFormat, codec, setCommand]); // Add setCommand to dependencies


  // Function to generate the command string for display (used by useEffect)
  // This uses the *local* file name for display purposes.
  const generateDisplayCommandString = (inputFilename: string, format: string, codec: string) => {
    if (!inputFilename || !format) {
      return ""; // Return empty string if command cannot be generated
    }

    const outputFile = `${inputFilename.split('.')[0]}.${format}`;
    let command = `ffmpeg -i "${inputFilename}"`;

    if (codec) {
      // Determine if it's video or audio codec
      const isVideoCodec = ["libx264", "libx265", "vp9", "mpeg4", "libxvid"].includes(codec);
      const isAudioCodec = ["libmp3lame", "aac"].includes(codec);

      if (isVideoCodec) {
        command += ` -c:v ${codec}`;
      } else if (isAudioCodec) {
        command += ` -c:a ${codec}`;
      }
      // Add copy for the other stream if not specified
      // Check if the output format is primarily audio or video
      const isOutputAudio = formatOptions.slice(6).includes(format);
      const isOutputVideo = formatOptions.slice(0, 6).includes(format);

      if (isVideoCodec && isOutputVideo) {
         command += ` -c:a copy`;
      } else if (isAudioCodec && isOutputAudio) {
         command += ` -c:v copy`; // Less common, but possible
      } else if (isVideoCodec && isOutputAudio) {
          // Converting video to audio, no video stream needed
          command += ` -vn`;
      } else if (isAudioCodec && isOutputVideo) {
          // Converting audio to video, no audio stream needed
          command += ` -an`;
      }


    } else {
       // Default to copy if no codec is selected, or if format doesn't typically use codecs
       if (!["gif", "webp", "wav", "flac"].includes(format)) {
          command += ` -c copy`;
       } else if (["gif", "webp"].includes(format)) {
           // GIF/WebP often require re-encoding and specific filters, not just copy
           // This is a simplified example, a real implementation might need -vf filters
           command += ` -vf "fps=10,scale=320:-1:flags=lanczos"`; // Example filter for GIF/WebP
       } else if (["wav", "flac"].includes(format)) {
           // WAV/FLAC are often uncompressed or lossless, copy might work if input is compatible
           // but re-encoding might be needed if input is compressed
           // command += ` -c copy`; // Keep copy as a possibility
       }
    }


    command += ` "${outputFile}"`;
    setCommand(command); // Set the command using the hook's function
    return command; // Return the generated command string
  };

  const handleFormatChange = (value: string) => {
    setOutputFormat(value);
    // Reset codec when format changes
    setCodec("");
    // Command will be regenerated by the useEffect hook
  };

  const handleCodecChange = (value: string) => {
    setCodec(value);
    // Command will be regenerated by the useEffect hook
  };

  // New handler for the Run button
  const handleRunClick = async () => {
      if (selectedFiles.length === 0) {
          toast.warning("Please select a file first.");
          return;
      }
      if (selectedFiles.length > 1) {
          toast.warning("Media Conversion currently only supports a single file. Please select only one file.");
          return;
      }
      if (!outputFormat) {
          toast.warning("Please select an output format.");
          return;
      }

      // Explicitly trigger single file upload
      const uploadedFile = await uploadSingleFile(selectedFiles[0]);

      if (uploadedFile) {
          // Construct the actual command payload using the *uploaded* filename
          const actualCommand = generateDisplayCommandString(uploadedFile, outputFormat, codec); // Reuse logic, but pass uploadedFile

          const payload: SingleFileCommandPayload = {
              command: actualCommand,
              inputFile: uploadedFile, // Use the uploaded filename
          };
          runCommand(payload); // Run the command via the hook
      }
  };


  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Media Conversion</h2>
        <p className="text-muted-foreground">Convert media files between different formats and codecs.</p>

        {/* Use the hook's file select handler */}
        <FileUploader onFileSelect={handleFileSelect} />

        {selectedFiles.length > 0 && ( // Use hook's selectedFiles for UI visibility
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Conversion Options</CardTitle>
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
                           <p className="text-sm text-yellow-600">Note: Media Conversion currently only supports a single file. Only the first file will be processed.</p>
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

                       {outputFormat && codecOptions[outputFormat] && codecOptions[outputFormat].length > 0 && (
                          <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="codec-select">Codec (Optional)</Label>
                            <Select onValueChange={handleCodecChange} value={codec} disabled={isProcessing || isUploading}>
                              <SelectTrigger id="codec-select">
                                <SelectValue placeholder="Select codec" />
                              </SelectTrigger>
                              <SelectContent>
                                {codecOptions[outputFormat].map(codecOption => (
                                  <SelectItem key={codecOption} value={codecOption}>{codecOption}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                       )}

                       {/* Run Button - uses the new handleRunClick */}
                       <Button
                           onClick={handleRunClick} // Use the new handler
                           disabled={!outputFormat || selectedFiles.length === 0 || isProcessing || isUploading} // Disable if no format, no file, processing, or uploading
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
                               "Run Conversion"
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

export default MediaConverter;