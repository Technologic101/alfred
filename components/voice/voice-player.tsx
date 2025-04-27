"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { synthesizeSpeech } from "@/lib/ai/speech";

interface VoicePlayerProps {
  text: string;
  autoPlay?: boolean;
}

export function VoicePlayer({ text, autoPlay = false }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const generateSpeech = async () => {
      try {
        const audioBlob = await synthesizeSpeech(text);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        if (autoPlay) {
          playAudio(url);
        }
      } catch (error) {
        console.error("Speech synthesis error:", error);
      }
    };

    if (text) {
      generateSpeech();
    }

    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [text, autoPlay]);

  const playAudio = (url: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    }
    
    audioRef.current.play();
    setIsPlaying(true);
  };

  const togglePlayback = () => {
    if (!audioUrl) return;
    
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      playAudio(audioUrl);
    }
  };

  return (
    <Button
      onClick={togglePlayback}
      variant="ghost"
      size="icon"
      disabled={!audioUrl}
    >
      {isPlaying ? (
        <VolumeX className="h-5 w-5" />
      ) : (
        <Volume2 className="h-5 w-5" />
      )}
      <span className="sr-only">
        {isPlaying ? "Stop speaking" : "Speak response"}
      </span>
    </Button>
  );
}