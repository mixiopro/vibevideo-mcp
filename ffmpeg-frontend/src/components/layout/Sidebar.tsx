import { cn } from "@/lib/utils";
import { Home, Repeat, Scissors, Maximize, Link as LinkIcon, SlidersHorizontal, Film, Subtitles, FileImage, Volume2, Video, Image, VolumeX, Webcam, ListChecks, Info, Tag, Split, Code, Workflow, Focus, Eye, Waves, Eraser, FastForward, Sparkles } from "lucide-react"; // Replaced Stabilize with Focus
import { Link } from "react-router-dom";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Modules
          </h2>
          <div className="space-y-1">
            {/* <Link
              to="/"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Link> */}
            <Link
              to="/timeline-editor"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Sparkles className="mr-2 h-4 w-4" /> {/* Used Sparkles icon */}
              Timeline Editor
            </Link>
            {/* Add links for new modules */}
             <Link
              to="/convert"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Repeat className="mr-2 h-4 w-4" />
              Media Conversion
            </Link>
             <Link
              to="/resize"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Maximize className="mr-2 h-4 w-4" />
              Video Resizing
            </Link>
             <Link
              to="/clip-join"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LinkIcon className="mr-2 h-4 w-4" /> {/* Using LinkIcon to avoid conflict with react-router-dom Link */}
              Clipper & Joiner
            </Link>
             <Link
              to="/filter"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filter Lab
            </Link>
            <Link
              to="/scene-detect"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Eye className="mr-2 h-4 w-4" />
              Scene Detection
            </Link>
             <Link
              to="/framerate"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Film className="mr-2 h-4 w-4" />
              Frame Rate
            </Link>
            <Link
              to="/speed-changer"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Sparkles className="mr-2 h-4 w-4" /> {/* Used Sparkles icon */}
              Speed Changer
            </Link>
            <Link
              to="/channel-mixer"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Volume2 className="mr-2 h-4 w-4" />
              Channel Mixer
            </Link>
            <Link
              to="/motion-interpolate"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <FastForward className="mr-2 h-4 w-4" /> {/* Used FastForward icon */}
              Motion Interpolation
            </Link>
            <Link
              to="/stabilize"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Focus className="mr-2 h-4 w-4" /> {/* Used Focus icon */}
              Video Stabilization
            </Link>
            
             <Link
              to="/noise-reduce"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Sparkles className="mr-2 h-4 w-4" /> {/* Used Sparkles icon */}
              Noise Reduction
            </Link>
            <Link
              to="/analyze"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Info className="mr-2 h-4 w-4" />
              Media Analyzer
            </Link>
             <Link
              to="/metadata"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Tag className="mr-2 h-4 w-4" />
              Metadata Editor
            </Link>            
          <Link
              to="/thumbnail"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Image className="mr-2 h-4 w-4" />
              Thumbnail Generator
            </Link>
<Link
              to="/extract"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Scissors className="mr-2 h-4 w-4" />
              Stream Extraction
            </Link>
             <Link
              to="/gif-webp"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <FileImage className="mr-2 h-4 w-4" />
              GIF/WebP Creator
            </Link>
            <Link
              to="/audio-enhance"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <VolumeX className="mr-2 h-4 w-4" />
              Audio Enhancer
            </Link>
             <Link
              to="/audio-visualizer"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Waves className="mr-2 h-4 w-4" />
              Audio Visualization
            </Link>
<Link
              to="/segmenter"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Split className="mr-2 h-4 w-4" />
              Adaptive Segmenter
            </Link>
             <Link
              to="/bitstream-extract"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Code className="mr-2 h-4 w-4" />
              Bitstream Extractor
            </Link>
   
             <Link
              to="/api-guide"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Code className="mr-2 h-4 w-4" />
              API Integration
            </Link>
             <Link
              to="/capture"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Webcam className="mr-2 h-4 w-4" />
              Capture Devices
            </Link>
             <Link
              to="/live-stream"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Video className="mr-2 h-4 w-4" />
              Live Streaming
            </Link>
             <Link
              to="/batch"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <ListChecks className="mr-2 h-4 w-4" />
              Batch Processor
            </Link>
             
            
             
            
  
             <Link
              to="/watermark-remover"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Eraser className="mr-2 h-4 w-4" />
              Watermark Remover
            </Link>
                         <Link
              to="/subtitles"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Subtitles className="mr-2 h-4 w-4" />
              Subtitles
            </Link>

            <Link
              to="/aubio-anlaysis"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Waves className="mr-2 h-4 w-4" />
              Aubio Analysis
            </Link>
            <Link
              to="/soxaudiofilter"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Volume2 className="mr-2 h-4 w-4" />
              SoX Audio Filter
            </Link>
           
            <Link
              to="/vapor-synth-launcher"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              VapourSynth Filters
            </Link>
            <Link
              to="/spleeter-stems"
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Volume2 className="mr-2 h-4 w-4" />
              Spleeter Stems
            </Link>
            {/* Add more module links here later */}
          </div>
        </div>
        {/* Add more sections here later */}
      </div>
    </div>
  );
}