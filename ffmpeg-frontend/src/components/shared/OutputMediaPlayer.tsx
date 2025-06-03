import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import React from "react"; // Import React for SyntheticEvent

interface OutputMediaPlayerProps {
  outputFile: string | null;
  mediaError: boolean;
  setMediaError: (error: boolean) => void; // Function to update mediaError state
}

const BACKEND_URL = "http://localhost:8200";

const OutputMediaPlayer = ({ outputFile, mediaError, setMediaError }: OutputMediaPlayerProps) => {

  // Function to determine if the output file is audio based on extension
  const isAudioFile = (filename: string | null) => {
    if (!filename) return false;
    // Added more common browser-supported audio formats
    const audioExtensions = ["mp3", "wav", "aac", "ogg", "opus"];
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext ? audioExtensions.includes(ext) : false;
  };

  // Function to determine if the output file is video based on extension
  const isVideoFile = (filename: string | null) => {
      if (!filename) return false;
      // Added common browser-supported video formats
      const videoExtensions = ["mp4", "webm", "ogg"];
      const ext = filename.split('.').pop()?.toLowerCase();
      return ext ? videoExtensions.includes(ext) : false;
  }


  const outputFileURL = outputFile ? `${BACKEND_URL}/files/${outputFile}` : null;

  const handleMediaError = (event: React.SyntheticEvent<HTMLVideoElement | HTMLAudioElement, Event>) => {
    console.error("Media playback error:", event);
    // Set error state to true
    setMediaError(true);
    toast.error("Playback failed. The browser may not support this media format.");
  };

  // Don't render the card at all if no output file is available
  if (!outputFile) {
    return null;
  }

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle>Output File</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">File: {outputFile}</p>

        {/* Conditionally render the media player or the error message */}
        {mediaError ? (
          <p className="text-sm text-red-600">
            Playback failed. The browser may not support this media format. Please try opening the file directly or convert it to a browser-friendly format like MP4 (H.264/AAC).
          </p>
        ) : (
          // Check if it's a known video or audio type before attempting playback
          isVideoFile(outputFile) ? (
            <video key={outputFileURL} controls autoPlay className="w-full max-h-[500px] rounded-md" onError={handleMediaError}>
              <source src={outputFileURL} type={`video/${outputFile.split('.').pop()}`} />
              Your browser does not support the video tag.
            </video>
          ) : isAudioFile(outputFile) ? (
             <audio key={outputFileURL} controls autoPlay className="w-full" onError={handleMediaError}>
               <source src={outputFileURL} type={`audio/${outputFile.split('.').pop()}`} />
               Your browser does not support the audio element.
             </audio>
          ) : (
              // If not a known browser-friendly type, show a message
              <p className="text-sm text-yellow-600">
                  This file format ({outputFile.split('.').pop()?.toUpperCase()}) may not be playable directly in the browser. Please open the file using the button below.
              </p>
          )
        )}

        {/* Always show the download/open button when outputFile exists */}
        <a href={outputFileURL} target="_blank" rel="noopener noreferrer">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Open {outputFile}
          </Button>
        </a>
        <p className="text-sm text-yellow-600">
          Note: The media player requires your backend to serve the output file statically from `{BACKEND_URL}/files/`.
        </p>
      </CardContent>
    </Card>
  );
};

export default OutputMediaPlayer;