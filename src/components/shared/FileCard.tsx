import React from 'react';
import { File, X, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';

interface FileCardProps {
  file: File;
  index: number;
  totalFiles: number;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const getFileExt = (name: string) => name.split('.').pop()?.toUpperCase() || '?';

export const FileCard: React.FC<FileCardProps> = ({
  file,
  index,
  totalFiles,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const isImage = file.type.startsWith('image/');
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, isImage]);

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="group flex items-center gap-3 p-3 bg-surface border border-border rounded-xl shadow-card
        hover:border-accent/40 hover:shadow-card-hover transition-all duration-200 animate-fade-in relative"
      id={`file-card-${index}`}
    >
      {/* Drag handle */}
      {onDragStart && (
        <div className="text-ink-muted/50 hover:text-ink-muted cursor-grab active:cursor-grabbing hidden sm:block shrink-0 transition-colors">
          <GripVertical size={14} />
        </div>
      )}

      {/* Preview / Icon */}
      <div className="w-10 h-10 bg-bg border border-border rounded-lg flex items-center justify-center overflow-hidden shrink-0">
        {isImage && previewUrl
          ? <img src={previewUrl} alt="" className="w-full h-full object-cover" />
          : (
            <div className="flex flex-col items-center">
              <span className="font-mono text-[7px] font-bold text-accent leading-none">
                {getFileExt(file.name)}
              </span>
              <File size={12} className="text-ink-muted mt-0.5" />
            </div>
          )
        }
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink truncate leading-tight" title={file.name}>
          {file.name}
        </p>
        <p className="font-mono text-[10px] text-ink-muted uppercase tracking-wider mt-0.5">
          {formatSize(file.size)}
          {file.size > 50 * 1024 * 1024 && (
            <span className="ml-1.5 text-danger">· Large file</span>
          )}
        </p>
      </div>

      {/* Reorder buttons — mobile */}
      {(onMoveUp || onMoveDown) && (
        <div className="flex sm:hidden flex-col gap-0.5">
          {onMoveUp && index > 0 && (
            <button onClick={onMoveUp} className="p-1 text-ink-muted hover:text-ink rounded" aria-label="Move up">
              <ChevronUp size={12} />
            </button>
          )}
          {onMoveDown && index < totalFiles - 1 && (
            <button onClick={onMoveDown} className="p-1 text-ink-muted hover:text-ink rounded" aria-label="Move down">
              <ChevronDown size={12} />
            </button>
          )}
        </div>
      )}

      {/* Reorder buttons — desktop (show on hover) */}
      <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onMoveUp && index > 0 && (
          <button onClick={onMoveUp} className="p-1.5 text-ink-muted hover:text-accent hover:bg-bg rounded-lg transition-colors btn-press" aria-label="Move up">
            <ChevronUp size={14} />
          </button>
        )}
        {onMoveDown && index < totalFiles - 1 && (
          <button onClick={onMoveDown} className="p-1.5 text-ink-muted hover:text-accent hover:bg-bg rounded-lg transition-colors btn-press" aria-label="Move down">
            <ChevronDown size={14} />
          </button>
        )}
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="p-1.5 text-ink-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-all duration-150 btn-press shrink-0"
        aria-label="Remove file"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default FileCard;
