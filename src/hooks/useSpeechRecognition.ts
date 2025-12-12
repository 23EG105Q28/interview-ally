import { useState, useCallback, useRef, useEffect } from "react";

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

interface UseSpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export const useSpeechRecognition = (options: UseSpeechRecognitionOptions = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const shouldRestartRef = useRef(false);
  const isStartingRef = useRef(false);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionAPI);
    
    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = options.continuous ?? true;
      recognition.interimResults = options.interimResults ?? true;
      recognition.lang = options.language ?? "en-US";
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        let final = "";
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }
        
        if (final) {
          setTranscript(prev => prev + " " + final);
        }
        setInterimTranscript(interim);
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        // Don't set error for aborted/no-speech - these are normal
        if (event.error !== "aborted" && event.error !== "no-speech") {
          setError(event.error);
        }
        isStartingRef.current = false;
        setIsListening(false);
      };
      
      recognition.onend = () => {
        isStartingRef.current = false;
        setIsListening(false);
        
        // Auto-restart if should continue listening
        if (shouldRestartRef.current) {
          setTimeout(() => {
            if (shouldRestartRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
                setIsListening(true);
              } catch (err) {
                console.log("Could not restart recognition:", err);
              }
            }
          }, 100);
        }
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [options.continuous, options.interimResults, options.language]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && !isStartingRef.current) {
      setError(null);
      shouldRestartRef.current = true;
      isStartingRef.current = true;
      
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        setError("Failed to start speech recognition");
        isStartingRef.current = false;
        shouldRestartRef.current = false;
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    isStartingRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.log("Recognition already stopped");
      }
      setIsListening(false);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
};
