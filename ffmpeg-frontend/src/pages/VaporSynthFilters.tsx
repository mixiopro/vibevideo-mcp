// pages/VapourSynthFilter.tsx
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import FileUploader from "@/components/shared/FileUploader";
import FFmpegCommandDisplay from "@/components/shared/FFmpegCommandDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const filters = [
  { label: "AI Denoise", value: "dfttest" },
  { label: "Deblock", value: "deblock" },
  { label: "Sharpen", value: "sharpen" },
  // Expand as desired
];

const VapourSynthFilter = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("");
  const [generatedScript, setGeneratedScript] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputFile, setOutputFile] = useState<string>("");

  const handleFileSelect = (files: File[]) => setSelectedFile(files[0] || null);

  const handleFilterChange = (val: string) => {
    setSelectedFilter(val);
    if (selectedFile && val) {
      const base = selectedFile.name.replace(/\.[^/.]+$/, "");
      setGeneratedScript(
        `
import vapoursynth as vs
core = vs.core
video = core.ffms2.Source('${selectedFile.name}')
filtered = core.${val}.${val.charAt(0).toUpperCase() + val.slice(1)}(video)
filtered.set_output()
        `.trim()
      );
    } else {
      setGeneratedScript("");
    }
  };

  const handleRun = async () => {
    if (!selectedFile || !selectedFilter) {
      toast.warning("Select file and filter");
      return;
    }
    setIsProcessing(true);
    // Mock or call backend for demo
    setTimeout(() => {
      setIsProcessing(false);
      setOutputFile(selectedFile.name.replace(/\.[^/.]+$/, "") + `_vs.mp4`);
      toast.success("Processing complete!");
    }, 2000);
  };

  return (
    <MainLayout>
      <div className="space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">VapourSynth Video Filters</h2>
        <p className="text-muted-foreground">Use advanced, scriptable video filters via VapourSynth (Python-powered).</p>
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
                {filters.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Button onClick={handleRun} disabled={!selectedFilter || isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isProcessing ? "Processing..." : "Run"}
              </Button>
              {generatedScript && (
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{generatedScript}</pre>
              )}
            </CardContent>
          </Card>
        )}
        {/* You can add a video output component here if desired */}
        <FFmpegCommandDisplay command={generatedScript} />
      </div>
    </MainLayout>
  );
};

export default VapourSynthFilter;
