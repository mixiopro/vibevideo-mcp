// server.js (Node.js/Express, full code, complete route mapping)

import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";

// Import your MCP generator functions and data here.
import availableFiltersData from "./src/data/ffmpegFilters.json" assert { type: "json" };
import availableAudioFiltersData from "./src/data/audioFilters.json" assert { type: "json" };
import toolDescriptions from "./src/data/toolDescriptions.json" assert { type: "json" };

import { generateTrimCommand, generateJoinCommandExample } from "./src/mcp/MediaClipJoin.js";
import { generateFrameRateCommand } from "./src/mcp/frameRateChanger.js";
import { generateGifWebpCommand } from "./src/mcp/GifWebpCreator.js";
import { generateCodeSnippet } from "./src/mcp/ApiIntegrationGuide.js";
import { generateAudioEnhancementCommand } from "./src/mcp/audioEnhancer.js";
import { generateAudioVisualizationCommand } from "./src/mcp/audioVisualizer.js";
import { generateBatchFFmpegCommands } from "./src/mcp/batchProcessor.js";
import { generateBitstreamExtractCommand } from "./src/mcp/bitstreamExtractor.js";
import { generateCaptureCommand } from "./src/mcp/captureManager.js";
import { generateChannelMixCommand } from "./src/mcp/channelMixer.js";
import { generateFilterLabCommand } from "./src/mcp/filterLab.js";
import { generateLiveStreamCommand } from "./src/mcp/LiveStreamManager.js";
import { generateFFprobeCommand } from "./src/mcp/MediaAnalyzer.js";
import { generateConvertCommand } from "./src/mcp/MediaConverter.js";
import { generateMetadataCommand } from "./src/mcp/metadataEditor.js";
import { generateMotionInterpolationCommand } from "./src/mcp/motionInterpolator.js";
import { generateNoiseReductionCommand } from "./src/mcp/noiseReducer.js";
import { generateSceneDetectCommand } from "./src/mcp/sceneDetector.js";
import { generateSegmentHlsCommand } from "./src/mcp/segmenter.js";
import { generateSpeedChangeCommand } from "./src/mcp/speedChanger.js";
import { generateStreamExtractionCommand } from "./src/mcp/streamExtractor.js";
import { generateSubtitlesCommand } from "./src/mcp/subtitlesManager.js";
import { generateThumbnailCommand } from "./src/mcp/thumbnailGenerator.js";
import { generateVideoResizerCommand } from "./src/mcp/videoResizer.js";
import { generateVideoStabilizerCommand } from "./src/mcp/VideoStabilizer.js";
import { generateWatermarkRemoverCommand } from "./src/mcp/watermarkRemover.js";

const app = express();
const PORT = process.env.PORT || 8300;
const PY_BACKEND = "http://127.0.0.1:8200/run";

app.use(cors());
app.use(express.json({ limit: "50mb" }));
const upload = multer({ dest: "./uploads" });
app.use("/files", express.static(path.join(process.cwd(), "outputs")));

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// ---- FILE UPLOAD ----
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({ filename: req.file.filename, originalname: req.file.originalname });
});

// Proxy utility
async function proxyToPython({ command, inputFile = undefined, operation = undefined, ...extra }, res) {
  const payload = {};
  if (operation) payload.operation = operation;
  if (command) payload.command = command;
  if (inputFile) payload.inputFile = inputFile;
  Object.assign(payload, extra);

  try {
    const pyResp = await fetch(PY_BACKEND, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await pyResp.json();
    if (!pyResp.ok) {
      return res.status(500).json({ error: data.error || "Python backend error" });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || "Python backend unreachable" });
  }
}

// Minimal registry for meta endpoints (can move to its own JSON if desired)
const TOOL_REGISTRY = [
  "generateTrimCommand",
  "generateFrameRateCommand",
  "generateGifWebpCommand",
  "generateCodeSnippet",
  "generateAudioEnhancementCommand",
  "generateAudioVisualizationCommand",
  "generateBatchFFmpegCommands",
  "generateBitstreamExtractCommand",
  "generateCaptureCommand",
  "generateChannelMixCommand",
  "generateFilterLabCommand",
  "generateLiveStreamCommand",
  "generateFFprobeCommand",
  "generateConvertCommand",
  "generateMetadataCommand",
  "generateMotionInterpolationCommand",
  "generateNoiseReductionCommand",
  "generateSceneDetectCommand",
  "generateSegmentHlsCommand",
  "generateSpeedChangeCommand",
  "generateStreamExtractionCommand",
  "generateSubtitlesCommand",
  "generateThumbnailCommand",
  "generateVideoResizerCommand",
  "generateVideoStabilizerCommand",
  "generateWatermarkRemoverCommand",
  "generateJoinCommandExample"
];


// === ROUTES ===

// --- 1. List all tools ---
app.get("/api/list-tools", (req, res) => {
  res.json({ tools: TOOL_REGISTRY });
});

// --- 2. Describe a single tool ---
app.get("/api/describe-tool/:toolName", (req, res) => {
  const toolName = req.params.toolName;

  // Find the description in toolDescriptions (assumes array of objects with .name)
  const desc = toolDescriptions.find(t => t.name === toolName);

  if (!desc) {
    return res.status(404).json({ error: "Tool not found" });
  }

  // Return the full description for this tool
  res.json(desc);
});


// --- 3. List filters for a tool (paged) ---
app.get("/api/list-filters/:toolName", (req, res) => {
  const { toolName } = req.params;
  const page = parseInt(req.query.page || "1");
  const pageSize = parseInt(req.query.pageSize || "25");

  let filters = [];
  if (toolName === "generateFilterLabCommand") {
    filters = availableFiltersData;
  } else if (toolName === "generateAudioEnhancementCommand") {
    filters = availableAudioFiltersData;
  } else {
    return res.json({ filters: [], page, total: 0 });
  }

  // Basic paging
  const total = filters.length;
  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);

  res.json({
    filters: filters.slice(startIdx, endIdx),
    page,
    pageSize,
    total
  });
});

// --- 4. Search filters for a tool ---
app.get("/api/search-filters/:toolName", (req, res) => {
  const { toolName } = req.params;
  const query = (req.query.query || "").toLowerCase();
  let filters = [];
  if (toolName === "generateFilterLabCommand") {
    filters = availableFiltersData;
  } else if (toolName === "generateAudioEnhancementCommand") {
    filters = availableAudioFiltersData;
  } else {
    return res.json({ filters: [] });
  }
  // Naive search on filter name + description
  const results = filters.filter(f =>
    (f.name && f.name.toLowerCase().includes(query)) ||
    (f.description && f.description.toLowerCase().includes(query))
  );
  res.json({ filters: results.slice(0, 50), total: results.length });
});

app.post("/api/generate-trim-command", (req, res) => {
  const { inputFilename, start, end } = req.body;
  const command = generateTrimCommand(inputFilename, start, end);
  if (!command) return res.status(400).json({ error: "Invalid parameters or command." });
  proxyToPython({ command, inputFile: inputFilename }, res);
});

app.post("/api/generate-framerate-command", (req, res) => {
  const { inputFilename, frameRate } = req.body;
  const command = generateFrameRateCommand(inputFilename, frameRate);
  if (!command) return res.status(400).json({ error: "Invalid parameters or command." });
  proxyToPython({ command, inputFile: inputFilename }, res);
});

app.post("/api/generate-gifwebp-command", (req, res) => {
  const { inputFilename, startTime, duration, format, scaleHeight, fps } = req.body;
  const command = generateGifWebpCommand(inputFilename, startTime, duration, format, scaleHeight, fps);
  if (!command) return res.status(400).json({ error: "Invalid parameters or command." });
  proxyToPython({ command, inputFile: inputFilename, operation: "gif_palette" }, res);
});

app.post("/api/generate-code-snippet", (req, res) => {
  const { command, language } = req.body;
  if (!command || !language) {
    return res.status(400).json({ error: "Missing command or language" });
  }
  try {
    const snippet = generateCodeSnippet(command, language);
    res.json({ snippet });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to generate code snippet" });
  }
});

app.post("/api/generate-audio-enhancement-command", (req, res) => {
  const { inputFilename, selectedFilters, parameterValues, availableFiltersData } = req.body;
  const command = generateAudioEnhancementCommand(inputFilename, selectedFilters, parameterValues, availableFiltersData);
  if (!command) return res.status(400).json({ error: "Invalid parameters or command." });
  proxyToPython({ command, inputFile: inputFilename }, res);
});

app.post("/api/generate-audio-visualization-command", (req, res) => {
  const { inputFilename, type, size, mode } = req.body;
  const command = generateAudioVisualizationCommand(inputFilename, type, size, mode);
  if (!command) return res.status(400).json({ error: "Invalid parameters or command." });
  proxyToPython({ command, inputFile: inputFilename }, res);
});

app.post("/api/generate-batch-ffmpeg-commands", (req, res) => {
  const { filenames, operation } = req.body;
  const commands = generateBatchFFmpegCommands(filenames, operation);
  if (!commands || !Array.isArray(commands) || !commands.length) return res.status(400).json({ error: "Invalid parameters or command." });
  proxyToPython({ operation, command: commands }, res);
});

app.post("/api/generate-bitstream-extract-command", (req, res) => {
  const { inputFilename, streamType } = req.body;
  const command = generateBitstreamExtractCommand(inputFilename, streamType);
  if (!command) return res.status(400).json({ error: "Invalid parameters or command." });
  proxyToPython({ command, inputFile: inputFilename }, res);
});

app.post("/api/generate-capture-command", (req, res) => {
  const { deviceValue, resolution, framerate } = req.body;
  const command = generateCaptureCommand(deviceValue, resolution, framerate);
  if (!command) return res.status(400).json({ error: "Invalid parameters or command." });
  proxyToPython({ command }, res);
});

app.post("/api/generate-channel-mix-command", (req, res) => {
  const { inputFilename, channels } = req.body;
  const command = generateChannelMixCommand(inputFilename, channels);
  if (!command) return res.status(400).json({ error: "Invalid parameters or command." });
  proxyToPython({ command, inputFile: inputFilename }, res);
});

app.post("/api/generate-filterlab-command", (req, res) => {
  const { inputFilename, filters, parameterValues } = req.body;
  const command = generateFilterLabCommand(inputFilename, filters, parameterValues, availableFiltersData);
  if (!command) return res.status(400).json({ error: "Invalid parameters or command." });
  proxyToPython({ command, inputFile: inputFilename }, res);
});

app.post("/api/generate-livestream-command", (req, res) => {
  const { inputFilename, rtmpUrl } = req.body;
  const command = generateLiveStreamCommand(inputFilename, rtmpUrl);
  if (!command) return res.status(400).json({ error: "Invalid parameters or command." });
  proxyToPython({ command, inputFile: inputFilename }, res);
});

app.post("/api/generate-ffprobe-command", (req, res) => {
  const { inputFilename } = req.body;
  const command = generateFFprobeCommand(inputFilename);
  if (!command) return res.status(400).json({ error: "Invalid parameters or command." });
  proxyToPython({ command, inputFile: inputFilename, operation: "analyze" }, res);
});

app.post("/api/generate-convert-command", (req, res) => {
  const { inputFilename, format, codec } = req.body;
  const command = generateConvertCommand(inputFilename, format, codec);
  if (!command) return res.status(400).json({ error: "Invalid parameters or command." });
  proxyToPython({ command, inputFile: inputFilename }, res);
});

app.post("/api/generate-metadata-command", (req, res) => {
  const { inputFilename, metadata } = req.body;
  const command = generateMetadataCommand(inputFilename, metadata);
  if (!command) return res.status(400).json({ error: "Invalid parameters or command." });
  proxyToPython({ command, inputFile: inputFilename }, res);
});

app.post("/api/generate-motion-interpolation-command", (req, res) => {
  const { inputFilename, fps, mode } = req.body;
  const command = generateMotionInterpolationCommand(inputFilename, fps, mode);
  if (!command) return res.status(400).json({ error: "Invalid parameters or command." });
  proxyToPython({ command, inputFile: inputFilename }, res);
});

app.post("/api/generate-noise-reduction-command", (req, res) => {
  const { inputFilename, filterType, strength } = req.body;
  const command = generateNoiseReductionCommand(inputFilename, filterType, strength);
  if (!command) return res.status(400).json({ error: "Invalid parameters or command." });
  proxyToPython({ command, inputFile: inputFilename }, res);
});

app.post("/api/generate-scene-detect-command", (req, res) => {
  const { inputFilename, sensitivity } = req.body;
  const command = generateSceneDetectCommand(inputFilename, sensitivity);
  if (!command) return res.status(400).json({ error: "Invalid parameters or command." });
  proxyToPython({ command, inputFile: inputFilename }, res);
});

app.post("/api/generate-segment-hls-command", (req, res) => {
  const { inputFilename, segmentDuration } = req.body;
  const command = generateSegmentHlsCommand(inputFilename, segmentDuration);
  if (!command) return res.status(400).json({ error: "Invalid parameters or command." });
  proxyToPython({ command, inputFile: inputFilename }, res);
});

app.post("/api/generate-speed-change-command", (req, res) => {
  const { inputFilename, speed } = req.body;
  const command = generateSpeedChangeCommand(inputFilename, speed);
  if (!command) return res.status(400).json({ error: "Invalid parameters or command." });
  proxyToPython({ command, inputFile: inputFilename }, res);
});

app.post("/api/generate-stream-extraction-command", (req, res) => {
  const { inputFilename, extractionType, outputFormat } = req.body;
  const command = generateStreamExtractionCommand(inputFilename, extractionType, outputFormat);
  if (!command) return res.status(400).json({ error: "Invalid parameters or command." });
  proxyToPython({ command, inputFile: inputFilename }, res);
});

app.post("/api/generate-subtitles-command", (req, res) => {
  const { inputFilename, subtitleFilename, actionType } = req.body;
  const command = generateSubtitlesCommand(inputFilename, subtitleFilename, actionType);
  if (!command) return res.status(400).json({ error: "Invalid parameters or command." });
  proxyToPython({ command, inputFile: inputFilename }, res);
});

app.post("/api/generate-thumbnail-command", (req, res) => {
  const { inputFilename, tab, timestamp, cols, rows, multipleSheets, interval, duration } = req.body;
  const command = generateThumbnailCommand(inputFilename, tab, timestamp, cols, rows, multipleSheets, interval, duration);
  if (!command) return res.status(400).json({ error: "Invalid parameters or command." });
  proxyToPython({ command, inputFile: inputFilename }, res);
});

app.post("/api/generate-video-resizer-command", (req, res) => {
  const { inputFilename, resolution, customWidth, customHeight } = req.body;
  const command = generateVideoResizerCommand(inputFilename, resolution, customWidth, customHeight);
  if (!command) return res.status(400).json({ error: "Invalid parameters or command." });
  proxyToPython({ command, inputFile: inputFilename }, res);
});

app.post("/api/generate-video-stabilizer-command", (req, res) => {
  const { inputFilename, strength } = req.body;
  const command = generateVideoStabilizerCommand(inputFilename, strength);
  if (!command) return res.status(400).json({ error: "Invalid parameters or command." });
  proxyToPython({ command, inputFile: inputFilename, operation: "stabilize" }, res);
});

app.post("/api/generate-watermark-remover-command", (req, res) => {
  const { inputFilename, x, y, width, height, filterType } = req.body;
  const command = generateWatermarkRemoverCommand(inputFilename, x, y, width, height, filterType);
  if (!command) return res.status(400).json({ error: "Invalid parameters or command." });
  proxyToPython({ command, inputFile: inputFilename }, res);
});

app.get("/api/generate-join-command-example", (_req, res) => {
  const command = generateJoinCommandExample();
  if (!command) return res.status(400).json({ error: "Could not generate join command example." });
  res.json({ command });
});

// ---- 404 Fallback ----
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`Node backend server listening on port ${PORT}`);
});


