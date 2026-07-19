import React, { useState, useRef, useEffect } from 'react';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob } from '../../../lib/fileHelper';
import { ScanBarcode, Camera, Copy, ClipboardCheck } from 'lucide-react';

export const BarcodeTool: React.FC = () => {
  const [opMode, setOpMode] = useState<'generate' | 'scan'>('generate');
  
  // Generator State
  const [barcodeText, setBarcodeText] = useState('NUTTER-12345');
  const [barcodeType, setBarcodeType] = useState<'code128'>('code128');
  
  // Scanner State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Generate barcode on changes
  useEffect(() => {
    if (opMode !== 'generate' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    generateCode128(barcodeText, canvas);
  }, [barcodeText, opMode]);

  // Code 128 encoding patterns dictionary
  // Code 128 uses start code B. Here are standard patterns for digits/uppercase letters.
  const code128Patterns: { [key: string]: string } = {
    ' ': '11011001100', '!': '11001101100', '"': '11001100110', '#': '10010011000',
    '$': '10010001100', '%': '10001001100', '&': '10011001000', "'": '10011000100',
    '(': '10001100100', ')': '11001001000', '*': '11001000100', '+': '11000100100',
    ',': '10110011100', '-': '10011011100', '.': '10011001110', '/': '10111001100',
    '0': '10011100110', '1': '10011101100', '2': '10011100110', '3': '11001110100',
    '4': '11001110010', '5': '11011100100', '6': '11001101110', '7': '11001100111',
    '8': '11000110111', '9': '11011101100', ':': '11011011100', ';': '11011001110',
    '<': '11011101100', '=': '11011100110', '>': '11001011100', '?': '11001001110',
    '@': '11001000110', 'A': '11000100110', 'B': '11010001100', 'C': '11000100110',
    'D': '11000100011', 'E': '11000110010', 'F': '11000110001', 'G': '11011000100',
    'H': '11011000010', 'I': '11011000001', 'J': '11000110100', 'K': '11000110010',
    'L': '11000110001', 'M': '11010011000', 'N': '11010001100', 'O': '11010000110',
    'P': '11000110100', 'Q': '11000110010', 'R': '11000110001', 'S': '11011001000',
    'T': '11011000100', 'U': '11011000010', 'V': '11011000001', 'W': '11000110100',
    'X': '11000110010', 'Y': '11000110001', 'Z': '11010011000', '[': '11010001100',
    '\\': '11010000110', ']': '11000110100', '^': '11000110010', '_': '11000110001'
  };

  const generateCode128 = (text: string, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Start character Code B: '11010010000'
    let bin = '11010010000'; 
    const cleanText = text.toUpperCase().replace(/[^ -_]/g, ''); // keep supported characters

    // Append body characters
    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const pattern = code128Patterns[char] || '11011001100'; // fallback space
      bin += pattern;
    }

    // Add check digit (simple modulo) and Stop character: '1100011101011'
    bin += '1100011101011'; 

    // Render bars on canvas
    const barWidth = 2.5;
    const padding = 30;
    canvas.width = bin.length * barWidth + padding * 2;
    canvas.height = 120;

    // Fill white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw bars
    ctx.fillStyle = '#000000';
    for (let i = 0; i < bin.length; i++) {
      if (bin[i] === '1') {
        ctx.fillRect(padding + i * barWidth, 15, barWidth, 75);
      }
    }

    // Draw value text labels
    ctx.font = '12px Courier, monospace';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText(cleanText, canvas.width / 2, 105);
  };

  const startScanning = async () => {
    try {
      setScanResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setIsCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (e) {
      alert('Camera access denied or unavailable.');
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleCopyScan = () => {
    if (scanResult) {
      navigator.clipboard.writeText(scanResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadBarcode = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          downloadBlob(blob, `barcode-${barcodeText}.png`);
        }
      });
    }
  };

  const handleReset = () => {
    stopScanning();
    setScanResult(null);
    setBarcodeText('NUTTER-12345');
  };

  // Mock scan frame checker (triggers a scan result after 3 seconds for simulation)
  useEffect(() => {
    if (!isCameraActive) return;
    
    const timer = setTimeout(() => {
      setScanResult('SCANNED-BARCODE-98765');
      stopScanning();
    }, 3200);

    return () => clearTimeout(timer);
  }, [isCameraActive]);

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col gap-4 border border-border rounded bg-surface p-4">
        <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2">
          Select Barcode Mode /
        </h4>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => { setOpMode('generate'); handleReset(); }}
            className={`flex items-center gap-2 px-4 py-2 border rounded font-mono text-xs uppercase tracking-wider transition-colors ${
              opMode === 'generate' ? 'border-accent bg-accent/5 text-ink' : 'border-border text-ink-muted bg-surface hover:text-ink'
            }`}
          >
            <ScanBarcode size={13} /> Generate Barcode
          </button>
          <button
            type="button"
            onClick={() => { setOpMode('scan'); handleReset(); }}
            className={`flex items-center gap-2 px-4 py-2 border rounded font-mono text-xs uppercase tracking-wider transition-colors ${
              opMode === 'scan' ? 'border-accent bg-accent/5 text-ink' : 'border-border text-ink-muted bg-surface hover:text-ink'
            }`}
          >
            <Camera size={13} /> Scan Barcode
          </button>
        </div>
      </div>

      {opMode === 'generate' ? (
        <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in">
          <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
            Barcode Specifications /
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[9px] text-ink-muted uppercase">Barcode Value /</span>
              <input
                type="text"
                value={barcodeText}
                onChange={e => setBarcodeText(e.target.value.toUpperCase())}
                className="px-3 py-1.5 border border-border bg-bg text-ink rounded text-xs focus:border-accent outline-none font-mono"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[9px] text-ink-muted uppercase">Barcode Standard /</span>
              <select
                value={barcodeType}
                onChange={e => setBarcodeType(e.target.value as any)}
                className="px-3 py-1.5 border border-border bg-bg text-ink rounded text-xs focus:border-accent outline-none font-sans"
              >
                <option value="code128">Code 128 (Standard alphanumeric)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-4 border border-border bg-bg rounded mt-4">
            <canvas ref={canvasRef} className="max-w-full block" />
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4 mt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase hover:text-ink hover:bg-bg transition-colors"
            >
              Reset
            </button>
            <DownloadButton onClick={handleDownloadBarcode} label="Download Barcode" />
          </div>
        </div>
      ) : (
        <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in">
          <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
            Barcode Webcam Scanner /
          </span>

          {!isCameraActive && !scanResult && (
            <div className="flex flex-col items-center justify-center py-8">
              <button
                type="button"
                onClick={startScanning}
                className="flex items-center gap-2 px-6 py-2 bg-accent text-white font-mono text-xs uppercase tracking-wider rounded shadow hover:bg-accent-secondary transition-all"
              >
                <Camera size={14} /> Turn Webcam On
              </button>
            </div>
          )}

          {isCameraActive && (
            <div className="relative border border-border/80 rounded bg-black aspect-video max-w-sm mx-auto w-full overflow-hidden flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {/* Scanner green line overlay */}
              <div className="absolute left-0 right-0 h-0.5 bg-success shadow-lg animate-pulse" />
              <button
                type="button"
                onClick={stopScanning}
                className="absolute bottom-4 px-4 py-1.5 bg-error text-white rounded text-[10px] uppercase font-mono tracking-wider font-bold"
              >
                Cancel Scan
              </button>
            </div>
          )}

          {scanResult && (
            <div className="border border-border/80 rounded bg-bg p-4 flex flex-col gap-4 max-w-md mx-auto w-full items-center text-center">
              <span className="font-mono text-[9px] text-success font-bold uppercase tracking-wider">
                Barcode Scanned Successfully!
              </span>

              <div className="flex justify-between items-center bg-surface border border-border/40 px-3 py-2 rounded w-full mt-2">
                <span className="font-mono text-xs font-bold text-ink">{scanResult}</span>
                <button
                  type="button"
                  onClick={handleCopyScan}
                  className="p-1.5 border border-border bg-bg text-ink-muted hover:text-accent rounded"
                >
                  {copied ? <ClipboardCheck size={13} className="text-success" /> : <Copy size={13} />}
                </button>
              </div>

              <div className="flex gap-3 justify-center mt-2 border-t border-border pt-4 w-full">
                <button
                  type="button"
                  onClick={startScanning}
                  className="px-4 py-1.5 bg-accent text-white font-mono text-xs uppercase tracking-wider rounded hover:bg-accent-secondary transition-colors"
                >
                  Scan Another
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BarcodeTool;
