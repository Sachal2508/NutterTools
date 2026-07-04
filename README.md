# ⚡ NutterTools — Cheat Code for Your Files

NutterTools is a production-quality, **100% client-side** React + TypeScript web application offering 24 everyday file utilities. Everything runs locally inside the user's browser window using WebAssembly (WASM) and JavaScript libraries. **Files are never uploaded to any server**, ensuring absolute privacy and security.

> **"Your files never leave your device."**

---

## 🛠️ Included Instruments (24 Tools)

### 📄 PDF Utilities (13 Tools)
- **Merge PDF** — Combine multiple PDFs in any order.
- **Split PDF** — Extract specific page ranges from a PDF.
- **Compress PDF** — Reduce file size using client-side quality scale controls.
- **PDF Page Resizer** — Resize PDF pages with quality/scale adjustment.
- **PDF to JPG / PNG / WebP** — Convert pages of a PDF into high-quality images.
- **JPG / PNG / WebP to PDF** — Convert images into a clean PDF.
- **Protect PDF** — Secure PDFs with user and owner passwords.
- **Unlock PDF** — Remove password security from protected PDFs.
- **Rotate PDF** — Rotate individual pages of a PDF.
- **Add PDF Page Numbers** — Place custom formatted page numbers on documents.
- **Add Watermark to PDF** — Overlay text watermarks with control over opacity, angle, and size.
- **Extract Text from PDF** — Extract raw text from documents.

### 🖼️ Image Utilities (7 Tools)
- **Image Converter** — Convert between PNG, JPG, WebP, GIF, BMP, and TIFF.
- **Image Resizer** — Resize image dimensions by percentage or pixels.
- **Image Cropper** — Crop images using standard aspect ratios or freeform boxes.
- **Image Compressor** — Compress images with real-time file size estimation.
- **SVG to PNG** — Convert vector SVGs to high-res PNG raster images.
- **QR Code Generator** — Generate QR codes with custom colors and error correction.
- **QR Code Reader** — Read QR codes from images or drag-and-drop files.

### ⚙️ General Utilities (4 Tools)
- **Text Diff Tool** — Compare two text inputs side-by-side with inline differences highlighted.
- **Markdown Previewer** — Write and preview formatted Markdown documents.
- **Word Counter** — Count words, characters, sentences, paragraphs, and read-time.
- **Password Generator** — Create highly secure, customizable passwords.

---

## 🔒 Privacy & Security Guarantee
Unlike traditional online tools that upload files to cloud servers, NutterTools reads, processes, and downloads files **entirely within your browser's local memory**. 
- Open your browser's network tab or turn off your internet completely — all tools work 100% offline.
- No files are sent to remote servers.
- No telemetry, tracker logs, or accounts.

---

## 🚀 Tech Stack
- **Framework**: React 19 + TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS v3
- **Animations**: CSS Transitions, Keyframe Animations, Hover Springs
- **Core Processing Engines**:
  - `pdf-lib` for advanced PDF manipulation
  - `pdfjs-dist` for PDF page rendering
  - Canvas APIs for client-side image operations

---

## 💻 Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

---

## 🌍 Vercel Deployment

Deploying NutterTools to Vercel is extremely simple:

1. Push this codebase to your own GitHub repository.
2. Log into your [Vercel Dashboard](https://vercel.com).
3. Click **New Project** and import your GitHub repository.
4. Vercel will automatically detect Vite. Keep default settings and click **Deploy**.
