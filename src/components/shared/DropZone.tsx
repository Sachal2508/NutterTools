import React, { useCallback, useRef, useState } from 'react';
import { UploadCloud, AlertTriangle, File as FileIcon } from 'lucide-react';

interface DropZoneProps {
  accept: string;
  acceptLabel: string;
  multiple?: boolean;
  onFilesAdded: (files: File[]) => void;
  maxSizeMB?: number;
}

export const DropZone: React.FC<DropZoneProps> = ({
  accept,
  acceptLabel,
  multiple = false,
  onFilesAdded,
  maxSizeMB = 50,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback((files: FileList): File[] => {
    const fileArray = Array.from(files);
    setError(null);

    if (!multiple && fileArray.length > 1) {
      setError('This tool accepts a single file at a time.');
      return [];
    }

    const isAccepted = (file: File) => {
      if (!accept) return true;
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();
      return accept.split(',').map(t => t.trim().toLowerCase()).some(type => {
        if (type.endsWith('/*')) return fileType.startsWith(`${type.split('/')[0]}/`);
        if (type.startsWith('.')) return fileName.endsWith(type);
        return fileType === type;
      });
    };

    for (const file of fileArray) {
      if (!isAccepted(file)) {
        setError(`That file type isn't supported here. Try a ${acceptLabel}.`);
        return [];
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File exceeds the ${maxSizeMB}MB limit. Please use a smaller file.`);
        return [];
      }
    }

    return fileArray;
  }, [accept, acceptLabel, multiple, maxSizeMB]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files?.length) {
      const valid = validateFiles(e.dataTransfer.files);
      if (valid.length) onFilesAdded(valid);
    }
  }, [validateFiles, onFilesAdded]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const valid = validateFiles(e.target.files);
      if (valid.length) onFilesAdded(valid);
    }
  }, [validateFiles, onFilesAdded]);

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        id="drop-zone-container"
        className={`relative w-full min-h-[220px] rounded-2xl border-2 border-dashed cursor-pointer
          flex flex-col items-center justify-center text-center gap-4 p-6 select-none
          transition-all duration-250 group overflow-hidden
          ${isDragActive
            ? 'border-accent bg-accent/8 scale-[0.99] shadow-glow-sm'
            : 'border-border hover:border-accent/60 bg-surface hover:bg-surface-raised'
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
          id="drop-zone-input"
        />

        {/* Animated icon */}
        <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300
          ${isDragActive
            ? 'bg-accent/15 border-accent/40 scale-110 text-accent'
            : 'bg-bg border border-border text-ink-muted group-hover:scale-105 group-hover:text-accent group-hover:border-accent/40'
          } border`}>
          {isDragActive
            ? <FileIcon size={24} className="animate-bounce-in" />
            : <UploadCloud size={24} className="transition-transform group-hover:translate-y-[-2px]" />
          }
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-ink">
            {isDragActive
              ? 'Release to upload'
              : multiple ? 'Drop files here, or click to browse' : 'Drop a file here, or click to browse'
            }
          </p>
          <p className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
            {acceptLabel} · max {maxSizeMB} MB
          </p>
        </div>

        {/* Dashed border shimmer on drag */}
        {isDragActive && (
          <div className="absolute inset-0 rounded-2xl border-2 border-accent/40 pointer-events-none" />
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-danger/8 border border-danger/25 rounded-xl text-xs text-danger animate-bounce-in">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default DropZone;
