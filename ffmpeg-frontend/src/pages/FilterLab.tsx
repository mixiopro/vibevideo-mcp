import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import FileUploader from "@/components/shared/FileUploader";
import FFmpegCommandDisplay from "@/components/shared/FFmpegCommandDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Info } from "lucide-react"; // Added Info icon for tooltip
import { useFFmpegProcessor } from "@/hooks/useFFmpegProcessor";
import OutputMediaPlayer from "@/components/shared/OutputMediaPlayer";
import { toast } from "sonner";
import type { SingleFileCommandPayload } from "@/hooks/useFFmpegProcessor";
import { Input } from "@/components/ui/input"; // Explicitly import Input
import { Slider } from "@/components/ui/slider"; // Import Slider
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Explicitly import Select components
import { Switch } from "@/components/ui/switch"; // Import Switch
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Import Tooltip components
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"; // Import Accordion
// Import the reusable FilterMultiSelect component
import { FilterMultiSelect } from "@/components/shared/FilterMultiSelect";

// Import the filter data from the JSON file
import availableFiltersData from '@/data/ffmpegFilters.json';

// Define the structure for filter options and parameters (matching JSON)
interface FilterParameter {
  name: string;
  type: "number" | "string" | "boolean" | "enum";
  description: string;
  default?: any;
  min?: number;
  max?: number;
  options?: string[]; // For string (with options) or enum types
}

interface FilterOption {
  label: string;
  value: string;
  ffmpeg_type: "audio" | "video" | "common"; // Added ffmpeg_type
  complex_filter?: boolean; // Added complex_filter
  default_extension?: string; // Added default_extension
  parameters?: FilterParameter[];
}

interface FilterCategory {
    category: string;
    filters: FilterOption[];
}


const FilterLab = () => {
  // Use the new hook
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

  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  // State to hold parameter values for selected filters
  // Structure: { filterValue: { paramName: value, ... }, ... }
  const [filterParameterValues, setFilterParameterValues] = useState<{ [filterValue: string]: { [paramName: string]: any } }>({});

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);

  // Use the imported filter data
  const availableFilters: FilterCategory[] = availableFiltersData;

  // Helper to find a filter definition by its value
  const findFilterDefinition = (filterValue: string): FilterOption | undefined => {
      for (const category of availableFilters) {
          const filter = category.filters.find(f => f.value === filterValue);
          if (filter) return filter;
      }
      return undefined;
  };

  const handlePreviewClick = async () => {
  if (!selectedFiles.length || !selectedFilters.length) return;
  setIsPreviewing(true);
  setPreviewUrl(null);

  const uploadedFile = await uploadSingleFile(selectedFiles[0]);
  if (!uploadedFile) { setIsPreviewing(false); return; }

  const previewCommand = generateDisplayCommandString(
    uploadedFile, selectedFilters, filterParameterValues, /* add preview mode flag if needed */
    true // << pass a 'preview' boolean, if your generator supports it
  );
  
  const resp = await fetch("http://localhost:8200/preview", {  // Your new backend endpoint
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      command: previewCommand,
      inputFile: uploadedFile,
      preview: true
    }),
  });
  const result = await resp.json();
  setIsPreviewing(false);

  if (result.success && result.preview_url) {
    setPreviewUrl(`http://localhost:8200/files/${result.preview_url}`);
  } else {
    toast.error("Preview failed.");
  }
};

  // Effect to initialize parameter state when selected filters change
  useEffect(() => {
      console.log("[FilterLab] useEffect [selectedFilters] triggered. selectedFilters:", selectedFilters);
      const initialParameterValues: { [filterValue: string]: { [paramName: string]: any } } = {};
      selectedFilters.forEach(filterValue => {
          const filterDef = findFilterDefinition(filterValue);
          if (filterDef?.parameters) {
              initialParameterValues[filterValue] = {};
              filterDef.parameters.forEach(param => {
                  // Initialize with default value if available, otherwise undefined
                  initialParameterValues[filterValue][param.name] = param.default !== undefined ? param.default : undefined;
              });
          }
      });
      setFilterParameterValues(initialParameterValues);
      // Command will be regenerated by the effect below
  }, [selectedFilters]); // Re-run when selectedFilters change


  // Effect to generate command string for display whenever selectedFiles, selectedFilters, or filterParameterValues changes
  // This command string uses the *local* file name for display purposes.
  useEffect(() => {
      console.log("[FilterLab] useEffect [command generation] triggered.", { selectedFilesLength: selectedFiles.length, selectedFilters, filterParameterValues });
      if (selectedFiles.length === 1 && selectedFilters.length > 0) {
          generateDisplayCommandString(selectedFiles[0].name, selectedFilters, filterParameterValues);
      } else {
          console.log("[FilterLab] useEffect [command generation]: Conditions not met, setting command to empty.");
          setCommand(""); // Clear command if requirements aren't met
      }
  }, [selectedFiles, selectedFilters, filterParameterValues, setCommand]); // Add all dependencies


  // Function to handle parameter value changes
  const handleParameterChange = (filterValue: string, paramName: string, value: any) => {
      console.log("[FilterLab] handleParameterChange called:", { filterValue, paramName, value });
      setFilterParameterValues(prevValues => ({
          ...prevValues,
          [filterValue]: {
              ...prevValues[filterValue],
              [paramName]: value,
          },
      }));
      // Command will be regenerated by the useEffect hook
  };

  // Function to reset parameters for a single filter to defaults
  const resetFilterParameters = (filterValue: string) => {
      console.log("[FilterLab] resetFilterParameters called for:", filterValue);
      const filterDef = findFilterDefinition(filterValue);
      if (filterDef?.parameters) {
          const defaultValues: { [paramName: string]: any } = {};
          filterDef.parameters.forEach(param => {
              defaultValues[param.name] = param.default !== undefined ? param.default : undefined;
          });
          setFilterParameterValues(prevValues => ({
              ...prevValues,
              [filterValue]: defaultValues,
          }));
      }
  };


  // Function to generate the command string for display (used by useEffect)
  // This uses the *local* file name for display purposes.
  const generateDisplayCommandString = (inputFilename: string, filters: string[], parameterValues: { [filterValue: string]: { [paramName: string]: any } }) => {
    console.log("[FilterLab] generateDisplayCommandString called", { inputFilename, filters, parameterValues });

    // --- Defensive Checks ---
    if (typeof inputFilename !== 'string' || !inputFilename) {
        console.error("[FilterLab] generateDisplayCommandString: Invalid inputFilename.");
        setCommand("Error: Invalid input file.");
        return "Error: Invalid input file.";
    }
    if (!Array.isArray(filters) || filters.length === 0) {
        console.log("[FilterLab] generateDisplayCommandString: No filters selected.");
        setCommand("");
        return "";
    }
     if (typeof parameterValues !== 'object' || parameterValues === null) {
         console.error("[FilterLab] generateDisplayCommandString: Invalid parameterValues object.");
         setCommand("Error: Invalid parameter data.");
         return "Error: Invalid parameter data.";
     }
    // --- End Defensive Checks ---


    const baseName = inputFilename.split('.')[0];
    const outputExtension = inputFilename.split('.').pop(); // Keep original extension for simplicity
    const outputFile = `${baseName}_filtered.${outputExtension}`; // Simple output naming

    let command: string = ''; // Initialize command variable

    let filtergraph = "";
    let useFilterComplex = false;
    let isAudioToVideoFilterPresent = false;
    let audioToVideoFilterValue: string | undefined; // Store the value of the first audio-to-video filter

    // Check for audio-to-video filters and complex filters
    for (const filterValue of filters) {
        const filterDef = findFilterDefinition(filterValue);
        if (filterDef) {
            // Check for audio-to-video filters (audio input, complex, implies video output)
            const isAudioToVideo = filterDef.ffmpeg_type === "audio" && filterDef.complex_filter === true &&
                                   (filterDef.default_extension === "mp4" || filterDef.default_extension === "mov" ||
                                    filterDef.description?.toLowerCase().includes("video output") ||
                                    filterDef.description?.toLowerCase().includes("visualizer") ||
                                    filterDef.description?.toLowerCase().includes("renders video") ||
                                    filterValue === "showfreqs" || filterValue === "aspectrum" || filterValue === "showwaves"); // Added showwaves

            if (isAudioToVideo) {
                isAudioToVideoFilterPresent = true;
                audioToVideoFilterValue = filterValue; // Store the first one found
                useFilterComplex = true; // Audio-to-video filters require filter_complex
                // For simplicity, if an audio-to-video filter is present, we'll only process that one
                // in the filtergraph string generation below.
                break; // Exit loop once an audio-to-video filter is found
            }
            // Check for other complex filters
            if (filterDef.complex_filter === true) {
                 useFilterComplex = true;
            }
        }
    }


    // Build the filtergraph string with parameters
    // If an audio-to-video filter is present, only include that one in the graph for simplicity
    const filtersToProcess = isAudioToVideoFilterPresent && audioToVideoFilterValue ? [audioToVideoFilterValue] : filters;

    filtergraph = filtersToProcess.map(filterValue => {
        const filterDef = findFilterDefinition(filterValue);
        if (!filterDef) {
            console.warn(`[FilterLab] generateDisplayCommandString: Definition not found for filter: ${filterValue}`);
            return filterValue; // Return raw value if definition is missing
        }

        // Use parameter values from state if available, falling back to defaults if not set
        const params = parameterValues[filterValue] || {};

        if (!filterDef.parameters || filterDef.parameters.length === 0) {
            return filterValue; // Filter has no parameters
        }

        // Build parameter string for this filter
        const paramString = filterDef.parameters.map(paramDef => {
            // Use value from state if available, otherwise use default from JSON
            const value = params?.[paramDef.name] !== undefined ? params[paramDef.name] : paramDef.default;

            // Only include parameter if value is not undefined/null and not an empty string (unless it's a valid empty string value)
            if (value === undefined || value === null || (typeof value === 'string' && value === '' && paramDef.type !== 'string')) {
                 // Special handling for boolean default=false vs value=false
                 if (paramDef.type === 'boolean' && value === false && (paramDef.default === undefined || paramDef.default === false)) {
                     return null; // Omit if boolean is false and default is false or undefined
                 }
                 return null; // Skip other undefined/null/empty parameters
            }

            // Format value based on type
            let formattedValue = value;
            if (paramDef.type === 'string' || paramDef.type === 'enum') {
                 // String and enum values might need quoting if they contain special characters,
                 // but simple values usually don't. Let's assume simple values for now.
                 // Escape single quotes within the string value
                 const escapedValue = String(value).replace(/'/g, "'\\''");
                 formattedValue = `'${escapedValue}'`; // Quote string/enum values
            } else if (paramDef.type === 'boolean') {
                 // Boolean values are typically 0 or 1 in FFmpeg filters
                 formattedValue = value ? 1 : 0;
            } else if (paramDef.type === 'number') {
                 // Numbers are used directly
                 formattedValue = value;
            }

            return `${paramDef.name}=${formattedValue}`;
        }).filter(param => param !== null).join(':'); // Join parameters with ':'

        return paramString ? `${filterValue}=${paramString}` : filterValue; // Combine filter name and parameters
    }).join(','); // Join filters with ','


    if (isAudioToVideoFilterPresent && audioToVideoFilterValue) {
        // Specific command structure for audio-to-video filters (Corrected)
        const outputVideoFile = `${baseName}_filtered.mp4`; // Force MP4 output for browser compatibility
        command = `ffmpeg -i "${inputFilename}" -filter_complex "[0:a]${filtergraph}[v]" -map "[v]" -map 0:a -c:v libx264 -c:a aac -strict experimental "${outputVideoFile}"`;
        console.log("[FilterLab] generateDisplayCommandString: Generated Audio-to-Video command:", command);
        setCommand(command);
        return command;

    } else if (useFilterComplex) {
        // Handle other complex filters (e.g., drawtext, overlay)
        // This part requires a full filter graph builder implementation.
        // For now, display a placeholder command indicating complex filters were selected.
        const otherComplexFilters = filters.filter(filterValue => {
             const filterDef = findFilterDefinition(filterValue);
             // Include filters marked complex_filter: true, but NOT audio-to-video ones
             return filterDef?.complex_filter === true && !(filterDef.ffmpeg_type === "audio" && filterDef.complex_filter === true &&
                                   (filterDef.default_extension === "mp4" || filterDef.description?.toLowerCase().includes("video output") || filterValue === "showfreqs" || filterValue === "aspectrum" || filterValue === "showwaves"));
        });

        if (otherComplexFilters.length > 0) {
             // Rebuild the filtergraph string for these other complex filters
             const otherComplexFiltergraph = otherComplexFilters.map(filterValue => {
                  const filterDef = findFilterDefinition(filterValue);
                  if (!filterDef) return filterValue; // Should not happen

                  const params = parameterValues[filterValue] || {};
                  if (!filterDef.parameters || filterDef.parameters.length === 0) return filterValue;

                  const paramString = filterDef.parameters.map(paramDef => {
                      const value = params?.[paramDef.name] !== undefined ? params[paramDef.name] : paramDef.default;
                      if (value === undefined || value === null || (typeof value === 'string' && value === '' && paramDef.type !== 'string')) return null;
                      let formattedValue = value;
                      if (paramDef.type === 'string' || paramDef.type === 'enum') {
                          const escapedValue = String(value).replace(/'/g, "'\\''");
                          formattedValue = `'${escapedValue}'`;
                      } else if (paramDef.type === 'boolean') {
                          formattedValue = value ? 1 : 0;
                      }
                      return `${paramDef.name}=${formattedValue}`;
                  }).filter(param => param !== null).join(':');

                  return paramString ? `${filterValue}=${paramString}` : filterValue;
             }).join(',');

             // Assuming a simple chain: [0:v]filter1,filter2[v_out]
             // This is still a simplification; a real graph builder is needed for complex chains/multiple inputs
             // Use -map 0:v for the input video stream, -map 0:a for the input audio stream
             // Re-encode video with libx264, copy audio
             const outputVideoFile = `${baseName}_filtered.mp4`; // Assume video output for complex filters
             command = `ffmpeg -i "${inputFilename}" -filter_complex "[0:v]${otherComplexFiltergraph}[v_out]" -map "[v_out]" -map 0:a -c:v libx264 -c:a copy "${outputVideoFile}"`;
             console.log("[FilterLab] generateDisplayCommandString: Generated Other Complex command:", command);
             setCommand(command);
             return command;

        } else {
             // This case should ideally not be reached if useFilterComplex is true but no other complex filters are found
             // It might indicate a logic error or a filter definition issue.
             console.error("[FilterLab] generateDisplayCommandString: useFilterComplex is true, but no other complex filters found to process.");
             command = "Error: Could not generate command for selected complex filters.";
             setCommand(command);
             return command;
        }


    } else {
        // Handle simple filters (-vf and -af)
        const videoFilters = filters.filter(filterValue => {
            const filterDef = findFilterDefinition(filterValue);
            return filterDef?.ffmpeg_type === "video" && filterDef?.complex_filter !== true;
        });

        const audioFilters = filters.filter(filterValue => {
            const filterDef = findFilterDefinition(filterValue);
            return filterDef?.ffmpeg_type === "audio" && filterDef?.complex_filter !== true;
        });

        const simpleVideoFilterString = videoFilters.map(filterValue => {
             const filterDef = findFilterDefinition(filterValue);
             const params = parameterValues[filterValue] || {};
             if (!filterDef?.parameters || filterDef.parameters.length === 0) return filterValue;
             const paramString = filterDef.parameters.map(paramDef => {
                 const value = params?.[paramDef.name] !== undefined ? params[paramDef.name] : paramDef.default;
                 if (value === undefined || value === null || (typeof value === 'string' && value === '' && paramDef.type !== 'string')) return null;
                 let formattedValue = value;
                 if (paramDef.type === 'string' || paramDef.type === 'enum') {
                     const escapedValue = String(value).replace(/'/g, "'\\''");
                     formattedValue = `'${escapedValue}'`;
                 } else if (paramDef.type === 'boolean') {
                     formattedValue = value ? 1 : 0;
                 }
                 return `${paramDef.name}=${formattedValue}`;
             }).filter(param => param !== null).join(':');
             return paramString ? `${filterValue}=${paramString}` : filterValue;
        }).join(',');

         const simpleAudioFilterString = audioFilters.map(filterValue => {
             const filterDef = findFilterDefinition(filterValue);
             const params = parameterValues[filterValue] || {}; // Corrected variable name
             if (!filterDef?.parameters || filterDef.parameters.length === 0) return filterValue;
             const paramString = filterDef.parameters.map(paramDef => {
                 const value = params?.[paramDef.name] !== undefined ? params[paramDef.name] : paramDef.default;
                 if (value === undefined || value === null || (typeof value === 'string' && value === '' && paramDef.type !== 'string')) return null;
                 let formattedValue = value;
                 if (paramDef.type === 'string' || paramDef.type === 'enum') {
                     const escapedValue = String(value).replace(/'/g, "'\\''");
                     formattedValue = `'${escapedValue}'`;
                 } else if (paramDef.type === 'boolean') {
                     formattedValue = value ? 1 : 0;
                 }
                 return `${paramDef.name}=${formattedValue}`;
             }).filter(param => param !== null).join(':');
             return paramString ? `${filterValue}=${paramString}` : filterValue;
        }).join(',');


        command = `ffmpeg -i "${inputFilename}"`; // Re-initialize command for simple filters

        if (simpleVideoFilterString) {
            command += ` -vf "${simpleVideoFilterString}"`;
        }
        if (simpleAudioFilterString) {
            command += ` -af "${simpleAudioFilterString}"`;
        }

        // Explicitly set codecs based on which filters are applied
        if (simpleVideoFilterString && simpleAudioFilterString) {
             // Both video and audio filters applied, re-encode both
             command += ` -c:v libx264 -c:a aac -strict experimental`;
        } else if (simpleVideoFilterString && !simpleAudioFilterString) {
             // Only video filters applied, re-encode video, copy audio
             command += ` -c:v libx264 -c:a copy`;
        } else if (!simpleVideoFilterString && simpleAudioFilterString) {
             // Only audio filters applied, copy video, re-encode audio
             command += ` -c:v copy -c:a aac -strict experimental`;
        } else {
             // No simple filters applied (this case should be caught earlier, but as a fallback)
             // Default to copy all streams
             command += ` -c copy`;
        }


        command += ` "${outputFile}"`;
        console.log("[FilterLab] generateDisplayCommandString: Generated Simple command:", command);
        setCommand(command); // Set the command using the hook's function
        return command; // Return the generated command string
    }
  };

  // New handler for the Run button
  const handleRunClick = async () => {
      console.log("[FilterLab] handleRunClick called.", { selectedFilesLength: selectedFiles.length, selectedFilters });
      if (selectedFiles.length === 0) {
          toast.warning("Please select a file first.");
          return;
      }
      if (selectedFiles.length > 1) {
          toast.warning("Filter Lab currently only supports a single file. Please select only one file.");
          return;
      }
      if (selectedFilters.length === 0) {
          toast.warning("Please select at least one filter.");
          return;
      }

      // Basic validation of parameter values before running
      for (const filterValue of selectedFilters) {
          const filterDef = findFilterDefinition(filterValue);
          const params = filterParameterValues[filterValue];
          if (filterDef?.parameters) {
              for (const paramDef of filterDef.parameters) {
                  // Use value from state if available, otherwise use default from JSON
                  const value = params?.[paramDef.name] !== undefined ? params[paramDef.name] : paramDef.default;

                  if (paramDef.type === 'number') {
                      // Only validate if a value is present (either from state or default)
                      if (value !== undefined && value !== null && value !== '') {
                          const numValue = parseFloat(value);
                          if (isNaN(numValue)) {
                              toast.warning(`Parameter "${paramDef.name}" for filter "${filterDef.label}" must be a number.`);
                              return; // Stop execution
                          }
                          if (paramDef.min !== undefined && numValue < paramDef.min) {
                              toast.warning(`Parameter "${paramDef.name}" for filter "${filterDef.label}" must be at least ${paramDef.min}.`);
                              return; // Stop execution
                          }
                          if (paramDef.max !== undefined && numValue > paramDef.max) {
                              toast.warning(`Parameter "${paramDef.name}" for filter "${filterDef.label}" must be at most ${paramDef.max}.`);
                              return; // Stop execution
                          }
                      }
                  }
                  // Add more validation for other types if necessary (e.g., required fields)
                  // For simplicity, we'll rely on FFmpeg's validation for now,
                  // but could add checks here for required parameters if the JSON included a 'required' flag.
              }
          }
      }


      // Explicitly trigger single file upload
      console.log("[FilterLab] handleRunClick: Calling uploadSingleFile...");
      const uploadedFile = await uploadSingleFile(selectedFiles[0]);
      console.log("[FilterLab] handleRunClick: uploadSingleFile returned:", uploadedFile);


      if (uploadedFile) {
          // Construct the actual command payload using the *uploaded* filename
          const actualCommand = generateDisplayCommandString(uploadedFile, selectedFilters, filterParameterValues); // Reuse logic, but pass uploadedFile
          console.log("[FilterLab] handleRunClick: Actual command generated for backend:", actualCommand);

          // Check if command was successfully generated (e.g., if required fields were missing)
          if (!actualCommand || actualCommand.startsWith("Error:")) { // Check for the specific error message too
              toast.error("Could not generate command. Please check your options.");
              return;
          }

          const payload: SingleFileCommandPayload = {
              command: actualCommand,
              inputFile: uploadedFile, // Use the uploaded filename
          };
          console.log("[FilterLab] handleRunClick: Running command with payload:", payload);
          runCommand(payload); // Run the command via the hook
      }
  };


  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Filter & Effects Lab</h2>
        <p className="text-muted-foreground">Apply various video and audio filters and effects.</p>

        {/* Use the hook's file select handler */}
        <FileUploader onFileSelect={handleFileSelect} />

        {selectedFiles.length > 0 && ( // Use hook's selectedFiles for UI visibility
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Filter Options</CardTitle>
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
                           <p className="text-sm text-yellow-600">Note: Filter Lab currently only supports a single file. Only the first file will be processed.</p>
                       )}

                       {/* Render multi-select dropdowns, one per category */}
                       {/* Changed space-y-4 to flex flex-wrap gap-2 */}
                       <div className="flex flex-wrap gap-2">
                           {availableFilters.map(category => (
                               // Only render the category if it contains audio filters
                               category.filters.some(filter => filter.ffmpeg_type === 'audio' || filter.ffmpeg_type === 'video' || filter.ffmpeg_type === 'common') && (
                                   // Removed the extra div and Label, pass category name directly
                                   <FilterMultiSelect
                                       key={category.category}
                                       categoryName={category.category} // Pass the category name for the button text
                                       filters={[category]} // Pass the single category within an array
                                       value={selectedFilters} // Pass the global selected filters state
                                       onValueChange={setSelectedFilters} // Pass the global setter function
                                       disabled={isProcessing || isUploading}
                                       // No filterType prop here, show all filter types
                                   />
                               )
                           ))}
                            {/* Option to clear ALL filters */}
                            {selectedFilters.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 border-dashed text-red-500 hover:text-red-600 border-red-500 hover:border-red-600"
                                    onClick={() => setSelectedFilters([])}
                                    disabled={isProcessing || isUploading}
                                >
                                    Clear All Filters ({selectedFilters.length})
                                </Button>
                            )}
                       </div>

                       {/* Render Parameter Controls for Selected Filters */}
                       {selectedFilters.length > 0 && (
                           <div className="space-y-6 mt-6">
                               <h3 className="text-lg font-semibold">Selected Filter Parameters</h3>
                               {selectedFilters.map(filterValue => {
                                   const filterDef = findFilterDefinition(filterValue);
                                   // Use parameter values from state, falling back to defaults if not set
                                   const params = filterParameterValues[filterValue] || {};

                                   if (!filterDef) return null; // Should not happen

                                   return (
                                       <Card key={filterValue} className="w-full">
                                           <CardHeader className="flex flex-row items-center justify-between">
                                               <CardTitle className="text-md">{filterDef.label} ({filterDef.value})</CardTitle>
                                                {filterDef.parameters && filterDef.parameters.length > 0 && (
                                                    <Button variant="outline" size="sm" onClick={() => resetFilterParameters(filterValue)} disabled={isProcessing || isUploading}>
                                                        Reset Parameters
                                                    </Button>
                                                )}
                                           </CardHeader>
                                           <CardContent className="space-y-4">
                                               {filterDef.parameters && filterDef.parameters.length > 0 ? (
                                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                       {filterDef.parameters.map(paramDef => (
                                                           <div key={paramDef.name} className="grid gap-1.5">
                                                               <div className="flex items-center space-x-2">
                                                                    <Label htmlFor={`${filterValue}-${paramDef.name}`}>{paramDef.name}</Label>
                                                                    {paramDef.description && (
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                                                                </TooltipTrigger>
                                                                                <TooltipContent className="max-w-xs">
                                                                                    <p>{paramDef.description}</p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    )}
                                                               </div>

                                                               {/* Render control based on parameter type */}
                                                               {paramDef.type === 'number' && (
                                                                   <Input
                                                                       id={`${filterValue}-${paramDef.name}`}
                                                                       type="number"
                                                                       value={params?.[paramDef.name] ?? (paramDef.default !== undefined ? paramDef.default : '')} // Use state value, fallback to JSON default, then empty string
                                                                       onChange={(e) => handleParameterChange(filterValue, paramDef.name, parseFloat(e.target.value))}
                                                                       placeholder={paramDef.default !== undefined ? `Default: ${paramDef.default}` : ''}
                                                                       min={paramDef.min}
                                                                       max={paramDef.max}
                                                                       step="any" // Allow decimal inputs
                                                                       disabled={isProcessing || isUploading}
                                                                   />
                                                               )}
                                                                {paramDef.type === 'string' && paramDef.options && paramDef.options.length > 0 && (
                                                                    <Select
                                                                        value={params?.[paramDef.name] ?? (paramDef.default !== undefined ? String(paramDef.default) : '')} // Ensure default is string for select
                                                                        onValueChange={(value) => handleParameterChange(filterValue, paramDef.name, value)}
                                                                        disabled={isProcessing || isUploading}
                                                                    >
                                                                        <SelectTrigger id={`${filterValue}-${paramDef.name}`}>
                                                                            <SelectValue placeholder={paramDef.default !== undefined ? `Default: ${paramDef.default}` : 'Select option'} />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {paramDef.options.map(option => (
                                                                                <SelectItem key={option} value={option}>{option}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                )}
                                                                {paramDef.type === 'string' && (!paramDef.options || paramDef.options.length === 0) && (
                                                                    <Input
                                                                        id={`${filterValue}-${paramDef.name}`}
                                                                        type="text"
                                                                        value={params?.[paramDef.name] ?? (paramDef.default !== undefined ? String(paramDef.default) : '')} // Ensure default is string
                                                                        onChange={(e) => handleParameterChange(filterValue, paramDef.name, e.target.value)}
                                                                        placeholder={paramDef.default !== undefined ? `Default: ${paramDef.default}` : ''}
                                                                        disabled={isProcessing || isUploading}
                                                                    />
                                                                )}
                                                                {paramDef.type === 'enum' && paramDef.options && paramDef.options.length > 0 && (
                                                                     <Select
                                                                        value={params?.[paramDef.name] ?? (paramDef.default !== undefined ? String(paramDef.default) : '')} // Ensure default is string for select
                                                                        onValueChange={(value) => handleParameterChange(filterValue, paramDef.name, value)}
                                                                        disabled={isProcessing || isUploading}
                                                                    >
                                                                        <SelectTrigger id={`${filterValue}-${paramDef.name}`}>
                                                                            <SelectValue placeholder={paramDef.default !== undefined ? `Default: ${paramDef.default}` : 'Select option'} />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {paramDef.options.map(option => (
                                                                                <SelectItem key={option} value={option}>{option}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                )}
                                                                {paramDef.type === 'boolean' && (
                                                                    <div className="flex items-center space-x-2">
                                                                        <Switch
                                                                            id={`${filterValue}-${paramDef.name}`}
                                                                            checked={params?.[paramDef.name] ?? (paramDef.default || false)} // Default to false if no default
                                                                            onCheckedChange={(checked) => handleParameterChange(filterValue, paramDef.name, checked)}
                                                                            disabled={isProcessing || isUploading}
                                                                        />
                                                                         <Label htmlFor={`${filterValue}-${paramDef.name}`}>
                                                                             {params?.[paramDef.name] ? 'Enabled' : 'Disabled'}
                                                                         </Label>
                                                                    </div>
                                                                )}
                                                           </div>
                                                       ))}
                                                   </div>
                                               ) : (
                                                   <p className="text-sm text-muted-foreground">No parameters for this filter.</p>
                                               )}
                                           </CardContent>
                                       </Card>
                                   );
                               })}
                           </div>
                       )}


                       <p className="text-sm text-yellow-600">
                           Note: This tool currently has limited support for complex filter graphs. If you select an audio filter that generates video (like `showfreqs` or `aspectrum`), only that filter will be applied using `-filter_complex`. Other complex filters (like `drawtext`) are not fully supported in combination with other filters in this version and will be shown in a placeholder command.
                       </p>

                        <Button
                        onClick={handlePreviewClick}
                        disabled={selectedFilters.length === 0 || selectedFiles.length === 0 || isProcessing || isUploading || isPreviewing}
                        variant="outline"
                        >
                        {isPreviewing ? (
                            <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating Preview...
                            </>
                        ) : (
                            "Preview"
                        )}
                        </Button>
                        
                       {/* Run Button - uses the new handleRunClick */}
                       <Button
                           onClick={handleRunClick} // Use the new handler
                           disabled={selectedFilters.length === 0 || selectedFiles.length === 0 || isProcessing || isUploading} // Disable if no filters, no file, processing, or uploading
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
                               "Run Filters"
                           )}
                       </Button>
                       <p className="text-sm text-yellow-600">
                           Note: Clicking "Run" will first upload the selected file and then send the command to your local backend server running on http://localhost:8200.
                           Ensure your backend is running and has access to the selected file.
                       </p>
                       <p className="text-sm text-yellow-600">
                           Note: Parameter controls are generated dynamically based on the filter definitions. Some advanced filters may require specific FFmpeg builds or external data.
                       </p>

                       {previewUrl && (
                        <div className="mt-4">
                            <video controls src={previewUrl} className="w-full max-w-lg rounded-lg shadow" />
                            {/* or for images:
                            <img src={previewUrl} className="w-full max-w-lg rounded-lg shadow" />
                            */}
                        </div>
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

export default FilterLab;