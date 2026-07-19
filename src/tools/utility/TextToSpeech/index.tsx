import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Square, Mic, MicOff, Copy, ClipboardCheck } from 'lucide-react';

export const TextToSpeech: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tts' | 'stt'>('tts');

  // TTS State
  const [ttsText, setTtsText] = useState('Welcome to NutterTools! This speech tool runs entirely client-side inside your browser.');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState(false);

  // STT State
  const [sttText, setSttText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [copied, setCopied] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Initialize Speech Synthesis Voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        if (availableVoices.length > 0 && !selectedVoice) {
          // Default to first english voice or system default
          const defaultVoice = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
          setSelectedVoice(defaultVoice.name);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Initialize Speech Recognition for STT
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (e: any) => {
        let finalTrans = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) {
            finalTrans += e.results[i][0].transcript + ' ';
          }
        }
        if (finalTrans) {
          setSttText(prev => prev + finalTrans);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (err: any) => {
        console.error(err);
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    if (!ttsText.trim()) return;

    const utterance = new SpeechSynthesisUtterance(ttsText);
    const voiceObj = voices.find(v => v.name === selectedVoice);
    if (voiceObj) {
      utterance.voice = voiceObj;
    }
    utterance.rate = speed;
    utterance.pitch = pitch;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const handleToggleDictation = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Try Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setSttText('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleCopyStt = () => {
    if (sttText) {
      navigator.clipboard.writeText(sttText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col gap-4 border border-border rounded bg-surface p-4">
        <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2">
          Select Speech Helper Mode /
        </h4>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => { setActiveTab('tts'); handleStopSpeak(); }}
            className={`flex items-center gap-2 px-4 py-2 border rounded font-mono text-xs uppercase tracking-wider transition-colors ${
              activeTab === 'tts' ? 'border-accent bg-accent/5 text-ink' : 'border-border text-ink-muted bg-surface hover:text-ink'
            }`}
          >
            <Volume2 size={13} /> Text-to-Speech Reader
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('stt'); handleStopSpeak(); }}
            className={`flex items-center gap-2 px-4 py-2 border rounded font-mono text-xs uppercase tracking-wider transition-colors ${
              activeTab === 'stt' ? 'border-accent bg-accent/5 text-ink' : 'border-border text-ink-muted bg-surface hover:text-ink'
            }`}
          >
            <Mic size={13} /> Voice Dictation (Speech-to-Text)
          </button>
        </div>
      </div>

      {activeTab === 'tts' ? (
        <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in">
          <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
            Voice Reader Workspace /
          </span>

          <textarea
            rows={5}
            value={ttsText}
            onChange={e => setTtsText(e.target.value)}
            className="w-full p-3 border border-border bg-bg text-ink rounded font-sans text-xs focus:border-accent outline-none resize-y leading-relaxed"
            placeholder="Type anything for the browser to read aloud..."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border pt-4">
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[9px] text-ink-muted uppercase">Voice Accent /</span>
              <select
                value={selectedVoice}
                onChange={e => setSelectedVoice(e.target.value)}
                className="w-full px-3 py-1.5 border border-border bg-bg text-ink rounded text-xs focus:border-accent outline-none font-sans"
              >
                {voices.map(v => (
                  <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[9px] text-ink-muted uppercase">Voice Speed ({speed}x) /</span>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.1}
                value={speed}
                onChange={e => setSpeed(parseFloat(e.target.value))}
                className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[9px] text-ink-muted uppercase">Voice Pitch ({pitch}) /</span>
              <input
                type="range"
                min={0.5}
                max={1.5}
                step={0.1}
                value={pitch}
                onChange={e => setPitch(parseFloat(e.target.value))}
                className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4 mt-2">
            {isPlaying ? (
              <button
                type="button"
                onClick={handleStopSpeak}
                className="flex items-center gap-1.5 px-4 py-2 bg-error text-white font-mono text-xs uppercase tracking-wider rounded hover:bg-error/90 transition-colors shadow"
              >
                <Square size={13} /> Stop Voice
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSpeak}
                disabled={!ttsText.trim()}
                className="flex items-center gap-1.5 px-5 py-2 bg-accent text-white font-mono text-xs uppercase tracking-wider rounded hover:bg-accent-secondary transition-colors shadow disabled:opacity-40"
              >
                <Play size={13} /> Speak Aloud
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
              Speech-to-Text Dictation pad /
            </span>
            {sttText && (
              <button
                type="button"
                onClick={handleCopyStt}
                className="flex items-center gap-1 px-3 py-1 border border-border text-[10px] uppercase font-mono tracking-wider text-ink-muted hover:text-ink hover:bg-bg rounded transition-colors"
              >
                {copied ? <ClipboardCheck size={11} className="text-success" /> : <Copy size={11} />}
              </button>
            )}
          </div>

          <div className="relative">
            <textarea
              rows={8}
              readOnly
              value={sttText || (isListening ? 'Listening... speak clearly into your microphone.' : 'Click start dictation and speak.')}
              className={`w-full p-3 border border-border bg-bg text-ink rounded font-sans text-xs focus:border-accent outline-none resize-none leading-relaxed ${
                isListening ? 'animate-pulse text-accent' : ''
              }`}
            />
            {isListening && (
              <div className="absolute top-2 right-2 w-3.5 h-3.5 bg-accent rounded-full animate-ping" />
            )}
          </div>

          {copied && (
            <div className="text-center text-xs text-success bg-success/5 border border-success/20 p-2 rounded leading-none">
              Dictated text copied to clipboard!
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-border pt-4 mt-2">
            <button
              type="button"
              onClick={handleToggleDictation}
              className={`flex items-center gap-1.5 px-6 py-2 text-white font-mono text-xs uppercase tracking-wider rounded shadow transition-all ${
                isListening ? 'bg-error hover:bg-error/90 animate-pulse' : 'bg-accent hover:bg-accent-secondary'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff size={14} /> Stop Dictation
                </>
              ) : (
                <>
                  <Mic size={14} /> Start Dictation
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextToSpeech;
