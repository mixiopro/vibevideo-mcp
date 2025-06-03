// pages/SoXAudioFilter.tsx
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import FileUploader from "@/components/shared/FileUploader";
import FFmpegCommandDisplay from "@/components/shared/FFmpegCommandDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import OutputMediaPlayer from "@/components/shared/OutputMediaPlayer";
import { toast } from "sonner";

const soxFilters = [
  { label: "Normalize", value: "norm" },
  { label: "Noise Reduction", value: "noisered" },
  { label: "Reverb", value: "reverb" },
  { label: "Pitch Shift", value: "pitch 300" },
  { label: "Tempo Change", value: "tempo 1.1" },
  // Add more as desired
];

const SoXAudioFilter = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("");
  const [generatedCommand, setGeneratedCommand] = useState<string>("");
  const [outputFile, setOutputFile] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (files: File[]) => {
    setSelectedFile(files[0] || null);
  };

  const handleFilterChange = (val: string) => {
    setSelectedFilter(val);
    if (selectedFile && val) {
      const out = selectedFile.name.replace(/\.[^/.]+$/, "") + `_sox.wav`;
      setGeneratedCommand(`sox "${selectedFile.name}" "${out}" ${val}`);
    } else {
      setGeneratedCommand("");
    }
  };

  const handleRun = async () => {
    if (!selectedFile || !selectedFilter) {
      toast.warning("Select file and filter");
      return;
    }
    setIsProcessing(true);
    // Assume you have a backend endpoint for sox; otherwise, mock or skip
    setTimeout(() => {
      setIsProcessing(false);
      setOutputFile(selectedFile.name.replace(/\.[^/.]+$/, "") + `_sox.wav`);
      toast.success("Processing complete!");
    }, 2000);
  };

  return (
    <MainLayout>
      <div className="space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">SoX Audio Filters</h2>
        <p className="text-muted-foreground">Apply high-quality audio effects and filters with SoX.</p>
        <FileUploader onFileSelect={handleFileSelect} />
        {selectedFile && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Choose Filter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <select
                className="w-full border rounded p-2"
                value={selectedFilter}
                onChange={e => handleFilterChange(e.target.value)}
                disabled={isProcessing}
              >
                <option value="">Select Filter</option>
                {soxFilters.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Button onClick={handleRun} disabled={!selectedFilter || isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isProcessing ? "Processing..." : "Run"}
              </Button>
            </CardContent>
          </Card>
        )}
        <OutputMediaPlayer outputFile={outputFile} />
        <FFmpegCommandDisplay command={generatedCommand} />
      </div>
    </MainLayout>
  );
};

export default SoXAudioFilter;
