// pages/SpleeterStems.tsx
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import FileUploader from "@/components/shared/FileUploader";
import FFmpegCommandDisplay from "@/components/shared/FFmpegCommandDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import OutputMediaPlayer from "@/components/shared/OutputMediaPlayer";
import { toast } from "sonner";

const stemOptions = [
  { label: "2 Stems (Vocals/Accompaniment)", value: "spleeter:2stems" },
  { label: "4 Stems (Vocals/Drums/Bass/Other)", value: "spleeter:4stems" },
  { label: "5 Stems (Vocals/Drums/Bass/Piano/Other)", value: "spleeter:5stems" },
];

const SpleeterStems = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedStems, setSelectedStems] = useState<string>("");
  const [generatedCommand, setGeneratedCommand] = useState<string>("");
  const [outputFile, setOutputFile] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (files: File[]) => setSelectedFile(files[0] || null);

  const handleStemChange = (val: string) => {
    setSelectedStems(val);
    if (selectedFile && val) {
      setGeneratedCommand(`spleeter separate -i "${selectedFile.name}" -p ${val} -o output/`);
    } else {
      setGeneratedCommand("");
    }
  };

  const handleRun = async () => {
    if (!selectedFile || !selectedStems) {
      toast.warning("Select file and stem type");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setOutputFile("output/vocals.wav"); // Demo, adjust for your output
      toast.success("Stems separated!");
    }, 2000);
  };

  return (
    <MainLayout>
      <div className="space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Spleeter Audio Stems</h2>
        <p className="text-muted-foreground">Separate vocals and instruments from music using AI.</p>
        <FileUploader onFileSelect={handleFileSelect} />
        {selectedFile && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Choose Stem Count</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <select
                className="w-full border rounded p-2"
                value={selectedStems}
                onChange={e => handleStemChange(e.target.value)}
                disabled={isProcessing}
              >
                <option value="">Select Stem Type</option>
                {stemOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Button onClick={handleRun} disabled={!selectedStems || isProcessing}>
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

export default SpleeterStems;
