import React, { useState, useRef } from 'react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer } from '../../../lib/fileHelper';
import { Upload } from 'lucide-react';

export const AddWatermark: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  
  // Watermark Settings
  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(0.2); // 0.0 to 1.0
  const [rotation, setRotation] = useState(45); // degrees
  const [color, setColor] = useState('#ff0000'); // hex
  const [position, setPosition] = useState<'center' | 'tile'>('center');
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageScale, setImageScale] = useState(0.5);

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [watermarkedBlob, setWatermarkedBlob] = useState<Blob | null>(null);

  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setWatermarkedBlob(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return rgb(r, g, b);
  };

  const handleApplyWatermark = async () => {
    if (!file) return;
    if (watermarkType === 'image' && !imageFile) {
      alert('Please upload a watermark image first.');
      return;
    }

    setIsProcessing(true);
    setProgress(15);
    setStatus('Initializing PDF context...');

    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const numPages = pdfDoc.getPageCount();

      setProgress(40);
      setStatus('Embedding watermark elements...');

      let embeddedImage: any = null;
      if (watermarkType === 'image' && imageFile) {
        const imgBuffer = await readFileAsArrayBuffer(imageFile);
        if (imageFile.type === 'image/png') {
          embeddedImage = await pdfDoc.embedPng(imgBuffer);
        } else {
          embeddedImage = await pdfDoc.embedJpg(imgBuffer);
        }
      }

      // Load Helvetica font for text watermarking
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontColor = hexToRgb(color);

      for (let i = 0; i < numPages; i++) {
        setStatus(`Drawing watermark on page ${i + 1} of ${numPages}...`);
        setProgress(40 + Math.round((i / numPages) * 50));

        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();

        if (watermarkType === 'text') {
          // Calculate text dimensions
          const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);
          
          if (position === 'center') {
            const x = (width - textWidth) / 2;
            const y = height / 2;
            
            page.drawText(text, {
              x,
              y,
              size: fontSize,
              font: helveticaFont,
              color: fontColor,
              opacity,
              rotate: degrees(rotation),
            });
          } else {
            // Tiled grid mode
            const cols = 3;
            const rows = 4;
            const xSpacing = width / cols;
            const ySpacing = height / rows;

            for (let r = 0; r < rows; r++) {
              for (let c = 0; c < cols; c++) {
                page.drawText(text, {
                  x: c * xSpacing + xSpacing / 4,
                  y: r * ySpacing + ySpacing / 2,
                  size: fontSize * 0.7,
                  font: helveticaFont,
                  color: fontColor,
                  opacity: opacity * 0.8,
                  rotate: degrees(rotation),
                });
              }
            }
          }
        } else if (watermarkType === 'image' && embeddedImage) {
          const imgDims = embeddedImage.scale(imageScale);
          
          if (position === 'center') {
            const x = (width - imgDims.width) / 2;
            const y = (height - imgDims.height) / 2;

            page.drawImage(embeddedImage, {
              x,
              y,
              width: imgDims.width,
              height: imgDims.height,
              opacity,
            });
          } else {
            // Tiled grid mode for images
            const cols = 2;
            const rows = 3;
            const xSpacing = width / cols;
            const ySpacing = height / rows;

            for (let r = 0; r < rows; r++) {
              for (let c = 0; c < cols; c++) {
                page.drawImage(embeddedImage, {
                  x: c * xSpacing + (xSpacing - imgDims.width) / 2,
                  y: r * ySpacing + (ySpacing - imgDims.height) / 2,
                  width: imgDims.width,
                  height: imgDims.height,
                  opacity: opacity * 0.8,
                });
              }
            }
          }
        }
      }

      setProgress(95);
      setStatus('Packaging watermarked PDF output...');
      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes as any], { type: 'application/pdf' });

      setWatermarkedBlob(blob);
      setProgress(100);
      setStatus('Watermark applied successfully.');
    } catch (err: any) {
      console.error(err);
      setStatus('Watermarking process failed.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (watermarkedBlob && file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      downloadBlob(watermarkedBlob, `${baseName}-watermarked.pdf`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setImageFile(null);
    setWatermarkedBlob(null);
    setProgress(0);
    setStatus('');
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {!file ? (
        <DropZone accept="application/pdf" acceptLabel="PDF file" onFilesAdded={handleFilesAdded} />
      ) : (
        <div className="flex flex-col gap-4">
          <FileCard file={file} index={0} totalFiles={1} onRemove={handleReset} />

          {!watermarkedBlob && !isProcessing && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
              <div className="flex flex-wrap gap-4 border-b border-border pb-3">
                <button
                  type="button"
                  onClick={() => setWatermarkType('text')}
                  className={`px-3 py-1 text-xs font-mono uppercase tracking-wider border rounded transition-colors ${
                    watermarkType === 'text' ? 'border-accent bg-accent/5 text-ink' : 'border-border text-ink-muted hover:text-ink'
                  }`}
                >
                  Text Watermark
                </button>
                <button
                  type="button"
                  onClick={() => setWatermarkType('image')}
                  className={`px-3 py-1 text-xs font-mono uppercase tracking-wider border rounded transition-colors ${
                    watermarkType === 'image' ? 'border-accent bg-accent/5 text-ink' : 'border-border text-ink-muted hover:text-ink'
                  }`}
                >
                  Image Watermark
                </button>
              </div>

              {watermarkType === 'text' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono text-[9px] text-ink-muted uppercase">Watermark Text /</span>
                    <input
                      type="text"
                      value={text}
                      onChange={e => setText(e.target.value)}
                      className="px-3 py-1.5 border border-border bg-bg text-ink rounded text-xs focus:border-accent outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono text-[9px] text-ink-muted uppercase">Font Color /</span>
                    <input
                      type="color"
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      className="w-full h-8 border border-border rounded bg-bg cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono text-[9px] text-ink-muted uppercase">Font Size ({fontSize}px) /</span>
                    <input
                      type="range"
                      min={12}
                      max={120}
                      value={fontSize}
                      onChange={e => setFontSize(parseInt(e.target.value))}
                      className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono text-[9px] text-ink-muted uppercase">Rotation Angle ({rotation}°) /</span>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={rotation}
                      onChange={e => setRotation(parseInt(e.target.value))}
                      className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono text-[9px] text-ink-muted uppercase">Upload Watermark Image /</span>
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 w-full py-2 border border-dashed border-border hover:border-accent bg-bg rounded text-xs text-ink-muted hover:text-ink transition-all"
                    >
                      <Upload size={13} /> {imageFile ? imageFile.name : 'Choose JPEG or PNG'}
                    </button>
                    <input
                      type="file"
                      ref={imageInputRef}
                      accept="image/png,image/jpeg"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono text-[9px] text-ink-muted uppercase">Image Scale ({Math.round(imageScale * 100)}%) /</span>
                    <input
                      type="range"
                      min={0.1}
                      max={2.0}
                      step={0.05}
                      value={imageScale}
                      onChange={e => setImageScale(parseFloat(e.target.value))}
                      className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[9px] text-ink-muted uppercase">Opacity ({Math.round(opacity * 100)}%) /</span>
                  <input
                    type="range"
                    min={0.05}
                    max={0.95}
                    step={0.05}
                    value={opacity}
                    onChange={e => setOpacity(parseFloat(e.target.value))}
                    className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[9px] text-ink-muted uppercase">Watermark Position /</span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPosition('center')}
                      className={`py-1.5 border rounded text-xs font-sans font-bold transition-colors ${
                        position === 'center' ? 'border-accent bg-accent/5 text-ink' : 'border-border text-ink-muted bg-surface'
                      }`}
                    >
                      Center Stamp
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosition('tile')}
                      className={`py-1.5 border rounded text-xs font-sans font-bold transition-colors ${
                        position === 'tile' ? 'border-accent bg-accent/5 text-ink' : 'border-border text-ink-muted bg-surface'
                      }`}
                    >
                      Tiled Grid
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Reset
                </button>
                <DownloadButton onClick={handleApplyWatermark} label="Apply Watermark" />
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {watermarkedBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                Watermark Status /
              </h4>
              <p className="text-sm font-sans text-ink">
                Watermark overlay completed successfully.
              </p>

              <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleDownload} label="Download Watermarked PDF" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddWatermark;
