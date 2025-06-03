import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud } from "lucide-react";

interface FileUploaderProps {
    onFileSelect: (files: File[]) => void;
}

const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFiles = Array.from(event.target.files);
      setFiles(selectedFiles);
      console.log("Selected files:", selectedFiles);
      onFileSelect(selectedFiles);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files) {
      const droppedFiles = Array.from(event.dataTransfer.files);
      setFiles(droppedFiles);
      console.log("Dropped files:", droppedFiles);
      onFileSelect(droppedFiles);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Media Files</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-md cursor-pointer hover:border-primary transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="mb-2 text-sm text-muted-foreground">
            Drag 'n' drop files here, or click to select files
          </p>
          <Label htmlFor="file-upload" className="cursor-pointer">
            <div className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              Select Files
            </div>
            <Input
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </Label>
        </div>
        {files.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Selected Files:</h3>
            <ul>
              {files.map((file, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {file.name} ({file.type})
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUploader;