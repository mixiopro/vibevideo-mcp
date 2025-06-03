import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function TimelineEditor({ timeline, setTimeline }) {
  const [editorValue, setEditorValue] = useState(
    timeline
      ? JSON.stringify(timeline, null, 2)
      : JSON.stringify(getEmptyTimeline(), null, 2)
  );
  const [error, setError] = useState<string | null>(null);

  function getEmptyTimeline() {
    return {
      "OTIO_SCHEMA": "Timeline.1",
      "name": "Untitled Timeline",
      "tracks": []
    };
  }

  // Load editor changes to state
  const handleEditorChange = (e) => {
    setEditorValue(e.target.value);
    setError(null);
  };

  // Save JSON to parent
  const handleApply = () => {
    try {
      const json = JSON.parse(editorValue);
      setTimeline(json);
      setError(null);
    } catch (e) {
      setError("Invalid JSON");
    }
  };

  // Optionally: "Add video track" / "Add clip" helper buttons
  const handleAddTrack = () => {
    try {
      const t = timeline || getEmptyTimeline();
      t.tracks = t.tracks || [];
      t.tracks.push({
        "OTIO_SCHEMA": "Track.1",
        "name": `Track ${t.tracks.length + 1}`,
        "kind": "Video",
        "children": []
      });
      setEditorValue(JSON.stringify(t, null, 2));
      setTimeline(t);
    } catch (e) {
      setError("Could not add track.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline (OTIO JSON Editor)</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          rows={18}
          value={editorValue}
          onChange={handleEditorChange}
          className="w-full font-mono text-xs"
        />
        {error && <div className="text-red-500 mt-2">{error}</div>}
        <div className="flex gap-2 mt-4">
          <Button variant="default" onClick={handleApply}>
            Apply JSON
          </Button>
          <Button variant="secondary" onClick={handleAddTrack}>
            Add Track
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
