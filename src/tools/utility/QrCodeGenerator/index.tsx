import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

import DownloadButton from '../../../components/shared/DownloadButton';

export const QrCodeGenerator: React.FC = () => {
  const [type, setType] = useState<'text' | 'wifi' | 'vcard'>('text');
  const [text, setText] = useState('https://the-workbench.local');
  const [fgColor, setFgColor] = useState('#1E2A2F');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const size = 256;

  // Wi-Fi fields
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [encryption, setEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');

  // vCard fields
  const [vFirstName, setVFirstName] = useState('');
  const [vLastName, setVLastName] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vEmail, setVEmail] = useState('');
  const [vCompany, setVCompany] = useState('');

  const qrCanvasRef = useRef<HTMLDivElement>(null);

  // Generate contents
  const getQRValue = () => {
    if (type === 'text') {
      return text || ' ';
    }
    if (type === 'wifi') {
      return `WIFI:S:${ssid};T:${encryption};P:${password};;`;
    }
    if (type === 'vcard') {
      return `BEGIN:VCARD
VERSION:3.0
N:${vLastName};${vFirstName};;;
FN:${vFirstName} ${vLastName}
ORG:${vCompany}
TEL;TYPE=CELL:${vPhone}
EMAIL:${vEmail}
END:VCARD`;
    }
    return '';
  };

  const handleDownload = () => {
    // Find canvas in ref and convert to download trigger
    const canvas = qrCanvasRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `qrcode-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const qrValue = getQRValue();

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Selector tab buttons */}
      <div className="flex border border-border rounded overflow-hidden w-fit font-mono text-[10px]">
        {(['text', 'wifi', 'vcard'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`px-3 py-1.5 uppercase tracking-wider transition-colors ${
              type === t
                ? 'bg-accent text-white font-semibold'
                : 'bg-bg text-ink-muted hover:text-ink hover:bg-border/30'
            }`}
          >
            {t === 'text' ? 'URL / Text' : t === 'wifi' ? 'Wi-Fi' : 'vCard Contact'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Controls Column */}
        <div className="flex flex-col gap-4">
          {/* Dynamic input fields based on QR Type */}
          {type === 'text' && (
            <div className="flex flex-col gap-1">
              <label htmlFor="qr-text" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                Enter URL or Text /
              </label>
              <textarea
                id="qr-text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="https://example.com"
                rows={4}
                className="w-full p-2 bg-bg border border-border rounded text-sm text-ink placeholder-ink-muted focus:border-accent outline-none resize-none font-sans"
              />
            </div>
          )}

          {type === 'wifi' && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="wifi-ssid" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">Network Name (SSID) /</label>
                <input
                  id="wifi-ssid"
                  type="text"
                  value={ssid}
                  onChange={e => setSsid(e.target.value)}
                  placeholder="Home-Network"
                  className="w-full p-2 bg-bg border border-border rounded text-sm text-ink outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="wifi-pass" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">Password /</label>
                <input
                  id="wifi-pass"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2 bg-bg border border-border rounded text-sm text-ink outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="wifi-enc" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">Encryption /</label>
                <select
                  id="wifi-enc"
                  value={encryption}
                  onChange={e => setEncryption(e.target.value as any)}
                  className="w-full p-2 bg-bg border border-border rounded text-sm text-ink outline-none focus:border-accent font-sans"
                >
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">Unsecured (No Password)</option>
                </select>
              </div>
            </div>
          )}

          {type === 'vcard' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label htmlFor="v-first" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">First Name /</label>
                  <input
                    id="v-first"
                    type="text"
                    value={vFirstName}
                    onChange={e => setVFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full p-2 bg-bg border border-border rounded text-sm text-ink outline-none focus:border-accent"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="v-last" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">Last Name /</label>
                  <input
                    id="v-last"
                    type="text"
                    value={vLastName}
                    onChange={e => setVLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full p-2 bg-bg border border-border rounded text-sm text-ink outline-none focus:border-accent"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="v-phone" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">Phone Number /</label>
                <input
                  id="v-phone"
                  type="text"
                  value={vPhone}
                  onChange={e => setVPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full p-2 bg-bg border border-border rounded text-sm text-ink outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="v-email" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">Email Address /</label>
                <input
                  id="v-email"
                  type="email"
                  value={vEmail}
                  onChange={e => setVEmail(e.target.value)}
                  placeholder="john.doe@example.com"
                  className="w-full p-2 bg-bg border border-border rounded text-sm text-ink outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="v-org" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">Company /</label>
                <input
                  id="v-org"
                  type="text"
                  value={vCompany}
                  onChange={e => setVCompany(e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full p-2 bg-bg border border-border rounded text-sm text-ink outline-none focus:border-accent"
                />
              </div>
            </div>
          )}

          {/* Color customization */}
          <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="fg-color" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">QR Code Color /</label>
              <div className="flex items-center gap-2">
                <input
                  id="fg-color"
                  type="color"
                  value={fgColor}
                  onChange={e => setFgColor(e.target.value)}
                  className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
                />
                <span className="font-mono text-[11px] text-ink">{fgColor}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="bg-color" className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">Background Color /</label>
              <div className="flex items-center gap-2">
                <input
                  id="bg-color"
                  type="color"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
                />
                <span className="font-mono text-[11px] text-ink">{bgColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Display Column */}
        <div className="flex flex-col items-center justify-center border border-border bg-bg/50 rounded-lg p-8 gap-4 min-h-[300px]">
          <div
            ref={qrCanvasRef}
            className="p-4 border border-border bg-white rounded flex items-center justify-center shadow-inner"
          >
            {/* qrcode.react renders a Canvas for saving, or SVG for crisp displaying */}
            <QRCodeCanvas
              value={qrValue}
              size={size}
              bgColor={bgColor}
              fgColor={fgColor}
              level="H" // High error correction
              includeMargin={true}
            />
          </div>

          <p className="font-mono text-[9px] text-ink-muted uppercase tracking-wider max-w-[200px] text-center leading-relaxed">
            [High error correction enabled: scan remains reliable when folded or dirty]
          </p>

          <DownloadButton
            onClick={handleDownload}
            label="Download QR Code"
            disabled={!qrValue.trim()}
            className="w-full max-w-[200px] mt-2"
          />
        </div>
      </div>
    </div>
  );
};

export default QrCodeGenerator;
