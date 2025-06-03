import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface FFmpegCommandDisplayProps {
  command: string | undefined; // Allow undefined for extra safety
}

const FFmpegCommandDisplay = ({ command }: FFmpegCommandDisplayProps) => {
  const copyToClipboard = () => {
    // Check if command is a non-empty string before copying
    if (typeof command === 'string' && command && command !== "FFmpeg command will appear here..." && !command.startsWith("Error:")) {
      navigator.clipboard.writeText(command).then(() => {
        toast.success("FFmpeg command copied to clipboard!");
      }).catch(err => {
        console.error("Failed to copy command: ", err);
        toast.error("Failed to copy command.");
      });
    } else {
       toast("No valid command to copy.");
    }
  };

  // Provide a fallback string if command is undefined, null, or empty
  const displayCommand = command === undefined ? "Error: Command state is undefined" : command || "FFmpeg command will appear here...";

  return (
    <Card className="w-full mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>FFmpeg Command</CardTitle>
        <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            // Disable button if command is undefined, empty, placeholder, or an error message
            disabled={!command || command === "FFmpeg command will appear here..." || command.startsWith("Error:")}
            aria-label="Copy FFmpeg command"
        >
            <Copy className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Textarea
          readOnly
          value={displayCommand} // Use the displayCommand variable
          className="font-mono text-xs"
          rows={5}
        />
      </CardContent>
    </Card>
  );
};

export default FFmpegCommandDisplay;