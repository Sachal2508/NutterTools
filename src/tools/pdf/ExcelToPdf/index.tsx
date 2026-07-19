import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer } from '../../../lib/fileHelper';

export const ExcelToPdf: React.FC = () => {
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

  const handleExcelToPdf = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(15);
    setStatus('Reading Excel spreadsheet streams...');

    // Create off-screen container for rendering tables
    const renderContainer = document.createElement('div');
    renderContainer.style.position = 'absolute';
    renderContainer.style.left = '-9999px';
    renderContainer.style.top = '0';
    renderContainer.style.width = '800px';
    renderContainer.style.background = '#FFFFFF';
    renderContainer.style.padding = '40px';
    document.body.appendChild(renderContainer);

    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      
      setProgress(40);
      setStatus('Parsing sheet structures...');
      
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetNames = workbook.SheetNames;

      if (sheetNames.length === 0) {
        throw new Error('This Excel file does not contain any sheets.');
      }

      setProgress(60);
      setStatus('Translating sheets to high-contrast tables...');

      // Let's create CSS styling for the sheets
      const styleTag = document.createElement('style');
      styleTag.innerHTML = `
        .excel-table-container { margin-bottom: 50px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .excel-sheet-title { font-size: 16px; font-weight: bold; margin-bottom: 12px; border-bottom: 2px solid #333; padding-bottom: 4px; color: #1e3a8a; }
        .excel-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
        .excel-table th, .excel-table td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; }
        .excel-table th { background-color: #f3f4f6; font-weight: bold; color: #374151; }
        .excel-table tr:nth-child(even) { background-color: #f9fafb; }
      `;
      renderContainer.appendChild(styleTag);

      // Loop sheets and render them into the DOM
      const sheetContainers: HTMLDivElement[] = [];

      sheetNames.forEach(name => {
        const sheet = workbook.Sheets[name];
        // Convert to HTML
        const htmlTable = XLSX.utils.sheet_to_html(sheet, { header: '', footer: '' });
        
        const sheetContainer = document.createElement('div');
        sheetContainer.className = 'excel-table-container';
        
        const title = document.createElement('div');
        title.className = 'excel-sheet-title';
        title.innerText = `Sheet: ${name}`;
        
        const tableWrapper = document.createElement('div');
        tableWrapper.innerHTML = htmlTable;
        
        // Add class to the table
        const tableElement = tableWrapper.querySelector('table');
        if (tableElement) {
          tableElement.className = 'excel-table';
        }

        sheetContainer.appendChild(title);
        sheetContainer.appendChild(tableWrapper);
        renderContainer.appendChild(sheetContainer);
        sheetContainers.push(sheetContainer);
      });

      // Pause to settle rendering
      await new Promise((resolve) => setTimeout(resolve, 300));

      setProgress(75);
      setStatus('Assembling print-ready PDF...');

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'a4',
      });

      // Render each sheet table to its own PDF page
      for (let i = 0; i < sheetContainers.length; i++) {
        setStatus(`Compiling sheet ${i + 1} of ${sheetContainers.length}...`);
        setProgress(75 + Math.round((i / sheetContainers.length) * 20));

        const container = sheetContainers[i];
        const canvas = await html2canvas(container, {
          scale: 2.0,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (i > 0) {
          pdf.addPage();
        }

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Draw centered with margins
        const imgDims = {
          width: pdfWidth - 40,
          height: ((pdfWidth - 40) * canvas.height) / canvas.width,
        };

        pdf.addImage(imgData, 'JPEG', 20, 20, imgDims.width, Math.min(imgDims.height, pdfHeight - 40));
      }

      const blob = pdf.output('blob');
      setPdfBlob(blob);
      setProgress(100);
      setStatus('Conversion complete.');
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || 'Excel to PDF conversion failed.');
      setProgress(0);
    } finally {
      if (document.body.contains(renderContainer)) {
        document.body.removeChild(renderContainer);
      }
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
        <DropZone accept=".xlsx" acceptLabel="Excel spreadsheet (.xlsx)" onFilesAdded={handleFilesAdded} />
      ) : (
        <div className="flex flex-col gap-4">
          <FileCard file={file} index={0} totalFiles={1} onRemove={handleReset} />

          {!pdfBlob && !isProcessing && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
              <div className="p-3 bg-accent/5 border border-accent/20 rounded text-xs text-ink-muted leading-relaxed font-sans">
                <strong>Format Support Notice:</strong> Visible rows, columns, and data tables from standard Excel sheets (.xlsx) are parsed and formatted into PDF tables in the browser. Formula expressions remain intact.
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Reset
                </button>
                <DownloadButton onClick={handleExcelToPdf} label="Convert to PDF" />
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
                Spreadsheet pages compiled successfully.
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

export default ExcelToPdf;
