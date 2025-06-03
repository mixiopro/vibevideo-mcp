import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import FileUploader from "@/components/shared/FileUploader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import TimelineEditor from "@/components/layout/Timeline"; // (You'll build this)
import TimelineVisualizer from "@/components/layout/TimelineVisualizer"; // (You'll build this)
import axios from "axios";

 const EMPTY_TIMELINE = {
  OTIO_SCHEMA: "Timeline.1",
  name: "New Timeline",
  tracks: [
        {
      "OTIO_SCHEMA": "Track.1",
      "name": "Track 1",
      "kind": "Video",
      "children": []
    },
    {
      "OTIO_SCHEMA": "Track.1",
      "name": "Track 2",
      "kind": "Video",
      "children": []
    }
  ],
};

const TimelinePage = () => {
//   const [timeline, setTimeline] = useState(null); // Store OTIO JSON
  const [timeline, setTimeline] = useState(EMPTY_TIMELINE);

  const [uploadResult, setUploadResult] = useState(null);

  // Upload timeline to backend
  const handleUpload = async () => {
    const blob = new Blob([JSON.stringify(timeline)], { type: "application/json" });
    const formData = new FormData();
    formData.append("timeline", blob, "timeline.otio");
    const res = await axios.post("/api/upload-timeline", formData, { baseURL: "http://localhost:8200" });
    setUploadResult(res.data);
  };
 
  // Required handler for resizing
function handleClipResize(trackIdx, clipIdx, newDuration) {
  setTimeline((prev) => {
    const next = JSON.parse(JSON.stringify(prev));
    // Clip duration should never be below 1 second
    next.tracks[trackIdx].children[clipIdx].duration = Math.max(1, Math.round(newDuration));
    return next;
  });
}


  // Send render request
  const handleRender = async () => {
    if (!uploadResult?.timeline_path) return;
    const res = await axios.post(
      "/api/render",
      { timeline_path: uploadResult.timeline_path },
      { baseURL: "http://localhost:8200" }
    );
    window.open(`http://localhost:8200/files/${res.data.output.split("/").pop()}`);
  };

 
  return (
    <MainLayout>
      <div className="space-y-4 p-8">
        <Card>
          <CardHeader>
            <CardTitle>Multi-Timeline Editor</CardTitle>
          </CardHeader>
          <TimelineVisualizer timeline={timeline} setTimeline={setTimeline} />

          <CardContent>
            <TimelineEditor timeline={timeline} setTimeline={setTimeline} />
            <div className="flex gap-4 mt-4">
              <Button onClick={handleUpload}>Upload Timeline</Button>
              <Button onClick={handleRender} disabled={!uploadResult?.timeline_path}>Render</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default TimelinePage;
