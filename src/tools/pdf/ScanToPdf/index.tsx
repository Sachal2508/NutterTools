import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob } from '../../../lib/fileHelper';
import { Camera, Upload, Trash2 } from 'lucide-react';

interface ScanPage {
  id: string;
  originalSrc: string;
  filteredSrc: string;
  filter: 'original' | 'bw' | 'grayscale' | 'contrast';
}

export const ScanToPdf: React.FC = () => {
  const [pages, setPages] = useState<ScanPage[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [filterType, setFilterType] = useState<'original' | 'bw' | 'grayscale' | 'contrast'>('bw');
  
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const startCamera = async () => {
    try {
      setResultBlob(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setIsCameraActive(true);
      
      // Delay slightly to allow videoRef to attach
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error(err);
      alert('Camera access denied or unavailable. You can still upload images to scan.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const applyScanFilters = (imgSrc: string, filter: 'original' | 'bw' | 'grayscale' | 'contrast'): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imgSrc);
          return;
        }
        ctx.drawImage(img, 0, 0);
        
        if (filter === 'original') {
          resolve(imgSrc);
          return;
        }

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Calculate luminance
          const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;

          if (filter === 'grayscale') {
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          } else if (filter === 'bw') {
            // High-contrast document threshold filter
            const threshold = 128;
            const val = gray > threshold ? 255 : 0;
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
          } else if (filter === 'contrast') {
            // Boost color contrast
            const factor = 1.8; // contrast multiplier
            const rFactor = Math.min(255, Math.max(0, factor * (r - 128) + 128));
            const gFactor = Math.min(255, Math.max(0, factor * (g - 128) + 128));
            const bFactor = Math.min(255, Math.max(0, factor * (b - 128) + 128));
            data[i] = rFactor;
            data[i + 1] = gFactor;
            data[i + 2] = bFactor;
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = imgSrc;
    });
  };

  const captureFrame = async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const originalSrc = canvas.toDataURL('image/jpeg', 0.9);
    
    // Apply default filter type
    const filteredSrc = await applyScanFilters(originalSrc, filterType);

    const newPage: ScanPage = {
      id: `scan-${Date.now()}`,
      originalSrc,
      filteredSrc,
      filter: filterType,
    };

    setPages([...pages, newPage]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setResultBlob(null);

    const filesList = Array.from(e.target.files);
    const newPages: ScanPage[] = [];

    for (let i = 0; i < filesList.length; i++) {
      const f = filesList[i];
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(f);
      });

      const filteredSrc = await applyScanFilters(dataUrl, filterType);
      
      newPages.push({
        id: `upload-${Date.now()}-${i}`,
        originalSrc: dataUrl,
        filteredSrc,
        filter: filterType,
      });
    }

    setPages([...pages, ...newPages]);
  };

  const changePageFilter = async (idx: number, filter: 'original' | 'bw' | 'grayscale' | 'contrast') => {
    const updated = [...pages];
    const filteredSrc = await applyScanFilters(updated[idx].originalSrc, filter);
    updated[idx].filter = filter;
    updated[idx].filteredSrc = filteredSrc;
    setPages(updated);
    setResultBlob(null);
  };

  const deletePage = (idx: number) => {
    setPages(pages.filter((_, i) => i !== idx));
    setResultBlob(null);
  };

  const buildScanPdf = async () => {
    if (pages.length === 0) return;

    setIsProcessing(true);
    setProgress(15);
    setStatus('Generating PDF pages from scans...');

    try {
      const pdfDoc = await PDFDocument.create();

      const dataUrlToBytes = (dataUrl: string): Uint8Array => {
        const base64 = dataUrl.split(',')[1];
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      };

      for (let k = 0; k < pages.length; k++) {
        setStatus(`Embedding scanned page ${k + 1} of ${pages.length}...`);
        setProgress(20 + Math.round((k / pages.length) * 65));

        const item = pages[k];
        const imgBytes = dataUrlToBytes(item.filteredSrc);
        const embeddedImg = await pdfDoc.embedJpg(imgBytes);

        // A4 page size in points
        const page = pdfDoc.addPage([595.28, 841.89]);
        
        // Scale and center scan within standard sheet margins
        const imgDims = embeddedImg.scaleToFit(555.28, 801.89);
        const x = (595.28 - imgDims.width) / 2;
        const y = (841.89 - imgDims.height) / 2;

        page.drawImage(embeddedImg, {
          x,
          y,
          width: imgDims.width,
          height: imgDims.height,
        });
      }

      setProgress(90);
      setStatus('Packaging PDF document elements...');

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes as any], { type: 'application/pdf' });

      setResultBlob(blob);
      setProgress(100);
      setStatus('Compilation complete.');
      stopCamera();
    } catch (err: any) {
      console.error(err);
      setStatus('Compilation failed. Please try again.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultBlob) {
      downloadBlob(resultBlob, `document-scan-${Date.now()}.pdf`);
    }
  };

  const handleReset = () => {
    stopCamera();
    setPages([]);
    setResultBlob(null);
    setProgress(0);
    setStatus('');
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col gap-4 border border-border rounded bg-surface p-4">
        <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2">
          Page Capture Setup /
        </h4>
        
        <div className="flex flex-wrap gap-3">
          {!isCameraActive ? (
            <button
              type="button"
              onClick={startCamera}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white font-mono text-xs uppercase tracking-wider rounded shadow hover:bg-accent-secondary transition-colors"
            >
              <Camera size={14} /> Use Camera
            </button>
          ) : (
            <button
              type="button"
              onClick={stopCamera}
              className="flex items-center gap-2 px-4 py-2 border border-border text-ink-muted bg-bg font-mono text-xs uppercase tracking-wider rounded hover:text-ink transition-colors"
            >
              Turn Camera Off
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 border border-border text-ink-muted bg-surface font-mono text-xs uppercase tracking-wider rounded hover:text-ink hover:bg-bg transition-colors"
          >
            <Upload size={14} /> Upload Images
          </button>

          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="flex items-center gap-2 ml-auto">
            <span className="font-mono text-[10px] text-ink-muted uppercase">Default Filter:</span>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
              className="px-2 py-1 border border-border rounded bg-bg text-ink text-xs focus:border-accent outline-none font-sans"
            >
              <option value="original">Original Photo</option>
              <option value="bw">B&W Document</option>
              <option value="grayscale">Grayscale</option>
              <option value="contrast">High Contrast</option>
            </select>
          </div>
        </div>

        {isCameraActive && (
          <div className="relative border border-border/80 rounded bg-black aspect-video max-w-lg mx-auto w-full overflow-hidden flex flex-col items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={captureFrame}
              className="absolute bottom-4 px-6 py-2 bg-accent text-white rounded-full shadow-lg font-mono text-xs uppercase tracking-wider font-bold hover:bg-accent-secondary transform hover:scale-105 active:scale-95 transition-all"
            >
              Capture Page
            </button>
          </div>
        )}
      </div>

      {pages.length > 0 && !resultBlob && !isProcessing && (
        <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in">
          <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2">
            Scanned Pages List ({pages.length}) /
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 py-2 max-h-[350px] overflow-y-auto p-1">
            {pages.map((item, idx) => {
              return (
                <div
                  key={item.id}
                  className="relative border border-border rounded p-2 bg-bg flex flex-col items-center gap-1.5 group select-none hover:shadow-md transition-shadow"
                >
                  <span className="font-mono text-[9px] text-ink-muted">Page {idx + 1}</span>
                  
                  <div className="relative border border-border/50 bg-white rounded overflow-hidden aspect-[1/1.4] w-28 flex items-center justify-center">
                    <img src={item.filteredSrc} alt={`Scan preview`} className="max-w-full max-h-full object-contain" />
                  </div>

                  <div className="flex flex-col gap-1 w-full mt-1 border-t border-border/40 pt-1.5">
                    <select
                      value={item.filter}
                      onChange={e => changePageFilter(idx, e.target.value as any)}
                      className="w-full text-[9px] border border-border bg-surface text-ink-muted rounded outline-none p-0.5"
                    >
                      <option value="original">Original</option>
                      <option value="bw">B&W Scan</option>
                      <option value="grayscale">Grayscale</option>
                      <option value="contrast">Contrast</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => deletePage(idx)}
                      className="flex items-center justify-center gap-1 w-full py-0.5 border border-border text-ink-muted hover:text-error hover:border-error/20 bg-surface rounded text-[9px] uppercase tracking-wider"
                    >
                      <Trash2 size={9} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4 mt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
            >
              Reset
            </button>
            <DownloadButton onClick={buildScanPdf} label="Build PDF" />
          </div>
        </div>
      )}

      {isProcessing && <ProgressBar progress={progress} status={status} />}

      {resultBlob && (
        <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
          <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
            Scan Status /
          </h4>
          <p className="text-sm font-sans text-ink">
            Scanned PDF document compiled successfully ({pages.length} pages total).
          </p>

          <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
            >
              Scan More
            </button>
            <DownloadButton onClick={handleDownload} label="Download PDF" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanToPdf;
