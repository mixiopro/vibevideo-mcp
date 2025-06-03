import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import FileUploader from "@/components/shared/FileUploader";
import FFmpegCommandDisplay from "@/components/shared/FFmpegCommandDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useFFmpegProcessor } from "@/hooks/useFFmpegProcessor";
import OutputMediaPlayer from "@/components/shared/OutputMediaPlayer";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import type { SingleFileCommandPayload } from "@/hooks/useFFmpegProcessor";

const presetSpeeds = [
  { label: "0.25x (Slower)", value: 0.25 },
  { label: "0.5x (Slow)", value: 0.5 },
  { label: "1x (Normal)", value: 1.0 },
  { label: "2x (Fast)", value: 2.0 },
  { label: "4x (Faster)", value: 4.0 },
];

const minSpeed = 0.25;
const maxSpeed = 4.0;

const SpeedChanger = () => {
  const {
    selectedFiles,
    uploadedFilename,
    outputFile,
    isUploading,
    isProcessing,
    mediaError,
    generatedCommand,
    handleFileSelect,
    runCommand,
    setCommand,
    setMediaError,
    uploadSingleFile,
  } = useFFmpegProcessor();

  const [speed, setSpeed] = useState(1.0);
  const [preset, setPreset] = useState<number | null>(1.0);

  const handlePresetChange = (value: string) => {
    const floatVal = parseFloat(value);
    setSpeed(floatVal);
    setPreset(floatVal);
  };

  const handleSliderChange = (value: number[]) => {
    setSpeed(value[0]);
    setPreset(presetSpeeds.find(p => p.value === value[0]) ? value[0] : null);
  };

  useEffect(() => {
    if (selectedFiles.length === 1 && speed) {
      generateDisplayCommandString(selectedFiles[0].name, speed);
    } else {
      setCommand("");
    }
  }, [selectedFiles, speed, setCommand]);

  // Final output is always MP4
  const generateDisplayCommandString = (inputFilename: string, speedValue: number) => {
    if (!inputFilename || !speedValue) return "";
    const baseName = inputFilename.split(".")[0];
    const outputFile = `${baseName}_${speedValue.toFixed(2).replace(".", "p")}x.mp4`;
    const setpts = (1 / speedValue).toFixed(3);

    // AUDIO FILTER CHAIN
    let audioFilter = `aresample=async=1`;
    let tempo = speedValue;
    if (tempo > 2.0) {
      while (tempo > 2.0) {
        audioFilter += `,atempo=2.0`;
        tempo /= 2.0;
      }
      audioFilter += `,atempo=${tempo.toFixed(3)}`;
    } else if (tempo < 0.5) {
      while (tempo < 0.5) {
        audioFilter += `,atempo=0.5`;
        tempo *= 2.0;
      }
      audioFilter += `,atempo=${tempo.toFixed(3)}`;
    } else {
      audioFilter += `,atempo=${tempo.toFixed(3)}`;
    }

    const command = `ffmpeg -fflags +genpts -i "${inputFilename}" -filter_complex "[0:v]setpts=${setpts}*PTS[v];[0:a]${audioFilter}[a]" -map "[v]" -map "[a]" -c:v libx264 -c:a aac -ar 48000 -movflags +faststart -shortest "${outputFile}"`;

    setCommand(command);
    return command;
  };

  const handleRunClick = async () => {
    if (selectedFiles.length === 0) {
      toast.warning("Please select a file first.");
      return;
    }
    if (selectedFiles.length > 1) {
      toast.warning("Speed Changer supports only a single file.");
      return;
    }
    if (!speed) {
      toast.warning("Please select or enter a speed.");
      return;
    }
    const uploadedFile = await uploadSingleFile(selectedFiles[0]);
    if (uploadedFile) {
      const actualCommand = generateDisplayCommandString(uploadedFile, speed);
      const payload: SingleFileCommandPayload = {
        command: actualCommand,
        inputFile: uploadedFile,
      };
      runCommand(payload);
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Speed Changer</h2>
        <p className="text-muted-foreground">Speed up or slow down video & audio by any amount.</p>
        <FileUploader onFileSelect={handleFileSelect} />
        {selectedFiles.length > 0 && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Speed Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isUploading && <p className="text-sm text-blue-600">Uploading file...</p>}
              {!isUploading && selectedFiles.length > 0 && (
                <>
                  <div>
                    <h4 className="text-md font-semibold mb-2">Selected File(s):</h4>
                    <ul>
                      {selectedFiles.map((file, index) => (
                        <li key={index} className="text-sm text-muted-foreground">{file.name}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid w-full max-w-sm items-center gap-1.5 mb-4">
                    <Label htmlFor="speed-preset-select">Preset</Label>
                    <Select
                      onValueChange={handlePresetChange}
                      value={preset !== null ? preset.toString() : ""}
                      disabled={isProcessing || isUploading}
                    >
                      <SelectTrigger id="speed-preset-select">
                        <SelectValue placeholder="Preset speed" />
                      </SelectTrigger>
                      <SelectContent>
                        {presetSpeeds.map(option => (
                          <SelectItem key={option.value} value={option.value.toString()}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="speed-slider">
                      Custom Speed ({speed.toFixed(2)}x)
                    </Label>
                    <Slider
                      id="speed-slider"
                      min={minSpeed}
                      max={maxSpeed}
                      step={0.01}
                      value={[speed]}
                      onValueChange={handleSliderChange}
                      className="w-full max-w-sm"
                      disabled={isProcessing || isUploading}
                    />
                    <p className="text-sm text-muted-foreground">Move the slider or pick a preset above. 1.00x = normal speed. Output is always .mp4 for max compatibility.</p>
                  </div>
                  <Button
                    onClick={handleRunClick}
                    disabled={!speed || selectedFiles.length === 0 || isProcessing || isUploading}
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
                      "Run Speed Change"
                    )}
                  </Button>
                  <p className="text-sm text-yellow-600">
                    Note: Speeding up audio more than 2x or slowing down below 0.5x requires chaining filters. This is handled automatically.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}
        <OutputMediaPlayer outputFile={outputFile} mediaError={mediaError} setMediaError={setMediaError} />
        <FFmpegCommandDisplay command={generatedCommand} />
      </div>
    </MainLayout>
  );
};

export default SpeedChanger;


// import { useState, useEffect } from "react";
// import { MainLayout } from "@/components/layout/MainLayout";
// import FileUploader from "@/components/shared/FileUploader";
// import FFmpegCommandDisplay from "@/components/shared/FFmpegCommandDisplay";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Button } from "@/components/ui/button";
// import { Loader2 } from "lucide-react";
// import { useFFmpegProcessor } from "@/hooks/useFFmpegProcessor";
// import OutputMediaPlayer from "@/components/shared/OutputMediaPlayer";
// import { Slider } from "@/components/ui/slider";
// import { toast } from "sonner";
// import type { SingleFileCommandPayload } from "@/hooks/useFFmpegProcessor";

// const presetSpeeds = [
//   { label: "0.25x (Slower)", value: 0.25 },
//   { label: "0.5x (Slow)", value: 0.5 },
//   { label: "1x (Normal)", value: 1.0 },
//   { label: "2x (Fast)", value: 2.0 },
//   { label: "4x (Faster)", value: 4.0 },
// ];

// const minSpeed = 0.25;
// const maxSpeed = 4.0;

// const SpeedChanger = () => {
//   const {
//     selectedFiles,
//     uploadedFilename,
//     outputFile,
//     isUploading,
//     isProcessing,
//     mediaError,
//     generatedCommand,
//     handleFileSelect,
//     runCommand,
//     setCommand,
//     setMediaError,
//     uploadSingleFile,
//   } = useFFmpegProcessor();

//   // The current speed (e.g. 0.5x, 2x)
//   const [speed, setSpeed] = useState(1.0);
//   // Selected preset for highlight only; not needed for command generation
//   const [preset, setPreset] = useState<number | null>(1.0);

//   // Whenever the preset is selected, update the slider and speed
//   const handlePresetChange = (value: string) => {
//     const floatVal = parseFloat(value);
//     setSpeed(floatVal);
//     setPreset(floatVal);
//   };

//   // Whenever slider changes, update speed and clear preset (if user picked a custom value)
//   const handleSliderChange = (value: number[]) => {
//     setSpeed(value[0]);
//     setPreset(presetSpeeds.find(p => p.value === value[0]) ? value[0] : null);
//   };

//   // Generate command string for UI and actual backend
//   useEffect(() => {
//     if (selectedFiles.length === 1 && speed) {
//       generateDisplayCommandString(selectedFiles[0].name, speed);
//     } else {
//       setCommand("");
//     }
//   }, [selectedFiles, speed, setCommand]);

//   // Core FFmpeg speed command generator
// //   const generateDisplayCommandString = (inputFilename: string, speedValue: number) => {
// //     if (!inputFilename || !speedValue) return "";
// //     const baseName = inputFilename.split(".")[0];
// //     const outputFile = `${baseName}_${speedValue.toFixed(2).replace(".", "p")}x.${inputFilename.split(".").pop()}`;

// //     // VIDEO: setpts=1/speed*PTS (slower: >1.0, faster: <1.0)
// //     // AUDIO: atempo up to 2.0 per filter, so chain if speed >2.0 or <0.5
// //     const setpts = (1 / speedValue).toFixed(3);
// //     let atempoFilters = [];
// //     let tempo = speedValue;
// //     if (tempo > 2.0) {
// //       while (tempo > 2.0) {
// //         atempoFilters.push("atempo=2.0");
// //         tempo /= 2.0;
// //       }
// //       atempoFilters.push(`atempo=${tempo.toFixed(3)}`);
// //     } else if (tempo < 0.5) {
// //       // For slow motion, chain atempo (e.g., 0.25 = atempo=0.5,atempo=0.5)
// //       while (tempo < 0.5) {
// //         atempoFilters.push("atempo=0.5");
// //         tempo *= 2.0;
// //       }
// //       atempoFilters.push(`atempo=${tempo.toFixed(3)}`);
// //     } else {
// //       atempoFilters.push(`atempo=${tempo.toFixed(3)}`);
// //     }
// //     const atempo = atempoFilters.join(",");

// //     // Final command
// //     const command = `ffmpeg -i "${inputFilename}" -filter_complex "[0:v]setpts=${setpts}*PTS[v];[0:a]${atempo}[a]" -map "[v]" -map "[a]" -c:v libx264 -c:a aac "${outputFile}"`;

// //     setCommand(command);
// //     return command;
// //   };
// const generateDisplayCommandString = (inputFilename: string, speedValue: number) => {
//   if (!inputFilename || !speedValue) return "";
//   const baseName = inputFilename.split(".")[0];
//   const outputFile = `${baseName}_${speedValue.toFixed(2).replace(".", "p")}x.${inputFilename.split(".").pop()}`;
//   const setpts = (1 / speedValue).toFixed(3);

//   // AUDIO FILTER CHAIN (as before)
//   let audioFilter = `aresample=async=1`;
//   let tempo = speedValue;
//   if (tempo > 2.0) {
//     while (tempo > 2.0) {
//       audioFilter += `,atempo=2.0`;
//       tempo /= 2.0;
//     }
//     audioFilter += `,atempo=${tempo.toFixed(3)}`;
//   } else if (tempo < 0.5) {
//     while (tempo < 0.5) {
//       audioFilter += `,atempo=0.5`;
//       tempo *= 2.0;
//     }
//     audioFilter += `,atempo=${tempo.toFixed(3)}`;
//   } else {
//     audioFilter += `,atempo=${tempo.toFixed(3)}`;
//   }

//   // *** THE FIX: -fflags +genpts and -movflags +faststart ***
//   const command = `ffmpeg -fflags +genpts -i "${inputFilename}" -filter_complex "[0:v]setpts=${setpts}*PTS[v];[0:a]${audioFilter}[a]" -map "[v]" -map "[a]" -c:v libx264 -c:a aac -movflags +faststart -ar 48000 -shortest "${outputFile}"`;

//   setCommand(command);
//   return command;
// };


//   const handleRunClick = async () => {
//     if (selectedFiles.length === 0) {
//       toast.warning("Please select a file first.");
//       return;
//     }
//     if (selectedFiles.length > 1) {
//       toast.warning("Speed Changer supports only a single file.");
//       return;
//     }
//     if (!speed) {
//       toast.warning("Please select or enter a speed.");
//       return;
//     }
//     const uploadedFile = await uploadSingleFile(selectedFiles[0]);
//     if (uploadedFile) {
//       const actualCommand = generateDisplayCommandString(uploadedFile, speed);
//       const payload: SingleFileCommandPayload = {
//         command: actualCommand,
//         inputFile: uploadedFile,
//       };
//       runCommand(payload);
//     }
//   };

//   return (
//     <MainLayout>
//       <div className="flex-1 space-y-4 p-8 pt-6">
//         <h2 className="text-3xl font-bold tracking-tight">Speed Changer</h2>
//         <p className="text-muted-foreground">Speed up or slow down video & audio by any amount.</p>
//         <FileUploader onFileSelect={handleFileSelect} />
//         {selectedFiles.length > 0 && (
//           <Card className="w-full">
//             <CardHeader>
//               <CardTitle>Speed Options</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               {isUploading && <p className="text-sm text-blue-600">Uploading file...</p>}
//               {!isUploading && selectedFiles.length > 0 && (
//                 <>
//                   <div>
//                     <h4 className="text-md font-semibold mb-2">Selected File(s):</h4>
//                     <ul>
//                       {selectedFiles.map((file, index) => (
//                         <li key={index} className="text-sm text-muted-foreground">{file.name}</li>
//                       ))}
//                     </ul>
//                   </div>
//                   <div className="grid w-full max-w-sm items-center gap-1.5 mb-4">
//                     <Label htmlFor="speed-preset-select">Preset</Label>
//                     <Select
//                       onValueChange={handlePresetChange}
//                       value={preset !== null ? preset.toString() : ""}
//                       disabled={isProcessing || isUploading}
//                     >
//                       <SelectTrigger id="speed-preset-select">
//                         <SelectValue placeholder="Preset speed" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {presetSpeeds.map(option => (
//                           <SelectItem key={option.value} value={option.value.toString()}>{option.label}</SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div className="grid w-full max-w-sm items-center gap-1.5">
//                     <Label htmlFor="speed-slider">
//                       Custom Speed ({speed.toFixed(2)}x)
//                     </Label>
//                     <Slider
//                       id="speed-slider"
//                       min={minSpeed}
//                       max={maxSpeed}
//                       step={0.01}
//                       value={[speed]}
//                       onValueChange={handleSliderChange}
//                       className="w-full max-w-sm"
//                       disabled={isProcessing || isUploading}
//                     />
//                     <p className="text-sm text-muted-foreground">Move the slider or pick a preset above. 1.00x = normal speed.</p>
//                   </div>
//                   <Button
//                     onClick={handleRunClick}
//                     disabled={!speed || selectedFiles.length === 0 || isProcessing || isUploading}
//                   >
//                     {isProcessing ? (
//                       <>
//                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                         Processing...
//                       </>
//                     ) : isUploading ? (
//                       <>
//                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                         Uploading...
//                       </>
//                     ) : (
//                       "Run Speed Change"
//                     )}
//                   </Button>
//                   <p className="text-sm text-yellow-600">
//                     Note: Speeding up audio more than 2x or slowing down below 0.5x requires chaining filters. This is handled automatically.
//                   </p>
//                 </>
//               )}
//             </CardContent>
//           </Card>
//         )}
//         <OutputMediaPlayer outputFile={outputFile} mediaError={mediaError} setMediaError={setMediaError} />
//         <FFmpegCommandDisplay command={generatedCommand} />
//       </div>
//     </MainLayout>
//   );
// };

// export default SpeedChanger;
