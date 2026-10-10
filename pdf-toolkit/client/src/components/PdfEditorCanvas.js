import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  Canvas as FabricCanvasClass,
  Circle as FabricCircleClass,
  IText as FabricITextClass,
  Image as FabricImageClass,
  Line as FabricLineClass,
  Path as FabricPathClass,
  Rect as FabricRectClass,
  Textbox as FabricTextboxClass
} from 'fabric';
/* eslint-disable react-hooks/exhaustive-deps */
import {
  FiArrowDown,
  FiArrowUp,
  FiBold,
  FiCircle,
  FiImage,
  FiItalic,
  FiMinus,
  FiMoreHorizontal,
  FiSave,
  FiSquare,
  FiTrash2,
  FiType,
  FiUnderline,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiRotateCcw,
  FiRotateCw,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight
} from 'react-icons/fi';
import api from '../services/api';

// Use the bundled local worker so the app does not depend on CDN fetches.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const FabricCanvas = FabricCanvasClass;
const FabricIText = FabricITextClass;
const FabricRect = FabricRectClass;
const FabricCircle = FabricCircleClass;
const FabricLine = FabricLineClass;
const FabricPath = FabricPathClass;
const FabricImage = FabricImageClass;
const FabricTextbox = FabricTextboxClass;

const FONT_FAMILIES = [
  { label: 'Helvetica', value: 'Helvetica' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Verdana', value: 'Verdana' }
];

const TEXT_TYPES = new Set(['i-text', 'textbox', 'text']);

const getScaledDimension = (object, axis) => {
  const scaleKey = axis === 'width' ? 'scaleX' : 'scaleY';
  const sizeKey = axis === 'width' ? 'width' : 'height';
  const scale = Number(object?.[scaleKey] ?? 1);
  const size = Number(object?.[sizeKey] ?? 0);
  return Math.max(0, size * scale);
};

// ─── Font variant helper ──────────────────────────────────────────────────────
// Extracts fontWeight and fontStyle from a PostScript-style font name string.
// Used as a secondary fallback when PDF.js style objects don't carry these.
const parseFontVariant = (fontName) => {
  const name = String(fontName || '');
  const isBold = /bold/i.test(name) || /\-B(d|old)?$/i.test(name) || /MT-Bold/i.test(name) || /Black$/i.test(name) || /Heavy$/i.test(name) || /Demi/i.test(name) || /SemiBold/i.test(name) || /ExtraBold/i.test(name);
  const isItalic = /italic/i.test(name) || /oblique/i.test(name) || /\-It(a|al)?$/i.test(name) || /\-Slanted/i.test(name);
  return {
    fontWeight: isBold ? 'bold' : 'normal',
    fontStyle: isItalic ? 'italic' : 'normal'
  };
};

// ─── PDF → Web font mapping ───────────────────────────────────────────────────
// Maps PostScript/PDF font family names to web-safe equivalents.
// Add new entries here when you see console warnings about unmapped fonts.
const PDF_FONT_MAP = [
  // Helvetica / Arial family
  { test: /helvetica/i, web: 'Arial' },
  { test: /arial/i, web: 'Arial' },
  { test: /calibri/i, web: 'Arial' },
  { test: /futura/i, web: 'Arial' },
  { test: /gill.?sans/i, web: 'Arial' },
  { test: /trebuchet/i, web: 'Trebuchet MS' },
  { test: /verdana/i, web: 'Verdana' },
  { test: /tahoma/i, web: 'Tahoma' },
  { test: /impact/i, web: 'Impact' },
  { test: /myriad/i, web: 'Arial' },
  { test: /optima/i, web: 'Arial' },
  { test: /franklin.?gothic/i, web: 'Arial' },
  // Times / Serif family
  { test: /times.?new.?roman/i, web: 'Times New Roman' },
  { test: /timesnewroman/i, web: 'Times New Roman' },
  { test: /times.?roman/i, web: 'Times New Roman' },
  { test: /times/i, web: 'Times New Roman' },
  { test: /garamond/i, web: 'Georgia' },
  { test: /georgia/i, web: 'Georgia' },
  { test: /palatino/i, web: 'Georgia' },
  { test: /book.?antiqua/i, web: 'Georgia' },
  { test: /cambria/i, web: 'Georgia' },
  { test: /constantia/i, web: 'Georgia' },
  { test: /minion/i, web: 'Georgia' },
  { test: /caslon/i, web: 'Georgia' },
  { test: /bookman/i, web: 'Georgia' },
  // Courier / Monospace family
  { test: /courier.?new/i, web: 'Courier New' },
  { test: /courier/i, web: 'Courier New' },
  { test: /lucida.?console/i, web: 'Courier New' },
  { test: /consolas/i, web: 'Courier New' },
  { test: /monaco/i, web: 'Courier New' },
  { test: /andale.?mono/i, web: 'Courier New' },
];

const mapPdfFontToWebFont = (fontFamily) => {
  const input = String(fontFamily || '').trim();
  if (!input) return 'Arial';
  for (const entry of PDF_FONT_MAP) {
    if (entry.test.test(input)) return entry.web;
  }
  // Log unmapped fonts so the table can be expanded
  console.warn(`[FontMap] Unmapped PDF font: "${input}" — falling back to Arial`);
  return 'Arial';
};

const extractCanvasSnapshot = (canvas, currentPage, pageMeta = {}) => {
  if (!canvas) {
    return null;
  }

  const objects = canvas
    .getObjects()
    .filter((object) => object && object.source !== 'background')
    .map((object) => {
      const base = {
        id: object.id || `${object.type}-${Date.now()}`,
        type: object.type,
        source: object.source || 'new',
        deleted: Boolean(object.deleted),
        visible: object.visible !== false,
        left: Number(object.left ?? 0),
        top: Number(object.top ?? 0),
        angle: Number(object.angle ?? 0),
        scaleX: Number(object.scaleX ?? 1),
        scaleY: Number(object.scaleY ?? 1),
        opacity: Number(object.opacity ?? 1)
      };

      if (TEXT_TYPES.has(object.type)) {
        const renderScale = Number(pageMeta.renderScale ?? 1) || 1;
        const rawTransform = Array.isArray(object.rawTransform) ? object.rawTransform : null;
        const pdfLeft = Number(object.pdfLeft ?? rawTransform?.[4] ?? object.left ?? 0);
        const pdfBaselineY = Number(object.pdfBaselineY ?? rawTransform?.[5] ?? object.top ?? 0);
        const pdfFontSize = Number(
          object.pdfFontSize ??
          (rawTransform ? Math.hypot(rawTransform?.[2] || 0, rawTransform?.[3] || 0) : Number(object.fontSize ?? 16))
        );
        const pdfWidth = Number(object.pdfWidth ?? (Number(getScaledDimension(object, 'width')) / renderScale));
        const pdfHeight = Number(object.pdfHeight ?? (Number(getScaledDimension(object, 'height')) / renderScale));
        const pdfTop = Number(object.pdfTop ?? (pdfBaselineY - pdfFontSize));

        return {
          ...base,
          text: object.text || '',
          originalText: object.originalText || object.text || '',
          originalLeft: Number(object.originalLeft ?? object.left ?? 0),
          originalTop: Number(object.originalTop ?? object.top ?? 0),
          originalWidth: Number(object.originalWidth ?? getScaledDimension(object, 'width')),
          originalHeight: Number(object.originalHeight ?? getScaledDimension(object, 'height')),
          pdfLeft,
          pdfBaselineY,
          pdfTop,
          pdfWidth,
          pdfHeight,
          pdfFontSize,
          width: Number(object.width ?? 0),
          height: Number(object.height ?? 0),
          fontSize: Number(object.fontSize ?? 16),
          fontFamily: object.fontFamily || 'Helvetica',
          fill: object.fill || '#111827',
          fontWeight: object.fontWeight || 'normal',
          fontStyle: object.fontStyle || 'normal',
          underline: Boolean(object.underline),
          textAlign: object.textAlign || 'left',
          lineHeight: Number(object.lineHeight ?? 1.16),
          dirty: Boolean(object.dirty)
        };
      }

      if (object.type === 'image') {
        return {
          ...base,
          src: object.sourceUrl || object.src || object.getSrc?.() || '',
          originalWidth: Number(object.originalWidth ?? getScaledDimension(object, 'width')),
          originalHeight: Number(object.originalHeight ?? getScaledDimension(object, 'height')),
          width: getScaledDimension(object, 'width'),
          height: getScaledDimension(object, 'height'),
          sourceUrl: object.sourceUrl || object.src || object.getSrc?.() || ''
        };
      }

      if (object.type === 'rect') {
        return {
          ...base,
          width: getScaledDimension(object, 'width'),
          height: getScaledDimension(object, 'height'),
          fill: object.fill || 'rgba(0,0,0,0)',
          stroke: object.stroke || undefined,
          strokeWidth: Number(object.strokeWidth ?? 0),
          rx: Number(object.rx ?? 0),
          ry: Number(object.ry ?? 0)
        };
      }

      if (object.type === 'circle') {
        return {
          ...base,
          radius: Number(object.radius ?? 0),
          width: getScaledDimension(object, 'width'),
          height: getScaledDimension(object, 'height'),
          fill: object.fill || 'rgba(0,0,0,0)',
          stroke: object.stroke || undefined,
          strokeWidth: Number(object.strokeWidth ?? 0)
        };
      }

      if (object.type === 'line') {
        return {
          ...base,
          x1: Number(object.x1 ?? 0),
          y1: Number(object.y1 ?? 0),
          x2: Number(object.x2 ?? 0),
          y2: Number(object.y2 ?? 0),
          stroke: object.stroke || '#111827',
          strokeWidth: Number(object.strokeWidth ?? 1)
        };
      }

      if (object.type === 'path') {
        return {
          ...base,
          path: object.path,
          fill: object.fill || 'rgba(0,0,0,0)',
          stroke: object.stroke || '#111827',
          strokeWidth: Number(object.strokeWidth ?? 1)
        };
      }

      return base;
    });

  return {
    pageNumber: currentPage,
    pageWidth: Number(pageMeta.pageWidth ?? canvas.getWidth()),
    pageHeight: Number(pageMeta.pageHeight ?? canvas.getHeight()),
    renderScale: Number(pageMeta.renderScale ?? 1),
    backgroundDataUrl: pageMeta.backgroundDataUrl || null,
    objects
  };
};

const createCanvasImage = async (url) => {
  if (!url) {
    console.log(`[DEBUG] createCanvasImage: url is empty, returning null`);
    return null;
  }

  console.log(`[DEBUG] createCanvasImage: Starting with URL length=${url.length}`);
  const isDataUrl = url.startsWith('data:');
  console.log(`[DEBUG] createCanvasImage: isDataUrl=${isDataUrl}`);

  // Try FabricImage.fromURL first (works for both data URLs and regular URLs)
  if (FabricImage?.fromURL) {
    try {
      console.log(`[DEBUG] createCanvasImage: Using FabricImage.fromURL`);
      const image = await Promise.race([
        FabricImage.fromURL(url, { crossOrigin: isDataUrl ? undefined : 'anonymous' }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('FabricImage.fromURL timeout after 10s')), 10000)
        )
      ]);
      console.log(`[DEBUG] createCanvasImage: FabricImage.fromURL succeeded, image size: ${image?.width}x${image?.height}`);
      return image;
    } catch (err) {
      console.error(`[DEBUG] createCanvasImage: FabricImage.fromURL failed:`, err);
      // Continue to callback approach
      // For data URLs, try loading via HTMLImage first for reliability
      if (isDataUrl && typeof Image !== 'undefined') {
        try {
          console.log(`[DEBUG] createCanvasImage: Trying HTMLImage approach for data URL`);
          const htmlImg = await new Promise((resolve, reject) => {
            const img = new Image();
            const timeout = setTimeout(() => {
              reject(new Error('HTMLImage load timeout'));
            }, 10000);
            img.onload = () => {
              clearTimeout(timeout);
              console.log(`[DEBUG] createCanvasImage: HTMLImage loaded, size=${img.width}x${img.height}`);
              resolve(img);
            };
            img.onerror = (e) => {
              clearTimeout(timeout);
              reject(new Error(`HTMLImage failed: ${e}`));
            };
            img.src = url;
          });
          // Now create a FabricImage from HTMLImage element
          console.log(`[DEBUG] createCanvasImage: Creating FabricImage from HTMLImage`);
          const fabricImage = new FabricImage(htmlImg, {
            crossOrigin: 'anonymous'
          });
          console.log(`[DEBUG] createCanvasImage: FabricImage created from HTMLImage, size=${fabricImage?.width}x${fabricImage?.height}`);
          return fabricImage;
        } catch (htmlImgErr) {
          console.error(`[DEBUG] createCanvasImage: HTMLImage approach failed:`, htmlImgErr);
          // Fall through to callback approach
        }
      }
    }
  }

  // Fallback: use Promise-based callback approach
  console.log(`[DEBUG] createCanvasImage: Using Promise-based callback approach`);
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Fabric image loader timeout (Promise callback)'));
    }, 10000);

    if (FabricImage && typeof FabricImage.fromURL === 'function') {
      try {
        FabricImage.fromURL(url, (image) => {
          clearTimeout(timeout);
          console.log(`[DEBUG] createCanvasImage: Callback resolved with image ${image?.width}x${image?.height}`);
          resolve(image);
        }, { crossOrigin: isDataUrl ? undefined : 'anonymous' });
      } catch (err) {
        clearTimeout(timeout);
        console.error(`[DEBUG] createCanvasImage: Callback threw error:`, err);
        reject(err);
      }
      return;
    }
    clearTimeout(timeout);
    reject(new Error('Fabric image loader is not available'));
  });
};

const isValidRenderedDataUrl = (value) =>
  typeof value === 'string' && value.startsWith('data:image/') && value.length > 1000;

const isBlankCanvas = (renderContext, width, height) => {
  // Sample multiple points to detect if canvas is mostly blank (mostly white or black)
  const samples = [];
  const sampleCount = 20;
  for (let i = 0; i < sampleCount; i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    const pix = renderContext.getImageData(x, y, 1, 1);
    samples.push(pix.data[0]); // Just check red channel
  }

  // Count how many pixels are "white-ish" (>240) or "black-ish" (<15)
  const whiteishCount = samples.filter(v => v > 240).length;
  const blackishCount = samples.filter(v => v < 15).length;
  const colorfulCount = samples.filter(v => v >= 15 && v <= 240).length;

  // Require a stricter threshold to consider canvas blank to avoid false positives
  // If >90% of samples are white/black AND <3% have actual color, it's blank
  const isEffectivelyBlank = (whiteishCount + blackishCount) / sampleCount > 0.9 && colorfulCount / sampleCount < 0.03;

  console.log(`[DEBUG] isBlankCanvas: whiteish=${whiteishCount}, blackish=${blackishCount}, colorful=${colorfulCount}, effectivelyBlank=${isEffectivelyBlank}`);
  return isEffectivelyBlank;
};

const getSafeRenderScale = (page, preferredScale = 1.5) => {
  const baseViewport = page.getViewport({ scale: 1 });
  const MAX_DIMENSION = 2200;
  const MAX_PIXELS = 6_000_000;

  const widthAtPreferred = baseViewport.width * preferredScale;
  const heightAtPreferred = baseViewport.height * preferredScale;
  const pixelCountAtPreferred = widthAtPreferred * heightAtPreferred;

  const scaleByDimension = Math.min(
    MAX_DIMENSION / Math.max(baseViewport.width, 1),
    MAX_DIMENSION / Math.max(baseViewport.height, 1)
  );
  const scaleByPixels = Math.sqrt(MAX_PIXELS / Math.max(baseViewport.width * baseViewport.height, 1));

  if (widthAtPreferred <= MAX_DIMENSION && heightAtPreferred <= MAX_DIMENSION && pixelCountAtPreferred <= MAX_PIXELS) {
    return preferredScale;
  }

  return Math.max(0.5, Math.min(preferredScale, scaleByDimension, scaleByPixels));
};

const createFabricObjectFromSerialized = async (item) => {
  if (!item || !item.type) return null;

  if (TEXT_TYPES.has(item.type)) {
    const FabricTextClass = item.type === 'textbox' ? FabricTextbox : FabricIText;
    const text = new FabricTextClass(item.text || '', {
      left: Number(item.left ?? 0),
      top: Number(item.top ?? 0),
      fontSize: Number(item.fontSize ?? 16),
      fontFamily: item.fontFamily || 'Helvetica',
      fill: item.fill || '#111827',
      backgroundColor: item.source === 'pdf' ? '#ffffff' : undefined,
      fontWeight: item.fontWeight || 'normal',
      fontStyle: item.fontStyle || 'normal',
      underline: Boolean(item.underline),
      textAlign: item.textAlign || 'left',
      lineHeight: Number(item.lineHeight ?? 1.16),
      opacity: Number(item.opacity ?? 1),
      angle: Number(item.angle ?? 0),
      scaleX: Number(item.scaleX ?? 1),
      scaleY: Number(item.scaleY ?? 1),
      editable: true,
      transparentCorners: false,
      hasBorders: true,
      hasControls: true,
      objectCaching: false,
      lockScalingY: false,
      lockScalingX: false,
      splitByGrapheme: false,
      width: Number(item.width ?? 0),
      source: item.source || 'new',
      deleted: Boolean(item.deleted),
      visible: item.visible !== false,
      dirty: Boolean(item.dirty)
    });

    text.id = item.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    text.originalText = item.originalText || item.text || '';
    text.originalLeft = Number(item.originalLeft ?? item.left ?? 0);
    text.originalTop = Number(item.originalTop ?? item.top ?? 0);
    text.originalWidth = Number(item.originalWidth ?? item.width ?? text.width ?? 0);
    text.originalHeight = Number(item.originalHeight ?? item.height ?? text.height ?? 0);
    text.pdfLeft = Number(item.pdfLeft ?? item.left ?? 0);
    text.pdfBaselineY = Number(item.pdfBaselineY ?? item.top ?? 0);
    text.pdfTop = Number(item.pdfTop ?? item.top ?? 0);
    text.pdfWidth = Number(item.pdfWidth ?? item.width ?? text.width ?? 0);
    text.pdfHeight = Number(item.pdfHeight ?? item.height ?? text.height ?? 0);
    text.pdfFontSize = Number(item.pdfFontSize ?? item.fontSize ?? text.fontSize ?? 16);
    return text;
  }

  if (item.type === 'image') {
    const image = await createCanvasImage(item.src || item.sourceUrl);
    if (!image) return null;

    image.set({
      left: Number(item.left ?? 0),
      top: Number(item.top ?? 0),
      angle: Number(item.angle ?? 0),
      scaleX: Number(item.scaleX ?? 1),
      scaleY: Number(item.scaleY ?? 1),
      opacity: Number(item.opacity ?? 1),
      source: item.source || 'new',
      sourceUrl: item.src || item.sourceUrl || '',
      deleted: Boolean(item.deleted),
      visible: item.visible !== false,
      dirty: Boolean(item.dirty),
      selectable: true,
      hasControls: true,
      hasBorders: true
    });

    image.id = item.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    image.originalWidth = Number(item.originalWidth ?? item.width ?? image.width ?? 0);
    image.originalHeight = Number(item.originalHeight ?? item.height ?? image.height ?? 0);
    return image;
  }

  if (item.type === 'rect') {
    const rect = new FabricRect({
      left: Number(item.left ?? 0),
      top: Number(item.top ?? 0),
      width: Number(item.width ?? 0),
      height: Number(item.height ?? 0),
      fill: item.fill || 'rgba(0,0,0,0)',
      stroke: item.stroke || undefined,
      strokeWidth: Number(item.strokeWidth ?? 0),
      rx: Number(item.rx ?? 0),
      ry: Number(item.ry ?? 0),
      angle: Number(item.angle ?? 0),
      scaleX: Number(item.scaleX ?? 1),
      scaleY: Number(item.scaleY ?? 1),
      opacity: Number(item.opacity ?? 1),
      source: item.source || 'new',
      deleted: Boolean(item.deleted),
      visible: item.visible !== false,
      dirty: Boolean(item.dirty)
    });
    rect.id = item.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return rect;
  }

  if (item.type === 'circle') {
    const circle = new FabricCircle({
      left: Number(item.left ?? 0),
      top: Number(item.top ?? 0),
      radius: Number(item.radius ?? 0),
      fill: item.fill || 'rgba(0,0,0,0)',
      stroke: item.stroke || undefined,
      strokeWidth: Number(item.strokeWidth ?? 0),
      angle: Number(item.angle ?? 0),
      scaleX: Number(item.scaleX ?? 1),
      scaleY: Number(item.scaleY ?? 1),
      opacity: Number(item.opacity ?? 1),
      source: item.source || 'new',
      deleted: Boolean(item.deleted),
      visible: item.visible !== false,
      dirty: Boolean(item.dirty)
    });
    circle.id = item.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return circle;
  }

  if (item.type === 'line') {
    const line = new FabricLine([
      Number(item.x1 ?? 0),
      Number(item.y1 ?? 0),
      Number(item.x2 ?? 0),
      Number(item.y2 ?? 0)
    ], {
      left: Number(item.left ?? 0),
      top: Number(item.top ?? 0),
      stroke: item.stroke || '#111827',
      strokeWidth: Number(item.strokeWidth ?? 1),
      angle: Number(item.angle ?? 0),
      scaleX: Number(item.scaleX ?? 1),
      scaleY: Number(item.scaleY ?? 1),
      opacity: Number(item.opacity ?? 1),
      source: item.source || 'new',
      deleted: Boolean(item.deleted),
      visible: item.visible !== false,
      dirty: Boolean(item.dirty)
    });
    line.id = item.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return line;
  }

  if (item.type === 'path') {
    const path = new FabricPath(item.path || item.pathData || [], {
      left: Number(item.left ?? 0),
      top: Number(item.top ?? 0),
      fill: item.fill || 'rgba(0,0,0,0)',
      stroke: item.stroke || '#111827',
      strokeWidth: Number(item.strokeWidth ?? 1),
      angle: Number(item.angle ?? 0),
      scaleX: Number(item.scaleX ?? 1),
      scaleY: Number(item.scaleY ?? 1),
      opacity: Number(item.opacity ?? 1),
      source: item.source || 'new',
      deleted: Boolean(item.deleted),
      visible: item.visible !== false,
      dirty: Boolean(item.dirty)
    });
    path.id = item.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return path;
  }

  return null;
};

const PdfEditorCanvas = ({ file, onSave, onCancel }) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const pdfDocRef = useRef(null);
  const loadingTaskRef = useRef(null);
  const pageCacheRef = useRef(new Map());
  const pageStateRef = useRef(new Map());
  const historyRef = useRef(new Map());
  const suppressHistoryRef = useRef(false);
  const isLoadingPageRef = useRef(false);
  const imageInputRef = useRef(null);
  const fileBufferRef = useRef(null);

  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Preparing PDF...');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [textStyle, setTextStyle] = useState({
    fontSize: 18,
    fontFamily: 'Helvetica',
    fill: '#111827',
    fontWeight: 'normal',
    fontStyle: 'normal',
    underline: false,
    textAlign: 'left'
  });

  const syncSelection = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject || activeObject.type === 'activeSelection' || activeObject.source === 'background') {
      setSelectedType(null);
      return;
    }

    setSelectedType(activeObject.type);

    if (TEXT_TYPES.has(activeObject.type)) {
      setTextStyle({
        fontSize: Number(activeObject.fontSize ?? 18),
        fontFamily: activeObject.fontFamily || 'Helvetica',
        fill: activeObject.fill || '#111827',
        fontWeight: activeObject.fontWeight || 'normal',
        fontStyle: activeObject.fontStyle || 'normal',
        underline: Boolean(activeObject.underline),
        textAlign: activeObject.textAlign || 'left'
      });
    }
  };

  const pushHistory = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || suppressHistoryRef.current || isLoadingPageRef.current) {
      return;
    }

    const snapshot = extractCanvasSnapshot(canvas, currentPage, pageCacheRef.current.get(currentPage) || {});
    if (!snapshot) return;

    const existing = historyRef.current.get(currentPage) || { stack: [], index: -1 };
    const stack = existing.stack.slice(0, existing.index + 1);
    stack.push(snapshot);

    while (stack.length > 30) {
      stack.shift();
    }

    historyRef.current.set(currentPage, {
      stack,
      index: stack.length - 1
    });
  };

  const getCurrentPageSerialized = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return null;
    return extractCanvasSnapshot(canvas, currentPage, pageCacheRef.current.get(currentPage) || {});
  };

  const restoreSnapshot = async (snapshot) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !snapshot) return;

    console.log(`[DEBUG] Restoring snapshot for page ${snapshot.pageNumber}: dims=${snapshot.pageWidth}x${snapshot.pageHeight}, hasBackground=${!!snapshot.backgroundDataUrl}, objects=${snapshot.objects?.length || 0}`);

    suppressHistoryRef.current = true;
    isLoadingPageRef.current = true;
    canvas.clear();
    canvas.backgroundImage = null;
    canvas.setDimensions({
      width: Math.ceil(snapshot.pageWidth || 612),
      height: Math.ceil(snapshot.pageHeight || 792)
    });

    if (snapshot.backgroundDataUrl) {
      try {
        console.log(`[DEBUG] Creating background image from data URL (length ${snapshot.backgroundDataUrl.length})`);
        const background = await createCanvasImage(snapshot.backgroundDataUrl);
        if (background) {
          console.log(`[DEBUG] Background image created successfully. Original size: ${background.width}x${background.height}`);
          const bgWidth = Math.max(1, Number(background.width || 1));
          const bgHeight = Math.max(1, Number(background.height || 1));
          const targetWidth = Number(snapshot.pageWidth || 612);
          const targetHeight = Number(snapshot.pageHeight || 792);

          background.set({
            left: 0,
            top: 0,
            selectable: false,
            evented: false,
            hasBorders: false,
            hasControls: false,
            absolutePositioned: true,
            originX: 'left',
            originY: 'top',
            scaleX: targetWidth / bgWidth,
            scaleY: targetHeight / bgHeight,
            source: 'background'
          });

          console.log(`[DEBUG] Background scaled to ${targetWidth}x${targetHeight}, result size: ${background.width * background.scaleX}x${background.height * background.scaleY}`);

          canvas.backgroundImage = background;
          console.log(`[DEBUG] Background applied as canvas.backgroundImage`);

          // Verify the background is actually visible
          console.log(`[DEBUG] Canvas background image state: visible=${background?.visible}, opacity=${background?.opacity}, scaleX=${background?.scaleX}, scaleY=${background?.scaleY}, width=${background?.width}, height=${background?.height}`);
        } else {
          console.warn(`[DEBUG] createCanvasImage returned null for background`);
        }
      } catch (bgError) {
        console.error(`[DEBUG] Error creating background image:`, bgError);
      }
    } else {
      console.log(`[DEBUG] No background data URL provided in snapshot`);
    }

    for (const item of snapshot.objects || []) {
      const object = await createFabricObjectFromSerialized(item);
      if (!object) continue;
      canvas.add(object);
      if (item.deleted || item.visible === false) {
        object.set({ visible: false, evented: false });
      }
      if (object.source === 'background') {
        canvas.sendObjectToBack(object);
      }
    }

    canvas.renderAll();
    console.log(`[DEBUG] Canvas rendered. Objects on canvas: ${canvas.getObjects().length}`);

    // Force a re-render and wait a bit for background to finish rendering
    await new Promise(resolve => setTimeout(resolve, 100));
    canvas.renderAll();
    console.log(`[DEBUG] Canvas re-rendered after background load`);

    // Log all objects on canvas for verification
    const objects = canvas.getObjects();
    console.log(`[DEBUG] Canvas objects breakdown:`);
    objects.forEach((obj, i) => {
      console.log(`  [${i}] type=${obj.type}, source=${obj.source}, visible=${obj.visible}, opacity=${obj.opacity}, size=${obj.width}x${obj.height}, pos=${obj.left},${obj.top}`);
    });

    // Check the actual canvas element
    const canvasEl = canvas.getElement();
    console.log(`[DEBUG] Canvas element: ${canvasEl?.tagName}, width=${canvasEl?.width}, height=${canvasEl?.height}, CSS width=${canvasEl?.style.width}, CSS height=${canvasEl?.style.height}`);

    // Check if we can access the canvas context and see actual pixels
    if (canvasEl) {
      try {
        const ctx = canvasEl.getContext('2d');
        // Sample multiple regions to get a better picture
        const samples = [
          { x: 0, y: 0, name: 'top-left' },
          { x: Math.floor(canvasEl.width / 2), y: Math.floor(canvasEl.height / 2), name: 'center' },
          { x: canvasEl.width - 1, y: canvasEl.height - 1, name: 'bottom-right' }
        ];
        samples.forEach(sample => {
          const imageData = ctx?.getImageData(sample.x, sample.y, 1, 1);
          if (imageData) {
            console.log(`[DEBUG] Canvas pixel at ${sample.name}(${sample.x},${sample.y}): RGBA=${imageData.data[0]},${imageData.data[1]},${imageData.data[2]},${imageData.data[3]}`);
          }
        });
      } catch (e) {
        console.log(`[DEBUG] Could not check canvas pixels:`, e);
      }
    }

    suppressHistoryRef.current = false;
    isLoadingPageRef.current = false;

    canvas.discardActiveObject();
    isLoadingPageRef.current = false;
    suppressHistoryRef.current = false;
    syncSelection();
  };

  const loadPageFromPdf = async (pageNumber) => {
    console.log(`[DEBUG] loadPageFromPdf: START for page ${pageNumber}`);
    const cached = pageCacheRef.current.get(pageNumber);
    if (cached) {
      console.log(`[DEBUG] loadPageFromPdf: Found cached snapshot for page ${pageNumber}, calling restoreSnapshot`);
      await restoreSnapshot(cached);
      console.log(`[DEBUG] loadPageFromPdf: Restored from cache, returning`);
      return;
    }

    const pdfDoc = pdfDocRef.current;
    if (!pdfDoc) {
      console.error(`[DEBUG] loadPageFromPdf: pdfDoc is null, returning`);
      return;
    }

    setLoading(true);
    setLoadingMessage(`Loading page ${pageNumber}...`);

    try {
      const page = await pdfDoc.getPage(pageNumber);
      const preferredScale = 1.5;
      const safeScale = getSafeRenderScale(page, preferredScale);
      let viewport = page.getViewport({ scale: safeScale });

      // Render the PDF page to a canvas
      let backgroundDataUrl = null;
      try {
        const retryScales = [safeScale, 1, 0.75, 0.5].filter((value, index, arr) => value > 0 && arr.indexOf(value) === index);
        console.log(`[DEBUG] Page ${pageNumber}: Attempting render with scales [${retryScales.join(", ")}]`);

        for (const attemptScale of retryScales) {
          console.log(`[DEBUG] Page ${pageNumber}: Render attempt at scale ${attemptScale}`);
          viewport = page.getViewport({ scale: attemptScale });
          console.log(`[DEBUG] Page ${pageNumber}: Viewport dimensions ${viewport.width}x${viewport.height}`);

          const renderCanvas = document.createElement('canvas');
          const renderContext = renderCanvas.getContext('2d');

          if (!renderContext) {
            console.error(`[DEBUG] Page ${pageNumber}: Canvas context is NULL at scale ${attemptScale}`);
            throw new Error('Canvas context unavailable');
          }

          const DPR = Math.max(1, (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1);
          // Backing store sized by DPR for crisp rendering; CSS size kept at viewport size
          renderCanvas.width = Math.max(1, Math.ceil(viewport.width * DPR));
          renderCanvas.height = Math.max(1, Math.ceil(viewport.height * DPR));
          renderCanvas.style.width = `${Math.ceil(viewport.width)}px`;
          renderCanvas.style.height = `${Math.ceil(viewport.height)}px`;
          // Ensure 1:1 mapping from CSS px to canvas by scaling the context
          renderContext.setTransform(DPR, 0, 0, DPR, 0, 0);

          console.log(`[DEBUG] Page ${pageNumber}: Canvas created ${renderCanvas.width}x${renderCanvas.height} (DPR=${DPR}, css=${renderCanvas.style.width}x${renderCanvas.style.height})`);

          // Check canvas initial state before render
          const initImageData = renderContext.getImageData(0, 0, 1, 1);
          console.log(`[DEBUG] Page ${pageNumber}: Canvas initial pixels (0,0): RGBA=${initImageData.data[0]},${initImageData.data[1]},${initImageData.data[2]},${initImageData.data[3]}`);

          try {
            const renderTask = page.render({
              canvasContext: renderContext,
              viewport
            });

            await Promise.race([
              renderTask.promise,
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Page render timeout')), 60000)
              )
            ]);
            console.log(`[DEBUG] Page ${pageNumber}: Render task completed successfully`);
          } catch (renderPromiseError) {
            console.error(`[DEBUG] Page ${pageNumber}: Render task failed:`, renderPromiseError);
            throw renderPromiseError;
          }

          // Check canvas after render
          const afterRenderImage = renderContext.getImageData(0, 0, 1, 1);
          console.log(`[DEBUG] Page ${pageNumber}: Canvas after render pixels (0,0): RGBA=${afterRenderImage.data[0]},${afterRenderImage.data[1]},${afterRenderImage.data[2]},${afterRenderImage.data[3]}`);

          // Sample some pixels from across the canvas
          const samplePixels = [];
          const samplePoints = [[0, 0], [Math.floor(renderCanvas.width / 2), Math.floor(renderCanvas.height / 2)], [renderCanvas.width - 1, renderCanvas.height - 1]];
          for (const [x, y] of samplePoints) {
            const pix = renderContext.getImageData(x, y, 1, 1);
            samplePixels.push(`(${x},${y}):${pix.data[0]}`);
          }
          console.log(`[DEBUG] Page ${pageNumber}: Sample pixels: ${samplePixels.join(", ")}`);

          // Check if the canvas is blank
          const blank = isBlankCanvas(renderContext, renderCanvas.width, renderCanvas.height);
          if (blank) {
            console.warn(`[DEBUG] Page ${pageNumber}: Render produced blank canvas at scale ${attemptScale}, skipping`);
            continue; // Try next scale
          }

          const attemptedDataUrl = renderCanvas.toDataURL('image/png');
          console.log(`[DEBUG] Page ${pageNumber}: Canvas toDataURL produced string of length ${attemptedDataUrl.length}, first 50 chars: "${attemptedDataUrl.substring(0, 50)}"`);

          const isValid = isValidRenderedDataUrl(attemptedDataUrl);
          console.log(`[DEBUG] Page ${pageNumber}: Data URL valid=${isValid}`);

          if (isValid) {
            backgroundDataUrl = attemptedDataUrl;
            console.log(`[PDF Render] Page ${pageNumber}: SUCCESS - rendered ${renderCanvas.width}x${renderCanvas.height} @ scale ${attemptScale}, dataURL length: ${backgroundDataUrl.length}`);
            break;
          } else {
            console.warn(`[DEBUG] Page ${pageNumber}: Data URL validation FAILED at scale ${attemptScale}`);
          }
        }

        if (!backgroundDataUrl) {
          console.error(`[ERROR] Page ${pageNumber}: All render attempts failed`);
          console.log(`[DEBUG] Page ${pageNumber}: Attempting server-side fallback rendering...`);

          // Try server-side rendering as fallback with exponential backoff on 429
          try {
            const formData = new FormData();
            if (file instanceof Blob) {
              formData.append('file', file, file.name || 'document.pdf');
            } else {
              formData.append('file', new Blob([fileBufferRef.current], { type: 'application/pdf' }), 'document.pdf');
            }
            formData.append('pages', String(pageNumber));

            const maxAttempts = 4;
            let attempt = 0;
            let lastError = null;
            while (attempt < maxAttempts && !backgroundDataUrl) {
              attempt += 1;
              try {
                console.log(`[DEBUG] Page ${pageNumber}: Server render attempt ${attempt}/${maxAttempts}`);
                const response = await api.post('/convert/render-pages', formData, {
                  headers: { 'Content-Type': 'multipart/form-data' },
                  timeout: 60000
                });

                const result = response?.data;
                if (result?.pages?.[0]?.dataUrl && isValidRenderedDataUrl(result.pages[0].dataUrl)) {
                  backgroundDataUrl = result.pages[0].dataUrl;
                  console.log(`[DEBUG] Page ${pageNumber}: Server-side render succeeded, dataURL length: ${backgroundDataUrl.length}`);
                  break;
                }

                lastError = new Error('Server render returned no valid page data URL');
                console.warn(`[DEBUG] Page ${pageNumber}: Server render attempt ${attempt} returned no valid data`);
              } catch (serverError) {
                lastError = serverError;
                const status = serverError?.response?.status;
                console.error(`[DEBUG] Page ${pageNumber}: Server-side fallback error on attempt ${attempt}:`, status || serverError.message || serverError);
                if (status === 429 && attempt < maxAttempts) {
                  // Exponential backoff before retrying
                  const delayMs = 500 * Math.pow(2, attempt - 1);
                  console.log(`[DEBUG] Page ${pageNumber}: Received 429 - backing off ${delayMs}ms before retry`);
                  await new Promise(r => setTimeout(r, delayMs));
                  continue; // retry
                }
                // For other errors or exhausted retries, stop retrying
                break;
              }
            }

            if (!backgroundDataUrl && lastError) {
              console.warn(`[DEBUG] Page ${pageNumber}: Server fallback finished with no data:`, lastError);
            }
          } catch (serverErrorOuter) {
            console.error(`[DEBUG] Page ${pageNumber}: Server-side fallback outer error:`, serverErrorOuter);
          }

          if (!backgroundDataUrl) {
            throw new Error('Unable to rasterize page to a valid image (client and server renders failed)');
          }
        }
      } catch (renderError) {
        console.warn(`Failed to render page ${pageNumber} visually`, renderError);
        throw new Error(`Unable to render page background for page ${pageNumber}. ${renderError?.message || ''}`.trim());
      }

      const textContent = await page.getTextContent();
      console.log(`[DEBUG] Page ${pageNumber}: Text extraction completed. Raw items: ${textContent.items?.length || 0}`);

      // PDF.js returns coordinates in PDF user space (origin at bottom-left).
      // The rendered viewport is at renderScale, so canvas-space dimensions are:
      //   canvasWidth  = pdfPageWidth  * renderScale
      //   canvasHeight = pdfPageHeight * renderScale
      // To convert a PDF baseline Y (Y=0 at bottom) to canvas top (Y=0 at top):
      //   canvasTop = (pdfPageHeight - pdfBaselineY) * renderScale - fontSize_canvas
      // where fontSize_canvas = pdfFontSize * renderScale.
      const pdfPageHeight = page.getViewport({ scale: 1 }).height;
      const pdfPageWidth = page.getViewport({ scale: 1 }).width;
      const rs = viewport.scale || safeScale; // render scale

      const rawTextItems = (textContent.items || [])
        .map((item, index) => {
          const pdfFontSize = Math.max(4, Math.hypot(item.transform?.[2] || 0, item.transform?.[3] || 0) || 12);
          const pdfLeft = Number(item.transform?.[4] ?? 0);
          const pdfBaselineY = Number(item.transform?.[5] ?? 0);

          const style = textContent.styles?.[item.fontName] || {};
          const ascent = Number.isFinite(Number(style.ascent)) ? Number(style.ascent) : 0.8;
          const descent = Math.abs(Number.isFinite(Number(style.descent)) ? Number(style.descent) : 0.2);

          // Derive font family
          const fontFamily = mapPdfFontToWebFont(style.fontFamily || item.fontName);

          // Derive weight / style — PDF.js style props are primary; font-name parse is fallback
          const nameVariant = parseFontVariant(style.fontFamily || item.fontName);
          const fontWeight = style.fontWeight || nameVariant.fontWeight;
          const fontStyle = style.italic ? 'italic' : nameVariant.fontStyle;

          // Canvas-space dimensions
          const canvasFontSize = pdfFontSize * rs;
          const canvasLeft = pdfLeft * rs;
          // Y-flip: PDF baseline at bottom → canvas top at top
          const canvasBaselineY = (pdfPageHeight - pdfBaselineY) * rs;
          const canvasTop = Math.max(0, canvasBaselineY - canvasFontSize);
          const canvasWidth = Math.max(canvasFontSize, Number(item.width ?? 0) * rs);
          const canvasHeight = Math.max(canvasFontSize, canvasFontSize * (ascent + descent));

          return {
            id: `pdf-text-${pageNumber}-${index}`,
            type: 'i-text',
            source: 'pdf',
            deleted: false,
            visible: true,
            dirty: false,
            text: item.str || '',
            originalText: item.str || '',
            // Canvas-space geometry (used by Fabric for display)
            left: canvasLeft,
            top: canvasTop,
            width: canvasWidth,
            height: canvasHeight,
            originalLeft: canvasLeft,
            originalTop: canvasTop,
            originalWidth: canvasWidth,
            originalHeight: canvasHeight,
            fontSize: canvasFontSize,
            originalFontSize: canvasFontSize,
            // PDF-space coordinates (used by server for reconstruction — no renderScale)
            pdfLeft,
            pdfBaselineY,
            pdfTop: pdfPageHeight - pdfBaselineY - pdfFontSize,
            pdfWidth: Math.max(pdfFontSize, Number(item.width ?? 0)),
            pdfHeight: Math.max(pdfFontSize, pdfFontSize * (ascent + descent)),
            pdfFontSize,
            // Style
            fontFamily,
            fill: '#111827',
            fontWeight,
            fontStyle,
            underline: false,
            textAlign: 'left',
            lineHeight: 1.16, // will be refined below via Y-delta measurement
            opacity: 1,
            angle: 0,
            scaleX: 1,
            scaleY: 1
          };
        })
        .filter((item) => String(item.text).trim().length > 0);

      // ─── Group text runs into paragraph-level blocks ────────────────────
      const sortedRaw = [...rawTextItems].sort((a, b) => b.pdfBaselineY - a.pdfBaselineY); // Top to bottom

      const blocks = [];
      let currentBlock = null;

      for (const item of sortedRaw) {
        if (!currentBlock) {
          currentBlock = [item];
          blocks.push(currentBlock);
          continue;
        }

        const prev = currentBlock[currentBlock.length - 1];

        const sameFont = item.fontFamily === prev.fontFamily && item.fontWeight === prev.fontWeight && item.fontStyle === prev.fontStyle;
        const similarSize = Math.abs(item.pdfFontSize - prev.pdfFontSize) / prev.pdfFontSize < 0.2;
        // Group if they are left-aligned or indented slightly
        const leftAligned = Math.abs(item.pdfLeft - currentBlock[0].pdfLeft) < item.pdfFontSize * 2;
        const verticalProximity = Math.abs(prev.pdfBaselineY - item.pdfBaselineY) > 0 && Math.abs(prev.pdfBaselineY - item.pdfBaselineY) < item.pdfFontSize * 3;

        if (sameFont && similarSize && leftAligned && verticalProximity) {
          currentBlock.push(item);
        } else {
          currentBlock = [item];
          blocks.push(currentBlock);
        }
      }

      // Convert blocks to Textbox objects
      const textItems = blocks.map(block => {
        if (block.length === 1) {
          const item = block[0];
          item.type = 'textbox';
          return item;
        }

        const first = block[0];
        
        let totalRatio = 0;
        let count = 0;
        for (let i = 0; i < block.length - 1; i++) {
          const deltaY = Math.abs(block[i].pdfBaselineY - block[i+1].pdfBaselineY);
          totalRatio += deltaY / block[i].pdfFontSize;
          count++;
        }
        const avgLineHeight = count > 0 ? (totalRatio / count) : 1.16;

        const combinedText = block.map(item => item.text).join(' ');
        const maxWidthCanvas = Math.max(...block.map(item => item.width));
        const maxWidthPdf = Math.max(...block.map(item => item.pdfWidth));
        const canvasHeight = block[block.length - 1].top - block[0].top + block[block.length - 1].height;
        const pdfHeight = block[0].pdfBaselineY - block[block.length - 1].pdfBaselineY + block[block.length - 1].pdfHeight;

        return {
          ...first,
          id: `pdf-textblock-${pageNumber}-${first.id}`,
          type: 'textbox',
          text: combinedText,
          originalText: combinedText,
          backgroundColor: '#ffffff',
          width: maxWidthCanvas,
          height: canvasHeight,
          originalWidth: maxWidthCanvas,
          originalHeight: canvasHeight,
          pdfWidth: maxWidthPdf,
          pdfHeight: pdfHeight,
          lineHeight: avgLineHeight >= 0.9 && avgLineHeight <= 3.5 ? Math.round(avgLineHeight * 100) / 100 : 1.16,
        };
      });

      console.log(`[DEBUG] Page ${pageNumber}: Filtered text items: ${textItems.length} (had content)`);

      const snapshot = {
        pageNumber,
        pageWidth: Math.ceil(viewport.width),
        pageHeight: Math.ceil(viewport.height),
        renderScale: viewport.scale || safeScale,
        backgroundDataUrl,
        objects: textItems
      };

      console.log(`[DEBUG] Page ${pageNumber}: Snapshot created - hasBackground=${!!backgroundDataUrl}, textObjects=${textItems.length}, dimensions=${snapshot.pageWidth}x${snapshot.pageHeight}`);

      if (!backgroundDataUrl && textItems.length === 0) {
        throw new Error('This page could not be rendered or text-extracted. Please try a text-based PDF or use a smaller file.');
      }

      pageCacheRef.current.set(pageNumber, snapshot);
      console.log(`[DEBUG] Page ${pageNumber}: Snapshot cached. Now calling restoreSnapshot()...`);

      await Promise.race([
        restoreSnapshot(snapshot),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('restoreSnapshot timeout after 15s')), 15000)
        )
      ]);

      console.log(`[DEBUG] Page ${pageNumber}: restoreSnapshot completed successfully`);
      console.log(`[DEBUG] loadPageFromPdf: SUCCESS - page ${pageNumber} fully loaded`);
    } catch (error) {
      console.error(`Error loading page ${pageNumber}:`, error);
      setError(`Failed to load page ${pageNumber}. ${error?.message || 'Please try another file.'}`);
      setLoading(false);
    }
  };

  const loadPage = async (pageNumber) => {
    if (!pdfDocRef.current) return;
    setError(null);
    setLoadingMessage(`Loading page ${pageNumber}...`);
    console.log(`[DEBUG] loadPage: Starting for page ${pageNumber}`);

    try {
      await loadPageFromPdf(pageNumber);
      console.log(`[DEBUG] loadPage: loadPageFromPdf completed for page ${pageNumber}`);
    } catch (err) {
      console.error(`[DEBUG] loadPage: loadPageFromPdf threw error:`, err);
      throw err;
    }

    const snapshot = pageCacheRef.current.get(pageNumber);
    if (snapshot) {
      const history = historyRef.current.get(pageNumber) || { stack: [], index: -1 };
      if (history.stack.length === 0) {
        history.stack = [snapshot];
        history.index = 0;
        historyRef.current.set(pageNumber, history);
      }
    }
    console.log(`[DEBUG] loadPage: Setting loading=false for page ${pageNumber}`);
    setLoading(false);
  };

  const persistCurrentPage = () => {
    const snapshot = getCurrentPageSerialized();
    if (!snapshot) return;
    pageStateRef.current.set(currentPage, snapshot);
    pageCacheRef.current.set(currentPage, snapshot);
    pushHistory();
  };

  // The canvas instance should be initialized once for the modal lifetime.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return undefined;

    const canvas = new FabricCanvas(canvasRef.current, {
      selection: true,
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: false,
      enableRetinaScaling: true,
      backgroundColor: '#ffffff'
    });

    fabricCanvasRef.current = canvas;

    const handleSelectionUpdate = () => syncSelection();
    const handleCanvasMutation = (event) => {
      if (isLoadingPageRef.current) return;
      const target = event?.target || canvas.getActiveObject();
      if (!target) return;

      if (target.source === 'pdf') {
        target.set('dirty', true);
      }

      // --- Push-down logic for Textbox auto-sizing ---
      if (event && event.type === 'text:changed' && target.type === 'textbox') {
        const currentHeight = target.getScaledHeight();
        const previousHeight = target.lastPushHeight || (target.originalHeight * target.scaleY);
        const deltaY = currentHeight - previousHeight;

        if (Math.abs(deltaY) > 2) {
          const snapshot = pageCacheRef.current.get(currentPage);
          const renderScale = snapshot?.renderScale || 1.5;

          canvas.getObjects().forEach(obj => {
            if (obj === target || obj.source === 'background') return;

            // Only push objects that are strictly below the edited block's top anchor
            // We use target.top + 10 as a safe anchor point
            if (obj.top > target.top + 10) {
              obj.set('top', obj.top + deltaY);
              
              if (obj.pdfBaselineY != null) {
                // PDF Y goes from bottom up, so pushing DOWN on canvas (larger top)
                // means a SMALLER pdfBaselineY in PDF user space.
                obj.pdfBaselineY -= (deltaY / renderScale);
              }
              if (obj.pdfTop != null) {
                obj.pdfTop -= (deltaY / renderScale);
              }
              obj.setCoords();
            }
          });

          target.lastPushHeight = currentHeight;
          canvas.requestRenderAll();
        }
      }

      pushHistory();
      syncSelection();
    };

    canvas.on('selection:created', handleSelectionUpdate);
    canvas.on('selection:updated', handleSelectionUpdate);
    canvas.on('selection:cleared', () => {
      setSelectedType(null);
    });
    canvas.on('object:modified', handleCanvasMutation);
    canvas.on('object:added', handleCanvasMutation);
    canvas.on('object:removed', handleCanvasMutation);
    canvas.on('text:changed', handleCanvasMutation);

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  // Load the selected file once and bootstrap page state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let cancelled = false;

    const initPdf = async () => {
      if (!file) return;
      try {
        setLoading(true);
        setError(null);
        setLoadingMessage('Reading PDF...');
        console.log(`[DEBUG] Starting PDF initialization. File: ${file.name}, Size: ${file.size} bytes`);

        const arrayBuffer = await file.arrayBuffer();
        if (cancelled) return;
        fileBufferRef.current = arrayBuffer;
        console.log(`[DEBUG] File converted to ArrayBuffer: ${arrayBuffer.byteLength} bytes`);

        if (loadingTaskRef.current?.destroy) {
          try {
            loadingTaskRef.current.destroy();
          } catch (e) {
            // no-op
          }
        }

        console.log(`[DEBUG] Creating PDF loading task...`);
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        loadingTaskRef.current = loadingTask;
        const pdfDoc = await loadingTask.promise;
        if (cancelled) return;

        console.log(`[DEBUG] PDF loaded successfully. Pages: ${pdfDoc.numPages}`);
        pdfDocRef.current = pdfDoc;
        pageCacheRef.current = new Map();
        pageStateRef.current = new Map();
        historyRef.current = new Map();
        setNumPages(pdfDoc.numPages);
        setCurrentPage(1);
        console.log(`[DEBUG] Calling loadPage(1)...`);
        await loadPage(1);
      } catch (pdfError) {
        console.error('PDF init error:', pdfError);
        if (!cancelled) {
          setError(`Failed to load the PDF. ${pdfError?.message || 'Please try another file.'}`);
          setLoading(false);
        }
      }
    };

    initPdf();

    return () => {
      cancelled = true;
    };
  }, [file]);

  // Reload canvas content only when the current page changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!pdfDocRef.current) return undefined;

    let cancelled = false;
    const syncPage = async () => {
      if (pageStateRef.current.has(currentPage)) {
        await restoreSnapshot(pageStateRef.current.get(currentPage));
        return;
      }
      if (pageCacheRef.current.has(currentPage)) {
        await restoreSnapshot(pageCacheRef.current.get(currentPage));
        return;
      }
      if (!cancelled) {
        await loadPage(currentPage);
      }
    };

    syncPage();

    return () => {
      cancelled = true;
    };
  }, [currentPage]);

  const handlePageChange = (nextPage) => {
    if (!pdfDocRef.current) return;
    if (nextPage < 1 || nextPage > numPages) return;
    persistCurrentPage();
    setCurrentPage(nextPage);
  };

  const addText = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const object = new FabricTextbox('Edit text', {
      left: Math.max(40, canvas.getWidth() / 4),
      top: Math.max(40, canvas.getHeight() / 4),
      width: 200,
      fontSize: 18,
      fontFamily: 'Helvetica',
      fill: '#111827',
      fontWeight: 'normal',
      fontStyle: 'normal',
      underline: false,
      textAlign: 'left',
      editable: true,
      source: 'new',
      dirty: true
    });

    object.id = `new-text-${Date.now()}`;
    canvas.add(object);
    canvas.setActiveObject(object);
    canvas.requestRenderAll();
    syncSelection();
    pushHistory();
  };

  const addShape = (shapeType) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    let object = null;
    if (shapeType === 'rect') {
      object = new FabricRect({
        left: Math.max(40, canvas.getWidth() / 4),
        top: Math.max(40, canvas.getHeight() / 4),
        width: 160,
        height: 90,
        fill: 'rgba(59, 130, 246, 0.2)',
        stroke: '#2563eb',
        strokeWidth: 2,
        source: 'new',
        dirty: true
      });
    } else if (shapeType === 'circle') {
      object = new FabricCircle({
        left: Math.max(40, canvas.getWidth() / 4),
        top: Math.max(40, canvas.getHeight() / 4),
        radius: 50,
        fill: 'rgba(245, 158, 11, 0.2)',
        stroke: '#d97706',
        strokeWidth: 2,
        source: 'new',
        dirty: true
      });
    } else if (shapeType === 'line') {
      object = new FabricLine([0, 0, 180, 0], {
        left: Math.max(40, canvas.getWidth() / 4),
        top: Math.max(40, canvas.getHeight() / 4),
        stroke: '#111827',
        strokeWidth: 3,
        source: 'new',
        dirty: true
      });
    } else if (shapeType === 'path') {
      object = new FabricPath('M 0 0 L 120 0 L 120 120 Z', {
        left: Math.max(40, canvas.getWidth() / 4),
        top: Math.max(40, canvas.getHeight() / 4),
        fill: 'rgba(16, 185, 129, 0.2)',
        stroke: '#059669',
        strokeWidth: 2,
        source: 'new',
        dirty: true
      });
    }

    if (!object) return;
    object.id = `new-${shapeType}-${Date.now()}`;
    canvas.add(object);
    canvas.setActiveObject(object);
    canvas.requestRenderAll();
    syncSelection();
    pushHistory();
  };

  const handleImageUpload = async (event) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      try {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const src = loadEvent.target.result;
        const image = await createCanvasImage(src);
        if (!image) return;

        const maxWidth = Math.min(240, canvas.getWidth() * 0.4);
        const maxHeight = Math.min(240, canvas.getHeight() * 0.4);
        const scale = Math.min(maxWidth / (image.width || 1), maxHeight / (image.height || 1), 1);

        image.set({
          left: Math.max(40, canvas.getWidth() / 4),
          top: Math.max(40, canvas.getHeight() / 4),
          scaleX: scale,
          scaleY: scale,
          source: 'new',
          sourceUrl: src,
          dirty: true
        });

        image.id = `new-image-${Date.now()}`;
        image.originalWidth = image.width || 0;
        image.originalHeight = image.height || 0;
        canvas.add(image);
        canvas.setActiveObject(image);
        canvas.requestRenderAll();
        syncSelection();
        pushHistory();
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
      }
    };

    reader.readAsDataURL(uploadedFile);
    event.target.value = '';
  };

  const deleteSelected = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    if (activeObject.type === 'activeSelection') {
      activeObject.getObjects().forEach((object) => {
        if (object.source === 'pdf') {
          object.set({ deleted: true, visible: false, evented: false, dirty: true });
        } else {
          canvas.remove(object);
        }
      });
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      pushHistory();
      syncSelection();
      return;
    }

    if (activeObject.source === 'pdf') {
      activeObject.set({ deleted: true, visible: false, evented: false, dirty: true });
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      pushHistory();
      syncSelection();
      return;
    }

    canvas.remove(activeObject);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    pushHistory();
    syncSelection();
  };

  const applyTextStyle = (updates) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject || !TEXT_TYPES.has(activeObject.type)) return;

    activeObject.set({ ...updates, dirty: true });
    canvas.requestRenderAll();
    syncSelection();
    pushHistory();
  };

  const handleUndo = async () => {
    const history = historyRef.current.get(currentPage);
    if (!history || history.index <= 0) return;

    history.index -= 1;
    historyRef.current.set(currentPage, history);
    await restoreSnapshot(history.stack[history.index]);
  };

  const handleRedo = async () => {
    const history = historyRef.current.get(currentPage);
    if (!history || history.index >= history.stack.length - 1) return;

    history.index += 1;
    historyRef.current.set(currentPage, history);
    await restoreSnapshot(history.stack[history.index]);
  };

  const handleSave = async () => {
    const snapshot = getCurrentPageSerialized();
    if (snapshot) {
      pageStateRef.current.set(currentPage, snapshot);
      pageCacheRef.current.set(currentPage, snapshot);
    }

    setSaving(true);
    try {
      const pages = [];
      for (let pageNumber = 1; pageNumber <= numPages; pageNumber += 1) {
        const saved = pageStateRef.current.get(pageNumber) || pageCacheRef.current.get(pageNumber);
        if (saved) {
          pages.push(saved);
        }
      }

      await onSave({
        pages,
        currentPage,
        totalPages: numPages,
        sourceFileName: file?.name || 'document.pdf'
      });
    } finally {
      setSaving(false);
    }
  };

  const activeObject = fabricCanvasRef.current?.getActiveObject();
  const canEditText = Boolean(activeObject && TEXT_TYPES.has(activeObject.type));
  const canLayer = Boolean(activeObject && activeObject.type !== 'activeSelection');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4">
      <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                <FiType />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Canvas PDF Editor</h3>
                <p className="text-sm text-slate-600">Edit extracted PDF text directly on the page canvas</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={handleUndo} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              <FiRotateCcw /> Undo
            </button>
            <button onClick={handleRedo} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              <FiRotateCw /> Redo
            </button>
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
              <FiSave /> {saving ? 'Saving...' : 'Save & Download'}
            </button>
            <button onClick={onCancel} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              <FiX /> Close
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <aside className="flex w-full flex-col gap-4 border-b border-slate-200 bg-slate-50 p-4 lg:w-80 lg:border-b-0 lg:border-r">
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Tools</h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                <button onClick={addText} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  <FiType /> Text
                </button>
                <button onClick={() => addShape('rect')} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  <FiSquare /> Rect
                </button>
                <button onClick={() => addShape('circle')} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  <FiCircle /> Circle
                </button>
                <button onClick={() => addShape('line')} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  <FiMinus /> Line
                </button>
                <button onClick={() => addShape('path')} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  <FiMoreHorizontal /> Path
                </button>
                <button onClick={() => imageInputRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  <FiImage /> Image
                </button>
                <button onClick={deleteSelected} className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 lg:col-span-2">
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>

            {canLayer && (
              <div>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Layer Order</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const canvas = fabricCanvasRef.current;
                      const object = canvas?.getActiveObject();
                      if (!canvas || !object) return;
                      if (typeof canvas.bringObjectForward === 'function') {
                        canvas.bringObjectForward(object);
                      } else if (typeof canvas.bringForward === 'function') {
                        canvas.bringForward(object);
                      } else if (typeof object.bringForward === 'function') {
                        object.bringForward();
                      }
                      canvas.requestRenderAll();
                      pushHistory();
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <FiArrowUp /> Forward
                  </button>
                  <button
                    onClick={() => {
                      const canvas = fabricCanvasRef.current;
                      const object = canvas?.getActiveObject();
                      if (!canvas || !object) return;
                      if (typeof canvas.sendObjectBackwards === 'function') {
                        canvas.sendObjectBackwards(object);
                      } else if (typeof canvas.sendBackwards === 'function') {
                        canvas.sendBackwards(object);
                      } else if (typeof object.sendBackwards === 'function') {
                        object.sendBackwards();
                      }
                      canvas.requestRenderAll();
                      pushHistory();
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <FiArrowDown /> Backward
                  </button>
                </div>
              </div>
            )}

            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Page</h4>
              <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">
                  <FiChevronLeft /> Prev
                </button>
                <span className="text-sm font-medium text-slate-700">{currentPage} / {numPages || 0}</span>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= numPages} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">
                  Next <FiChevronRight />
                </button>
              </div>
            </div>

            {canEditText && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Text Properties</h4>
                <div className="space-y-3">
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-slate-700">Size</span>
                    <input
                      type="range"
                      min="8"
                      max="72"
                      value={textStyle.fontSize}
                      onChange={(event) => {
                        const nextValue = Number(event.target.value);
                        setTextStyle((prev) => ({ ...prev, fontSize: nextValue }));
                        applyTextStyle({ fontSize: nextValue });
                      }}
                      className="w-full"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-slate-700">Font</span>
                    <select
                      value={textStyle.fontFamily}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setTextStyle((prev) => ({ ...prev, fontFamily: nextValue }));
                        applyTextStyle({ fontFamily: nextValue });
                      }}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2"
                    >
                      {FONT_FAMILIES.map((family) => (
                        <option key={family.value} value={family.value}>{family.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-slate-700">Color</span>
                    <input
                      type="color"
                      value={textStyle.fill}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setTextStyle((prev) => ({ ...prev, fill: nextValue }));
                        applyTextStyle({ fill: nextValue });
                      }}
                      className="h-10 w-full rounded-lg border border-slate-200"
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        const nextValue = textStyle.fontWeight === 'bold' ? 'normal' : 'bold';
                        setTextStyle((prev) => ({ ...prev, fontWeight: nextValue }));
                        applyTextStyle({ fontWeight: nextValue });
                      }}
                      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${textStyle.fontWeight === 'bold' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700'}`}
                    >
                      <FiBold /> Bold
                    </button>
                    <button
                      onClick={() => {
                        const nextValue = textStyle.fontStyle === 'italic' ? 'normal' : 'italic';
                        setTextStyle((prev) => ({ ...prev, fontStyle: nextValue }));
                        applyTextStyle({ fontStyle: nextValue });
                      }}
                      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${textStyle.fontStyle === 'italic' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700'}`}
                    >
                      <FiItalic /> Italic
                    </button>
                    <button
                      onClick={() => {
                        const nextValue = !textStyle.underline;
                        setTextStyle((prev) => ({ ...prev, underline: nextValue }));
                        applyTextStyle({ underline: nextValue });
                      }}
                      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${textStyle.underline ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700'}`}
                    >
                      <FiUnderline /> Underline
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setTextStyle((prev) => ({ ...prev, textAlign: 'left' }));
                        applyTextStyle({ textAlign: 'left' });
                      }}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm ${textStyle.textAlign === 'left' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700'}`}
                    >
                      <FiAlignLeft />
                    </button>
                    <button
                      onClick={() => {
                        setTextStyle((prev) => ({ ...prev, textAlign: 'center' }));
                        applyTextStyle({ textAlign: 'center' });
                      }}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm ${textStyle.textAlign === 'center' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700'}`}
                    >
                      <FiAlignCenter />
                    </button>
                    <button
                      onClick={() => {
                        setTextStyle((prev) => ({ ...prev, textAlign: 'right' }));
                        applyTextStyle({ textAlign: 'right' });
                      }}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm ${textStyle.textAlign === 'right' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700'}`}
                    >
                      <FiAlignRight />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Document</h4>
              <div className="space-y-2 text-sm text-slate-600">
                <p>Pages: {numPages}</p>
                <p>Active item: {selectedType || 'None'}</p>
                <p>Buffer loaded: {fileBufferRef.current ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </aside>

          <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-slate-100">
            <div className="flex-1 overflow-auto p-4">
              {error ? (
                <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
                  <p className="text-lg font-semibold text-red-700">Unable to load PDF</p>
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                  <button onClick={onCancel} className="mt-6 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                    Return
                  </button>
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
                    <canvas ref={canvasRef} className="block" />

                    {loading && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                        <div className="rounded-2xl bg-white px-6 py-8 text-center shadow-lg">
                          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                          <p className="text-sm font-medium text-slate-700">{loadingMessage}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>
  );
};

export default PdfEditorCanvas;
