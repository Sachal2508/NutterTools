import React, { useState } from 'react';
import heic2any from 'heic2any';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob } from '../../../lib/fileHelper';

export const ImageFormatConverter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<string>('image/png');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);

  const formats = [
    { mime: 'image/png', ext: '.png', label: 'PNG' },
    { mime: 'image/jpeg', ext: '.jpg', label: 'JPEG / JPG' },
    { mime: 'image/webp', ext: '.webp', label: 'WebP' },
    { mime: 'image/gif', ext: '.gif', label: 'GIF' },
    { mime: 'image/bmp', ext: '.bmp', label: 'BMP' },
  ];

  const handleFilesAdded = async (files: File[]) => {
    if (files.length === 0) return;
    let selected = files[0];
    setConvertedBlob(null);

    const ext = selected.name.split('.').pop()?.toLowerCase();
    
    // HEIC support
    if (ext === 'heic' || selected.type === 'image/heic') {
      setIsProcessing(true);
      setProgress(20);
      setStatus('Converting HEIC file to JPEG in browser...');
      
      try {
        const result = await heic2any({
          blob: selected,
          toType: 'image/jpeg',
          quality: 0.9,
        });
        
        const blob = Array.isArray(result) ? result[0] : result;
        selected = new File([blob], selected.name.replace(/\.heic$/i, '.jpg'), {
          type: 'image/jpeg',
        });
        
        setProgress(100);
        setStatus('HEIC conversion completed.');
      } catch (err) {
        console.error(err);
        alert('HEIC file conversion failed. Ensure it is a valid HEIC image.');
        setIsProcessing(false);
        return;
      } finally {
        setIsProcessing(false);
      }
    }

    setFile(selected);
  };

  const handleConvert = () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(30);
    setStatus('Loading image on canvas...');

    const img = new Image();
    img.onload = () => {
      setProgress(60);
      setStatus('Rendering image to target format...');

      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not create context');

        // Draw image, handling transparent background if converting to JPEG
        if (outputFormat === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);

        setProgress(85);
        setStatus('Generating export image file...');

        canvas.toBlob(
          blob => {
            if (blob) {
              setConvertedBlob(blob);
              setProgress(100);
              setStatus('Conversion complete.');
            } else {
              throw new Error('Canvas export failed');
            }
            setIsProcessing(false);
          },
          outputFormat,
          0.92
        );
      } catch (err) {
        console.error(err);
        setStatus('Conversion failed.');
        setIsProcessing(false);
        setProgress(0);
      }
    };

    img.onerror = () => {
      setStatus('Failed to load image.');
      setIsProcessing(false);
      setProgress(0);
    };

    img.src = URL.createObjectURL(file);
  };

  const handleDownload = () => {
    if (convertedBlob && file) {
      const selectedFormat = formats.find(f => f.mime === outputFormat);
      const ext = selectedFormat ? selectedFormat.ext : '.png';
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      downloadBlob(convertedBlob, `${baseName}${ext}`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setConvertedBlob(null);
    setProgress(0);
    setStatus('');
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {!file ? (
        <DropZone
          // Accept standard formats + HEIC
          accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,.heic"
          acceptLabel="Images (PNG, JPG, WebP, GIF, BMP, HEIC)"
          onFilesAdded={handleFilesAdded}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <FileCard file={file} index={0} totalFiles={1} onRemove={handleReset} />

          {!convertedBlob && !isProcessing && (
            <div className="border border-border rounded p-4 bg-surface flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="format-select" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                  Select Output Format /
                </label>
                <select
                  id="format-select"
                  value={outputFormat}
                  onChange={e => setOutputFormat(e.target.value)}
                  className="w-full p-2 bg-bg border border-border rounded text-sm text-ink outline-none focus:border-accent font-sans"
                >
                  {formats.map(f => (
                    <option key={f.mime} value={f.mime}>
                      {f.label} ({f.ext})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Reset
                </button>
                <DownloadButton onClick={handleConvert} label="Convert Format" />
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {convertedBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                Conversion Status /
              </h4>
              <p className="text-sm font-sans text-ink">
                Your file was successfully converted to{' '}
                <strong className="text-accent-secondary">
                  {formats.find(f => f.mime === outputFormat)?.label}
                </strong>
              </p>

              <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleDownload} label="Download Converted Image" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageFormatConverter;
