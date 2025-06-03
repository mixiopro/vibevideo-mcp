import { useState, useEffect } from "react";
import { Rnd } from "react-rnd";
import { MainLayout } from "@/components/layout/MainLayout";
import FileUploader from "@/components/shared/FileUploader";
import FFmpegCommandDisplay from "@/components/shared/FFmpegCommandDisplay"; // Added back
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider"; // Assuming Slider is available
import { Button } from "@/components/ui/button"; // Import Button
import { Loader2 } from "lucide-react"; // Import Loader2 icon
import { useFFmpegProcessor } from "@/hooks/useFFmpegProcessor"; // Import the new hook
import OutputMediaPlayer from "@/components/shared/OutputMediaPlayer"; // Import the new component
import { toast } from "sonner"; // Import toast
import type { SingleFileCommandPayload } from "@/hooks/useFFmpegProcessor"; // Import payload type


// Place this near the top of your file, before your main component:
const WatermarkBoxSelector = ({ frameUrl, box, onBoxChange }) => {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <img src={frameUrl} alt="First video frame" style={{ display: "block", maxWidth: 800 }} />
      <Rnd
        bounds="parent"
        size={{ width: box.width, height: box.height }}
        position={{ x: box.x, y: box.y }}
        onDragStop={(e, d) => {
          onBoxChange({ ...box, x: d.x, y: d.y });
        }}
        onResizeStop={(e, direction, ref, delta, position) => {
          const width = parseInt(ref.style.width, 10);
          const height = parseInt(ref.style.height, 10);
          onBoxChange({ x: position.x, y: position.y, width, height });
        }}
        style={{
          border: "2px solid #0070f3",
          background: "rgba(0,112,243,0.15)",
        }}
      />
    </div>
  );
};



const WatermarkRemover = () => {
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

  const [strength, setStrength] = useState<number[]>([50]); // Default strength 0.5 (FFmpeg uses 0-1)

  const [frameUrl, setFrameUrl] = useState<string>("");
  const [box, setBox] = useState({ x: 10, y: 10, width: 100, height: 50 });
    const [x, setX] = useState("10");
    const [y, setY] = useState("10");
    const [width, setWidth] = useState("100");
    const [height, setHeight] = useState("50");
const [filterType, setFilterType] = useState<'delogo' | 'inpaint'>('delogo');

   
    // Sync input fields when box is changed by drag/resize
useEffect(() => {
  setX(box.x.toString());
  setY(box.y.toString());
  setWidth(box.width.toString());
  setHeight(box.height.toString());
}, [box]);


// Sync drag box if user types input fields (convert to numbers)
useEffect(() => {
  if (
    !isNaN(Number(x)) &&
    !isNaN(Number(y)) &&
    !isNaN(Number(width)) &&
    !isNaN(Number(height))
  ) {
    setBox({
      x: Number(x),
      y: Number(y),
      width: Number(width),
      height: Number(height),
    });
  }
  // Only run if you want instant updates; otherwise, add a "sync" button
}, [x, y, width, height]);

useEffect(() => {
  if (selectedFiles.length === 1) {
    console.log("[EFFECT] selectedFiles changed:", selectedFiles[0].name);

    // Call upload and log results
    (async () => {
      console.log("[EFFECT] Calling uploadSingleFile with", selectedFiles[0].name);
      const uploaded = await uploadSingleFile(selectedFiles[0]);
      console.log("[EFFECT] uploadSingleFile returned:", uploaded);

      // You should see uploadedFilename being set by the hook now
      setTimeout(() => {
        // Log hook value after microtask queue
        console.log("[EFFECT] uploadedFilename in hook (after upload):", uploadedFilename);
      }, 250);
    })();
  } else {
    setFrameUrl("");
    console.log("[EFFECT] No single selectedFile. FrameUrl cleared.");
  }
  // Also log whenever selectedFiles changes
  console.log("[EFFECT] selectedFiles in dependency array now:", selectedFiles.map(f => f.name));
  // eslint-disable-next-line
}, [selectedFiles]);

useEffect(() => {
  console.log("[EFFECT] uploadedFilename changed:", uploadedFilename);
  if (uploadedFilename) {
    console.log("[EFFECT] Fetching frame for file:", uploadedFilename);

    fetch(`http://localhost:8200/api/frame?file=${encodeURIComponent(uploadedFilename)}`)
      .then(res => {
        console.log("[EFFECT] /api/frame response:", res);
        if (!res.ok) throw new Error("No frame available");
        return res.blob();
      })
     .then(blob => {
        console.log("[EFFECT] Successfully fetched frame blob.", blob);
        // Quick check for image type:
        console.log("[EFFECT] Blob type:", blob.type, "Blob size:", blob.size);

        // DEBUG: Try to read the blob as text (to check if it's an error)
        blob.text().then(text => {
            console.log("[EFFECT] Blob text preview:", text.slice(0, 200));
        });

        setFrameUrl(URL.createObjectURL(blob));
        })

      .catch(e => {
        console.error("[EFFECT] Error fetching frame:", e);
        setFrameUrl("");
      });
  } else {
    setFrameUrl("");
    console.log("[EFFECT] uploadedFilename falsy, frameUrl cleared.");
  }
  // eslint-disable-next-line
}, [uploadedFilename]);

useEffect(() => {
  console.log("[DEBUG] uploadedFilename NOW:", uploadedFilename);
}, [uploadedFilename]);

  // Effect to generate command string for display whenever selectedFiles, coordinates, dimensions, or strength changes
  // This command string uses the *local* file name for display purposes.
  useEffect(() => {
      if (selectedFiles.length === 1 && x && y && width && height) {
          generateDisplayCommandString(selectedFiles[0].name, x, y, width, height);
      } else {
          setCommand(""); // Clear command if requirements aren't met
      }
  }, [selectedFiles, x, y, width, height, strength, setCommand]); // Add setCommand to dependencies


  const handleInputChange = (field: "x" | "y" | "width" | "height", value: string) => {
      if (field === "x") setX(value);
      else if (field === "y") setY(value);
      else if (field === "width") setWidth(value);
      else if (field === "height") setHeight(value);

      // Command will be regenerated by the useEffect hook
  }

  const handleStrengthChange = (value: number[]) => {
    setStrength(value);
    // Command will be regenerated by the useEffect hook
  };


//  const generateDisplayCommandString = (
//   inputFilename: string,
//   xVal: string,
//   yVal: string,
//   wVal: string,
//   hVal: string
// ) => {
//   if (!inputFilename || !xVal || !yVal || !wVal || !hVal) {
//     return "";
//   }

//   const baseName = inputFilename.split('.')[0];
//   const outputFileName = `${baseName}_no_watermark.${inputFilename.split('.').pop()}`;

//   // Hardcode show=0 (never show box)
//   const command = `ffmpeg -i "${inputFilename}" -vf "delogo=x=${xVal}:y=${yVal}:w=${wVal}:h=${hVal}:show=0" -c:a copy "${outputFileName}"`;

//   setCommand(command);
//   return command;
// };

const generateDisplayCommandString = (
  inputFilename, xVal, yVal, wVal, hVal
) => {
  if (!inputFilename || !xVal || !yVal || !wVal || !hVal) {
    return "";
  }
  const baseName = inputFilename.split('.')[0];
  const outputFileName = `${baseName}_no_watermark.${inputFilename.split('.').pop()}`;

  let filter;
  if (filterType === 'delogo') {
    filter = `delogo=x=${xVal}:y=${yVal}:w=${wVal}:h=${hVal}:show=0`;
  } else if (filterType === 'inpaint') {
    filter = `inpaint=x=${xVal}:y=${yVal}:w=${wVal}:h=${hVal}:radius=15:iterations=5`;
  }
  const command = `ffmpeg -i "${inputFilename}" -vf "${filter}" -c:a copy "${outputFileName}"`;
  setCommand(command);
  return command;
};


const handleRunClick = async () => {
  console.log("[Run] Button clicked.");
  if (selectedFiles.length === 0) {
    toast.warning("Please select a file first.");
    console.log("[Run] No file selected, abort.");
    return;
  }
  if (selectedFiles.length > 1) {
    toast.warning("Watermark Removal currently only supports a single file. Please select only one file.");
    console.log("[Run] Multiple files selected, abort.");
    return;
  }
  if (!x || !y || !width || !height) {
    toast.warning("Please enter all coordinates and dimensions for the watermark area.");
    console.log("[Run] Missing box dimensions, abort.");
    return;
  }

  // Use already-uploaded filename, do NOT re-upload!
  const inputFile = uploadedFilename;
  if (!inputFile) {
    toast.warning("File must be uploaded before running command.");
    console.log("[Run] No uploadedFilename, abort.");
    return;
  }

  const command = generateDisplayCommandString(
    inputFile, x, y, width, height
  );
  console.log("[Run] Sending to runCommand:", { command, inputFile });

  const payload = {
    command,
    inputFile
  };

  await runCommand(payload); // This will POST to /run
};


  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Logo/Watermark Remover</h2>
        <p className="text-muted-foreground">Generate FFmpeg commands to remove logos or watermarks from videos.</p>

        {/* Use the hook's file select handler */}
        <FileUploader onFileSelect={handleFileSelect} />

        {selectedFiles.length > 0 && ( // Use hook's selectedFiles for UI visibility
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Removal Options</CardTitle>
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

                        <WatermarkBoxSelector frameUrl={frameUrl} box={box} onBoxChange={setBox} />

                       {selectedFiles.length > 1 && (
                           <p className="text-sm text-yellow-600">Note: Watermark removal currently only applies to the first selected file.</p>
                       )}

                       <p className="text-sm text-muted-foreground">
                           Select a file above and specify the region of the logo/watermark.
                       </p>
                                            
                        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                        <div className="grid gap-1.5">
                            <Label htmlFor="logo-x">X Coordinate</Label>
                            <Input
                            id="logo-x"
                            type="number"
                            placeholder="e.g., 10"
                            value={box.x}
                            onChange={e => setBox({ ...box, x: Number(e.target.value) })}
                            disabled={isProcessing || isUploading}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="logo-y">Y Coordinate</Label>
                            <Input
                            id="logo-y"
                            type="number"
                            placeholder="e.g., 10"
                            value={box.y}
                            onChange={e => setBox({ ...box, y: Number(e.target.value) })}
                            disabled={isProcessing || isUploading}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="logo-width">Width</Label>
                            <Input
                            id="logo-width"
                            type="number"
                            placeholder="e.g., 100"
                            value={box.width}
                            onChange={e => setBox({ ...box, width: Number(e.target.value) })}
                            disabled={isProcessing || isUploading}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="logo-height">Height</Label>
                            <Input
                            id="logo-height"
                            type="number"
                            placeholder="e.g., 50"
                            value={box.height}
                            onChange={e => setBox({ ...box, height: Number(e.target.value) })}
                            disabled={isProcessing || isUploading}
                            />
                        </div>
                        </div>

                        <div className="mb-4">
                        <Label htmlFor="filter-type">Removal Method</Label>
                        <select
                        id="filter-type"
                        value={filterType}
                        onChange={e => setFilterType(e.target.value as 'delogo' | 'inpaint')}
                        className="block mt-1"
                        disabled={isProcessing || isUploading}
                        >
                        <option value="delogo">Delogo (basic)</option>
                        <option value="inpaint">Inpaint (better)</option>
                        </select>
                        </div>

                       {/* Run Button - uses the new handleRunClick */}
                       <Button
                        onClick={handleRunClick}
                        disabled={
                            !x || !y || !width || !height ||
                            selectedFiles.length === 0 ||
                            isProcessing ||
                            isUploading
                        }
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
                            "Run Removal"
                        )}
                        </Button>
                       <p className="text-sm text-yellow-600">
                           Note: Clicking "Run" will first upload the selected file and then send the command to your local backend server running on http://localhost:8200.
                           Ensure your backend is running and has access to the selected file.
                       </p>
                       <p className="text-sm text-yellow-600">
                           Note: The `delogo` filter is a basic tool and may not perfectly remove complex or animated watermarks. You may need to experiment with parameters.
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

export default WatermarkRemover;