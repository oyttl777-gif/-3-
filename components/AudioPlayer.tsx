
import React, { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  audioBuffer: AudioBuffer | null;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioBuffer }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const startAudio = () => {
    if (!audioBuffer) return;

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = ctx;
    
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    
    source.onended = () => {
      if (offsetRef.current + (ctx.currentTime - startTimeRef.current) >= audioBuffer.duration) {
        setIsPlaying(false);
        setProgress(100);
        offsetRef.current = 0;
      }
    };

    startTimeRef.current = ctx.currentTime;
    source.start(0, offsetRef.current);
    sourceRef.current = source;
    setIsPlaying(true);
    updateProgress();
  };

  const stopAudio = () => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) {}
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      offsetRef.current += (audioContextRef.current.currentTime - startTimeRef.current);
    }
    cancelAnimationFrame(animationRef.current);
    setIsPlaying(false);
  };

  const resetAudio = () => {
    stopAudio();
    offsetRef.current = 0;
    setProgress(0);
  };

  const updateProgress = () => {
    if (!audioBuffer || !audioContextRef.current || !isPlaying) return;
    
    const currentPos = offsetRef.current + (audioContextRef.current.currentTime - startTimeRef.current);
    const percent = (currentPos / audioBuffer.duration) * 100;
    
    setProgress(Math.min(percent, 100));
    
    if (percent < 100) {
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      if (progress >= 100) {
        offsetRef.current = 0;
        setProgress(0);
      }
      startAudio();
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <button 
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-md disabled:bg-slate-300"
          disabled={!audioBuffer}
        >
          {isPlaying ? <i className="fa-solid fa-pause"></i> : <i className="fa-solid fa-play ml-1"></i>}
        </button>
        
        <div className="flex-1">
          <div className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Listening Audio</div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-100 ease-linear" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <button 
          onClick={resetAudio}
          className="text-slate-400 hover:text-slate-600 p-2"
          title="Reset"
        >
          <i className="fa-solid fa-rotate-left"></i>
        </button>
      </div>
      
      {!audioBuffer && (
        <div className="flex items-center gap-2 text-blue-600 text-sm animate-pulse">
          <i className="fa-solid fa-spinner fa-spin"></i>
          <span>Generating AI Voice...</span>
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
