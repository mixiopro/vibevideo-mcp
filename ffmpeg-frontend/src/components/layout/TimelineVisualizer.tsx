import { useState } from "react";
import { Rnd } from "react-rnd";
import { Plus, Trash2 } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import FileUploader from "@/components/shared/FileUploader";
import { Button } from "@/components/ui/button";
import { useFFmpegProcessor } from "@/hooks/useFFmpegProcessor";


export default function TimelineVisualEditor({ timeline, setTimeline }) {
  const [selectedClip, setSelectedClip] = useState(null);
  const [addClipTrackIdx, setAddClipTrackIdx] = useState(null);
  const [showFileDialog, setShowFileDialog] = useState(false);
  const { uploadSingleFile, runCommand } = useFFmpegProcessor();
    const [zoom, setZoom] = useState(1); // 1 = 100%

const PIXELS_PER_SECOND_BASE = 40;
const PIXELS_PER_SECOND = PIXELS_PER_SECOND_BASE * zoom;
const TRACK_HEIGHT = 48;

  // Add Clip Handler (opens file dialog)
  const handleAddClipIcon = (trackIdx) => {
    setAddClipTrackIdx(trackIdx);
    setShowFileDialog(true);
  };

  // File select/upload/probe/thumbnail
const handleFileSelected = async (fileOrFiles: File | File[]) => {
  const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles;
  if (!file) return;

  const uploadedFile = await uploadSingleFile(file);
  if (!uploadedFile) return;

  // Probe for duration
  let duration = 5;
  const probePayload = {
    command: `ffprobe -v error -select_streams v:0 -show_entries stream=duration -of default=noprint_wrappers=1:nokey=1 "${uploadedFile}"`,
    inputFile: uploadedFile,
  };
  const probeResult = await runCommand(probePayload) as { output?: string };

  if (
    probeResult &&
    typeof probeResult === "object" &&
    typeof probeResult.output === "string"
  ) {
    const lines = probeResult.output.trim().split('\n');
    for (const l of lines) {
      const parsed = parseFloat(l);
      if (!isNaN(parsed)) {
        duration = parsed;
        break;
      }
    }
  }

  // Generate thumbnail
  const ext = uploadedFile.split('.').pop();
  const thumbName = uploadedFile.replace(`.${ext}`, `_thumb.jpg`);
  await runCommand({
    command: `ffmpeg -y -i "${uploadedFile}" -frames:v 1 -q:v 2 "${thumbName}"`,
    inputFile: uploadedFile,
  });
  
  const waveformName = uploadedFile.replace(`.${ext}`, `_waveform.png`);
await runCommand({
  command: `ffmpeg -y -i "${uploadedFile}" -filter_complex "aformat=channel_layouts=mono,showwavespic=s=600x80:colors=0080FF" -frames:v 1 "${waveformName}"`,
  inputFile: uploadedFile,
});

  // Add new clip to timeline
const newClip = {
  id: (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`),
  OTIO_SCHEMA: "Clip.1",
  name: file.name,
  source: uploadedFile,
  start: 0,
  duration,
  thumbnail: `http://localhost:8200/files/${thumbName}`,
};

 setTimeline((oldTimeline: any) => {
    const track = oldTimeline.tracks[addClipTrackIdx];
    const lastClip = track.children.length > 0 ? track.children[track.children.length - 1] : null;
    const newStart = lastClip ? (lastClip.start + lastClip.duration) : 0;

    const newClip = {
      id: (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`),
      OTIO_SCHEMA: "Clip.1",
      name: file.name,
      source: uploadedFile,
      start: newStart,
      duration,
      thumbnail: `http://localhost:8200/files/${thumbName}`,
      waveform: `http://localhost:8200/files/${waveformName}`,
    };

    const tracks = oldTimeline.tracks.map((track: any, idx: number) =>
      idx === addClipTrackIdx
        ? { ...track, children: [...track.children, newClip] }
        : track
    );
    console.log("CLIPS AFTER ADD", tracks[addClipTrackIdx].children);
    return { ...oldTimeline, tracks };
  });

  setShowFileDialog(false);
  setAddClipTrackIdx(null);
};


const handleClipMove = (trackIdx, clipIdx, newStart) => {
  setTimeline((oldTimeline) => {
    const tracks = oldTimeline.tracks.map((track, tIdx) => {
      if (tIdx !== trackIdx) return track;
      return {
        ...track,
        children: track.children.map((clip, cIdx) =>
          cIdx === clipIdx ? { ...clip, start: newStart } : clip
        ),
      };
    });
    return { ...oldTimeline, tracks };
  });
};

const handleClipResize = (trackIdx, clipIdx, newDuration) => {
  setTimeline((oldTimeline) => {
    const tracks = oldTimeline.tracks.map((track, tIdx) => {
      if (tIdx !== trackIdx) return track;
      return {
        ...track,
        children: track.children.map((clip, cIdx) =>
          cIdx === clipIdx ? { ...clip, duration: Math.max(0.5, newDuration) } : clip
        ),
      };
    });
    return { ...oldTimeline, tracks };
  });
};

  // Move a clip to a different track
  const moveClip = (sourceTrackIdx, sourceClipIdx, destTrackIdx, destClipIdx = 0) => {
    if (sourceTrackIdx === destTrackIdx && sourceClipIdx === destClipIdx) return;
    const t = JSON.parse(JSON.stringify(timeline));
    const [clip] = t.tracks[sourceTrackIdx].children.splice(sourceClipIdx, 1);
    t.tracks[destTrackIdx].children.splice(destClipIdx, 0, clip);
    setTimeline(t);
  };

  // Move track position
  const moveTrack = (sourceIdx, destIdx) => {
    if (sourceIdx === destIdx) return;
    const t = JSON.parse(JSON.stringify(timeline));
    const [track] = t.tracks.splice(sourceIdx, 1);
    t.tracks.splice(destIdx, 0, track);
    setTimeline(t);
  };

  // Drag and drop handler
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination, type } = result;

    // Handle track move
    if (type === "track") {
      moveTrack(source.index, destination.index);
    }
    // Handle clip move (including cross-track)
    if (type === "clip") {
      moveClip(
        parseInt(source.droppableId),
        source.index,
        parseInt(destination.droppableId),
        destination.index
      );
    }
  };

  // Ruler max length
  const maxEnd = Math.max(
    ...timeline.tracks.flatMap((track) =>
      track.children.map((clip) => clip.start + clip.duration)
    ),
    20
  );

function getRulerStep(maxEnd, zoom) {
  // Strongly prioritize zoom
  if (zoom < 0.3) return 10; // show every 1min at extreme zoom out
  if (zoom < 0.5) return 5;
  if (zoom < 0.8) return 3;
  if (zoom < 1) return 1;

  // If zoom is high, base on total duration
  if (maxEnd > 18000) return 50;     // Over 5 hours, every 50s
  if (maxEnd > 1200) return 25;      // Over 20 min, every 25s
  if (maxEnd > 600) return 10;       // Over 10 min, every 10s
  if (maxEnd > 240) return 5;        // Over 4 min, every 5s
  if (maxEnd > 60) return 2;         // Over 1 min, every 2s

  return 1; // default, every second
}

const step = getRulerStep(maxEnd, zoom);


  return (
    <div className="rounded-lg border p-4 bg-white shadow mb-8">
      <div className="font-bold text-lg mb-2">Visual Timeline Editor</div>
      {/* Time Ruler */}
      <div className="flex items-center gap-2 mb-2">
        <span className="font-bold text-lg">Visual Timeline Editor</span>
        <Button onClick={() => setZoom((z) => Math.min(z + 0.05, 5))}>+</Button>
        <Button onClick={() => setZoom((z) => Math.max(z - 0.05, 0.05))}>-</Button>
        <span className="text-xs">Zoom: {Math.round(zoom * 100)}%</span>
        </div>
        <div className="overflow-x-auto" style={{ width: "100%" }}>
  <div style={{ width: `${maxEnd * PIXELS_PER_SECOND + 200}px` }}>


<div className="relative h-8 ml-24 border-b">
  {Array.from({ length: Math.ceil(maxEnd / step) + 1 }).map((_, i) => (
    <span
      key={i}
      className="absolute"
      style={{
        left: `${i * step * PIXELS_PER_SECOND}px`,
        fontSize: "0.7rem",
        color: "#888",
        minWidth: 24,
        textAlign: "center",
      }}
    >
      {i * step}s
    </span>
  ))}
</div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="all-tracks" type="track">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {timeline.tracks.map((track, tIdx) => (
                <Draggable
                  draggableId={`track-${tIdx}`}
                  index={tIdx}
                  key={tIdx}
                >
                  {(provided) => (
                    <div
                      className="flex items-center h-12 border-b last:border-0"
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      <div className="w-24 flex items-center gap-1" {...provided.dragHandleProps}>
                        <span className="font-mono text-xs text-gray-700">{track.name}</span>
                        <button
                          className="p-1 hover:bg-blue-100 rounded"
                          onClick={() => handleAddClipIcon(tIdx)}
                          title="Add Clip"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          className="p-1 hover:bg-red-100 rounded"
                          onClick={() => deleteTrack(tIdx)}
                          title="Delete Track"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <Droppable droppableId={String(tIdx)} direction="horizontal" type="clip">
                        {(dropProvided) => (
                          <div
                            className="relative flex-1 h-full"
                            ref={dropProvided.innerRef}
                            {...dropProvided.droppableProps}
                          >
                            {track.children.map((clip, cIdx) => (
                              <Draggable
                                key={clip.id}
                                draggableId={clip.id}
                                index={cIdx}
                              >
                                {(dragProvided) => (
                                  <div
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    style={{
                                      display: "inline-block",
                                      position: "absolute",
                                      left: clip.start * PIXELS_PER_SECOND,
                                      top: 4,
                                      width: clip.duration * PIXELS_PER_SECOND,
                                      height: TRACK_HEIGHT - 8,
                                      zIndex: selectedClip === `${tIdx}_${cIdx}` ? 2 : 1,
                                      ...dragProvided.draggableProps.style,
                                    }}
                                    onClick={() => setSelectedClip(`${tIdx}_${cIdx}`)}
                                  >
                                    <Rnd
  size={{
    width: clip.duration * PIXELS_PER_SECOND,
    height: TRACK_HEIGHT - 8,
  }}
  position={{
    x: 0,
    y: 0,
  }}
  minWidth={PIXELS_PER_SECOND * 0.5}
  maxHeight={TRACK_HEIGHT - 8}
  bounds="parent"
  enableResizing={{ right: true, left: true }}
  dragAxis="x"
  onDragStop={(e, d) => {
    const newStart = Math.max(0, Math.round(d.x / PIXELS_PER_SECOND));
    handleClipMove(tIdx, cIdx, newStart);
  }}
  onResizeStop={(e, direction, ref, delta, position) => {
    const newDuration = ref.offsetWidth / PIXELS_PER_SECOND;
    handleClipResize(tIdx, cIdx, newDuration);
  }}
  style={{
    border: selectedClip === `${tIdx}_${cIdx}` ? "2px solid #2563eb" : "1.5px solid #666",
    borderRadius: 8,
    background: "#e0ecff",
    cursor: "pointer",
    boxShadow: selectedClip === `${tIdx}_${cIdx}` ? "0 0 6px #2563eb55" : undefined,
    display: "flex",
    alignItems: "center",
    padding: 0,
    overflow: "visible"
  }}
>
  <div className="flex items-center h-full w-full relative px-2">
    {/* Thumbnail on the left */}
    {clip.thumbnail ? (
      <img
        src={clip.thumbnail}
        className="w-14 h-10 object-cover rounded mr-3"
        alt={clip.name}
        style={{ boxShadow: "0 2px 8px #0002" }}
      />
    ) : (
      <div className="w-14 h-10 bg-gray-200 rounded mr-3 flex items-center justify-center">
        🎬
      </div>
    )}
    {/* Text to the right */}
    <div className="flex flex-col justify-center flex-1 min-w-0">
      <div className="font-bold text-base truncate">{clip.name}</div>
      <div className="text-[10px] text-gray-600 truncate">
        {clip.start}s / {clip.duration.toFixed(2)}s
      </div>
    </div>
    {/* Delete Button top-right */}
    <button
      className="absolute top-1 right-1 p-1 rounded hover:bg-red-100 transition"
      title="Delete Clip"
      onClick={e => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this clip?")) {
          setTimeline(oldTimeline => {
            const tracks = oldTimeline.tracks.map((track, tIdx2) => {
              if (tIdx2 !== tIdx) return track;
              return {
                ...track,
children: track.children.filter((clipObj) => clipObj.id !== clip.id),
              };
            });
            return { ...oldTimeline, tracks };
          });
        }
      }}
    >
      <Trash2 size={16} className="text-red-500" />
    </button>
  </div>
</Rnd>

                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {dropProvided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      </div></div>

      {/* Show file dialog modal when adding clip */}
      {showFileDialog && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded shadow-lg p-8 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
              onClick={() => setShowFileDialog(false)}
            >
              ×
            </button>
            <div className="font-bold mb-2">Select a Clip to Add</div>
            <FileUploader onFileSelect={handleFileSelected} />
          </div>
        </div>
      )}
    </div>
  );
}

