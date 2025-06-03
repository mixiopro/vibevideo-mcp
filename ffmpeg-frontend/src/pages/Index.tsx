import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom"; // Import Link


const Index = () => {
  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          {/* Add actions here later */}
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="conversion">Conversion</TabsTrigger>
            <TabsTrigger value="editing">Editing</TabsTrigger>
             <TabsTrigger value="filters">Filters</TabsTrigger>
             <TabsTrigger value="advanced">Advanced</TabsTrigger>
             <TabsTrigger value="media-tools">Media Tools</TabsTrigger>
             <TabsTrigger value="developer">Developer</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Placeholder cards for overview stats or quick links */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Jobs
                  </CardTitle>
                  {/* Icon placeholder */}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">
                    No jobs run yet
                  </p>
                </CardContent>
              </Card>
              {/* Add more overview cards */}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  {/* Placeholder for quick action buttons */}
                  <p className="text-sm text-muted-foreground">Quick action buttons will go here.</p>
                </CardContent>
              </Card>
              <Card className="col-span-3">
                 <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                   {/* Placeholder for recent activity list */}
                   <p className="text-sm text-muted-foreground">Recent jobs will be listed here.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
           <TabsContent value="conversion" className="space-y-4">
             <h3 className="text-xl font-semibold tracking-tight">Conversion Modules</h3>
             <Accordion type="single" collapsible className="w-full">
               <AccordionItem value="item-1">
                 <AccordionTrigger>Basic Conversion</AccordionTrigger>
                 <AccordionContent className="space-y-4 p-4">
                   <p className="text-sm text-muted-foreground mb-4">Convert media files between various formats and codecs.</p>
                   <Link to="/convert" className="text-primary hover:underline">Go to Media Conversion Page</Link>
                 </AccordionContent>
               </AccordionItem>
                <AccordionItem value="item-2">
                 <AccordionTrigger>Stream Extraction</AccordionTrigger>
                 <AccordionContent className="space-y-4 p-4">
                   <p className="text-sm text-muted-foreground mb-4">Extract audio or video streams from a media file.</p>
                   <Link to="/extract" className="text-primary hover:underline">Go to Stream Extraction Page</Link>
                 </AccordionContent>
               </AccordionItem>
               {/* Add more AccordionItems for specific conversion types */}
             </Accordion>
           </TabsContent>
            <TabsContent value="editing" className="space-y-4">
             <h3 className="text-xl font-semibold tracking-tight">Editing Modules</h3>
             <Accordion type="single" collapsible className="w-full">
               <AccordionItem value="item-1">
                 <AccordionTrigger>Video Resizing & Scaling</AccordionTrigger>
                 <AccordionContent className="space-y-4 p-4">
                   <p className="text-sm text-muted-foreground mb-4">Resize videos to predefined or custom resolutions.</p>
                   <Link to="/resize" className="text-primary hover:underline">Go to Video Resizing Page</Link>
                 </AccordionContent>
               </AccordionItem>
                <AccordionItem value="item-2">
                 <AccordionTrigger>Clipper & Joiner</AccordionTrigger>
                 <AccordionContent className="space-y-4 p-4">
                   <p className="text-sm text-muted-foreground mb-4">Trim sections from a media file or concatenate multiple files.</p>
                   <Link to="/clip-join" className="text-primary hover:underline">Go to Clipper & Joiner Page</Link>
                 </AccordionContent>
               </AccordionItem>
               {/* Add more AccordionItems for specific editing types */}
             </Accordion>
           </TabsContent>
            <TabsContent value="filters" className="space-y-4">
             <h3 className="text-xl font-semibold tracking-tight">Filter Modules</h3>
             <Accordion type="single" collapsible className="w-full">
               <AccordionItem value="item-1">
                 <AccordionTrigger>Filter & Effects Lab</AccordionTrigger>
                 <AccordionContent className="space-y-4 p-4">
                   <p className="text-sm text-muted-foreground mb-4">Apply various video filters and effects.</p>
                   <Link to="/filter" className="text-primary hover:underline">Go to Filter Lab Page</Link>
                 </AccordionContent>
               </AccordionItem>
                <AccordionItem value="item-2">
                 <AccordionTrigger>Frame Rate Adjustment</AccordionTrigger>
                 <AccordionContent className="space-y-4 p-4">
                   <p className="text-sm text-muted-foreground mb-4">Modify the frame rate of a video.</p>
                   <Link to="/framerate" className="text-primary hover:underline">Go to Frame Rate Page</Link>
                 </AccordionContent>
               </AccordionItem>
                <AccordionItem value="item-3">
                 <AccordionTrigger>Video Stabilization</AccordionTrigger>
                 <AccordionContent className="space-y-4 p-4">
                   <p className="text-sm text-muted-foreground mb-4">Stabilize shaky video footage.</p>
                   <Link to="/stabilize" className="text-primary hover:underline">Go to Video Stabilization Page</Link>
                 </AccordionContent>
               </AccordionItem>
                <AccordionItem value="item-4">
                 <AccordionTrigger>Scene Detection</AccordionTrigger>
                 <AccordionContent className="space-y-4 p-4">
                   <p className="text-sm text-muted-foreground mb-4">Detect and extract key scenes (scene changes).</p>
                   <Link to="/scene-detect" className="text-primary hover:underline">Go to Scene Detection Page</Link>
                 </AccordionContent>
               </AccordionItem>
                <AccordionItem value="item-5"> {/* New Accordion Item */}
                 <AccordionTrigger>Motion Interpolation</AccordionTrigger>
                 <AccordionContent className="space-y-4 p-4">
                   <p className="text-sm text-muted-foreground mb-4">Smooth out low frame-rate video (slowmo/interpolation).</p>
                   <Link to="/motion-interpolate" className="text-primary hover:underline">Go to Motion Interpolation Page</Link>
                 </AccordionContent>
               </AccordionItem>
                <AccordionItem value="item-6"> {/* New Accordion Item */}
                 <AccordionTrigger>Noise Reduction (Video)</AccordionTrigger>
                 <AccordionContent className="space-y-4 p-4">
                   <p className="text-sm text-muted-foreground mb-4">Remove grain/noise from video.</p>
                   <Link to="/noise-reduce" className="text-primary hover:underline">Go to Noise Reduction Page</Link>
                 </AccordionContent>
               </AccordionItem>
               {/* Add more AccordionItems for specific filter types */}
             </Accordion>
           </TabsContent>
            <TabsContent value="advanced" className="space-y-4">
             <h3 className="text-xl font-semibold tracking-tight">Advanced Modules</h3>
             <Accordion type="single" collapsible className="w-full">
               <AccordionItem value="item-1">
                 <AccordionTrigger>Subtitles Management</AccordionTrigger>
                 <AccordionContent className="space-y-4 p-4">
                   <p className="text-sm text-muted-foreground mb-4">Add, extract, or remove subtitles from videos.</p>
                   <Link to="/subtitles" className="text-primary hover:underline">Go to Subtitles Management Page</Link>
                 </AccordionContent>
               </AccordionItem>
                <AccordionItem value="item-2">
                 <AccordionTrigger>GIF & WebP Creator</AccordionTrigger>
                 <AccordionContent className="space-y-4 p-4">
                   <p className="text-sm text-muted-foreground mb-4">Convert video segments into animated GIF or WebP files.</p>
                   <Link to="/gif-webp" className="text-primary hover:underline">Go to GIF & WebP Creator Page</Link>
                 </AccordionContent>
               </AccordionItem>
                <AccordionItem value="item-3">
                 <AccordionTrigger>Channel Mixer</AccordionTrigger>
                 <AccordionContent className="space-y-4 p-4">
                   <p className="text-sm text-muted-foreground mb-4">Modify the number of audio channels in a media file.</p>
                   <Link to="/channel-mixer" className="text-primary hover:underline">Go to Channel Mixer Page</Link>
                 </AccordionContent>
               </AccordionItem>
                <AccordionItem value="item-4">
                 <AccordionTrigger>Live Streaming & Recording</AccordionTrigger>
                 <AccordionContent className="space-y-4 p-4">
                   <p className="text-sm text-muted-foreground mb-4">Generate FFmpeg commands for streaming media.</p>
                   <Link to="/live-stream" className="text-primary hover:underline">Go to Live Streaming Page</Link>
                 </AccordionContent>
               </AccordionItem>
                <AccordionItem value="item-5">
                 <AccordionTrigger>Capture Devices & Screen</AccordionTrigger>
                 <AccordionContent className="space-y-4 p-4">
                   <p className="text-sm text-muted-foreground mb-4">Generate FFmpeg commands for capturing from webcams or screens.</p>
                   <Link to="/capture" className="text-primary hover:underline">Go to Capture Devices Page</Link>
                 </AccordionContent>
               </AccordionItem>
                <AccordionItem value="item-6">
                 <AccordionTrigger>Batch Processor</AccordionTrigger>
                 <AccordionContent className="space-y-4 p-4">
                   <p className="text-sm text-muted-foreground mb-4">Generate FFmpeg commands to apply operations to multiple files.</p>
                   <Link to="/batch" className="text-primary hover:underline">Go to Batch Processor Page</Link>
                 </AccordionContent>
               </AccordionItem>
                <AccordionItem value="item-7">
                 <AccordionTrigger>Adaptive Streaming Segmenter</AccordionTrigger>
                 <AccordionContent className="space-y-4 p-4">
                   <p className="text-sm text-muted-foreground mb-4">Generate FFmpeg commands to segment media for HLS or DASH.</p>
                   <Link to="/segmenter" className="text-primary hover:underline">Go to Adaptive Segmenter Page</Link>
                 </AccordionContent>
               </AccordionItem>
                <AccordionItem value="item-8">
                 <AccordionTrigger>Bitstream Extractor</AccordionTrigger>
                 <AccordionContent className="space-y-4 p-4">
                   <p className="text-sm text-muted-foreground mb-4">Generate FFmpeg commands to extract raw video, audio, or subtitle bitstreams.</p>
                   <Link to="/bitstream-extract" className="text-primary hover:underline">Go to Bitstream Extractor Page</Link>
                 </AccordionContent>
               </AccordionItem>
               {/* Add more AccordionItems for specific advanced types */}
             </Accordion>
           </TabsContent>
            <TabsContent value="media-tools" className="space-y-4">
             <h3 className="text-xl font-semibold tracking-tight">Media Tools</h3>
             <Accordion type="single" collapsible className="w-full">
               <AccordionItem value="item-1">
                 <AccordionTrigger>Thumbnail Generator</AccordionTrigger>
                 <AccordionContent className="space-y-4 p-4">
                   <p className="text-sm text-muted-foreground mb-4">Capture single screenshots or generate thumbnail sheets from videos.</p>
                   <Link to="/thumbnail" className="text-primary hover:underline">Go to Thumbnail Generator Page</Link>
                 </AccordionContent>
               </AccordionItem>
                <AccordionItem value="item-2">
                 <AccordionTrigger>Audio Enhancer</AccordionTrigger>
                 <AccordionContent className="space-y-4 p-4">
                   <p className="text-sm text-muted-foreground mb-4">Apply various audio filters and effects.</p>
                   <Link to="/audio-enhance" className="text-primary hover:underline">Go to Audio Enhancer Page</Link>
                 </AccordionContent>
               </AccordionItem>
                <AccordionItem value="item-3">
                 <AccordionTrigger>Media Analyzer</AccordionTrigger>
                 <AccordionContent className="space-y-4 p-4">
                   <p className="text-sm text-muted-foreground mb-4">Analyze media files to display detailed information.</p>
                   <Link to="/analyze" className="text-primary hover:underline">Go to Media Analyzer Page</Link>
                 </AccordionContent>
               </AccordionItem>
                <AccordionItem value="item-4">
                 <AccordionTrigger>Metadata & Chapters Editor</AccordionTrigger>
                 <AccordionContent className="space-y-4 p-4">
                   <p className="text-sm text-muted-foreground mb-4">View and edit basic metadata for media files.</p>
                   <Link to="/metadata" className="text-primary hover:underline">Go to Metadata Editor Page</Link>
                 </AccordionContent>
               </AccordionItem>
                <AccordionItem value="item-5">
                 <AccordionTrigger>Audio Visualization</AccordionTrigger>
                 <AccordionContent className="space-y-4 p-4">
                   <p className="text-sm text-muted-foreground mb-4">Generate visual representations (waveforms, spectrograms) from audio streams.</p>
                   <Link to="/audio-visualizer" className="text-primary hover:underline">Go to Audio Visualization Page</Link>
                 </AccordionContent>
               </AccordionItem>
                <AccordionItem value="item-6">
                 <AccordionTrigger>Logo/Watermark Remover</AccordionTrigger>
                 <AccordionContent className="space-y-4 p-4">
                   <p className="text-sm text-muted-foreground mb-4">Generate FFmpeg commands to remove logos or watermarks from videos.</p>
                   <Link to="/watermark-remover" className="text-primary hover:underline">Go to Watermark Remover Page</Link>
                 </AccordionContent>
               </AccordionItem>
               {/* Add more AccordionItems for specific media tools */}
             </Accordion>
           </TabsContent>
            <TabsContent value="developer" className="space-y-4">
             <h3 className="text-xl font-semibold tracking-tight">Developer Tools</h3>
             <Accordion type="single" collapsible className="w-full">
               <AccordionItem value="item-1">
                 <AccordionTrigger>Filter Graph Builder</AccordionTrigger>
                 <AccordionContent className="space-y-4 p-4">
                   <p className="text-sm text-muted-foreground mb-4">Design and apply complex, multi-step filter chains.</p>
                   <Link to="/filter-graph" className="text-primary hover:underline">Go to Filter Graph Builder Page</Link>
                 </AccordionContent>
               </AccordionItem>
                <AccordionItem value="item-2">
                 <AccordionTrigger>API Integration Helper</AccordionTrigger>
                 <AccordionContent className="space-y-4 p-4">
                   <p className="text-sm text-muted-foreground mb-4">Get code snippets to integrate FFmpeg commands into your scripts.</p>
                   <Link to="/api-guide" className="text-primary hover:underline">Go to API Integration Helper Page</Link>
                 </AccordionContent>
               </AccordionItem>
               {/* Add more AccordionItems for specific developer tools */}
             </Accordion>
           </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Index;