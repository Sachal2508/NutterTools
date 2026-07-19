import React, { useState } from 'react';
import DownloadButton from '../../../components/shared/DownloadButton';
import { downloadBlob } from '../../../lib/fileHelper';
import { FileCode, Copy, ClipboardCheck } from 'lucide-react';

export const MarkdownEditor: React.FC = () => {
  const [mdCode, setMdCode] = useState(`# Markdown Editor Preview

This is a **fluid, live split-screen editor** running entirely in your browser.

## Key Features
- **100% Secure**: Files are processed locally.
- **Fast rendering**: Instant key stroke preview loops.
- **Tables and lists**: Full GFM visual styling.

### Code Example
\`\`\`javascript
const greeting = "Hello, NutterTools!";
console.log(greeting);
\`\`\`

Feel free to edit this text in the editor panel to see updates.
`);
  const [copiedHtml, setCopiedHtml] = useState(false);

  // A lightweight regex compiler converting GFM markdown to styled HTML
  const compileMarkdownToHtml = (markdown: string): string => {
    let html = markdown
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 1. Headers
    html = html.replace(/^# (.*?)$/gm, '<h1 style="font-size: 20px; font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-top: 18px; margin-bottom: 10px; color: #1e3a8a;">$1</h1>');
    html = html.replace(/^## (.*?)$/gm, '<h2 style="font-size: 16px; font-weight: bold; margin-top: 14px; margin-bottom: 8px; color: #1e40af;">$1</h2>');
    html = html.replace(/^### (.*?)$/gm, '<h3 style="font-size: 14px; font-weight: bold; margin-top: 10px; margin-bottom: 6px; color: #1d4ed8;">$1</h3>');

    // 2. Bold & Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 3. Fenced Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre style="background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; padding: 10px; font-family: monospace; font-size: 11px; overflow-x: auto; margin-bottom: 12px; color: #374151;"><code>$1</code></pre>');
    
    // 4. Inline code
    html = html.replace(/`(.*?)`/g, '<code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px; font-family: monospace; font-size: 11px; color: #b91c1c;">$1</code>');

    // 5. Unordered List Items
    html = html.replace(/^- (.*?)$/gm, '<li style="margin-left: 18px; list-style-type: disc; margin-bottom: 4px; color: #374151;">$1</li>');

    // 6. Hyperlinks
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color: #4f46e5; text-decoration: underline;">$1</a>');

    // 7. Paragraph separations
    html = html.split('\n\n').map(p => {
      if (p.trim().startsWith('<h') || p.trim().startsWith('<li') || p.trim().startsWith('<pre')) {
        return p;
      }
      return `<p style="font-size: 12px; line-height: 1.6; margin-bottom: 12px; color: #374151;">${p.trim()}</p>`;
    }).join('\n');

    return html;
  };

  const handleCopyHtml = () => {
    const htmlOutput = compileMarkdownToHtml(mdCode);
    navigator.clipboard.writeText(htmlOutput);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  const handleDownloadMd = () => {
    const blob = new Blob([mdCode], { type: 'text/markdown' });
    downloadBlob(blob, 'document.md');
  };

  const handleClear = () => {
    setMdCode('');
  };

  return (
    <div className="flex flex-col gap-4 font-sans">
      <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4">
        
        <div className="flex flex-wrap gap-3 items-center border-b border-border pb-2">
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-ink-muted uppercase tracking-wider">
            <FileCode size={12} className="text-accent" /> Markdown Workspace /
          </span>

          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={handleCopyHtml}
              className="flex items-center gap-1 px-3 py-1 border border-border text-[10px] uppercase font-mono tracking-wider text-ink-muted hover:text-ink hover:bg-bg rounded transition-colors"
            >
              {copiedHtml ? (
                <>
                  <ClipboardCheck size={11} className="text-success" /> Copied HTML!
                </>
              ) : (
                <>
                  <Copy size={11} /> Copy HTML
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Editor Input */}
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[9px] text-ink-muted uppercase">Markdown Code /</span>
            <textarea
              rows={14}
              value={mdCode}
              onChange={e => setMdCode(e.target.value)}
              className="w-full p-3 border border-border bg-bg text-ink rounded font-mono text-xs focus:border-accent outline-none resize-y leading-relaxed"
              placeholder="# Write markdown code..."
            />
          </div>

          {/* HTML Render Panel */}
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[9px] text-ink-muted uppercase">Styled Live HTML Preview /</span>
            <div 
              dangerouslySetInnerHTML={{ __html: compileMarkdownToHtml(mdCode) }}
              className="w-full p-3 border border-border bg-bg rounded text-xs max-h-[300px] overflow-y-auto leading-relaxed shadow-inner"
            />
          </div>

        </div>

        <div className="flex justify-between items-center border-t border-border pt-4 mt-1">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 border border-border text-ink-muted rounded font-mono text-xs uppercase hover:text-ink hover:bg-bg transition-colors"
          >
            Clear Editor
          </button>
          <DownloadButton onClick={handleDownloadMd} label="Download Markdown" disabled={!mdCode.trim()} />
        </div>

      </div>
    </div>
  );
};

export default MarkdownEditor;
