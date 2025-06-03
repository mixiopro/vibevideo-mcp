import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import FileUploader from "@/components/shared/FileUploader";
import FFmpegCommandDisplay from "@/components/shared/FFmpegCommandDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const BatchProcessor = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [batchOp, setBatchOp] = useState("");
  const [commands, setCommands] = useState<string[]>([]);

  const ops = [
    { label: "Convert to MP4 (libx264)", value: "convert_mp4" },
    { label: "Convert to MP3 (libmp3lame)", value: "convert_mp3" },
    { label: "Resize to 720p (1280x720)", value: "resize_720p" },
  ];

  const generate = (files: File[], op: string) => {
    if (!op) {
      setCommands([]);
      return;
    }
    const cmds = files.map((f) => {
      const name = f.name;
      const base = name.replace(/\.[^/.]+$/, "");
      let cmd = `ffmpeg -i "${name}"`;
      let out = "";

      if (op === "convert_mp4") {
        cmd += " -c:v libx264 -c:a aac";
        out = `${base}_converted.mp4`;
      } else if (op === "convert_mp3") {
        cmd += " -vn -acodec libmp3lame -ab 192k";
        out = `${base}_converted.mp3`;
      } else {
        cmd += " -vf scale=1280:720 -c:a copy";
        const ext = name.split(".").pop();
        out = `${base}_720p.${ext}`;
      }
      return `${cmd} "${out}"`;
    });
    setCommands(cmds);
  };

  const onFiles = (files: File[]) => {
    setSelectedFiles(files);
    setCommands([]);
    if (batchOp) generate(files, batchOp);
  };

  const onOpChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setBatchOp(val);
    generate(selectedFiles, val);
  };

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        <h2 className="text-3xl font-bold">Batch Processor</h2>
        <p className="text-muted-foreground">
          Generate FFmpeg commands for multiple files.
        </p>

        <FileUploader onFileSelect={onFiles} />

        {selectedFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-sm space-y-1">
                <Label htmlFor="operation-select">Batch Operation</Label>
                <select
                  id="operation-select"
                  value={batchOp}
                  onChange={onOpChange}
                  className="block w-full h-10 px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Select operation</option>
                  {ops.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <h4 className="font-semibold">Files Selected:</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {selectedFiles.map((f, i) => (
                    <li key={i}>{f.name}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {commands.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>FFmpeg Commands</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {commands.map((cmd, i) => (
                  <FFmpegCommandDisplay key={i} command={cmd} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default BatchProcessor;




// import { useState } from "react";
// import * as Select from "@radix-ui/react-select";
// import { Check, ChevronDown, ChevronUp } from "lucide-react";

// import { MainLayout } from "@/components/layout/MainLayout";
// import FileUploader from "@/components/shared/FileUploader";
// import FFmpegCommandDisplay from "@/components/shared/FFmpegCommandDisplay";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Label } from "@/components/ui/label";

// const BatchProcessor = () => {
//   const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
//   const [batchOp, setBatchOp] = useState("");
//   const [commands, setCommands] = useState<string[]>([]);

//   const ops = [
//     { label: "Convert to MP4 (libx264)", value: "convert_mp4" },
//     { label: "Convert to MP3 (libmp3lame)", value: "convert_mp3" },
//     { label: "Resize to 720p (1280x720)", value: "resize_720p" },
//   ];

//   const gen = (files: File[], op: string) => {
//     if (!op) return setCommands([]);
//     const list = files.map((f) => {
//       const name = f.name;
//       const base = name.split(".")[0];
//       let cmd = `ffmpeg -i "${name}"`;
//       let out = "";

//       if (op === "convert_mp4") {
//         cmd += " -c:v libx264 -c:a aac";
//         out = `${base}_converted.mp4`;
//       } else if (op === "convert_mp3") {
//         cmd += " -vn -acodec libmp3lame -ab 192k";
//         out = `${base}_converted.mp3`;
//       } else {
//         cmd += " -vf scale=1280:720 -c:a copy";
//         const ext = name.split(".").pop();
//         out = `${base}_720p.${ext}`;
//       }

//       return `${cmd} "${out}"`;
//     });
//     setCommands(list);
//   };

//   const onFiles = (files: File[]) => {
//     setSelectedFiles(files);
//     setCommands([]);
//     if (batchOp) gen(files, batchOp);
//   };
//   const onOp = (val: string) => {
//     setBatchOp(val);
//     gen(selectedFiles, val);
//   };

//   return (
//     <MainLayout>
//       <div className="flex-1 space-y-4 p-8 pt-6">
//         <h2 className="text-3xl font-bold">Batch Processor</h2>
//         <p className="text-muted-foreground">
//           Generate FFmpeg commands for multiple files.
//         </p>

//         <FileUploader onFileSelect={onFiles} />

//         {selectedFiles.length > 0 && (
//           <Card className="w-full">
//             <CardHeader>
//               <CardTitle>Options</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="grid max-w-sm gap-1.5">
//                 <Label htmlFor="op-select">Operation</Label>
//                 <Select.Root value={batchOp} onValueChange={onOp}>
//                   <Select.Trigger
//                     id="op-select"
//                     className="flex items-center justify-between w-full h-10 px-3 py-2 border rounded-md bg-background text-sm"
//                   >
//                     <Select.Value placeholder="Select operation" />
//                     <Select.Icon>
//                       <ChevronDown className="h-4 w-4 opacity-50" />
//                     </Select.Icon>
//                   </Select.Trigger>
//                   <Select.Portal>
//                     <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
//                       <Select.ScrollUpButton className="flex items-center justify-center py-1">
//                         <ChevronUp className="h-4 w-4" />
//                       </Select.ScrollUpButton>
//                       <Select.Viewport className="p-1">
//                         {ops.map((o) => (
//                           <Select.Item
//                             key={o.value}
//                             value={o.value}
//                             className="relative flex w-full items-center px-2 py-1.5 text-sm cursor-default select-none rounded-sm focus:bg-accent focus:text-accent-foreground"
//                           >
//                             <Select.ItemText>{o.label}</Select.ItemText>
//                             <Select.ItemIndicator className="absolute left-0 inline-flex items-center pl-1">
//                               <Check className="h-4 w-4" />
//                             </Select.ItemIndicator>
//                           </Select.Item>
//                         ))}
//                       </Select.Viewport>
//                       <Select.ScrollDownButton className="flex items-center justify-center py-1">
//                         <ChevronDown className="h-4 w-4" />
//                       </Select.ScrollDownButton>
//                     </Select.Content>
//                   </Select.Portal>
//                 </Select.Root>
//               </div>

//               <div>
//                 <h4 className="font-semibold">Files Selected:</h4>
//                 <ul className="list-disc list-inside text-sm text-muted-foreground">
//                   {selectedFiles.map((f, i) => (
//                     <li key={i}>{f.name}</li>
//                   ))}
//                 </ul>
//               </div>
//             </CardContent>
//           </Card>
//         )}

//         {commands.length > 0 && (
//           <Card className="w-full mt-6">
//             <CardHeader>
//               <CardTitle>FFmpeg Commands</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-2">
//                 {commands.map((c, i) => (
//                   <FFmpegCommandDisplay key={i} command={c} />
//                 ))}
//               </div>
//             </CardContent>
//           </Card>
//         )}
//       </div>
//     </MainLayout>
//   );
// };

// export default BatchProcessor;



// // import { useState } from "react";
// // import { MainLayout } from "@/components/layout/MainLayout";
// // import FileUploader from "@/components/shared/FileUploader";
// // import FFmpegCommandDisplay from "@/components/shared/FFmpegCommandDisplay";
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Label } from "@/components/ui/label";
// // import {
// //   Select,
// //   SelectContent,
// //   SelectItem,
// //   SelectTrigger,
// //   SelectValue,
// // } from "@/components/ui/select";

// // const BatchProcessor = () => {
// //   const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
// //   const [batchOperation, setBatchOperation] = useState("");     // ← initial empty
// //   const [ffmpegCommands, setFfmpegCommands] = useState<string[]>([]);

// //   const operationOptions = [
// //     { label: "Convert to MP4 (libx264)", value: "convert_mp4" },
// //     { label: "Convert to MP3 (libmp3lame)", value: "convert_mp3" },
// //     { label: "Resize to 720p (1280x720)", value: "resize_720p" },
// //   ];

// //   const generateCommands = (files: File[], operation: string) => {
// //     if (!operation) {
// //       setFfmpegCommands([]);
// //       return;
// //     }

// //     const commands = files.map((file) => {
// //       const name = file.name;
// //       const base = name.split(".")[0];
// //       let cmd = `ffmpeg -i "${name}"`;
// //       let out = "";

// //       switch (operation) {
// //         case "convert_mp4":
// //           cmd += ` -c:v libx264 -c:a aac`;
// //           out = `${base}_converted.mp4`;
// //           break;
// //         case "convert_mp3":
// //           cmd += ` -vn -acodec libmp3lame -ab 192k`;
// //           out = `${base}_converted.mp3`;
// //           break;
// //         case "resize_720p":
// //           cmd += ` -vf scale=1280:720 -c:a copy`;
// //           const ext = name.split(".").pop();
// //           out = `${base}_720p.${ext}`;
// //           break;
// //       }

// //       return `${cmd} "${out}"`;
// //     });

// //     setFfmpegCommands(commands);
// //   };

// //   const handleFileSelect = (files: File[]) => {
// //     setSelectedFiles(files);
// //     setFfmpegCommands([]);  // clear old
// //     if (batchOperation) {
// //       generateCommands(files, batchOperation);
// //     }
// //   };

// //   const handleOperationChange = (value: string) => {
// //     setBatchOperation(value);
// //     generateCommands(selectedFiles, value);
// //   };

// //   return (
// //     <MainLayout>
// //       <div className="flex-1 space-y-4 p-8 pt-6">
// //         <h2 className="text-3xl font-bold tracking-tight">Batch Processor</h2>
// //         <p className="text-muted-foreground">
// //           Generate FFmpeg commands for multiple files.
// //         </p>

// //         <FileUploader onFileSelect={handleFileSelect} />

// //         {selectedFiles.length > 0 && (
// //           <Card className="w-full">
// //             <CardHeader>
// //               <CardTitle>Batch Options</CardTitle>
// //             </CardHeader>
// //             <CardContent className="space-y-4">
// //               <div className="grid w-full max-w-sm items-center gap-1.5">
// //                 <Label htmlFor="operation-select">Batch Operation</Label>
// //                 <Select
// //                   value={batchOperation}
// //                   onValueChange={handleOperationChange}
// //                 >
// //                   <SelectTrigger id="operation-select">
// //                     <SelectValue placeholder="Select operation" />
// //                   </SelectTrigger>
// //                   <SelectContent>
// //                     {operationOptions.map((opt) => (
// //                       <SelectItem key={opt.value} value={opt.value}>
// //                         {opt.label}
// //                       </SelectItem>
// //                     ))}
// //                   </SelectContent>
// //                 </Select>
// //               </div>

// //               <div>
// //                 <h4 className="text-md font-semibold mb-2">
// //                   Files Selected:
// //                 </h4>
// //                 <ul>
// //                   {selectedFiles.map((f, i) => (
// //                     <li key={i} className="text-sm text-muted-foreground">
// //                       {f.name}
// //                     </li>
// //                   ))}
// //                 </ul>
// //               </div>
// //             </CardContent>
// //           </Card>
// //         )}

// //         {ffmpegCommands.length > 0 && (
// //           <Card className="w-full mt-6">
// //             <CardHeader>
// //               <CardTitle>FFmpeg Commands</CardTitle>
// //             </CardHeader>
// //             <CardContent>
// //               <div className="space-y-4">
// //                 {ffmpegCommands.map((cmd, i) => (
// //                   <FFmpegCommandDisplay key={i} command={cmd} />
// //                 ))}
// //               </div>
// //             </CardContent>
// //           </Card>
// //         )}
// //       </div>
// //     </MainLayout>
// //   );
// // };

// // export default BatchProcessor;


// // // import { useState } from "react";
// // // import { MainLayout } from "@/components/layout/MainLayout";
// // // import FileUploader from "@/components/shared/FileUploader";
// // // import FFmpegCommandDisplay from "@/components/shared/FFmpegCommandDisplay";
// // // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // // import { Label } from "@/components/ui/label";
// // // import {
// // //   Select,
// // //   SelectContent,
// // //   SelectItem,
// // //   SelectTrigger,
// // //   SelectValue,
// // // } from "@/components/ui/select";
// // // import { Button } from "@/components/ui/button";

// // // const BatchProcessor = () => {
// // //   const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
// // //   const [batchOperation, setBatchOperation] = useState<string>("");  // ← start empty
// // //   const [ffmpegCommands, setFFmpegCommands] = useState<string[]>([]);

// // //   const operationOptions = [
// // //     { label: "Convert to MP4 (libx264)", value: "convert_mp4" },
// // //     { label: "Convert to MP3 (libmp3lame)", value: "convert_mp3" },
// // //     { label: "Resize to 720p (1280x720)", value: "resize_720p" },
// // //   ];

// // //   const generateCommands = (files: File[], operation: string) => {
// // //     if (!operation) {
// // //       setFFmpegCommands([]);
// // //       return;
// // //     }

// // //     const commands = files.map((file) => {
// // //       const name = file.name;
// // //       const base = name.split(".")[0];
// // //       let cmd = `ffmpeg -i "${name}"`;
// // //       let out = "";

// // //       if (operation === "convert_mp4") {
// // //         cmd += ` -c:v libx264 -c:a aac -strict experimental`;
// // //         out = `${base}_converted.mp4`;
// // //       } else if (operation === "convert_mp3") {
// // //         cmd += ` -vn -acodec libmp3lame -ab 192k`;
// // //         out = `${base}_converted.mp3`;
// // //       } else if (operation === "resize_720p") {
// // //         cmd += ` -vf scale=1280:720 -c:a copy`;
// // //         const ext = name.split(".").pop();
// // //         out = `${base}_720p.${ext}`;
// // //       }

// // //       return `${cmd} "${out}"`;
// // //     });

// // //     setFFmpegCommands(commands);
// // //   };

// // //   const handleFileSelect = (files: File[]) => {
// // //     setSelectedFiles(files);
// // //     setFfmpegCommands([]);  // clear prior results
// // //     // if you already had an operation selected, regenerate
// // //     if (batchOperation) {
// // //       generateCommands(files, batchOperation);
// // //     }
// // //   };

// // //   const handleOperationChange = (value: string) => {
// // //     setBatchOperation(value);
// // //     generateCommands(selectedFiles, value);
// // //   };

// // //   return (
// // //     <MainLayout>
// // //       <div className="flex-1 space-y-4 p-8 pt-6">
// // //         <h2 className="text-3xl font-bold tracking-tight">Batch Processor</h2>
// // //         <p className="text-muted-foreground">
// // //           Generate FFmpeg commands for multiple files.
// // //         </p>

// // //         <FileUploader onFileSelect={handleFileSelect} />

// // //         {selectedFiles.length > 0 && (
// // //           <Card className="w-full">
// // //             <CardHeader>
// // //               <CardTitle>Batch Options</CardTitle>
// // //             </CardHeader>
// // //             <CardContent className="space-y-4">
// // //               <div className="grid w-full max-w-sm items-center gap-1.5">
// // //                 <Label htmlFor="operation-select">Batch Operation</Label>
// // //                 <Select
// // //                   value={batchOperation}
// // //                   onValueChange={handleOperationChange}
// // //                 >
// // //                   <SelectTrigger id="operation-select">
// // //                     <SelectValue placeholder="Select operation" />
// // //                   </SelectTrigger>
// // //                   <SelectContent>
// // //                     {operationOptions.map((opt) => (
// // //                       <SelectItem key={opt.value} value={opt.value}>
// // //                         {opt.label}
// // //                       </SelectItem>
// // //                     ))}
// // //                   </SelectContent>
// // //                 </Select>
// // //               </div>

// // //               <div>
// // //                 <h4 className="text-md font-semibold mb-2">
// // //                   Files Selected:
// // //                 </h4>
// // //                 <ul>
// // //                   {selectedFiles.map((f, i) => (
// // //                     <li key={i} className="text-sm text-muted-foreground">
// // //                       {f.name}
// // //                     </li>
// // //                   ))}
// // //                 </ul>
// // //               </div>
// // //             </CardContent>
// // //           </Card>
// // //         )}

// // //         {ffmpegCommands.length > 0 && (
// // //           <Card className="w-full mt-6">
// // //             <CardHeader>
// // //               <CardTitle>FFmpeg Commands</CardTitle>
// // //             </CardHeader>
// // //             <CardContent>
// // //               <div className="space-y-4">
// // //                 {ffmpegCommands.map((cmd, i) => (
// // //                   <FFmpegCommandDisplay key={i} command={cmd} />
// // //                 ))}
// // //               </div>
// // //             </CardContent>
// // //           </Card>
// // //         )}
// // //       </div>
// // //     </MainLayout>
// // //   );
// // // };

// // // export default BatchProcessor;


// // // // import { useState, useEffect } from "react";
// // // // import { MainLayout } from "@/components/layout/MainLayout";
// // // // import FileUploader from "@/components/shared/FileUploader";
// // // // import FFmpegCommandDisplay from "@/components/shared/FFmpegCommandDisplay";
// // // // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // // // import { Label } from "@/components/ui/label";
// // // // import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// // // // import { Button } from "@/components/ui/button"; // Assuming Button is available

// // // // const BatchProcessor = () => {
// // // //   const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
// // // //   const [batchOperation, setBatchOperation] = useState<string>("__placeholder__");
// // // //   const [ffmpegCommands, setFFmpegCommands] = useState<string[]>([]); // Use array for multiple commands

// // // //   // Placeholder batch operations - simplified examples
// // // //   const operationOptions = [
// // // //     { label: "Select Operation", value: "__placeholder__" },
// // // //     { label: "Convert to MP4 (libx264)", value: "convert_mp4" },
// // // //     { label: "Convert to MP3 (libmp3lame)", value: "convert_mp3" },
// // // //     { label: "Resize to 720p (1280x720)", value: "resize_720p" },
// // // //     // Add more simplified batch operations
// // // //   ];

// // // // const handleFileSelect = (files: File[]) => {
// // // //   setSelectedFiles(files);
// // // //   setFFmpegCommands([]);
// // // //   // If batchOperation somehow got reset to "", force it
// // // //   if (!batchOperation || batchOperation === "") {
// // // //     setBatchOperation("__placeholder__");
// // // //     return;
// // // //   }
// // // //   if (batchOperation !== "__placeholder__") {
// // // //     generateCommands(files, batchOperation);
// // // //   }
// // // // };

// // // // const handleOperationChange = (value: string) => {
// // // //   setBatchOperation(value || "__placeholder__");
// // // //   if (value === "__placeholder__") {
// // // //     setFFmpegCommands([]);
// // // //     return;
// // // //   }
// // // //   generateCommands(selectedFiles, value);
// // // // };

// // // //   const generateCommands = (files: File[], operation: string) => {
// // // //     if (files.length === 0 || !operation || operation === "__placeholder__") {
// // // //       setFFmpegCommands([]);
// // // //       return;
// // // //     }

// // // //     const commands: string[] = files.map(file => {
// // // //         const inputFileName = file.name;
// // // //         const baseName = inputFileName.split('.')[0];
// // // //         let command = `ffmpeg -i "${inputFileName}"`;
// // // //         let outputFileName = "";

// // // //         switch (operation) {
// // // //             case "convert_mp4":
// // // //                 command += ` -c:v libx264 -c:a aac -strict experimental`; // Basic H.264/AAC conversion
// // // //                 outputFileName = `${baseName}_converted.mp4`;
// // // //                 break;
// // // //             case "convert_mp3":
// // // //                  command += ` -vn -acodec libmp3lame -ab 192k`; // Extract audio and convert to MP3 192kbps
// // // //                  outputFileName = `${baseName}_converted.mp3`;
// // // //                  break;
// // // //             case "resize_720p":
// // // //                  command += ` -vf scale=1280:720 -c:a copy`; // Resize video, copy audio
// // // //                  outputFileName = `${baseName}_720p.${inputFileName.split('.').pop()}`; // Keep original extension
// // // //                  break;
// // // //             default:
// // // //                 return `# No command generated for operation: ${operation}`;
// // // //         }

// // // //         command += ` "${outputFileName}"`;
// // // //         return command;
// // // //     });

// // // //     setFFmpegCommands(commands);
// // // //   };
   
// // // //   const sanitizedBatchOperation = batchOperation && batchOperation !== "" ? batchOperation : "__placeholder__";

// // // //   return (
// // // //     <MainLayout>
// // // //       <div className="flex-1 space-y-4 p-8 pt-6">
// // // //         <h2 className="text-3xl font-bold tracking-tight">Batch Processor</h2>
// // // //         <p className="text-muted-foreground">Generate FFmpeg commands to apply operations to multiple files.</p>

// // // //         <FileUploader onFileSelect={handleFileSelect} />

// // // //         {selectedFiles.length > 0 && (
// // // //           <Card className="w-full">
// // // //             <CardHeader>
// // // //               <CardTitle>Batch Options</CardTitle>
// // // //             </CardHeader>
// // // //             <CardContent className="space-y-4">
// // // //               <div className="grid w-full max-w-sm items-center gap-1.5">
// // // //                 <Label htmlFor="operation-select">Batch Operation</Label>
// // // //                 console.log("batchOperation state:", batchOperation, "| rendered value:", sanitizedBatchOperation);
// // // //                   <Select
// // // //                     onValueChange={handleOperationChange}
// // // //                     value={sanitizedBatchOperation}
// // // //                   >
// // // //                   <SelectTrigger id="operation-select">
// // // //                     <SelectValue placeholder="Select operation" />
// // // //                   </SelectTrigger>
// // // //                   <SelectContent>
// // // //                     {operationOptions.map(option => (
// // // //                       <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
// // // //                     ))}
// // // //                   </SelectContent>
// // // //                 </Select>
// // // //               </div>
// // // //                {selectedFiles.length > 0 && (
// // // //                    <div>
// // // //                        <h4 className="text-md font-semibold mb-2">Files selected for batch processing:</h4>
// // // //                        <ul>
// // // //                            {selectedFiles.map((file, index) => (
// // // //                                <li key={index} className="text-sm text-muted-foreground">{file.name}</li>
// // // //                            ))}
// // // //                        </ul>
// // // //                    </div>
// // // //                )}
// // // //                <p className="text-sm text-yellow-600">
// // // //                    Note: This tool generates a separate FFmpeg command for each selected file based on the chosen operation. Executing these commands requires FFmpeg installed on your system.
// // // //                </p>
// // // //             </CardContent>
// // // //           </Card>
// // // //         )}

// // // //         {ffmpegCommands.length > 0 && (
// // // //             <Card className="w-full mt-6">
// // // //                 <CardHeader>
// // // //                     <CardTitle>Generated FFmpeg Commands</CardTitle>
// // // //                 </CardHeader>
// // // //                 <CardContent>
// // // //                     <div className="space-y-4">
// // // //                         {ffmpegCommands.map((command, index) => (
// // // //                             <FFmpegCommandDisplay key={index} command={command} />
// // // //                         ))}
// // // //                     </div>
// // // //                 </CardContent>
// // // //             </Card>
// // // //         )}
// // // //          {selectedFiles.length > 0 && ffmpegCommands.length === 0 && batchOperation && (
// // // //              <p className="text-sm text-yellow-600">Select an operation to generate commands.</p>
// // // //          )}

// // // //       </div>
// // // //     </MainLayout>
// // // //   );
// // // // };

// // // // export default BatchProcessor;