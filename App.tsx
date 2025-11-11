import React, { useState, useCallback, useRef, useEffect } from 'react';
import StoryCard from './components/StoryCard';
import VoiceSelector from './components/VoiceSelector';
import SpeedSelector from './components/SpeedSelector';
import PauseSelector from './components/PauseSelector';
import { TTSState, VoiceName, PauseStrength } from './types';
import { generateSpeech } from './services/ttsService';
import { applyAudioEnhancement, decodeAudioData, audioBufferToWav, processAudioSpeed } from './utils/audioUtils';

const App: React.FC = () => {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [voice, setVoice] = useState<VoiceName>(VoiceName.Puck);
  const [speed, setSpeed] = useState<number>(1.0);
  const [pauseStrength, setPauseStrength] = useState<PauseStrength>(PauseStrength.Normal);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isEnhanced, setIsEnhanced] = useState(true); 
  const [isDownloading, setIsDownloading] = useState(false);

  const rawAudioRef = useRef<Uint8Array | null>(null);

  const [ttsState, setTtsState] = useState<TTSState>({
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    const updatePreview = async () => {
      if (!rawAudioRef.current) return;
      
      try {
        let blob: Blob;
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const buffer = await decodeAudioData(rawAudioRef.current, ctx);
        if (isEnhanced) {
          const enhanced = await applyAudioEnhancement(buffer);
          blob = audioBufferToWav(enhanced);
        } else {
          blob = audioBufferToWav(buffer);
        }
        
        const newUrl = URL.createObjectURL(blob);
        setAudioUrl(prev => {
          if (prev) URL.revokeObjectURL(prev);
          return newUrl;
        });
      } catch (e) {
        console.error("Failed to update preview enhancement", e);
      }
    };

    updatePreview();
  }, [isEnhanced]);

  const handleGenerate = useCallback(async (textToPlay: string) => {
    setTtsState({ isLoading: true, error: null });

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    rawAudioRef.current = null;

    try {
      const audioBytes = await generateSpeech(textToPlay, voice, pauseStrength);
      rawAudioRef.current = audioBytes;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(audioBytes, audioContext);

      let blob: Blob;
      if (isEnhanced) {
        const enhancedBuffer = await applyAudioEnhancement(audioBuffer);
        blob = audioBufferToWav(enhancedBuffer);
      } else {
        blob = audioBufferToWav(audioBuffer);
      }

      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setTtsState({ isLoading: false, error: null });
    } catch (error: any) {
      setTtsState({
        isLoading: false,
        error: error.message || "An error occurred generating audio.",
      });
    }
  }, [voice, pauseStrength, isEnhanced, audioUrl]);

  const handleDownload = async () => {
    if (!rawAudioRef.current || isDownloading) return;

    try {
      setIsDownloading(true);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      let buffer = await decodeAudioData(rawAudioRef.current, audioContext);

      if (speed !== 1.0) {
        buffer = await processAudioSpeed(buffer, speed);
      }
      if (isEnhanced) {
        buffer = await applyAudioEnhancement(buffer);
      }

      const wavBlob = audioBufferToWav(buffer);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[\s\W]+/g, '_') || 'audio'}.wav`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

    } catch (error) {
      console.error("Error processing download:", error);
      alert("Failed to process audio for download.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-wavy text-neutral-200 selection:bg-red-900 selection:text-white flex flex-col lg:flex-row">
      <aside className="w-full lg:w-80 shrink-0 bg-black/70 backdrop-blur-xl border-r border-neutral-800 lg:h-screen lg:sticky lg:top-0 overflow-y-auto z-20 custom-scrollbar">
        <div className="p-6 flex flex-col gap-8 h-full">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-900 rounded-xl flex items-center justify-center shadow-[0_0_25px_rgba(220,38,38,0.6)] shrink-0 border border-red-500/30">
               <svg className="w-7 h-7 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
               </svg>
             </div>
             <div className="flex flex-col">
               <h1 className="cinzel text-2xl font-black tracking-wider text-white leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                 TEXT TO
               </h1>
               <span className="cinzel text-xl font-bold tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400 block leading-none mt-0.5 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">
                 SPEECH
               </span>
             </div>
          </div>
          <div className="text-[10px] text-neutral-600 font-mono -mt-6">
            Powered by BOIX PROJECT V.1 TTS
          </div>
          <div className="flex flex-col gap-5">
             <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Studio Controls</div>
             <SpeedSelector
               currentSpeed={speed}
               onChange={setSpeed}
               disabled={ttsState.isLoading}
             />
             <PauseSelector
               currentStrength={pauseStrength}
               onChange={setPauseStrength}
               disabled={ttsState.isLoading}
             />
             <VoiceSelector 
               currentVoice={voice} 
               onChange={setVoice} 
               disabled={ttsState.isLoading} 
             />
            <div className="flex flex-col gap-2 bg-neutral-900/50 p-3 rounded-lg border border-neutral-800">
               <label className="flex items-center justify-between cursor-pointer group">
                 <span className="text-neutral-300 text-sm font-medium group-hover:text-white transition-colors">Cinematic Audio</span>
                 <div className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isEnhanced}
                      onChange={(e) => setIsEnhanced(e.target.checked)}
                      disabled={ttsState.isLoading}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                 </div>
               </label>
               <div className="text-[10px] text-neutral-500 leading-tight">
                 Adds bass boost, clarity, and dynamic compression.
               </div>
            </div>
          </div>
          <div className="flex-1"></div>
        </div>
      </aside>
      <main className="flex-1 p-4 lg:p-8 flex flex-col h-auto min-h-screen lg:h-screen overflow-y-auto custom-scrollbar">
        <div className="max-w-5xl mx-auto w-full pb-20 lg:pb-0">
           <StoryCard 
             title={title}
             text={text}
             ttsState={ttsState}
             audioUrl={audioUrl}
             playbackSpeed={speed}
             onGenerate={handleGenerate}
             onTextChange={setText}
             onTitleChange={setTitle}
             onDownload={handleDownload}
             isDownloading={isDownloading}
           />
        </div>
      </main>
    </div>
  );
};

export default App;