import { useEffect, RefObject } from "react";
import { User, VideoOff } from "lucide-react";

interface VideoPreviewProps {
  videoRef: RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  isVideoEnabled: boolean;
  label?: string;
  className?: string;
  mirrored?: boolean;
}

const VideoPreview = ({ 
  videoRef, 
  stream, 
  isVideoEnabled, 
  label = "Camera",
  className = "",
  mirrored = true
}: VideoPreviewProps) => {
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoRef]);

  return (
    <div className={`relative rounded-xl overflow-hidden bg-secondary ${className}`}>
      {stream && isVideoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${mirrored ? "scale-x-[-1]" : ""}`}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {stream ? (
            <>
              <VideoOff className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Camera off</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                <User className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">{label}</p>
            </>
          )}
        </div>
      )}
      
      {/* Label overlay */}
      {stream && isVideoEnabled && label && (
        <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-background/70 backdrop-blur-sm">
          <span className="text-xs text-foreground">{label}</span>
        </div>
      )}
    </div>
  );
};

export default VideoPreview;
