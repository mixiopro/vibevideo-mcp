// pages/AubioAnalysis.tsx
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import FileUploader from "@/components/shared/FileUploader";
import FFmpegCommandDisplay from "@/components/shared/FFmpegCommandDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const aubioTasks = [
  { label: "Detect BPM", value: "tempo" },
  { label: "Detect Onsets", value: "onset" },
  { label: "Detect Pitch", value: "pitch" },
];

const AubioAnalysis = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [generatedCommand, setGeneratedCommand] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>("");

  const handleFileSelect = (files: File[]) => {
    setSelectedFile(files[0] || null);
  };

  const handleTaskChange = (val: string) => {
    setSelectedTask(val);
    if (selectedFile && val) {
      setGeneratedCommand(`aubio ${val} "${selectedFile.name}"`);
    } else {
      setGeneratedCommand("");
    }
  };

  const handleRun = async () => {
    if (!selectedFile || !selectedTask) {
      toast.warning("Select file and analysis task");
      return;
    }
    setIsProcessing(true);
    // Assume backend call or mock
    setTimeout(() => {
      setIsProcessing(false);
      setAnalysisResult("Result: Detected BPM: 120 (example)");
      toast.success("Analysis complete!");
    }, 2000);
  };

  return (
    <MainLayout>
      <div className="space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Aubio Audio Analysis</h2>
        <p className="text-muted-foreground">Analyze music files for BPM, pitch, and onsets.</p>
        <FileUploader onFileSelect={handleFileSelect} />
        {selectedFile && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Choose Analysis Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <select
                className="w-full border rounded p-2"
                value={selectedTask}
                onChange={e => handleTaskChange(e.target.value)}
                disabled={isProcessing}
              >
                <option value="">Select Task</option>
                {aubioTasks.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Button onClick={handleRun} disabled={!selectedTask || isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isProcessing ? "Processing..." : "Run"}
              </Button>
              {analysisResult && <div className="mt-2 text-green-700">{analysisResult}</div>}
            </CardContent>
          </Card>
        )}
        <FFmpegCommandDisplay command={generatedCommand} />
      </div>
    </MainLayout>
  );
};

export default AubioAnalysis;
