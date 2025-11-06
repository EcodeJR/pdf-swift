import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker - environment-aware
if (process.env.NODE_ENV === 'development') {
  // Development: Use local worker
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} else {
  // Production: Use CDN
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

const PdfEditor = ({ file, onSave, onCancel }) => {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [tool, setTool] = useState('text'); // text, highlight, image, watermark
  const [texts, setTexts] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [watermark, setWatermark] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [fontSize, setFontSize] = useState(12);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleCanvasClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'text' && textInput) {
      setTexts([...texts, {
        text: textInput,
        x: x,
        y: 800 - y, // PDF coordinates are bottom-up
        page: currentPage - 1,
        size: fontSize,
        color: { r: 0, g: 0, b: 0 }
      }]);
      setTextInput('');
    } else if (tool === 'highlight') {
      setAnnotations([...annotations, {
        type: 'highlight',
        x: x,
        y: 800 - y,
        page: currentPage - 1,
        width: 100,
        height: 20,
        color: { r: 1, g: 1, b: 0 },
        opacity: 0.3
      }]);
    }
  };

  const handleSave = () => {
    const edits = {
      texts,
      annotations,
      watermark
    };
    onSave(edits);
  };

  const addWatermark = () => {
    const text = prompt('Enter watermark text:');
    if (text) {
      setWatermark({
        text,
        opacity: 0.3,
        rotation: 45,
        size: 50
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-6xl max-h-[95vh] w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Edit PDF</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save Changes
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Toolbar */}
          <div className="w-64 border-r p-4 overflow-y-auto">
            <h4 className="font-semibold mb-4">Tools</h4>
            
            {/* Tool Selection */}
            <div className="space-y-2 mb-6">
              <button
                onClick={() => setTool('text')}
                className={`w-full px-4 py-2 rounded ${tool === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
              >
                Add Text
              </button>
              <button
                onClick={() => setTool('highlight')}
                className={`w-full px-4 py-2 rounded ${tool === 'highlight' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
              >
                Highlight
              </button>
              <button
                onClick={addWatermark}
                className="w-full px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
              >
                Add Watermark
              </button>
            </div>

            {/* Text Tool Options */}
            {tool === 'text' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Text</label>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter text..."
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Font Size</label>
                  <input
                    type="number"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    min="8"
                    max="72"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold mb-2">Edits</h4>
              <div className="text-sm space-y-1">
                <p>Texts: {texts.length}</p>
                <p>Highlights: {annotations.length}</p>
                <p>Watermark: {watermark ? 'Yes' : 'No'}</p>
              </div>
            </div>

            {/* Undo Last */}
            {(texts.length > 0 || annotations.length > 0) && (
              <button
                onClick={() => {
                  if (texts.length > 0) {
                    setTexts(texts.slice(0, -1));
                  } else if (annotations.length > 0) {
                    setAnnotations(annotations.slice(0, -1));
                  }
                }}
                className="w-full mt-4 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Undo Last
              </button>
            )}
          </div>

          {/* PDF Canvas */}
          <div className="flex-1 overflow-auto p-4 bg-gray-100">
            <div className="flex justify-center">
              <div className="relative" onClick={handleCanvasClick} style={{ cursor: 'crosshair' }}>
                <Document
                  file={file}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={<div className="text-center py-8">Loading PDF...</div>}
                >
                  <Page
                    pageNumber={currentPage}
                    scale={1.0}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </Document>
                
                {/* Overlay for showing edits */}
                <div className="absolute inset-0 pointer-events-none">
                  {texts.filter(t => t.page === currentPage - 1).map((t, i) => (
                    <div
                      key={`text-${i}`}
                      style={{
                        position: 'absolute',
                        left: t.x,
                        top: 800 - t.y,
                        fontSize: t.size,
                        color: 'blue',
                        fontWeight: 'bold'
                      }}
                    >
                      {t.text}
                    </div>
                  ))}
                  {annotations.filter(a => a.page === currentPage - 1).map((a, i) => (
                    <div
                      key={`ann-${i}`}
                      style={{
                        position: 'absolute',
                        left: a.x,
                        top: 800 - a.y,
                        width: a.width,
                        height: a.height,
                        backgroundColor: 'rgba(255, 255, 0, 0.3)',
                        border: '1px solid yellow'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center justify-center space-x-4 mt-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
              >
                Previous
              </button>
              <span>Page {currentPage} of {numPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                disabled={currentPage >= numPages}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfEditor;
