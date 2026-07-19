import React, { useState } from 'react';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer } from '../../../lib/fileHelper';
import { ShieldCheck } from 'lucide-react';

export const DpiConverter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [dpi, setDpi] = useState<number>(300);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      const f = files[0];
      setFile(f);
      setConvertedBlob(null);
      
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result as string);
      reader.readAsDataURL(f);
    }
  };

  // Rewrite JPEG APP0 or PNG pHYs chunks to set DPI values in binary headers
  const convertImageDpi = (buffer: ArrayBuffer, targetDpi: number): Blob => {
    const uint8 = new Uint8Array(buffer);
    const view = new DataView(buffer);

    // 1. Check if PNG
    if (uint8[0] === 0x89 && uint8[1] === 0x50 && uint8[2] === 0x4E && uint8[3] === 0x47) {
      return changePngDpi(buffer, targetDpi);
    }

    // 2. Check if JPEG (SOI marker)
    if (view.getUint16(0) === 0xFFD8) {
      return changeJpegDpi(uint8, targetDpi);
    }

    // Default return original blob if format is unhandled
    return new Blob([buffer], { type: file?.type || 'image/jpeg' });
  };

  const changeJpegDpi = (uint8: Uint8Array, targetDpi: number): Blob => {
    // Search for APP0 (FF E0) segment within first 200 bytes
    let offset = 2;
    let app0Offset = -1;

    while (offset < uint8.length - 4) {
      const marker = (uint8[offset] << 8) | uint8[offset + 1];
      if (marker === 0xFFE0) {
        app0Offset = offset;
        break;
      }
      if ((marker & 0xFF00) !== 0xFF00) break;
      offset += 2 + ((uint8[offset + 2] << 8) | uint8[offset + 3]);
    }

    if (app0Offset !== -1) {
      // Modify existing APP0 JFIF density properties
      // units at offset + 9, Xdensity at offset + 10, Ydensity at offset + 12
      const modifiedBytes = new Uint8Array(uint8);
      modifiedBytes[app0Offset + 9] = 1; // 1 = dots per inch (DPI)
      
      // Write DPI (2 bytes)
      modifiedBytes[app0Offset + 10] = (targetDpi >> 8) & 0xFF;
      modifiedBytes[app0Offset + 11] = targetDpi & 0xFF;
      modifiedBytes[app0Offset + 12] = (targetDpi >> 8) & 0xFF;
      modifiedBytes[app0Offset + 13] = targetDpi & 0xFF;
      
      return new Blob([modifiedBytes as any], { type: 'image/jpeg' });
    } else {
      // Rebuild JPEG by inserting a clean APP0 JFIF header block right after SOI marker
      const app0Header = new Uint8Array([
        0xFF, 0xE0, // APP0 marker
        0x00, 0x10, // segment size (16 bytes)
        0x4A, 0x46, 0x49, 0x46, 0x00, // "JFIF\0"
        0x01, 0x01, // Version 1.01
        0x01, // Units: dots per inch
        (targetDpi >> 8) & 0xFF, targetDpi & 0xFF, // Xdensity
        (targetDpi >> 8) & 0xFF, targetDpi & 0xFF, // Ydensity
        0x00, 0x00 // thumbnail width & height
      ]);

      const newBytes = new Uint8Array(uint8.length + app0Header.length);
      newBytes.set(uint8.subarray(0, 2), 0); // SOI (FF D8)
      newBytes.set(app0Header, 2); // APP0 Header
      newBytes.set(uint8.subarray(2), 2 + app0Header.length); // Original body
      
      return new Blob([newBytes as any], { type: 'image/jpeg' });
    }
  };

  const changePngDpi = (buffer: ArrayBuffer, targetDpi: number): Blob => {
    // 1 meter = 39.3701 inches. pHYs chunks specify pixels per meter.
    const pixelsPerMeter = Math.round(targetDpi * 39.3701);
    
    // Create new pHYs chunk: Length (4 bytes), Tag "pHYs" (4 bytes), Xpx (4 bytes), Ypx (4 bytes), Unit (1 byte = meter), CRC (4 bytes)
    const physBytes = new Uint8Array([
      0x00, 0x00, 0x00, 0x09, // Length: 9 bytes
      0x70, 0x48, 0x59, 0x73, // Chunk Type: "pHYs"
      (pixelsPerMeter >> 24) & 0xFF, (pixelsPerMeter >> 16) & 0xFF, (pixelsPerMeter >> 8) & 0xFF, pixelsPerMeter & 0xFF, // X pixels per meter
      (pixelsPerMeter >> 24) & 0xFF, (pixelsPerMeter >> 16) & 0xFF, (pixelsPerMeter >> 8) & 0xFF, pixelsPerMeter & 0xFF, // Y pixels per meter
      0x01, // Unit: meters
      0x00, 0x00, 0x00, 0x00 // Place-holder for CRC calculation
    ]);

    // Simple CRC-32 calculation for compliance
    const calcCrc = (bytes: Uint8Array): number => {
      let crc = 0xFFFFFFFF;
      for (let i = 4; i < bytes.length - 4; i++) {
        const c = bytes[i];
        for (let j = 0; j < 8; j++) {
          if ((crc ^ c) & 1) {
            crc = (crc >>> 1) ^ 0xEDB88320;
          } else {
            crc = crc >>> 1;
          }
        }
      }
      return crc ^ 0xFFFFFFFF;
    };

    const crc = calcCrc(physBytes);
    const view = new DataView(physBytes.buffer);
    view.setUint32(physBytes.length - 4, crc, false); // big endian

    const original = new Uint8Array(buffer);
    
    // Reconstruct PNG inserting the pHYs chunk immediately after the IHDR chunk (always at offset 33)
    const newBytes = new Uint8Array(original.length + physBytes.length);
    newBytes.set(original.subarray(0, 33), 0); // PNG signature + IHDR
    newBytes.set(physBytes, 33); // Insert pHYs chunk
    newBytes.set(original.subarray(33), 33 + physBytes.length); // Rest of PNG body

    return new Blob([newBytes as any], { type: 'image/png' });
  };

  const handleConvertDpi = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const buffer = await readFileAsArrayBuffer(file);
      const blob = convertImageDpi(buffer, dpi);
      setConvertedBlob(blob);
    } catch (err) {
      console.error(err);
      alert('Failed to rewrite image DPI headers.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (convertedBlob && file) {
      downloadBlob(convertedBlob, file.name);
    }
  };

  const handleReset = () => {
    setFile(null);
    setImageSrc(null);
    setConvertedBlob(null);
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {!imageSrc ? (
        <DropZone accept="image/png,image/jpeg" acceptLabel="JPEG or PNG photograph" onFilesAdded={handleFilesAdded} />
      ) : (
        <div className="flex flex-col gap-4 animate-fade-in">
          <FileCard file={file!} index={0} totalFiles={1} onRemove={handleReset} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Controls */}
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 h-fit">
              <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2">
                DPI Specifications /
              </span>

              <div className="flex flex-col gap-2">
                <span className="font-mono text-[9px] text-ink-muted uppercase">Target DPI Value /</span>
                <div className="grid grid-cols-4 gap-2">
                  {[72, 96, 150, 300].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => { setDpi(val); setConvertedBlob(null); }}
                      className={`py-1.5 border rounded text-xs font-mono font-bold transition-colors ${
                        dpi === val ? 'border-accent bg-accent/5 text-ink' : 'border-border text-ink-muted bg-surface'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[9px] text-ink-muted uppercase">Custom Value /</span>
                <input
                  type="number"
                  value={dpi}
                  min={1}
                  max={2400}
                  onChange={e => { setDpi(Math.max(1, parseInt(e.target.value) || 300)); setConvertedBlob(null); }}
                  className="px-3 py-1.5 border border-border bg-bg text-ink rounded text-xs focus:border-accent outline-none"
                />
              </div>

              <div className="p-3 bg-accent/5 border border-accent/20 rounded text-[10px] text-ink-muted leading-relaxed">
                <strong>Quality Notice:</strong> Modifying the DPI header rewrites metadata resolution flags without resynthesizing pixel details or resizing images. This ensures 100% original visual quality.
              </div>

              {!convertedBlob && !isProcessing && (
                <div className="flex justify-end gap-3 mt-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase hover:text-ink hover:bg-bg transition-colors"
                  >
                    Reset
                  </button>
                  <DownloadButton onClick={handleConvertDpi} label="Convert DPI" />
                </div>
              )}
            </div>

            {/* Display status */}
            <div className="lg:col-span-2 border border-border rounded bg-surface p-4 flex flex-col gap-4 text-center items-center justify-center">
              {convertedBlob ? (
                <div className="flex flex-col items-center justify-center gap-4 py-6">
                  <ShieldCheck size={48} className="text-success animate-bounce" />
                  <h4 className="text-sm font-sans font-bold text-ink">Image Header Updated!</h4>
                  <div className="bg-bg border border-border rounded p-3 text-xs text-ink-muted leading-relaxed max-w-xs text-center">
                    Density header updated successfully to <strong>{dpi} DPI</strong>. Ready for upload.
                  </div>
                  <div className="flex gap-3 justify-center mt-2 border-t border-border pt-4 w-full">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase hover:text-ink hover:bg-bg transition-colors"
                    >
                      Start Over
                    </button>
                    <DownloadButton onClick={handleDownload} label="Download Image" />
                  </div>
                </div>
              ) : (
                <>
                  <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                    Photo Preview /
                  </span>
                  <div className="relative border border-border/50 bg-black/5 rounded overflow-hidden aspect-[1.3/1] max-w-sm w-full flex items-center justify-center mt-4">
                    <img src={imageSrc} alt="DPI photo preview" className="max-w-full max-h-full object-contain" />
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default DpiConverter;
