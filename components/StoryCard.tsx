import React, { useRef, useState, useEffect } from 'react';
import { TTSState } from '../types';
import { formatTime } from '../utils/audioUtils';

interface StoryCardProps {
  title: string;
  text: string;
  ttsState: TTSState;
  audioUrl: string | null;
  playbackSpeed: number;
  onGenerate: (text: string) => void;
  onTextChange: (newText: string) => void;
  onTitleChange: (newTitle: string) => void;
  onDownload: () => void;
  isDownloading: boolean;
}

const StoryCard: React.FC<StoryCardProps> = ({ 
  title,
  text, 
  ttsState, 
  audioUrl,
  playbackSpeed,
  onGenerate,
  onTextChange,
  onTitleChange,
  onDownload,
  isDownloading
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const isLoading = ttsState.isLoading;

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentTime(0);
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const togglePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      if (!ttsState.isLoading) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
          setIsPlaying(false);
        });
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-black/60 backdrop-blur-md shadow-2xl">
      
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />
      )}

      <div className="p-6 md:p-8">
        <div className="flex flex-col gap-6 mb-6">
          <div className="flex items-center gap-4">
            <input 
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="flex-1 bg-transparent border-b border-transparent hover:border-neutral-700 focus:border-red-800 p-1 cinzel text-2xl md:text-3xl font-bold tracking-wide focus:outline-none text-white transition-colors placeholder-neutral-600"
              placeholder="Story Title..."
            />
          </div>
          
          <div className="bg-black/40 rounded-lg p-4 border border-neutral-800 flex flex-col gap-4">
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onGenerate(text)}
                  disabled={isLoading || isDownloading}
                  className={`
                    flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-lg
                    ${isLoading || isDownloading
                      ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
                      : 'bg-white text-black hover:bg-neutral-200'
                    }
                  `}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      <span>Generate Audio</span>
                    </>
                  )}
                </button>

                {audioUrl && !isLoading && (
                   <button
                    onClick={togglePlayPause}
                    disabled={isDownloading}
                    className="w-10 h-10 rounded-full bg-red-700 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg shadow-red-900/30 disabled:opacity-50"
                   >
                     {isPlaying ? (
                       <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
                     ) : (
                       <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                     )}
                   </button>
                )}
              </div>

              {audioUrl && !isLoading && (
                <button
                  onClick={onDownload}
                  disabled={isDownloading}
                  className={`text-neutral-400 hover:text-white transition-colors p-2 flex items-center gap-2 ${isDownloading ? 'opacity-50 cursor-wait' : ''}`}
                  title="Download WAV"
                >
                  {isDownloading ? (
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  )}
                </button>
              )}
            </div>

            {audioUrl && !isLoading && (
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs font-mono text-neutral-500 w-10 text-right">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-red-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:hover:bg-red-500"
                />
                <span className="text-xs font-mono text-neutral-500 w-10">{formatTime(duration)}</span>
              </div>
            )}
             {ttsState.error && (
                <div className="mt-2 text-center text-red-300 bg-red-900/50 border border-red-500/50 rounded-md p-3 text-sm">
                    <p><strong>Error:</strong> {ttsState.error}</p>
                </div>
           )}
          </div>

        </div>

        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          className="w-full bg-transparent resize-y min-h-[400px] rounded-xl p-6 border border-neutral-800 focus:border-neutral-600 focus:bg-black/20 outline-none text-lg md:text-xl leading-relaxed text-neutral-300 placeholder-neutral-700 transition-all font-serif custom-scrollbar"
          placeholder="Write your story here..."
          spellCheck={false}
        />
      </div>
    </div>
  );
};

export default StoryCard;