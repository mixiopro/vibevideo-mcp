import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MediaConverter from "./pages/MediaConverter";
import StreamExtractor from "./pages/StreamExtractor";
import VideoResizer from "./pages/VideoResizer";
import MediaClipJoin from "./pages/MediaClipJoin";
import FilterLab from "./pages/FilterLab";
import FrameRateChanger from "./pages/FrameRateChanger";
import SubtitlesManager from "./pages/SubtitlesManager";
import GifWebpCreator from "./pages/GifWebpCreator";
import ChannelMixer from "./pages/ChannelMixer";
import LiveStreamManager from "./pages/LiveStreamManager";
import ThumbnailGenerator from "./pages/ThumbnailGenerator";
import AudioEnhancer from "./pages/AudioEnhancer";
import AubioAnalysis from "./pages/AubioAnalysis";
import CaptureManager from "./pages/CaptureManager";
import BatchProcessor from "./pages/BatchProcessor";
import MediaAnalyzer from "./pages/MediaAnalyzer";
import MetadataEditor from "./pages/MetadataEditor";
import Segmenter from "./pages/Segmenter";
import BitstreamExtractor from "./pages/BitstreamExtractor";
// import FilterGraphBuilder from "./pages/FilterGraphBuilder";
import ApiIntegrationGuide from "./pages/ApiIntegrationGuide";
import VideoStabilizer from "./pages/VideoStabilizer";
import SceneDetector from "./pages/SceneDetector";
import AudioVisualizer from "./pages/AudioVisualizer";
import WatermarkRemover from "./pages/WatermarkRemover";
import MotionInterpolator from "./pages/MotionInterpolator";
import NoiseReducer from "./pages/NoiseReducer";
import SpeedChanger from "./pages/SpeedChanger";
import TimelineEditor from "./pages/TimelineEditor";

import SoxAudioFilter from "./pages/SoxAudioFilter";
import SpleeterStems from "./pages/SpleeterStems";
import VaporSynthFilters from "./pages/VaporSynthFilters";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";


const queryClient = new QueryClient();

const PAGE_TITLES = {
  "/": "Dashboard",
  "/convert": "Media Converter",
  "/extract": "Stream Extractor",
  "/resize": "Video Resizer",
  "/clip-join": "Clip & Join",
  "/filter": "Filter Lab",
  "/framerate": "Frame Rate Changer",
  "/subtitles": "Subtitles Manager",
  "/gif-webp": "GIF/WebP Creator",
  "/channel-mixer": "Channel Mixer",
  "/live-stream": "Live Stream Manager",
  "/thumbnail": "Thumbnail Generator",
  "/audio-enhance": "Audio Enhancer",
  "/capture": "Capture Manager",
  "/batch": "Batch Processor",
  "/analyze": "Media Analyzer",
  "/metadata": "Metadata Editor",
  "/segmenter": "Segmenter",
  "/bitstream-extract": "Bitstream Extractor",
  "/api-guide": "API Integration Guide",
  "/stabilize": "Video Stabilizer",
  "/scene-detect": "Scene Detector",
  "/audio-visualizer": "Audio Visualizer",
  "/aubio-anlaysis": "Aubio Analysis",
  "/watermark-remover": "Watermark Remover",
  "/motion-interpolate": "Motion Interpolator",
  "/noise-reduce": "Noise Reducer",
  "/speed-changer": "Speed Changer",
  "/timeline-editor": "Timeline Editor",
  "/soxaudiofilter": "SoX Audio Filter",
  "/vapor-synth-launcher": "VapourSynth Filters",
  "/spleeter-stems": "Spleeter Stems",
  // ...add more as needed
};


const App = () => {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || "Vibe Video";

   return (
    <>
      <Helmet>
        <title>{title} | Vibe Video</title>
      </Helmet>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="/convert" element={<MediaConverter />} />
          <Route path="/extract" element={<StreamExtractor />} />
          <Route path="/resize" element={<VideoResizer />} />
          <Route path="/clip-join" element={<MediaClipJoin />} />
          <Route path="/filter" element={<FilterLab />} />
          <Route path="/framerate" element={<FrameRateChanger />} />
          <Route path="/subtitles" element={<SubtitlesManager />} />
          <Route path="/gif-webp" element={<GifWebpCreator />} />
          <Route path="/channel-mixer" element={<ChannelMixer />} />
          <Route path="/live-stream" element={<LiveStreamManager />} />
          <Route path="/thumbnail" element={<ThumbnailGenerator />} />
          <Route path="/audio-enhance" element={<AudioEnhancer />} />
          <Route path="/capture" element={<CaptureManager />} />
          <Route path="/batch" element={<BatchProcessor />} />
          <Route path="/analyze" element={<MediaAnalyzer />} />
          <Route path="/metadata" element={<MetadataEditor />} />
          <Route path="/segmenter" element={<Segmenter />} />
          <Route path="/bitstream-extract" element={<BitstreamExtractor />} />
          <Route path="/api-guide" element={<ApiIntegrationGuide />} />
          <Route path="/stabilize" element={<VideoStabilizer />} />
          <Route path="/scene-detect" element={<SceneDetector />} />
          <Route path="/audio-visualizer" element={<AudioVisualizer />} />
          <Route path="/aubio-anlaysis" element={<AubioAnalysis />} />
          <Route path="/watermark-remover" element={<WatermarkRemover />} />
          <Route path="/motion-interpolate" element={<MotionInterpolator />} />
          <Route path="/noise-reduce" element={<NoiseReducer />} />
          <Route path="/speed-changer" element={<SpeedChanger />} />
          <Route path="/timeline-editor" element={<TimelineEditor />} />
          <Route path="/soxaudiofilter" element={<SoxAudioFilter />} />
          <Route path="/vapor-synth-launcher" element={<VaporSynthFilters />} />
          <Route path="/spleeter-stems" element={<SpleeterStems />} />
          <Route path="*" element={<NotFound />} />
         </Routes>
        </TooltipProvider>
      </QueryClientProvider>
    </>
  );
};

export default App;

// const App = () => {
//   const location = useLocation();
//   const title = PAGE_TITLES[location.pathname] || "Video Encoderp";

//   return (
//     <>
//       <Helmet>
//         <title>{title} | Video Encoderp</title>
//       </Helmet>
//       <QueryClientProvider client={queryClient}>
//         <TooltipProvider>
//           <Toaster />
//           <Sonner />
//           <Routes>
//           <Route path="/" element={<Index />} />
//           {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
//           <Route path="/convert" element={<MediaConverter />} />
//           <Route path="/extract" element={<StreamExtractor />} />
//           <Route path="/resize" element={<VideoResizer />} />
//           <Route path="/clip-join" element={<MediaClipJoin />} />
//           <Route path="/filter" element={<FilterLab />} />
//           <Route path="/framerate" element={<FrameRateChanger />} />
//           <Route path="/subtitles" element={<SubtitlesManager />} />
//           <Route path="/gif-webp" element={<GifWebpCreator />} />
//           <Route path="/channel-mixer" element={<ChannelMixer />} />
//           <Route path="/live-stream" element={<LiveStreamManager />} />
//           <Route path="/thumbnail" element={<ThumbnailGenerator />} />
//           <Route path="/audio-enhance" element={<AudioEnhancer />} />
//           <Route path="/capture" element={<CaptureManager />} />
//           <Route path="/batch" element={<BatchProcessor />} />
//           <Route path="/analyze" element={<MediaAnalyzer />} />
//           <Route path="/metadata" element={<MetadataEditor />} />
//           <Route path="/segmenter" element={<Segmenter />} />
//           <Route path="/bitstream-extract" element={<BitstreamExtractor />} />
//           <Route path="/api-guide" element={<ApiIntegrationGuide />} />
//           <Route path="/stabilize" element={<VideoStabilizer />} />
//           <Route path="/scene-detect" element={<SceneDetector />} />
//           <Route path="/audio-visualizer" element={<AudioVisualizer />} />
//           <Route path="/aubio-anlaysis" element={<AubioAnalysis />} />
//           <Route path="/watermark-remover" element={<WatermarkRemover />} />
//           <Route path="/motion-interpolate" element={<MotionInterpolator />} />
//           <Route path="/noise-reduce" element={<NoiseReducer />} />
//           <Route path="/speed-changer" element={<SpeedChanger />} />
//           <Route path="/timeline-editor" element={<TimelineEditor />} />
//           <Route path="/soxaudiofilter" element={<SoxAudioFilter />} />
//           <Route path="/vapor-synth-launcher" element={<VaporSynthFilters />} />
//           <Route path="/spleeter-stems" element={<SpleeterStems />} />
//           <Route path="*" element={<NotFound />} />
//          </Routes>
//         </TooltipProvider>
//       </QueryClientProvider>
//     </>
//   );
// };
// export default App;