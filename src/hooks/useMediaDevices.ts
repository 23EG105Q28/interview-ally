import { useState, useCallback, useRef, useEffect } from "react";

interface UseMediaDevicesOptions {
  video?: boolean;
  audio?: boolean;
}

export const useMediaDevices = (options: UseMediaDevicesOptions = { video: true, audio: true }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(options.video ?? true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(options.audio ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startMedia = useCallback(async () => {
    setIsInitializing(true);
    setError(null);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: options.video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        } : false,
        audio: options.audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } : false,
      });
      
      setStream(mediaStream);
      setIsVideoEnabled(options.video ?? true);
      setIsAudioEnabled(options.audio ?? true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      return mediaStream;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to access camera/microphone";
      setError(errorMessage);
      console.error("Media access error:", err);
      return null;
    } finally {
      setIsInitializing(false);
    }
  }, [options.video, options.audio]);

  const stopMedia = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const toggleVideo = useCallback(() => {
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(prev => !prev);
    }
  }, [stream]);

  const toggleAudio = useCallback(() => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(prev => !prev);
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return {
    stream,
    videoRef,
    isVideoEnabled,
    isAudioEnabled,
    isInitializing,
    error,
    startMedia,
    stopMedia,
    toggleVideo,
    toggleAudio,
  };
};
