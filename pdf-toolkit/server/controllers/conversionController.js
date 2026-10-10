const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts, degrees } = require('pdf-lib');
const pdfParse = require('pdf-parse');
const { Document, Paragraph, TextRun, Packer } = require('docx');
const xlsx = require('xlsx');
const sharp = require('sharp');
const PDFDocument2 = require('pdfkit');
const muhammara = require('muhammara');
// const { convert } = require('pdf-poppler'); // [REMOVED] Breaks on Linux
const { exec, execFile } = require('child_process');
const execAsync = require('util').promisify(exec);
const execFileAsync = require('util').promisify(execFile);
// LibreOffice path for Windows
// LibreOffice path for Windows/Linux
const LIBREOFFICE_PATH = process.env.LIBREOFFICE_PATH ||
  (process.platform === 'win32'
    ? 'C:\\Program Files\\LibreOffice\\program\\soffice.exe'
    : '/usr/bin/soffice');

// Poppler path for Windows/Linux
const POPPLER_BIN_PATH = process.env.POPPLER_PATH ||
  (process.platform === 'win32' ? 'pdftoppm' : 'pdftoppm');
// pdftoppm is usually in the PATH, but users can override via POPPLER_PATH

const resolvePdftoppmPath = () => {
  const configuredPath = process.env.POPPLER_PATH;
  const executableName = process.platform === 'win32' ? 'pdftoppm.exe' : 'pdftoppm';

  if (!configuredPath) {
    return POPPLER_BIN_PATH;
  }

  const normalizedPath = configuredPath.trim().replace(/^"|"$/g, '');

  try {
    if (fsSync.existsSync(normalizedPath) && fsSync.statSync(normalizedPath).isDirectory()) {
      return path.join(normalizedPath, executableName);
    }
  } catch (error) {
    console.warn('Unable to inspect POPPLER_PATH:', error.message);
  }

  return normalizedPath;
};

const getPdftoppmExecForShell = () => {
  const resolvedPath = resolvePdftoppmPath();
  return resolvedPath.includes(' ') ? `"${resolvedPath}"` : resolvedPath;
};

const Conversion = require('../models/Conversion');
const User = require('../models/User');
const { lockFileWithTimeout, unlockFile } = require('../utils/fileManager');
const { streamFromGridFS } = require('../utils/gridfsHelper');
const { handleFileStorage, cleanupFile, validateStorageRequest, getStorageMetadata } = require('../utils/conversionHelper');

// Helper to calculate protection flag
const calculateProtectionFlag = (permissions) => {
  if (!permissions) return 4; // Default: Print allowed (Bit 3)

  let flag = 0;
  // Bit 3: Print
  if (permissions.print) flag |= 4;
  // Bit 4: Modify
  if (permissions.modify) flag |= 8;
  // Bit 5: Copy/Extract
  if (permissions.copy) flag |= 16;
  // Bit 6: Add/Modify Annotations
  if (permissions.annotate) flag |= 32;
  // Bit 9: Fill Forms
  if (permissions.fillForms) flag |= 256;
  // Bit 10: Extract for accessibility
  if (permissions.accessibility) flag |= 512;
  // Bit 11: Assemble
  if (permissions.assemble) flag |= 1024;
  // Bit 12: High Res Print
  if (permissions.highResPrint) flag |= 2048;

  return flag;
};

const parseJsonField = (value, fallback) => {
  if (typeof value === 'undefined' || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'string') {
    return JSON.parse(value);
  }

  return value;
};

const buildPythonCandidates = () => {
  const candidates = [];

  if (process.env.PYTHON_EXECUTABLE) {
    candidates.push({ command: process.env.PYTHON_EXECUTABLE, args: [] });
  }

  if (process.platform === 'win32') {
    candidates.push({ command: 'py', args: ['-3'] });
    candidates.push({ command: 'python', args: [] });
  } else {
    candidates.push({ command: 'python3', args: [] });
    candidates.push({ command: 'python', args: [] });
  }

  return candidates;
};

const runPythonScript = async (scriptPath, scriptArgs) => {
  const attempts = [];

  for (const candidate of buildPythonCandidates()) {
    try {
      await execFileAsync(candidate.command, [...candidate.args, scriptPath, ...scriptArgs]);
      return;
    } catch (error) {
      attempts.push(`${candidate.command}${candidate.args.length ? ` ${candidate.args.join(' ')}` : ''}: ${error.message}`);
    }
  }

  const error = new Error(`No usable Python executable found. Tried: ${attempts.join(' | ')}`);
  error.attempts = attempts;
  throw error;
};

const toRgbColor = (color, defaultColor = rgb(0, 0, 0)) => {
  if (!color) return defaultColor;

  if (typeof color === 'object' && typeof color.r === 'number' && typeof color.g === 'number' && typeof color.b === 'number') {
    return rgb(color.r, color.g, color.b);
  }

  return defaultColor;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const isPdfTextObject = (item) => item && ['i-text', 'textbox', 'text'].includes(item.type);

const standardFontFor = (fontFamily, fontWeight, fontStyle) => {
  const family = String(fontFamily || '').toLowerCase();
  const bold = String(fontWeight || '').toLowerCase().includes('bold') || Number(fontWeight) >= 600;
  const italic = String(fontStyle || '').toLowerCase().includes('italic') || String(fontStyle || '').toLowerCase().includes('oblique');

  if (family.includes('courier')) {
    if (bold && italic) return StandardFonts.CourierBoldOblique;
    if (bold) return StandardFonts.CourierBold;
    if (italic) return StandardFonts.CourierOblique;
    return StandardFonts.Courier;
  }

  if (family.includes('times')) {
    if (bold && italic) return StandardFonts.TimesRomanBoldItalic;
    if (bold) return StandardFonts.TimesRomanBold;
    if (italic) return StandardFonts.TimesRomanItalic;
    return StandardFonts.TimesRoman;
  }

  if (bold && italic) return StandardFonts.HelveticaBoldOblique;
  if (bold) return StandardFonts.HelveticaBold;
  if (italic) return StandardFonts.HelveticaOblique;
  return StandardFonts.Helvetica;
};

const extractDataUrl = (value) => {
  if (!value || typeof value !== 'string') return null;
  const match = value.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1].toLowerCase(),
    bytes: Buffer.from(match[2], 'base64')
  };
};

const embedImageFromDataUrl = async (pdfDoc, dataUrl) => {
  const source = extractDataUrl(dataUrl);
  if (!source) return null;

  if (source.mimeType.includes('png')) {
    return pdfDoc.embedPng(source.bytes);
  }

  if (source.mimeType.includes('jpeg') || source.mimeType.includes('jpg')) {
    return pdfDoc.embedJpg(source.bytes);
  }

  return null;
};

const drawCanvasPages = async (pdfDoc, canvasData) => {
  const pages = Array.isArray(canvasData?.pages) ? canvasData.pages : [];

  for (const pageData of pages) {
    // renderScale is the ratio canvas-px / pdf-pt. Divide canvas-space coords by it
    // to get PDF user-space coordinates for images and new shapes.
    const renderScale = Number(pageData.renderScale || 1) || 1;
    const pageWidth   = Math.round(Number(pageData.pageWidth  || 612) / renderScale);
    const pageHeight  = Math.round(Number(pageData.pageHeight || 792) / renderScale);
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const items = Array.isArray(pageData.objects) ? pageData.objects : [];

    // Preserve the rendered source page so scanned/image PDFs stay visible.
    const backgroundImage = await embedImageFromDataUrl(pdfDoc, pageData.backgroundDataUrl);
    if (backgroundImage) {
      page.drawImage(backgroundImage, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
        opacity: 1
      });
    }

    for (const item of items) {
      if (!item || item.deleted || item.visible === false) {
        continue;
      }

      if (isPdfTextObject(item) && typeof item.text === 'string') {
        const isOriginalPdfText = item.source === 'pdf';
        const currentText = String(item.text || '');
        const originalText = String(item.originalText || '');

        // If this text is from the original PDF and hasn't been changed, skip drawing
        // We rely on the rasterized background image to preserve unmodified vectors.
        if (isOriginalPdfText && currentText === originalText && !item.deleted && !item.dirty) {
          continue;
        }

        // Embed font and compute size/position
        const font = await pdfDoc.embedFont(standardFontFor(item.fontFamily, item.fontWeight, item.fontStyle));
        const size = Number(item.pdfFontSize ?? item.originalFontSize ?? item.fontSize ?? 16);
        const textColor = toRgbColor(item.fill, rgb(0.07, 0.09, 0.15));
        const safeText = currentText.replace(/[^\x20-\xFF]/g, '');

        if (!safeText.trim()) continue;

        // If this is modified text from the PDF, erase the original area
        if (isOriginalPdfText) {
          const scaleX = Number(item.scaleX ?? 1) || 1;
          const scaleY = Number(item.scaleY ?? 1) || 1;

          let eraseWidth, eraseHeight, eraseX, eraseBaseY;
          if (item.pdfBaselineY != null && item.pdfLeft != null) {
            const pdfW    = Number(item.pdfWidth || item.pdfFontSize * 6) * scaleX;
            eraseWidth  = Math.max(1, Math.ceil(pdfW * 1.4 + 20));
            eraseHeight = Math.max(1, Math.ceil(size * scaleY * 1.8 + 8));
            eraseX      = Number(item.pdfLeft) - 4;
            eraseBaseY  = Number(item.pdfBaselineY);
          } else {
            const baseW = Number((item.originalWidth  || item.width  || 0) * scaleX);
            const baseH = Number((item.originalFontSize ?? item.originalHeight ?? item.height ?? 16) * scaleY);
            eraseWidth  = Math.max(1, Math.ceil(baseW * 1.4 + 20));
            eraseHeight = Math.max(1, Math.ceil(baseH * 1.8 + 8));
            const leftAnchor = Number(item.originalLeft ?? item.left ?? 0);
            const topAnchor  = Number(item.originalTop  ?? item.top  ?? 0);
            eraseX     = leftAnchor - 4;
            eraseBaseY = pageHeight - topAnchor;
          }

          const eraseY = eraseBaseY - eraseHeight * 0.8;
          try {
            page.drawRectangle({ x: eraseX, y: clamp(eraseY, 0, pageHeight), width: eraseWidth, height: eraseHeight, color: rgb(1,1,1), opacity: 1 });
            console.log(`[DEBUG] drawCanvasPages: Erased PDF background area for original text -> rect=(x=${eraseX},y=${eraseY},w=${eraseWidth},h=${eraseHeight})`);
          } catch (e) {
            console.warn('[DEBUG] drawCanvasPages: erase rect failed', e?.message || e);
          }
          if (item.deleted) {
            continue;
          }
        }

        // Draw replacement or new text using PDF-space coords where available
        let xCoord, yCoord;
        if (item.pdfBaselineY != null && item.pdfLeft != null) {
          xCoord = Number(item.pdfLeft);
          yCoord = Number(item.pdfBaselineY);
        } else {
          const canvasTop  = Number(item.originalTop  ?? item.top  ?? 0);
          const canvasLeft = Number(item.originalLeft ?? item.left ?? 0);
          xCoord = canvasLeft;
          yCoord = pageHeight - canvasTop - size;
        }

        // Word wrapping for textbox objects
        const wrapWidth = item.type === 'textbox' ? (item.pdfWidth || (item.originalWidth / (item.renderScale || 1)) || (item.width / (item.renderScale || 1))) : Infinity;
        const words = safeText.split(/([ \n])/);
        const lines = [];
        let currentLine = '';
        
        for (const word of words) {
          if (word === '\n') {
            lines.push(currentLine);
            currentLine = '';
            continue;
          }
          const testLine = currentLine + word;
          const testWidth = font.widthOfTextAtSize(testLine, size);
          
          if (testWidth > wrapWidth && currentLine.trim() !== '') {
            lines.push(currentLine);
            currentLine = word.startsWith(' ') ? word.slice(1) : word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) {
          lines.push(currentLine);
        }

        const lineHeight = size * Number(item.lineHeight || 1.16);
        lines.forEach((line, idx) => {
          page.drawText(line, { 
            x: xCoord, 
            y: clamp(yCoord - (idx * lineHeight), 0, pageHeight), 
            size, 
            font, 
            color: textColor, 
            rotate: item.angle ? degrees(Number(item.angle)) : undefined, 
            opacity: Number(item.opacity ?? 1) 
          });
        });
        continue;
      }

      if (item.type === 'image') {
        const source = extractDataUrl(item.src || item.sourceUrl);
        if (!source) continue;

        const image = source.mimeType === 'png'
          ? await pdfDoc.embedPng(source.bytes)
          : await pdfDoc.embedJpg(source.bytes);

        // Normalize from canvas-space to PDF user-space
        const imgLeft   = Number(item.left   || 0) / renderScale;
        const imgTop    = Number(item.top    || 0) / renderScale;
        const imgWidth  = Number(item.width  || image.width  || 0) / renderScale;
        const imgHeight = Number(item.height || image.height || 0) / renderScale;

        page.drawImage(image, {
          x: imgLeft,
          y: clamp(pageHeight - imgTop - imgHeight, 0, pageHeight),
          width:  imgWidth,
          height: imgHeight,
          opacity: Number(item.opacity ?? 1),
          rotate: item.angle ? degrees(Number(item.angle)) : undefined
        });
        continue;
      }

      if (item.type === 'rect') {
        const rs2   = renderScale;
        const width  = Number(item.width  || 0) * Number(item.scaleX || 1) / rs2;
        const height = Number(item.height || 0) * Number(item.scaleY || 1) / rs2;
        const rLeft  = Number(item.left   || 0) / rs2;
        const rTop   = Number(item.top    || 0) / rs2;
        page.drawRectangle({
          x: rLeft,
          y: clamp(pageHeight - rTop - height, 0, pageHeight),
          width,
          height,
          color: toRgbColor(item.fill, rgb(0, 0, 0)),
          opacity: Number(item.opacity ?? 1),
          borderColor: item.stroke ? toRgbColor(item.stroke, rgb(0, 0, 0)) : undefined,
          borderWidth: Number(item.strokeWidth ?? 0) / rs2,
          rotate: item.angle ? degrees(Number(item.angle)) : undefined
        });
        continue;
      }

      if (item.type === 'circle') {
        const rs2    = renderScale;
        const radius = Number(item.radius || 0) * Number(item.scaleX || 1) / rs2;
        const cLeft  = Number(item.left || 0) / rs2;
        const cTop   = Number(item.top  || 0) / rs2;
        page.drawEllipse({
          x: cLeft + radius,
          y: clamp(pageHeight - cTop - radius, 0, pageHeight),
          xScale: radius,
          yScale: radius,
          color: toRgbColor(item.fill, rgb(0, 0, 0)),
          opacity: Number(item.opacity ?? 1),
          borderColor: item.stroke ? toRgbColor(item.stroke, rgb(0, 0, 0)) : undefined,
          borderWidth: Number(item.strokeWidth ?? 0) / rs2
        });
        continue;
      }

      if (item.type === 'line') {
        const rs2 = renderScale;
        page.drawLine({
          start: { x: (Number(item.left || 0) + Number(item.x1 || 0)) / rs2, y: clamp(pageHeight - (Number(item.top || 0) + Number(item.y1 || 0)) / rs2, 0, pageHeight) },
          end:   { x: (Number(item.left || 0) + Number(item.x2 || 0)) / rs2, y: clamp(pageHeight - (Number(item.top || 0) + Number(item.y2 || 0)) / rs2, 0, pageHeight) },
          thickness: Number(item.strokeWidth ?? 1) / rs2,
          color: toRgbColor(item.stroke, rgb(0.07, 0.09, 0.15)),
          opacity: Number(item.opacity ?? 1)
        });
        continue;
      }

      if (item.type === 'path' && Array.isArray(item.path)) {
        page.drawSvgPath(JSON.stringify(item.path));
      }
    }
  }
};

const drawCanvasPageOverlay = async (page, pageData, pdfDoc) => {
  if (!page || !pageData) return;

  const pageHeight = page.getSize().height;
  const items = Array.isArray(pageData.objects) ? pageData.objects : [];

  // Strategy: Only modify items that were explicitly changed.
  // For PDF-sourced text:
  //   - If unchanged (text === originalText): SKIP (leave original vectors intact)
  //   - If changed: ERASE original area (white rect) + DRAW replacement text
  //   - If deleted: ERASE original area (white rect) + SKIP drawing
  // For new items (source !== 'pdf'): just draw them normally
  // This preserves all original layout, fonts, colors, shapes for unmodified content.

  for (const item of items) {
    if (!item || item.visible === false) {
      continue;
    }

    try {
      if (isPdfTextObject(item) && typeof item.text === 'string') {
        const originalText = typeof item.originalText === 'string' ? item.originalText : '';
        const currentText = item.text || '';
        const isOriginalPdfText = item.source === 'pdf';
        const hasChangedText = currentText !== originalText;
        const isModified = isOriginalPdfText && (hasChangedText || item.deleted || item.dirty);

        // Unchanged PDF text: skip entirely (preserve original vectors)
        if (isOriginalPdfText && !hasChangedText && !item.deleted && !item.dirty) {
          console.log(`[DEBUG] drawCanvasPageOverlay: Skipping unchanged PDF text: "${currentText.substring(0, 30)}"`);
          continue;
        }

        // For modified PDF text: erase the original area
        if (isModified && isOriginalPdfText) {
          // Use PDF-space coordinates for stable erase position across render scales
          const eraseFontSize = Number(item.pdfFontSize ?? item.originalFontSize ?? item.fontSize ?? 16);
          const scaleX  = Number(item.scaleX ?? 1) || 1;
          const scaleY  = Number(item.scaleY ?? 1) || 1;

          // Compute erase bounds in PDF space
          let eraseWidth, eraseHeight, eraseX, eraseBaseY;
          if (item.pdfBaselineY != null && item.pdfLeft != null) {
            // Use stored PDF-space geometry for precision
            const pdfW = Number(item.pdfWidth || item.pdfFontSize * 6) * scaleX;
            eraseWidth  = Math.max(1, Math.ceil(pdfW * 1.4 + 20));
            eraseHeight = Math.max(1, Math.ceil(eraseFontSize * scaleY * 1.8 + 8));
            eraseX      = Number(item.pdfLeft) - 4;
            eraseBaseY  = Number(item.pdfBaselineY); // baseline in PDF space (Y=0 at bottom)
          } else {
            // Fallback: canvas-space calculation
            const baseWidth  = Number((item.originalWidth  || item.width  || 0) * scaleX);
            const baseHeight = Number((item.originalFontSize ?? item.originalHeight ?? item.height ?? 16) * scaleY);
            eraseWidth  = Math.max(1, Math.ceil(baseWidth  * 1.4 + 20));
            eraseHeight = Math.max(1, Math.ceil(baseHeight * 1.8 + 8));
            const leftAnchor = Number(item.originalLeft ?? item.left ?? 0);
            const topAnchor  = Number(item.originalTop  ?? item.top  ?? 0);
            eraseX     = leftAnchor - 4;
            eraseBaseY = pageHeight - topAnchor; // approximate baseline in PDF space
          }

          // If text is rotated, add extra padding
          const angleDeg = Number(item.angle ?? 0) || 0;
          if (Math.abs(angleDeg) > 0.1) { eraseWidth += 16; eraseHeight += 10; }

          // Erase rect bottom = eraseBaseY - ascent padding; top = eraseBaseY + descent padding
          const eraseY = eraseBaseY - eraseHeight * 0.8; // sits mostly above baseline

          try {
            page.drawRectangle({
              x: eraseX,
              y: clamp(eraseY, 0, pageHeight),
              width: eraseWidth,
              height: eraseHeight,
              color: rgb(1, 1, 1),
              opacity: 1
            });
            console.log(`[DEBUG] drawCanvasPageOverlay: Erased for "${originalText.substring(0, 30)}" -> rect=(x=${eraseX}, y=${eraseY}, w=${eraseWidth}, h=${eraseHeight})`);
          } catch (e) {
            console.warn('[DEBUG] drawCanvasPageOverlay: erase rect draw failed', e?.message || e);
          }

          // If deleted, skip drawing (just leave the white erase area)
          if (item.deleted) {
            console.log(`[DEBUG] drawCanvasPageOverlay: Item marked deleted, skipping draw`);
            continue;
          }
        }

        // For new text OR modified PDF text: draw the text
        const font = await pdfDoc.embedFont(standardFontFor(item.fontFamily, item.fontWeight, item.fontStyle));
        console.log(`[DEBUG] drawCanvasPageOverlay: Drawing text: "${currentText.substring(0, 50)}" (source=${item.source})`);
        const size = Number(item.pdfFontSize ?? item.originalFontSize ?? item.fontSize ?? 16);
        const textColor = toRgbColor(item.fill, rgb(0.07, 0.09, 0.15));
        const safeText = currentText.replace(/[^\x20-\xFF]/g, '');

        if (!safeText.trim()) {
          console.log(`[DEBUG] drawCanvasPageOverlay: Text was empty after sanitization, skipping`);
          continue;
        }

        // Prefer PDF-space coordinates (pdfBaselineY is Y=0 at bottom — exactly what pdf-lib needs).
        // Fall back to canvas-space Y-flip for user-added items that have no pdfBaselineY.
        let xCoord, yCoord;
        if (item.pdfBaselineY != null && item.pdfLeft != null) {
          // Original PDF text: use stored PDF-space baseline directly
          xCoord = Number(item.pdfLeft);
          yCoord = Number(item.pdfBaselineY);
        } else {
          // New/user text: convert canvas-space top to PDF-space baseline
          const canvasTop = Number(item.originalTop ?? item.top ?? 0);
          const canvasLeft = Number(item.originalLeft ?? item.left ?? 0);
          xCoord = canvasLeft;
          yCoord = pageHeight - canvasTop - size;
        }

        // Word wrapping for textbox objects
        const wrapWidth = item.type === 'textbox' ? (item.pdfWidth || (item.originalWidth / (item.renderScale || 1)) || (item.width / (item.renderScale || 1))) : Infinity;
        const words = safeText.split(/([ \n])/);
        const lines = [];
        let currentLine = '';
        
        for (const word of words) {
          if (word === '\n') {
            lines.push(currentLine);
            currentLine = '';
            continue;
          }
          const testLine = currentLine + word;
          const testWidth = font.widthOfTextAtSize(testLine, size);
          
          if (testWidth > wrapWidth && currentLine.trim() !== '') {
            lines.push(currentLine);
            currentLine = word.startsWith(' ') ? word.slice(1) : word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) {
          lines.push(currentLine);
        }

        const lineHeight = size * Number(item.lineHeight || 1.16);
        lines.forEach((line, idx) => {
          page.drawText(line, {
            x: xCoord,
            y: clamp(yCoord - (idx * lineHeight), 0, pageHeight),
            size,
            font,
            color: textColor,
            rotate: item.angle ? degrees(Number(item.angle)) : undefined,
            opacity: Number(item.opacity ?? 1)
          });
        });
        console.log(`[DEBUG] drawCanvasPageOverlay: Drew text at (x=${xCoord}, y=${clamp(yCoord, 0, pageHeight)}), size=${size}`);
        continue;
      }
    } catch (itemError) {
      console.error(`[DEBUG] drawCanvasPageOverlay: Error processing item:`, itemError);
      throw itemError;
    }

    if (item.type === 'image') {
      const source = extractDataUrl(item.src || item.sourceUrl);
      if (!source) continue;

      const image = source.mimeType === 'png'
        ? await pdfDoc.embedPng(source.bytes)
        : await pdfDoc.embedJpg(source.bytes);

      const width = Number(item.width || image.width || 0);
      const height = Number(item.height || image.height || 0);

      page.drawImage(image, {
        x: Number(item.left || 0),
        y: clamp(pageHeight - Number(item.top || 0) - height, 0, pageHeight),
        width,
        height,
        opacity: Number(item.opacity ?? 1),
        rotate: item.angle ? degrees(Number(item.angle)) : undefined
      });
      continue;
    }

    if (item.type === 'rect') {
      const width = Number(item.width || 0) * Number(item.scaleX || 1);
      const height = Number(item.height || 0) * Number(item.scaleY || 1);
      page.drawRectangle({
        x: Number(item.left || 0),
        y: clamp(pageHeight - Number(item.top || 0) - height, 0, pageHeight),
        width,
        height,
        color: toRgbColor(item.fill, rgb(0, 0, 0)),
        opacity: Number(item.opacity ?? 1),
        borderColor: item.stroke ? toRgbColor(item.stroke, rgb(0, 0, 0)) : undefined,
        borderWidth: Number(item.strokeWidth ?? 0),
        rotate: item.angle ? degrees(Number(item.angle)) : undefined
      });
      continue;
    }

    if (item.type === 'circle') {
      const radius = Number(item.radius || 0) * Number(item.scaleX || 1);
      page.drawEllipse({
        x: Number(item.left || 0) + radius,
        y: clamp(pageHeight - Number(item.top || 0) - radius, 0, pageHeight),
        xScale: radius,
        yScale: radius,
        color: toRgbColor(item.fill, rgb(0, 0, 0)),
        opacity: Number(item.opacity ?? 1),
        borderColor: item.stroke ? toRgbColor(item.stroke, rgb(0, 0, 0)) : undefined,
        borderWidth: Number(item.strokeWidth ?? 0)
      });
      continue;
    }

    if (item.type === 'line') {
      page.drawLine({
        start: { x: Number(item.left || 0) + Number(item.x1 || 0), y: clamp(pageHeight - Number(item.top || 0) - Number(item.y1 || 0), 0, pageHeight) },
        end: { x: Number(item.left || 0) + Number(item.x2 || 0), y: clamp(pageHeight - Number(item.top || 0) - Number(item.y2 || 0), 0, pageHeight) },
        thickness: Number(item.strokeWidth ?? 1),
        color: toRgbColor(item.stroke, rgb(0.07, 0.09, 0.15)),
        opacity: Number(item.opacity ?? 1)
      });
      continue;
    }

    if (item.type === 'path' && Array.isArray(item.path)) {
      page.drawSvgPath(JSON.stringify(item.path));
    }
  }
};

// Helper function to track conversion
const trackConversion = async (userId, ipAddress, conversionType, originalFileName, outputFileName, fileSize, storageType, gridFsFileId = null) => {
  try {
    const expiresAt = storageType === 'temporary' ? new Date(Date.now() + 60 * 60 * 1000) : null; // 1 hour for temporary

    await Conversion.create({
      userId,
      ipAddress,
      conversionType,
      originalFileName,
      outputFileName,
      fileSize,
      storageType,
      gridFsFileId,
      expiresAt
    });

    // Update User statistics if authenticated
    if (userId) {
      console.log(`[TrackConversion] Attempting to update stats for user ${userId}`);
      try {
        const user = await User.findById(userId);
        if (user) {
          user.totalConversions = (user.totalConversions || 0) + 1;
          user.conversionsThisMonth = (user.conversionsThisMonth || 0) + 1;
          // NOTE: conversionsThisHour is already incremented by the rate limiter middleware
          // Do NOT increment it here to avoid double-counting

          // If file was stored in GridFS, add to filesStored
          if (gridFsFileId) {
            user.filesStored.push(gridFsFileId);
          }
          await user.save();
          console.log(`[TrackConversion] Successfully updated stats. Total: ${user.totalConversions}`);
        } else {
          console.warn(`[TrackConversion] User ${userId} not found`);
        }
      } catch (updateError) {
        console.error('[TrackConversion] Error updating user stats:', updateError);
      }
    }
  } catch (error) {
    console.error('Error tracking conversion:', error);
  }
};

// PDF to Word Converter
exports.pdfToWord = async (req, res) => {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const outputDir = path.join(__dirname, '../uploads');
    const outputFileName = req.file.filename.replace(path.extname(req.file.filename), "") + ".docx";
    const outputPath = path.join(outputDir, outputFileName);

    // Check local file existence before convert
    await fs.access(req.file.path);

    // Convert using Python pdf2docx
    try {
      const pythonScript = path.join(__dirname, '../utils/pdfToWord.py');
      await runPythonScript(pythonScript, [req.file.path, outputPath]);
    } catch (error) {
      console.error('Python PDF to Word conversion error:', error.message);
      if (error.attempts) console.error('Python attempts:', error.attempts.join(' | '));
      // Log stderr if available for debugging
      if (error.stderr) console.error('Python stderr:', error.stderr);
      throw new Error('Conversion failed. Please install Python or set PYTHON_EXECUTABLE, then try again.');
    }

    // Check if output exists
    try {
      await fs.access(outputPath);
    } catch (e) {
      throw new Error('Output file was not generated.');
    }

    // Get file stats
    const stats = await fs.stat(outputPath);

    // Track conversion
    const ip = req.ip || req.connection.remoteAddress;
    await trackConversion(
      req.user ? req.user._id : null,
      ip,
      'pdf-to-word',
      req.file.originalname,
      outputFileName,
      stats.size,
      req.body.storageType || 'temporary'
    );

    // Clean up original PDF
    await fs.unlink(req.file.path);

    const conversionTime = Date.now() - startTime;

    res.json({
      message: 'PDF converted to Word successfully (High Quality)',
      downloadUrl: `/api/convert/download/${outputFileName}`,
      fileName: outputFileName,
      fileSize: stats.size,
      conversionTime
    });
  } catch (error) {
    console.error('PDF to Word error:', error);
    // Cleanup on error
    try { if (req.file) await fs.unlink(req.file.path); } catch (e) { }
    res.status(500).json({ message: 'Error converting PDF to Word', error: error.message });
  }
};

// PDF to Excel Converter
exports.pdfToExcel = async (req, res) => {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const outputDir = path.join(__dirname, '../uploads');
    const outputFileName = req.file.filename.replace(path.extname(req.file.filename), "") + ".xlsx";
    const outputPath = path.join(outputDir, outputFileName);

    // Convert using LibreOffice
    // --infilter="calc_pdf_import" forces PDF import into Calc
    try {
      const command = `"${LIBREOFFICE_PATH}" --headless --infilter="calc_pdf_import" --convert-to xlsx --outdir "${outputDir}" "${req.file.path}"`;
      await execAsync(command);
    } catch (error) {
      console.error('LibreOffice PDF to Excel conversion error:', error.message);
      throw new Error('Conversion failed. Please ensure the file is a valid PDF.');
    }

    // Check if output exists
    try {
      await fs.access(outputPath);
    } catch (e) {
      throw new Error('Output file was not generated.');
    }

    // Get file size
    const stats = await fs.stat(outputPath);

    // Track conversion
    const ip = req.ip || req.connection.remoteAddress;
    await trackConversion(
      req.user ? req.user._id : null,
      ip,
      'pdf-to-excel',
      req.file.originalname,
      outputFileName,
      stats.size,
      req.body.storageType || 'temporary'
    );

    // Clean up original PDF
    await fs.unlink(req.file.path);

    const conversionTime = Date.now() - startTime;

    res.json({
      message: 'PDF converted to Excel successfully (Enhanced Tables)',
      downloadUrl: `/api/convert/download/${outputFileName}`,
      fileName: outputFileName,
      fileSize: stats.size,
      conversionTime
    });
  } catch (error) {
    console.error('PDF to Excel error:', error);
    // Cleanup
    try { if (req.file) await fs.unlink(req.file.path); } catch (e) { }
    res.status(500).json({ message: 'Error converting PDF to Excel', error: error.message });
  }
};

// Compress PDF
exports.compressPdf = async (req, res) => {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { compressionLevel } = req.body; // 'basic' or 'strong'
    const outputFileName = req.file.filename.replace(path.extname(req.file.filename), "") + "-compressed.pdf";
    const outputPath = path.join(__dirname, '../uploads', outputFileName);
    let compressedBytes;
    let originalSize;

    if (compressionLevel === 'strong') {
      // STRONG COMPRESSION (Rasterization using pdftoppm)
      const inputPath = req.file.path;
      const outputDir = path.join(__dirname, '../uploads', `temp_${Date.now()}`);

      try {
        await fs.mkdir(outputDir);

        // 1. Convert PDF to Images using pdftoppm (Linux native & Windows compatible)
        const pdftoppmExec = getPdftoppmExecForShell();

        const command = `${pdftoppmExec} -jpeg -r 150 "${inputPath}" "${path.join(outputDir, 'page')}"`;
        await execAsync(command);

        // 2. Compress Images & Build PDF
        const pdfDoc = await PDFDocument.create();
        const files = await fs.readdir(outputDir);
        const imageFiles = files.filter(f => f.startsWith('page') && f.endsWith('.jpg'));

        // Sort by page number (pdftoppm outputs page-1.jpg, page-2.jpg, etc.)
        imageFiles.sort((a, b) => {
          const numA = parseInt(a.match(/page-(\d+)/)?.[1] || '0');
          const numB = parseInt(b.match(/page-(\d+)/)?.[1] || '0');
          return numA - numB;
        });

        for (const file of imageFiles) {
          const filePath = path.join(outputDir, file);
          const imageBuffer = await fs.readFile(filePath);

          // Compress with Sharp
          const compressedImage = await sharp(imageBuffer)
            .jpeg({ quality: 50 }) // Aggressive compression
            .toBuffer();

          const image = await pdfDoc.embedJpg(compressedImage);
          const page = pdfDoc.addPage([image.width, image.height]);
          page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height
          });
        }

        compressedBytes = await pdfDoc.save();
        await fs.writeFile(outputPath, compressedBytes);

        // Cleanup temp dir
        for (const file of await fs.readdir(outputDir)) {
          await fs.unlink(path.join(outputDir, file));
        }
        await fs.rmdir(outputDir);

        const stats = await fs.stat(req.file.path);
        originalSize = stats.size;

      } catch (err) {
        // Cleanup on error
        try {
          const files = await fs.readdir(outputDir);
          for (const file of files) await fs.unlink(path.join(outputDir, file));
          await fs.rmdir(outputDir);
        } catch (e) { }
        throw err;
      }

    } else {
      // BASIC COMPRESSION (Default)
      const pdfBuffer = await fs.readFile(req.file.path);
      originalSize = pdfBuffer.length;
      const pdfDoc = await PDFDocument.load(pdfBuffer);

      // Save with compression options
      compressedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 50
      });

      await fs.writeFile(outputPath, compressedBytes);
    }

    const compressedSize = compressedBytes.length;
    const reductionPercent = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);

    // Track conversion
    const ip = req.ip || req.connection.remoteAddress;
    await trackConversion(
      req.user ? req.user._id : null,
      ip,
      'compress-pdf',
      req.file.originalname,
      outputFileName,
      compressedSize,
      req.body.storageType || 'temporary'
    );

    // Clean up original PDF
    await fs.unlink(req.file.path);

    const conversionTime = Date.now() - startTime;

    res.json({
      message: 'PDF compressed successfully',
      downloadUrl: `/api/convert/download/${outputFileName}`,
      fileName: outputFileName,
      originalSize,
      compressedSize,
      reductionPercent,
      conversionTime
    });
  } catch (error) {
    console.error('Compress PDF error:', error);
    res.status(500).json({ message: 'Error compressing PDF', error: error.message });
  }
};

// Merge PDFs
exports.mergePdf = async (req, res) => {
  const startTime = Date.now();

  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ message: 'Please upload at least 2 PDF files to merge' });
    }

    if (req.files.length > 10) {
      return res.status(400).json({ message: 'Maximum 10 files allowed for merging' });
    }

    // Create merged PDF
    const mergedPdf = await PDFDocument.create();

    // Load and merge each PDF with validation
    const failedFiles = [];
    for (const file of req.files) {
      const pdfBuffer = await fs.readFile(file.path);

      try {
        const pdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      } catch (loadError) {
        console.error(`Failed to load PDF: ${file.originalname}`, loadError.message);
        failedFiles.push(file.originalname);
      }

      // Clean up individual file
      await fs.unlink(file.path);
    }

    // If all files failed, return error
    if (failedFiles.length === req.files.length) {
      return res.status(400).json({
        message: 'All uploaded files are invalid or corrupted PDFs.',
        failedFiles
      });
    }

    // If some files failed, warn but continue
    if (failedFiles.length > 0) {
      console.warn(`Some files could not be merged: ${failedFiles.join(', ')}`);
    }

    const mergedBytes = await mergedPdf.save();
    const outputFileName = `merged-pdf-swift-${Date.now()}.pdf`;
    const outputPath = path.join(__dirname, '../uploads', outputFileName);

    await fs.writeFile(outputPath, mergedBytes);

    // Track conversion
    const ip = req.ip || req.connection.remoteAddress;
    await trackConversion(
      req.user ? req.user._id : null,
      ip,
      'merge-pdf',
      req.files.map(f => f.originalname).join(', '),
      outputFileName,
      mergedBytes.length,
      req.body.storageType || 'temporary'
    );

    const conversionTime = Date.now() - startTime;

    res.json({
      message: `${req.files.length} PDFs merged successfully`,
      downloadUrl: `/api/convert/download/${outputFileName}`,
      fileName: outputFileName,
      fileSize: mergedBytes.length,
      conversionTime
    });
  } catch (error) {
    console.error('Merge PDF error:', error);

    // Clean up files on error
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (e) { }
      }
    }

    res.status(500).json({ message: 'Error merging PDFs', error: error.message });
  }
};

// Split PDF
exports.splitPdf = async (req, res) => {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { pageRange } = req.body;
    if (!pageRange) {
      return res.status(400).json({ message: 'Please specify page range (e.g., "1-3" or "1,3,5")' });
    }

    const pdfBuffer = await fs.readFile(req.file.path);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const totalPages = pdfDoc.getPageCount();

    // Parse page range
    let pagesToExtract = [];
    if (pageRange.includes('-')) {
      const [start, end] = pageRange.split('-').map(n => parseInt(n));
      for (let i = start; i <= end && i <= totalPages; i++) {
        pagesToExtract.push(i - 1); // 0-indexed
      }
    } else {
      pagesToExtract = pageRange.split(',').map(n => parseInt(n) - 1);
    }

    // Create new PDF with selected pages
    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdfDoc, pagesToExtract);
    copiedPages.forEach(page => newPdf.addPage(page));

    const splitBytes = await newPdf.save();
    const outputFileName = req.file.filename.replace(path.extname(req.file.filename), "") + "-split.pdf";
    const outputPath = path.join(__dirname, '../uploads', outputFileName);

    await fs.writeFile(outputPath, splitBytes);

    // Track conversion
    const ip = req.ip || req.connection.remoteAddress;
    await trackConversion(
      req.user ? req.user._id : null,
      ip,
      'split-pdf',
      req.file.originalname,
      outputFileName,
      splitBytes.length,
      req.body.storageType || 'temporary'
    );

    // Clean up original PDF
    await fs.unlink(req.file.path);

    const conversionTime = Date.now() - startTime;

    res.json({
      message: `PDF split successfully (pages ${pageRange})`,
      downloadUrl: `/api/convert/download/${outputFileName}`,
      fileName: outputFileName,
      fileSize: splitBytes.length,
      pagesExtracted: pagesToExtract.length,
      conversionTime
    });
  } catch (error) {
    console.error('Split PDF error:', error);
    res.status(500).json({ message: 'Error splitting PDF', error: error.message });
  }
};

// JPG to PDF Converter
exports.jpgToPdf = async (req, res) => {
  const startTime = Date.now();

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    const pdfDoc = await PDFDocument.create();

    for (const file of req.files) {
      let imageBytes = await fs.readFile(file.path);

      // Resize if needed, but preserve format
      let resized;
      let image;

      if (file.mimetype === 'image/png') {
        // Keep PNG format
        resized = await sharp(imageBytes)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .png({ quality: 90 })
          .toBuffer();
        image = await pdfDoc.embedPng(resized);
      } else {
        // Convert to JPEG for JPG, JPEG, and other formats
        resized = await sharp(imageBytes)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 90 })
          .toBuffer();
        image = await pdfDoc.embedJpg(resized);
      }


      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height
      });

      // Clean up individual file
      await fs.unlink(file.path);
    }

    const pdfBytes = await pdfDoc.save();
    const outputFileName = `converted-pdf-swift-${Date.now()}.pdf`;
    const outputPath = path.join(__dirname, '../uploads', outputFileName);

    await fs.writeFile(outputPath, pdfBytes);

    // Track conversion
    const ip = req.ip || req.connection.remoteAddress;
    await trackConversion(
      req.user ? req.user._id : null,
      ip,
      'jpg-to-pdf',
      req.files.map(f => f.originalname).join(', '),
      outputFileName,
      pdfBytes.length,
      req.body.storageType || 'temporary'
    );

    const conversionTime = Date.now() - startTime;

    res.json({
      message: `${req.files.length} image(s) converted to PDF successfully`,
      downloadUrl: `/api/convert/download/${outputFileName}`,
      fileName: outputFileName,
      fileSize: pdfBytes.length,
      conversionTime
    });
  } catch (error) {
    console.error('JPG to PDF error:', error);

    // Clean up files on error
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (e) { }
      }
    }

    res.status(500).json({ message: 'Error converting images to PDF', error: error.message });
  }
};

// Download file
exports.downloadFile = async (req, res) => {
  try {
    const fileName = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', fileName);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ message: 'File not found or expired' });
    }

    // Lock file to prevent cleanup during download (auto-unlocks after 5 minutes)
    lockFileWithTimeout(fileName, 5 * 60 * 1000);

    res.download(filePath, fileName, async (err) => {
      // Unlock file after download completes (success or error)
      unlockFile(fileName);

      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error downloading file' });
        }
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Error downloading file' });
  }
};

// PDF to JPG Converter
exports.pdfToJpg = async (req, res) => {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const pdfPath = req.file.path;
    const outputDir = path.join(__dirname, '../uploads');
    const baseFileName = path.basename(req.file.filename, '.pdf');

    // PDF to image conversion options
    const opts = {
      format: 'jpeg',
      out_dir: outputDir,
      out_prefix: baseFileName,
      page: null // Convert all pages
    };

    // Convert PDF to images using pdftoppm (Linux native & Windows compatible)
    try {
      // On Windows, if POPPLER_PATH is provided, use the full path to pdftoppm.exe
      const pdftoppmExec = getPdftoppmExecForShell();

      const command = `${pdftoppmExec} -jpeg -r 300 "${pdfPath}" "${path.join(outputDir, baseFileName)}"`;
      await execAsync(command);
    } catch (error) {
      console.error('pdftoppm conversion error:', error.message);
      throw new Error('Image conversion service failed. Please ensure poppler-utils is installed.');
    }

    // Find generated image files
    const files = await fs.readdir(outputDir);
    const imageFiles = files.filter(f => f.startsWith(baseFileName) && f.endsWith('.jpg'));

    if (imageFiles.length === 0) {
      throw new Error('No images generated from PDF');
    }

    // Use the first image as the primary output
    const originalName = path.parse(req.file.originalname).name;
    const outputFileName = `${originalName}-pdf-swift-1.jpg`; // Use first page
    const outputPath = path.join(outputDir, outputFileName);

    // Rename the generated file to match our target name if needed
    if (imageFiles[0] !== outputFileName) {
      await fs.rename(path.join(outputDir, imageFiles[0]), outputPath);
    }
    const stats = await fs.stat(outputPath);

    // Track conversion
    const ip = req.ip || req.connection.remoteAddress;
    await trackConversion(
      req.user ? req.user._id : null,
      ip,
      'pdf-to-jpg',
      req.file.originalname,
      outputFileName,
      stats.size,
      req.body.storageType || 'temporary'
    );

    // Clean up original PDF
    await fs.unlink(pdfPath);

    const conversionTime = Date.now() - startTime;

    res.json({
      message: `PDF converted to ${imageFiles.length} JPG image(s) successfully`,
      downloadUrl: `/api/convert/download/${outputFileName}`,
      fileName: outputFileName,
      fileSize: stats.size,
      pageCount: imageFiles.length,
      conversionTime,
      allImages: imageFiles.map(f => `/api/convert/download/${f}`)
    });
  } catch (error) {
    console.error('PDF to JPG error:', error);
    res.status(500).json({
      message: 'Error converting PDF to JPG. Please ensure the PDF is valid.',
      error: error.message
    });
  }
};

// Word to PDF Converter
// Word to PDF Converter
exports.wordToPdf = async (req, res) => {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file is not empty
    const stats = await fs.stat(req.file.path);
    if (stats.size === 0) {
      await fs.unlink(req.file.path);
      return res.status(400).json({
        message: 'Error: Uploaded file is empty. Please select a valid Word document.'
      });
    }

    const outputDir = path.join(__dirname, '../uploads');
    const outputFileName = req.file.filename.replace(path.extname(req.file.filename), "") + ".pdf";
    const outputPath = path.join(outputDir, outputFileName);

    // Convert to PDF using direct soffice execution
    try {
      const command = `"${LIBREOFFICE_PATH}" --headless --convert-to pdf --outdir "${outputDir}" "${req.file.path}"`;
      await execAsync(command);
    } catch (error) {
      console.error('LibreOffice conversion error:', error.message);

      // Clean up original file
      try {
        await fs.unlink(req.file.path);
      } catch (e) { }

      return res.status(503).json({
        message: 'LibreOffice service is unavailable. Please ensure LibreOffice is installed.',
        details: error.message
      });
    }

    // Check if output file exists and is not empty
    try {
      const pdfStats = await fs.stat(outputPath);
      if (pdfStats.size === 0) {
        throw new Error('Output PDF is empty');
      }
    } catch (e) {
      // Clean up original file
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupErr) { }

      return res.status(400).json({
        message: 'Conversion failed. Please ensure your Word document is valid.'
      });
    }

    // Read the generated PDF to buffer (optional, but good for consistency if we wanted to stream, but here we just leave it on disk)
    // Actually, trackConversion expects fileSize.
    const pdfStats = await fs.stat(outputPath);

    // Track conversion
    const ip = req.ip || req.connection.remoteAddress;
    await trackConversion(
      req.user ? req.user._id : null,
      ip,
      'word-to-pdf',
      req.file.originalname,
      outputFileName,
      pdfStats.size,
      req.body.storageType || 'temporary'
    );

    // Clean up original file
    await fs.unlink(req.file.path);

    const conversionTime = Date.now() - startTime;

    res.json({
      message: 'Word document converted to PDF successfully',
      downloadUrl: `/api/convert/download/${outputFileName}`,
      fileName: outputFileName,
      fileSize: pdfStats.size,
      conversionTime
    });
  } catch (error) {
    console.error('Word to PDF error:', error);

    // Cleanup on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) { }
    }

    res.status(500).json({
      message: 'Error converting Word to PDF.',
      error: error.message
    });
  }
};

// Excel to PDF Converter
// Excel to PDF Converter
exports.excelToPdf = async (req, res) => {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file is not empty
    const stats = await fs.stat(req.file.path);
    if (stats.size === 0) {
      await fs.unlink(req.file.path);
      return res.status(400).json({
        message: 'Error: Uploaded file is empty. Please select a valid Excel spreadsheet.'
      });
    }

    const outputDir = path.join(path.parse(__dirname).dir, 'uploads');
    const outputFileName = req.file.filename.replace(path.extname(req.file.filename), "") + ".pdf";
    const outputPath = path.join(outputDir, outputFileName);

    // Convert to PDF using direct soffice execution
    try {
      const command = `"${LIBREOFFICE_PATH}" --headless --convert-to pdf --outdir "${outputDir}" "${req.file.path}"`;
      await execAsync(command);
    } catch (error) {
      console.error('LibreOffice conversion error:', error.message);

      // Clean up original file
      try {
        await fs.unlink(req.file.path);
      } catch (e) { }

      return res.status(503).json({
        message: 'LibreOffice service is unavailable. Please ensure LibreOffice is installed.',
        details: error.message
      });
    }

    // Check if output file exists and is not empty
    try {
      const pdfStats = await fs.stat(outputPath);
      if (pdfStats.size === 0) {
        throw new Error('Output PDF is empty');
      }
    } catch (e) {
      // Clean up original file
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupErr) { }

      return res.status(400).json({
        message: 'Conversion failed. Please ensure your Excel spreadsheet is valid.'
      });
    }

    const pdfStats = await fs.stat(outputPath);

    // Track conversion
    const ip = req.ip || req.connection.remoteAddress;
    await trackConversion(
      req.user ? req.user._id : null,
      ip,
      'excel-to-pdf',
      req.file.originalname,
      outputFileName,
      pdfStats.size,
      req.body.storageType || 'temporary'
    );

    // Clean up original file
    await fs.unlink(req.file.path);

    const conversionTime = Date.now() - startTime;

    res.json({
      message: 'Excel spreadsheet converted to PDF successfully',
      downloadUrl: `/api/convert/download/${outputFileName}`,
      fileName: outputFileName,
      fileSize: pdfStats.size,
      conversionTime
    });
  } catch (error) {
    console.error('Excel to PDF error:', error);

    // Cleanup on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) { }
    }

    res.status(500).json({
      message: 'Error converting Excel to PDF.',
      error: error.message
    });
  }
};

// PDF Editor - Canvas-based content reconstruction
exports.editPdf = async (req, res) => {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }


    let canvasData = null;
    let texts = [];
    let images = [];
    let annotations = [];
    let watermark = null;
    let rotate = null;

    try {
      canvasData = parseJsonField(req.body.canvasData, null);
      texts = parseJsonField(req.body.texts, []);
      images = parseJsonField(req.body.images, []);
      annotations = parseJsonField(req.body.annotations, []);
      watermark = parseJsonField(req.body.watermark, null);
      rotate = parseJsonField(req.body.rotate, null);
    } catch (parseError) {
      console.error('Error parsing edit data:', parseError);
      return res.status(400).json({ message: 'Invalid edit data format' });
    }

    const pdfBytes = await fs.readFile(req.file.path);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    let editedPdfBytes;

    console.log(`[DEBUG] editPdf: canvasData structure:`, {
      hasPages: !!canvasData?.pages,
      pagesLength: canvasData?.pages?.length,
      firstPageObjects: canvasData?.pages?.[0]?.objects?.length
    });

    if (canvasData?.pages?.length) {
      console.log(`[DEBUG] editPdf: Using canvas-based editing for ${canvasData.pages.length} pages`);
      const rebuiltPdfDoc = await PDFDocument.create();
      const copiedPages = await rebuiltPdfDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
      copiedPages.forEach((page) => rebuiltPdfDoc.addPage(page));

      const rebuiltPages = rebuiltPdfDoc.getPages();
      for (let index = 0; index < canvasData.pages.length; index += 1) {
        const pageData = canvasData.pages[index];
        const explicitPageNumber = Number(pageData?.pageNumber);
        const targetPageIndex = Number.isFinite(explicitPageNumber) && explicitPageNumber > 0
          ? explicitPageNumber - 1
          : index;
        const targetPage = rebuiltPages[targetPageIndex];
        console.log(`[DEBUG] editPdf: Processing pageDataIndex=${index}, targetPageIndex=${targetPageIndex}, hasPageData=${!!pageData}, hasTargetPage=${!!targetPage}`);
        if (!targetPage || !pageData) continue;
        try {
          await drawCanvasPageOverlay(targetPage, pageData, rebuiltPdfDoc);
          console.log(`[DEBUG] editPdf: Page ${targetPageIndex} overlay complete`);
        } catch (overlayError) {
          console.error(`[DEBUG] editPdf: Page ${targetPageIndex} overlay failed:`, overlayError);
          throw overlayError;
        }
      }

      console.log(`[DEBUG] editPdf: All overlays complete, saving PDF...`);
      editedPdfBytes = await rebuiltPdfDoc.save();
      console.log(`[DEBUG] editPdf: PDF saved, size=${editedPdfBytes.length}`);

      try {
        await PDFDocument.load(editedPdfBytes);
        console.log(`[DEBUG] editPdf: PDF validation passed`);
      } catch (validationError) {
        console.error(`[DEBUG] editPdf: PDF validation failed:`, validationError);
        throw new Error(`Generated PDF failed validation: ${validationError.message}`);
      }
    } else {
      const pages = pdfDoc.getPages();

      for (const textItem of texts) {
        if (!textItem?.text || typeof textItem.text !== 'string') continue;
        const page = pages[textItem.page || 0];
        if (!page) continue;
        const { height } = page.getSize();
        const fontSize = Number(textItem.size || 12);
        const font = await pdfDoc.embedFont(standardFontFor(textItem.fontFamily, textItem.bold ? 'bold' : 'normal', textItem.italic ? 'italic' : 'normal'));
        const cleanText = textItem.text.replace(/[^\x20-\xFF]/g, '');
        if (!cleanText.length) continue;

        page.drawText(cleanText, {
          x: Number(textItem.x || 0),
          y: height - Number(textItem.y || 0) - fontSize,
          size: fontSize,
          color: toRgbColor(textItem.color, rgb(0, 0, 0)),
          font
        });
      }

      for (const imgItem of images) {
        const page = pages[imgItem.page || 0];
        if (!page || !imgItem.imageData) continue;
        const source = extractDataUrl(imgItem.imageData);
        if (!source) continue;
        const image = source.mimeType === 'png' ? await pdfDoc.embedPng(source.bytes) : await pdfDoc.embedJpg(source.bytes);
        page.drawImage(image, {
          x: Number(imgItem.x || 0),
          y: page.getSize().height - Number(imgItem.y || 0) - Number(imgItem.height || 100),
          width: Number(imgItem.width || 100),
          height: Number(imgItem.height || 100)
        });
      }

      for (const annotation of annotations) {
        const page = pages[annotation.page || 0];
        if (!page) continue;
        const { height } = page.getSize();
        const annotationColor = toRgbColor(annotation.color, rgb(1, 1, 0));
        const borderColor = annotation.borderColor ? toRgbColor(annotation.borderColor, rgb(0, 0, 0)) : undefined;
        const opacity = Number(annotation.opacity || 0.3);

        if (annotation.type === 'rectangle' || annotation.type === 'highlight') {
          page.drawRectangle({
            x: Number(annotation.x || 0),
            y: height - Number(annotation.y || 0) - Number(annotation.height || 0),
            width: Number(annotation.width || 0),
            height: Number(annotation.height || 0),
            color: annotationColor,
            opacity,
            borderColor,
            borderWidth: Number(annotation.borderWidth || 1)
          });
        }

        if (annotation.type === 'circle') {
          page.drawEllipse({
            x: Number(annotation.x || 0) + Number(annotation.width || 0) / 2,
            y: height - Number(annotation.y || 0) - Number(annotation.height || 0) / 2,
            xScale: Number(annotation.width || 0) / 2,
            yScale: Number(annotation.height || 0) / 2,
            color: annotationColor,
            opacity,
            borderColor,
            borderWidth: Number(annotation.borderWidth || 1)
          });
        }

        if (annotation.type === 'line') {
          page.drawLine({
            start: { x: Number(annotation.x || 0), y: height - Number(annotation.y || 0) },
            end: { x: Number(annotation.x2 || 0), y: height - Number(annotation.y2 || 0) },
            thickness: Number(annotation.thickness || 2),
            color: annotationColor
          });
        }
      }

      if (watermark && watermark.text) {
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const watermarkColor = toRgbColor(watermark.color, rgb(0.5, 0.5, 0.5));
        const rotationAngle = typeof watermark.rotation === 'object'
          ? (watermark.rotation.angle || 45)
          : (watermark.rotation || 45);

        pages.forEach(page => {
          const { width, height } = page.getSize();
          page.drawText(watermark.text, {
            x: width / 2 - (watermark.text.length * 10),
            y: height / 2,
            size: watermark.size || 50,
            color: watermarkColor,
            opacity: watermark.opacity || 0.3,
            rotate: degrees(rotationAngle),
            font
          });
        });
      }

      if (rotate) {
        const page = pages[rotate.page];
        if (page) {
          const currentRotation = page.getRotation().angle;
          page.setRotation({ angle: currentRotation + (rotate.degrees || 90) });
        }
      }

      editedPdfBytes = await pdfDoc.save();
    }

    // Save the edited PDF
    const outputFileName = req.file.filename.replace(path.extname(req.file.filename), "") + "-edited.pdf";
    const outputPath = path.join(__dirname, '../uploads', outputFileName);

    await fs.writeFile(outputPath, editedPdfBytes);

    // Track conversion
    const ip = req.ip || req.connection.remoteAddress;
    await trackConversion(
      req.user ? req.user._id : null,
      ip,
      'edit-pdf',
      req.file.originalname,
      outputFileName,
      editedPdfBytes.length,
      req.body.storageType || 'temporary'
    );

    // Clean up original file
    await fs.unlink(req.file.path);

    const conversionTime = Date.now() - startTime;

    res.json({
      message: canvasData?.pages?.length ? 'Canvas PDF edited successfully' : 'PDF edited successfully',
      downloadUrl: `/api/convert/download/${outputFileName}`,
      fileName: outputFileName,
      fileSize: editedPdfBytes.length,
      conversionTime,
      editsApplied: {
        pages: canvasData?.pages?.length || 0,
        texts: canvasData?.pages?.reduce((count, page) => count + (page?.objects || []).filter(isPdfTextObject).length, 0) || texts.length,
        images: canvasData?.pages?.reduce((count, page) => count + (page?.objects || []).filter(item => item?.type === 'image').length, 0) || images.length,
        annotations: canvasData?.pages?.reduce((count, page) => count + (page?.objects || []).filter(item => ['rect', 'circle', 'line', 'path'].includes(item?.type)).length, 0) || annotations.length,
        watermark: watermark ? true : false,
        rotated: rotate ? true : false
      }
    });
  } catch (error) {
    console.error('PDF editing error:', error);
    res.status(500).json({
      message: 'Error editing PDF. Please ensure the PDF is valid and editing instructions are correct.',
      error: error.message
    });
  }
};

// Protect PDF
exports.protectPdf = async (req, res) => {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const outputFileName = req.file.filename.replace(path.extname(req.file.filename), "") + "-protected.pdf";
    const outputPath = path.join(__dirname, '../uploads', outputFileName);

    // Use muhammara for encryption
    try {
      muhammara.recrypt(req.file.path, outputPath, {
        userPassword: password,
        ownerPassword: password,
        userProtectionFlag: calculateProtectionFlag(typeof req.body.permissions === 'string' ? JSON.parse(req.body.permissions) : req.body.permissions)
      });
    } catch (e) {
      throw new Error('Encryption failed: ' + e.message);
    }

    const stats = await fs.stat(outputPath);

    // Track conversion
    const ip = req.ip || req.connection.remoteAddress;
    await trackConversion(
      req.user ? req.user._id : null,
      ip,
      'protect-pdf',
      req.file.originalname,
      outputFileName,
      stats.size,
      req.body.storageType || 'temporary'
    );

    // Clean up original PDF
    await fs.unlink(req.file.path);

    const conversionTime = Date.now() - startTime;

    res.json({
      message: 'PDF protected successfully',
      downloadUrl: `/api/convert/download/${outputFileName}`,
      fileName: outputFileName,
      fileSize: stats.size,
      conversionTime
    });
  } catch (error) {
    console.error('Protect PDF error:', error);
    res.status(500).json({ message: 'Error protecting PDF', error: error.message });
  }
};

// Watermark PDF
exports.watermarkPdf = async (req, res) => {
  const startTime = Date.now();

  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }

    const pdfFile = req.files.file[0];
    const pdfBuffer = await fs.readFile(pdfFile.path);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();

    const {
      type, // 'text' or 'image'
      text,
      color = '#000000',
      opacity = 0.5,
      size = 50,
      rotation = 0,
      imageScale = 0.5
    } = req.body;

    if (type === 'text') {
      if (!text) return res.status(400).json({ message: 'Watermark text is required' });

      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      // Parse hex color
      const r = parseInt(color.slice(1, 3), 16) / 255;
      const g = parseInt(color.slice(3, 5), 16) / 255;
      const b = parseInt(color.slice(5, 7), 16) / 255;

      const textWidth = font.widthOfTextAtSize(text, Number(size));
      const textHeight = font.heightAtSize(Number(size));

      pages.forEach(page => {
        const { width, height } = page.getSize();
        let x, y;

        if (req.body.x !== undefined && req.body.y !== undefined) {
          x = Number(req.body.x);
          y = Number(req.body.y);
        } else {
          const position = req.body.position || 'center';
          const margin = 20;

          switch (position) {
            case 'top-left':
              x = margin;
              y = height - margin - textHeight;
              break;
            case 'top-center':
              x = (width - textWidth) / 2;
              y = height - margin - textHeight;
              break;
            case 'top-right':
              x = width - margin - textWidth;
              y = height - margin - textHeight;
              break;
            case 'middle-left':
              x = margin;
              y = (height - textHeight) / 2;
              break;
            case 'middle-right':
              x = width - margin - textWidth;
              y = (height - textHeight) / 2;
              break;
            case 'bottom-left':
              x = margin;
              y = margin;
              break;
            case 'bottom-center':
              x = (width - textWidth) / 2;
              y = margin;
              break;
            case 'bottom-right':
              x = width - margin - textWidth;
              y = margin;
              break;
            case 'center':
            default:
              x = (width - textWidth) / 2;
              y = (height - textHeight) / 2;
              break;
          }
        }

        page.drawText(text, {
          x: x,
          y: y,
          size: Number(size),
          font: font,
          color: rgb(r, g, b),
          opacity: Number(opacity),
          rotate: degrees(Number(rotation)),
        });
      });

    } else if (type === 'image') {
      if (!req.files.watermarkImage) {
        return res.status(400).json({ message: 'Watermark image is required' });
      }

      const imageFile = req.files.watermarkImage[0];
      const imageBuffer = await fs.readFile(imageFile.path);
      let image;

      if (imageFile.mimetype === 'image/png') {
        image = await pdfDoc.embedPng(imageBuffer);
      } else {
        image = await pdfDoc.embedJpg(imageBuffer);
      }

      const scaledWidth = image.width * Number(imageScale);
      const scaledHeight = image.height * Number(imageScale);

      pages.forEach(page => {
        const { width, height } = page.getSize();
        let x, y;

        if (req.body.x !== undefined && req.body.y !== undefined) {
          x = Number(req.body.x);
          y = Number(req.body.y);
        } else {
          const position = req.body.position || 'center';
          const margin = 20;

          switch (position) {
            case 'top-left':
              x = margin;
              y = height - margin - scaledHeight;
              break;
            case 'top-center':
              x = (width - scaledWidth) / 2;
              y = height - margin - scaledHeight;
              break;
            case 'top-right':
              x = width - margin - scaledWidth;
              y = height - margin - scaledHeight;
              break;
            case 'middle-left':
              x = margin;
              y = (height - scaledHeight) / 2;
              break;
            case 'middle-right':
              x = width - margin - scaledWidth;
              y = (height - scaledHeight) / 2;
              break;
            case 'bottom-left':
              x = margin;
              y = margin;
              break;
            case 'bottom-center':
              x = (width - scaledWidth) / 2;
              y = margin;
              break;
            case 'bottom-right':
              x = width - margin - scaledWidth;
              y = margin;
              break;
            case 'center':
            default:
              x = (width - scaledWidth) / 2;
              y = (height - scaledHeight) / 2;
              break;
          }
        }

        page.drawImage(image, {
          x: x,
          y: y,
          width: scaledWidth,
          height: scaledHeight,
          opacity: Number(opacity),
          rotate: degrees(Number(rotation)),
        });
      });

      // Cleanup image file
      await fs.unlink(imageFile.path);
    }

    const watermarkedBytes = await pdfDoc.save();
    const outputFileName = pdfFile.filename.replace(path.extname(pdfFile.filename), "") + "-watermarked.pdf";
    const outputPath = path.join(__dirname, '../uploads', outputFileName);

    await fs.writeFile(outputPath, watermarkedBytes);

    // Track conversion
    const ip = req.ip || req.connection.remoteAddress;
    await trackConversion(
      req.user ? req.user._id : null,
      ip,
      'watermark-pdf',
      pdfFile.originalname,
      outputFileName,
      watermarkedBytes.length,
      req.body.storageType || 'temporary'
    );

    // Clean up original PDF
    await fs.unlink(pdfFile.path);

    const conversionTime = Date.now() - startTime;

    res.json({
      message: 'Watermark added successfully',
      downloadUrl: `/api/convert/download/${outputFileName}`,
      fileName: outputFileName,
      fileSize: watermarkedBytes.length,
      conversionTime
    });

  } catch (error) {
    console.error('Watermark PDF error:', error);
    res.status(500).json({ message: 'Error adding watermark', error: error.message });
  }
};

// Unlock PDF
// Unlock PDF
exports.unlockPdf = async (req, res) => {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const outputFileName = req.file.filename.replace(path.extname(req.file.filename), "") + "-unlocked.pdf";
    const outputPath = path.join(__dirname, '../uploads', outputFileName);

    // Use muhammara to unlock (create new PDF and copy pages from encrypted source)
    try {
      const writer = muhammara.createWriter(outputPath);
      // appendPDFPagesFromPDF throws if password is wrong or file invalid
      writer.appendPDFPagesFromPDF(req.file.path, { password });
      writer.end();
    } catch (e) {
      // Check if encryption related (wrong password usually throws 'unable to append page')
      if (e.message && e.message.includes('unable to append page')) {
        console.warn(`Unlock PDF failed: Incorrect password provided for file ${req.file.originalname}`);
        return res.status(400).json({ message: 'Incorrect password' });
      }
      console.error('Muhammara unlock error:', e);
      return res.status(400).json({ message: 'Incorrect password or invalid PDF' });
    }

    const stats = await fs.stat(outputPath);

    // Track conversion
    const ip = req.ip || req.connection.remoteAddress;
    await trackConversion(
      req.user ? req.user._id : null,
      ip,
      'unlock-pdf',
      req.file.originalname,
      outputFileName,
      stats.size,
      req.body.storageType || 'temporary'
    );

    // Clean up original PDF
    await fs.unlink(req.file.path);

    const conversionTime = Date.now() - startTime;

    res.json({
      message: 'PDF unlocked successfully',
      downloadUrl: `/api/convert/download/${outputFileName}`,
      fileName: outputFileName,
      fileSize: stats.size,
      conversionTime
    });

  } catch (error) {
    console.error('Unlock PDF error:', error);
    res.status(500).json({ message: 'Error unlocking PDF', error: error.message });
  }
};

// Download file from GridFS cloud storage
exports.downloadCloudFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;

    if (!fileId) {
      return res.status(400).json({ message: 'File ID is required' });
    }

    // Stream file directly from GridFS to response
    await streamFromGridFS(fileId, res);

  } catch (error) {
    console.error('Cloud download error:', error);

    if (error.message === 'File not found in GridFS') {
      return res.status(404).json({ message: 'File not found or expired' });
    }

    if (!res.headersSent) {
      res.status(500).json({ message: 'Error downloading file from cloud storage' });
    }
  }
};



// Render PDF pages as images (for client-side display fallback)
exports.renderPages = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }

    const uploadStats = await fs.stat(req.file.path);
    if (!uploadStats.size) {
      return res.status(400).json({ message: 'Uploaded PDF is empty' });
    }

    const pagesParam = req.body.pages || req.query.pages || '1';
    const pagesArray = pagesParam.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p) && p > 0);
    
    if (pagesArray.length === 0) {
      return res.status(400).json({ message: 'Invalid pages parameter' });
    }

    console.log(`[renderPages] Rendering pages: ${pagesArray} from ${req.file.originalname}`);

    const pdfPath = req.file.path;
    const uploadDir = path.dirname(pdfPath);
    const baseFilename = `rendered-${Date.now()}`;
    const ppmPath = path.join(uploadDir, `${baseFilename}.ppm`);
    
    // Use pdftoppm to render PDF pages as PPM files
    // pdftoppm outputs one file per page with format: filename-page.ppm
    const pageRanges = pagesArray.join(',');
    const pdftoppmExec = getPdftoppmExecForShell();
    const renderCmd = `${pdftoppmExec} -png -f ${Math.min(...pagesArray)} -l ${Math.max(...pagesArray)} -r 150 "${pdfPath}" "${path.join(uploadDir, baseFilename)}"`;
    
    console.log(`[renderPages] Running: ${renderCmd}`);
    
    try {
      await execAsync(renderCmd);
    } catch (cmdError) {
      console.error('[renderPages] pdftoppm failed:', cmdError);
      return res.status(500).json({ message: 'Failed to render PDF pages' });
    }

    // Read the rendered PNG files and convert to data URLs
    const pages = [];
    for (const pageNum of pagesArray) {
      const pngFile = `${path.join(uploadDir, baseFilename)}-${pageNum}.png`;
      
      try {
        if (!fsSync.existsSync(pngFile)) {
          console.warn(`[renderPages] PNG file not found: ${pngFile}`);
          continue;
        }

        const imageData = await fs.readFile(pngFile);
        const dataUrl = `data:image/png;base64,${imageData.toString('base64')}`;
        pages.push({
          page: pageNum,
          dataUrl,
          size: imageData.length
        });
        
        // Cleanup temp file
        try {
          await fs.unlink(pngFile);
        } catch (e) {
          // Ignore cleanup errors
        }
      } catch (err) {
        console.error(`[renderPages] Error processing page ${pageNum}:`, err);
      }
    }

    if (pages.length === 0) {
      return res.status(500).json({ message: 'No pages were successfully rendered' });
    }

    console.log(`[renderPages] Successfully rendered ${pages.length} page(s)`);
    res.json({ pages, success: true });

  } catch (error) {
    console.error('[renderPages] Error:', error);
    res.status(500).json({ message: 'Server-side rendering failed', error: error.message });
  } finally {
    // Cleanup temp files
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
};



