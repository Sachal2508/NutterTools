import React, { useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer } from '../../../lib/fileHelper';

// Setup worker
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const PdfToExcel: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [excelBlob, setExcelBlob] = useState<Blob | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setExcelBlob(null);
    }
  };

  const handlePdfToExcel = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(10);
    setStatus('Initializing PDF analyzer...');

    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      // Create a new workbook
      const wb = XLSX.utils.book_new();

      for (let i = 1; i <= numPages; i++) {
        setStatus(`Extracting tables from page ${i} of ${numPages}...`);
        setProgress(10 + Math.round((i / numPages) * 75));

        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const items = textContent.items as any[];

        if (items.length === 0) continue;

        // Group items by Y coordinate (rows) within a threshold of 6 points
        const rowsMap: { [key: number]: any[] } = {};
        items.forEach(item => {
          const y = Math.round(item.transform[5]);
          const matchedYKey = Object.keys(rowsMap).find(key => Math.abs(parseInt(key) - y) <= 6);
          
          if (matchedYKey) {
            rowsMap[parseInt(matchedYKey)].push(item);
          } else {
            rowsMap[y] = [item];
          }
        });

        // Sort Y coordinates descending (top-to-bottom)
        const sortedYKeys = Object.keys(rowsMap)
          .map(k => parseInt(k))
          .sort((a, b) => b - a);

        const sheetData: string[][] = [];

        sortedYKeys.forEach(yKey => {
          const lineItems = rowsMap[yKey];
          // Sort items on this row by X coordinate ascending (left-to-right)
          lineItems.sort((a, b) => a.transform[4] - b.transform[4]);

          const rowCells: string[] = [];
          let lastX = -1;
          let cellText = '';

          lineItems.forEach((item, idx) => {
            const currentX = item.transform[4];
            
            // Basic threshold spacing detection for columns (e.g. gap > 35 points represents a new cell)
            if (lastX !== -1 && currentX - lastX > 35) {
              rowCells.push(cellText.trim());
              cellText = item.str;
            } else {
              cellText += (cellText ? ' ' : '') + item.str;
            }
            
            lastX = currentX + (item.width || 0);

            if (idx === lineItems.length - 1) {
              rowCells.push(cellText.trim());
            }
          });

          if (rowCells.some(cell => cell.length > 0)) {
            sheetData.push(rowCells);
          }
        });

        if (sheetData.length > 0) {
          const ws = XLSX.utils.aoa_to_sheet(sheetData);
          XLSX.utils.book_append_sheet(wb, ws, `Page ${i}`);
        }
      }

      setProgress(90);
      setStatus('Compiling Excel spreadsheet layouts...');

      // Save workbook to binary array buffer
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      setExcelBlob(blob);
      setProgress(100);
      setStatus('Conversion complete.');
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || 'PDF to Excel conversion failed.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (excelBlob && file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      downloadBlob(excelBlob, `${baseName}.xlsx`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setExcelBlob(null);
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

          {!excelBlob && !isProcessing && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
              <div className="p-3 bg-accent/5 border border-accent/20 rounded text-xs text-ink-muted leading-relaxed font-sans">
                <strong>Important Conversion Note:</strong> Column grids and cell values are mapped client-side based on the spatial coordinate indexes of the text layers. Scanned PDFs (lacking selectable text) will yield blank sheets.
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Reset
                </button>
                <DownloadButton onClick={handlePdfToExcel} label="Convert to Excel" />
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {excelBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                Excel Status /
              </h4>
              <p className="text-sm font-sans text-ink">
                Excel workbook generated successfully, with individual pages mapped to sheets.
              </p>

              <div className="flex gap-3 justify-center w-full mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Start Over
                </button>
                <DownloadButton onClick={handleDownload} label="Download Excel File" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfToExcel;
