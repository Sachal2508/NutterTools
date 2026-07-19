import React, { useState } from 'react';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer, formatBytes } from '../../../lib/fileHelper';
import { Camera, Calendar, MapPin, EyeOff, ShieldCheck } from 'lucide-react';

interface ExifData {
  make?: string;
  model?: string;
  dateTime?: string;
  software?: string;
  latitude?: string;
  longitude?: string;
  hasExif: boolean;
}

export const ExifStripper: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [exif, setExif] = useState<ExifData | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [cleanedBlob, setCleanedBlob] = useState<Blob | null>(null);

  const handleFilesAdded = async (files: File[]) => {
    if (files.length > 0) {
      const f = files[0];
      setFile(f);
      setCleanedBlob(null);

      // Create preview source URL
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result as string);
      reader.readAsDataURL(f);

      // Parse metadata from ArrayBuffer
      try {
        const arrayBuffer = await readFileAsArrayBuffer(f);
        const parsed = parseExifHeaders(arrayBuffer);
        setExif(parsed);
      } catch (err) {
        console.error('Metadata parsing error:', err);
        setExif({ hasExif: false });
      }
    }
  };

  // A lightweight EXIF parser that scans APP1 JPEG markers client-side
  const parseExifHeaders = (buffer: ArrayBuffer): ExifData => {
    const dataView = new DataView(buffer);
    if (dataView.getUint16(0) !== 0xFFD8) {
      // Not a valid JPEG file
      return { hasExif: false };
    }

    let offset = 2;
    const length = buffer.byteLength;

    while (offset < length) {
      const marker = dataView.getUint16(offset);
      if (marker === 0xFFE1) {
        // APP1 Marker containing EXIF data!
        return extractTiffTags(dataView, offset + 4);
      } else if ((marker & 0xFF00) !== 0xFF00) {
        break;
      } else {
        offset += 2 + dataView.getUint16(offset + 2);
      }
    }

    return { hasExif: false };
  };

  const extractTiffTags = (dataView: DataView, offset: number): ExifData => {
    // Basic EXIF header check (Exif\0\0)
    if (dataView.getUint32(offset) !== 0x45786966 || dataView.getUint16(offset + 4) !== 0) {
      return { hasExif: false };
    }

    const tiffOffset = offset + 6;
    const bigEndian = dataView.getUint16(tiffOffset) === 0x4D4D; // MM for Big Endian, II for Little Endian
    
    if (dataView.getUint16(tiffOffset + 2, !bigEndian) !== 0x002A) {
      return { hasExif: false };
    }

    const ifdOffset = dataView.getUint32(tiffOffset + 4, !bigEndian);
    const tags: ExifData = { hasExif: true };

    const readString = (start: number, len: number) => {
      let str = '';
      for (let i = 0; i < len; i++) {
        const char = dataView.getUint8(start + i);
        if (char === 0) break; // null terminator
        str += String.fromCharCode(char);
      }
      return str.trim();
    };

    try {
      const numEntries = dataView.getUint16(tiffOffset + ifdOffset, !bigEndian);
      let entryOffset = tiffOffset + ifdOffset + 2;

      for (let i = 0; i < numEntries; i++) {
        const tag = dataView.getUint16(entryOffset, !bigEndian);
        const count = dataView.getUint32(entryOffset + 4, !bigEndian);
        const valOffset = dataView.getUint32(entryOffset + 8, !bigEndian);

        // Map standard tags
        if (tag === 0x010F) { // Make
          tags.make = readString(tiffOffset + valOffset, count);
        } else if (tag === 0x0110) { // Model
          tags.model = readString(tiffOffset + valOffset, count);
        } else if (tag === 0x0132) { // DateTime
          tags.dateTime = readString(tiffOffset + valOffset, count);
        } else if (tag === 0x013B) { // Artist
          tags.software = readString(tiffOffset + valOffset, count);
        }
        
        entryOffset += 12;
      }
    } catch (e) {
      console.warn('Error reading IFD tags:', e);
    }

    return tags;
  };

  const handleStripMetadata = () => {
    if (!imageSrc || !file) return;

    setIsProcessing(true);
    
    // Canvas recreation drops all EXIF APP markers automatically
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          setCleanedBlob(blob);
          setIsProcessing(false);
        }, 'image/jpeg', 0.95);
      }
    };
    img.src = imageSrc;
  };

  const handleDownload = () => {
    if (cleanedBlob && file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      downloadBlob(cleanedBlob, `${baseName}-cleaned.jpg`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setImageSrc(null);
    setExif(null);
    setCleanedBlob(null);
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {!imageSrc ? (
        <DropZone accept="image/jpeg" acceptLabel="JPEG photograph" onFilesAdded={handleFilesAdded} />
      ) : (
        <div className="flex flex-col gap-4 animate-fade-in">
          <FileCard file={file!} index={0} totalFiles={1} onRemove={handleReset} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Metadata telemetry */}
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 h-fit">
              <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2">
                Parsed EXIF Telemetry /
              </span>

              {exif && exif.hasExif ? (
                <div className="flex flex-col gap-3.5 py-1">
                  {exif.make && (
                    <div className="flex items-start gap-2.5">
                      <Camera size={15} className="text-accent mt-0.5" />
                      <div>
                        <span className="font-mono text-[8px] text-ink-muted uppercase block">Camera Manufacturer</span>
                        <span className="text-xs font-bold text-ink">{exif.make}</span>
                      </div>
                    </div>
                  )}
                  {exif.model && (
                    <div className="flex items-start gap-2.5">
                      <Camera size={15} className="text-accent mt-0.5" />
                      <div>
                        <span className="font-mono text-[8px] text-ink-muted uppercase block">Camera Model</span>
                        <span className="text-xs font-bold text-ink">{exif.model}</span>
                      </div>
                    </div>
                  )}
                  {exif.dateTime && (
                    <div className="flex items-start gap-2.5">
                      <Calendar size={15} className="text-accent mt-0.5" />
                      <div>
                        <span className="font-mono text-[8px] text-ink-muted uppercase block">Date & Time Taken</span>
                        <span className="text-xs font-bold text-ink">{exif.dateTime}</span>
                      </div>
                    </div>
                  )}
                  {(exif.latitude || exif.longitude) && (
                    <div className="flex items-start gap-2.5">
                      <MapPin size={15} className="text-error mt-0.5" />
                      <div>
                        <span className="font-mono text-[8px] text-ink-muted uppercase block">GPS Location Coordinates</span>
                        <span className="text-xs font-bold text-ink">{exif.latitude || '0.000'}, {exif.longitude || '0.000'}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 border border-border/60 bg-bg text-center rounded text-xs text-ink-muted italic">
                  No hidden location coordinates or camera EXIF details detected.
                </div>
              )}

              <div className="p-3 bg-accent/5 border border-accent/20 rounded text-[10px] text-ink-muted leading-relaxed">
                <strong>Why strip metadata?</strong> Photographs contain hidden metadata tags containing date, camera parameters, and GPS locations. Stripping them preserves your privacy.
              </div>

              {!cleanedBlob && !isProcessing && (
                <div className="flex gap-3 justify-end mt-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase hover:text-ink hover:bg-bg transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleStripMetadata}
                    className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white font-mono text-xs uppercase tracking-wider rounded shadow hover:bg-accent-secondary transition-colors"
                  >
                    <EyeOff size={13} /> Clean EXIF Tags
                  </button>
                </div>
              )}
            </div>

            {/* Preview image */}
            <div className="lg:col-span-2 border border-border rounded bg-surface p-4 flex flex-col gap-4 text-center items-center justify-center">
              {cleanedBlob ? (
                <div className="flex flex-col items-center justify-center gap-4 py-6">
                  <ShieldCheck size={48} className="text-success animate-bounce" />
                  <h4 className="text-sm font-sans font-bold text-ink">Metadata Stripped Successfully!</h4>
                  <div className="grid grid-cols-2 gap-4 text-center py-2 border border-border bg-bg rounded p-3 w-64">
                    <div>
                      <span className="font-mono text-[8px] text-ink-muted uppercase block">Original Size</span>
                      <span className="text-xs font-bold text-ink">{file ? formatBytes(file.size) : '0 B'}</span>
                    </div>
                    <div>
                      <span className="font-mono text-[8px] text-ink-muted uppercase block">Cleaned Size</span>
                      <span className="text-xs font-bold text-accent">{formatBytes(cleanedBlob.size)}</span>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-center mt-2 border-t border-border pt-4 w-full">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase hover:text-ink hover:bg-bg transition-colors"
                    >
                      Start Over
                    </button>
                    <DownloadButton onClick={handleDownload} label="Download Privacy Image" />
                  </div>
                </div>
              ) : (
                <>
                  <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                    Photo Preview /
                  </span>
                  <div className="relative border border-border/50 bg-black/5 rounded overflow-hidden aspect-[1.3/1] max-w-sm w-full flex items-center justify-center mt-4">
                    <img src={imageSrc} alt="EXIF photo preview" className="max-w-full max-h-full object-contain" />
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

export default ExifStripper;
