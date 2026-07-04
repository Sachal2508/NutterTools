import React, { useState } from 'react';
import mammoth from 'mammoth';
import { jsPDF } from 'jspdf';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer } from '../../../lib/fileHelper';

export const WordToPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setPdfBlob(null);
    }
  };

  const handleConvertToPdf = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(15);
    setStatus('Parsing Word document layout...');

    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      
      setProgress(40);
      setStatus('Translating DOCX structural markup to HTML...');
      const parseResult = await mammoth.convertToHtml({ arrayBuffer });
      const html = parseResult.value;

      if (!html.trim()) {
        throw new Error('This Word document is empty or could not be parsed.');
      }

      setProgress(60);
      setStatus('Rerendering text grids onto PDF page layouts...');

      // Create local off-screen container for rendering
      const renderContainer = document.createElement('div');
      renderContainer.innerHTML = html;
      renderContainer.className = 'word-to-pdf-temp-render';
      
      // Styling rules matching standard A4 dimensions for html2canvas
      renderContainer.style.width = '700px';
      renderContainer.style.padding = '48px';
      renderContainer.style.background = '#FFFFFF';
      renderContainer.style.color = '#000000';
      renderContainer.style.fontFamily = 'Inter, "Segoe UI", sans-serif';
      renderContainer.style.fontSize = '13px';
      renderContainer.style.lineHeight = '1.6';
      
      // Apply clean headings spacing
      const styleTag = document.createElement('style');
      styleTag.innerHTML = `
        .word-to-pdf-temp-render h1 { font-size: 22px; font-weight: bold; margin-bottom: 12px; margin-top: 18px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
        .word-to-pdf-temp-render h2 { font-size: 18px; font-weight: bold; margin-bottom: 8px; margin-top: 14px; }
        .word-to-pdf-temp-render h3 { font-size: 15px; font-weight: bold; margin-bottom: 6px; margin-top: 12px; }
        .word-to-pdf-temp-render p { margin-bottom: 10px; text-align: justify; }
        .word-to-pdf-temp-render table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .word-to-pdf-temp-render th, .word-to-pdf-temp-render td { border: 1px solid #ddd; padding: 6px 10px; font-size: 11px; }
        .word-to-pdf-temp-render th { background-color: #f5f5f5; font-weight: bold; }
        .word-to-pdf-temp-render ul, .word-to-pdf-temp-render ol { margin-left: 20px; margin-bottom: 10px; }
        .word-to-pdf-temp-render li { margin-bottom: 4px; }
      `;
      renderContainer.appendChild(styleTag);
      document.body.appendChild(renderContainer);

      setProgress(75);
      setStatus('Compiling final PDF file...');

      setTimeout(async () => {
        try {
          const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: 'a4',
          });

          await doc.html(renderContainer, {
            callback: (pdf) => {
              const blob = pdf.output('blob');
              document.body.removeChild(renderContainer);
              setPdfBlob(blob);
              setProgress(100);
              setStatus('Conversion complete.');
              setIsProcessing(false);
            },
            x: 10,
            y: 10,
            width: 430, // Fit cleanly in A4 size
            windowWidth: 700,
          });
        } catch (innerErr) {
          document.body.removeChild(renderContainer);
          throw innerErr;
        }
      }, 200);

    } catch (err: any) {
      console.error(err);
      setStatus(err.message || 'An error occurred during Word-to-PDF conversion.');
      setProgress(0);
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (pdfBlob && file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      downloadBlob(pdfBlob, `${baseName}.pdf`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPdfBlob(null);
    setProgress(0);
    setStatus('');
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {!file ? (
        <DropZone accept=".docx" acceptLabel="Word document (.docx)" onFilesAdded={handleFilesAdded} />
      ) : (
        <div className="flex flex-col gap-4">
          <FileCard file={file} index={0} totalFiles={1} onRemove={handleReset} />

          {!pdfBlob && !isProcessing && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
              <div className="p-3 bg-accent/5 border border-accent/20 rounded text-xs text-ink-muted leading-relaxed font-sans">
                <strong>Format Support Notice:</strong> This converter processes standard XML-based Word files ending in `.docx`. It translates text formatting, tables, lists, and basic images locally. Ensure the file does not have read restrictions or protection.
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Reset
                </button>
                <DownloadButton onClick={handleConvertToPdf} label="Convert to PDF" />
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {pdfBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                PDF Status /
              </h4>
              <p className="text-sm font-sans text-ink">
                PDF document generated successfully.
              </p>

              <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleDownload} label="Download PDF" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WordToPdf;
