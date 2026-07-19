import React, { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import DropZone from '../../../components/shared/DropZone';
import FileCard from '../../../components/shared/FileCard';
import ProgressBar from '../../../components/shared/ProgressBar';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob, readFileAsArrayBuffer } from '../../../lib/fileHelper';

interface FormFieldItem {
  name: string;
  type: 'text' | 'checkbox' | 'dropdown' | 'other';
  value: string | boolean;
  options?: string[]; // for dropdowns
}

export const PdfForms: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<FormFieldItem[]>([]);
  const [flatten, setFlatten] = useState(true);
  
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isParsingForm, setIsParsingForm] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setFields([]);
      setResultBlob(null);
    }
  };

  // Parse fields
  useEffect(() => {
    if (!file) return;

    const parseFormFields = async () => {
      setIsParsingForm(true);
      setProgress(10);
      setStatus('Scanning document for interactive form fields...');

      try {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const form = pdfDoc.getForm();
        const rawFields = form.getFields();

        const items: FormFieldItem[] = [];

        rawFields.forEach(field => {
          const name = field.getName();
          const constructorName = field.constructor.name;
          
          if (constructorName === 'PDFTextField' || 'getText' in field) {
            const txtField = field as any;
            items.push({
              name,
              type: 'text',
              value: txtField.getText() || '',
            });
          } else if (constructorName === 'PDFCheckBox' || 'isChecked' in field) {
            const chkField = field as any;
            items.push({
              name,
              type: 'checkbox',
              value: chkField.isChecked(),
            });
          } else if (constructorName === 'PDFDropdown' || 'getSelected' in field) {
            const dropField = field as any;
            items.push({
              name,
              type: 'dropdown',
              value: dropField.getSelected()?.[0] || '',
              options: dropField.getOptions() || [],
            });
          } else {
            items.push({
              name,
              type: 'other',
              value: '',
            });
          }
        });

        setFields(items);
        setProgress(100);
        setStatus('');
      } catch (err) {
        console.error('Failed to parse form fields:', err);
        setStatus('No interactive form fields detected in this document.');
      } finally {
        setIsParsingForm(false);
      }
    };

    parseFormFields();
  }, [file]);

  const handleFieldChange = (name: string, value: string | boolean) => {
    setFields(fields.map(f => f.name === name ? { ...f, value } : f));
    setResultBlob(null);
  };

  const handleFillForm = async () => {
    if (!file || fields.length === 0) return;

    setIsProcessing(true);
    setProgress(30);
    setStatus('Mapping form fields in memory...');

    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const form = pdfDoc.getForm();

      fields.forEach(f => {
        try {
          if (f.type === 'text') {
            const txtField = form.getTextField(f.name);
            txtField.setText(f.value as string);
          } else if (f.type === 'checkbox') {
            const chkField = form.getCheckBox(f.name);
            if (f.value) {
              chkField.check();
            } else {
              chkField.uncheck();
            }
          } else if (f.type === 'dropdown') {
            const dropField = form.getDropdown(f.name);
            dropField.select(f.value as string);
          }
        } catch (fieldErr) {
          console.warn(`Could not set field value for: ${f.name}`, fieldErr);
        }
      });

      if (flatten) {
        setProgress(70);
        setStatus('Flattening form values (locking fields)...');
        form.flatten();
      }

      setProgress(85);
      setStatus('Packaging PDF document bytes...');
      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes as any], { type: 'application/pdf' });

      setResultBlob(blob);
      setProgress(100);
      setStatus('Form completed successfully.');
    } catch (err: any) {
      console.error(err);
      setStatus('Failed to fill form fields.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultBlob && file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      downloadBlob(resultBlob, `${baseName}-filled.pdf`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFields([]);
    setResultBlob(null);
    setProgress(0);
    setStatus('');
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {!file ? (
        <DropZone accept="application/pdf" acceptLabel="PDF Form file" onFilesAdded={handleFilesAdded} />
      ) : (
        <div className="flex flex-col gap-4">
          <FileCard file={file} index={0} totalFiles={1} onRemove={handleReset} />

          {isParsingForm && <ProgressBar progress={progress} status={status} />}

          {!isParsingForm && fields.length === 0 && !resultBlob && (
            <div className="p-4 border border-border bg-surface text-center rounded text-sm text-ink-muted leading-relaxed font-sans">
              No interactive form inputs, textboxes, or checkboxes were detected in this PDF. Please verify your file contains active form fields.
            </div>
          )}

          {!isParsingForm && fields.length > 0 && !resultBlob && !isProcessing && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2">
                Fill Form Inputs ({fields.length}) /
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2 max-h-[350px] overflow-y-auto pr-1">
                {fields.map(f => (
                  <div key={f.name} className="flex flex-col gap-1.5 border border-border/40 p-2.5 rounded bg-bg/50">
                    <span className="font-mono text-[9px] text-ink-muted truncate" title={f.name}>
                      {f.name}
                    </span>

                    {f.type === 'text' && (
                      <input
                        type="text"
                        value={f.value as string}
                        onChange={e => handleFieldChange(f.name, e.target.value)}
                        className="px-3 py-1.5 border border-border bg-surface text-ink rounded text-xs focus:border-accent outline-none"
                      />
                    )}

                    {f.type === 'checkbox' && (
                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-sans text-ink">
                        <input
                          type="checkbox"
                          checked={f.value as boolean}
                          onChange={e => handleFieldChange(f.name, e.target.checked)}
                          className="w-4 h-4 border border-border rounded accent-accent bg-surface"
                        />
                        Selected
                      </label>
                    )}

                    {f.type === 'dropdown' && (
                      <select
                        value={f.value as string}
                        onChange={e => handleFieldChange(f.name, e.target.value)}
                        className="px-3 py-1.5 border border-border bg-surface text-ink rounded text-xs focus:border-accent outline-none font-sans"
                      >
                        {f.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {f.type === 'other' && (
                      <span className="text-[10px] text-ink-muted italic">Unsupported Field Type</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-2 border-t border-border pt-4">
                <span className="font-mono text-[10px] text-ink-muted uppercase">Flatten Settings /</span>
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-sans text-ink leading-relaxed">
                  <input
                    type="checkbox"
                    checked={flatten}
                    onChange={e => setFlatten(e.target.checked)}
                    className="w-4 h-4 border border-border rounded accent-accent bg-surface"
                  />
                  <strong>Flatten Fields:</strong> Merge the text values into the page contents permanently (locked, cannot be edited again).
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase tracking-wider hover:text-ink hover:bg-bg transition-colors"
                >
                  Reset
                </button>
                <DownloadButton onClick={handleFillForm} label="Save Form Data" />
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} status={status} />}

          {resultBlob && (
            <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in text-center items-center">
              <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2 w-full text-left">
                Form Status /
              </h4>
              <p className="text-sm font-sans text-ink">
                Form field data saved successfully ({flatten ? 'Flattened Static Layout' : 'Interactive Fields'}).
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

export default PdfForms;
