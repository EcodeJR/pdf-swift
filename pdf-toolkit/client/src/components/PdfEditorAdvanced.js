import React, { useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { FiType, FiImage, FiSquare, FiCircle, FiMinus, FiDroplet, FiTrash2, FiEdit2 } from 'react-icons/fi';

// Set up PDF.js worker - environment-aware
if (process.env.NODE_ENV === 'development') {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} else {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

const PdfEditorAdvanced = ({ file, onSave, onCancel }) => {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  
  // Tools
  const [tool, setTool] = useState('text');
  const [selectedElement, setSelectedElement] = useState(null);
  
  // Elements
  const [texts, setTexts] = useState([]);
  const [images, setImages] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [watermark, setWatermark] = useState(null);
  
  // Tool settings
  const [textSettings, setTextSettings] = useState({
    content: '',
    size: 16,
    color: '#000000',
    bold: false,
    italic: false
  });
  
  const [shapeSettings, setShapeSettings] = useState({
    type: 'rectangle',
    fillColor: '#FFFF00',
    borderColor: '#000000',
    opacity: 0.3,
    borderWidth: 2
  });

  const fileInputRef = useRef(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  // Add text element
  const handleCanvasClick = (e) => {
    if (tool === 'select') return;
    
    const rect = e.target.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    if (tool === 'text' && textSettings.content) {
      const newText = {
        id: Date.now(),
        text: textSettings.content,
        x: x,
        y: 800 - y,
        page: currentPage - 1,
        size: textSettings.size,
        color: hexToRgb(textSettings.color),
        bold: textSettings.bold,
        italic: textSettings.italic
      };
      setTexts([...texts, newText]);
    } else if (tool === 'shape') {
      const newShape = {
        id: Date.now(),
        type: shapeSettings.type,
        x: x,
        y: 800 - y,
        page: currentPage - 1,
        width: 100,
        height: shapeSettings.type === 'line' ? 2 : 60,
        fillColor: hexToRgb(shapeSettings.fillColor),
        borderColor: hexToRgb(shapeSettings.borderColor),
        opacity: shapeSettings.opacity,
        borderWidth: shapeSettings.borderWidth
      };
      setShapes([...shapes, newShape]);
    }
  };

  // Convert hex color to RGB object
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImage = {
          id: Date.now(),
          imageData: event.target.result,
          x: 100,
          y: 400,
          page: currentPage - 1,
          width: 150,
          height: 150
        };
        setImages([...images, newImage]);
      };
      reader.readAsDataURL(file);
    }
  };

  // Delete selected element
  const deleteElement = () => {
    if (!selectedElement) return;
    
    if (selectedElement.type === 'text') {
      setTexts(texts.filter(t => t.id !== selectedElement.id));
    } else if (selectedElement.type === 'image') {
      setImages(images.filter(i => i.id !== selectedElement.id));
    } else if (selectedElement.type === 'shape') {
      setShapes(shapes.filter(s => s.id !== selectedElement.id));
    }
    setSelectedElement(null);
  };

  // Dragging state
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Start dragging
  const handleMouseDown = (e, element, type) => {
    e.stopPropagation();
    setSelectedElement({ type, id: element.id });
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setDragging({ type, id: element.id });
  };

  // Handle dragging
  const handleMouseMove = (e) => {
    if (!dragging) return;
    
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - dragOffset.x) / scale;
    const y = (e.clientY - rect.top - dragOffset.y) / scale;

    if (dragging.type === 'text') {
      setTexts(texts.map(t => 
        t.id === dragging.id ? { ...t, x, y: 800 - y } : t
      ));
    } else if (dragging.type === 'image') {
      setImages(images.map(i => 
        i.id === dragging.id ? { ...i, x, y: 800 - y } : i
      ));
    } else if (dragging.type === 'shape') {
      setShapes(shapes.map(s => 
        s.id === dragging.id ? { ...s, x, y: 800 - y } : s
      ));
    }
  };

  // Stop dragging
  const handleMouseUp = () => {
    setDragging(null);
  };

  // Update element properties
  const updateElement = (updates) => {
    if (!selectedElement) return;
    
    if (selectedElement.type === 'text') {
      setTexts(texts.map(t => 
        t.id === selectedElement.id ? { ...t, ...updates } : t
      ));
    } else if (selectedElement.type === 'image') {
      setImages(images.map(i => 
        i.id === selectedElement.id ? { ...i, ...updates } : i
      ));
    } else if (selectedElement.type === 'shape') {
      setShapes(shapes.map(s => 
        s.id === selectedElement.id ? { ...s, ...updates } : s
      ));
    }
  };

  // Add watermark
  const addWatermark = () => {
    const text = prompt('Enter watermark text:');
    if (text) {
      setWatermark({
        text,
        opacity: 0.3,
        rotation: 45,
        size: 50,
        color: { r: 0.5, g: 0.5, b: 0.5 }
      });
    }
  };

  // Save all edits
  const handleSave = () => {
    const edits = {
      texts: texts.map(t => ({
        text: t.text,
        x: t.x,
        y: t.y,
        page: t.page,
        size: t.size,
        color: t.color
      })),
      images,
      annotations: shapes.map(s => ({
        type: s.type === 'rectangle' ? 'rectangle' : s.type === 'circle' ? 'rectangle' : 'line',
        x: s.x,
        y: s.y,
        page: s.page,
        width: s.width,
        height: s.height,
        color: s.fillColor,
        borderColor: s.borderColor,
        opacity: s.opacity,
        borderWidth: s.borderWidth
      })),
      watermark
    };
    onSave(edits);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-7xl max-h-[95vh] w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold">Advanced PDF Editor</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
            >
              Save & Download
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
          {/* Left Toolbar */}
          <div className="w-20 border-r bg-gray-50 flex flex-col items-center py-4 space-y-2">
            <button
              onClick={() => setTool('select')}
              className={`p-3 rounded ${tool === 'select' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'}`}
              title="Select"
            >
              <FiEdit2 size={20} />
            </button>
            <button
              onClick={() => setTool('text')}
              className={`p-3 rounded ${tool === 'text' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'}`}
              title="Add Text"
            >
              <FiType size={20} />
            </button>
            <button
              onClick={() => { setTool('image'); fileInputRef.current?.click(); }}
              className={`p-3 rounded ${tool === 'image' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'}`}
              title="Add Image"
            >
              <FiImage size={20} />
            </button>
            <button
              onClick={() => { setTool('shape'); setShapeSettings({...shapeSettings, type: 'rectangle'}); }}
              className={`p-3 rounded ${tool === 'shape' && shapeSettings.type === 'rectangle' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'}`}
              title="Rectangle"
            >
              <FiSquare size={20} />
            </button>
            <button
              onClick={() => { setTool('shape'); setShapeSettings({...shapeSettings, type: 'circle'}); }}
              className={`p-3 rounded ${tool === 'shape' && shapeSettings.type === 'circle' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'}`}
              title="Circle"
            >
              <FiCircle size={20} />
            </button>
            <button
              onClick={() => { setTool('shape'); setShapeSettings({...shapeSettings, type: 'line'}); }}
              className={`p-3 rounded ${tool === 'shape' && shapeSettings.type === 'line' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'}`}
              title="Line"
            >
              <FiMinus size={20} />
            </button>
            <button
              onClick={addWatermark}
              className="p-3 rounded bg-white hover:bg-gray-100"
              title="Add Watermark"
            >
              <FiDroplet size={20} />
            </button>
            {selectedElement && (
              <button
                onClick={deleteElement}
                className="p-3 rounded bg-red-100 text-red-600 hover:bg-red-200"
                title="Delete Selected"
              >
                <FiTrash2 size={20} />
              </button>
            )}
          </div>

          {/* Properties Panel */}
          <div className="w-72 border-r p-4 overflow-y-auto bg-gray-50">
            <h4 className="font-semibold mb-4 text-gray-900">Properties</h4>
            
            {/* Text Tool Settings */}
            {tool === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Text Content</label>
                  <textarea
                    value={textSettings.content}
                    onChange={(e) => setTextSettings({...textSettings, content: e.target.value})}
                    placeholder="Enter text..."
                    className="w-full px-3 py-2 border rounded resize-none"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Font Size: {textSettings.size}px</label>
                  <input
                    type="range"
                    value={textSettings.size}
                    onChange={(e) => setTextSettings({...textSettings, size: Number(e.target.value)})}
                    min="8"
                    max="72"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Color</label>
                  <input
                    type="color"
                    value={textSettings.color}
                    onChange={(e) => setTextSettings({...textSettings, color: e.target.value})}
                    className="w-full h-10 rounded border"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setTextSettings({...textSettings, bold: !textSettings.bold})}
                    className={`flex-1 px-3 py-2 rounded font-bold ${textSettings.bold ? 'bg-blue-600 text-white' : 'bg-white border'}`}
                  >
                    B
                  </button>
                  <button
                    onClick={() => setTextSettings({...textSettings, italic: !textSettings.italic})}
                    className={`flex-1 px-3 py-2 rounded italic ${textSettings.italic ? 'bg-blue-600 text-white' : 'bg-white border'}`}
                  >
                    I
                  </button>
                </div>
              </div>
            )}

            {/* Shape Tool Settings */}
            {tool === 'shape' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fill Color</label>
                  <input
                    type="color"
                    value={shapeSettings.fillColor}
                    onChange={(e) => setShapeSettings({...shapeSettings, fillColor: e.target.value})}
                    className="w-full h-10 rounded border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Border Color</label>
                  <input
                    type="color"
                    value={shapeSettings.borderColor}
                    onChange={(e) => setShapeSettings({...shapeSettings, borderColor: e.target.value})}
                    className="w-full h-10 rounded border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Opacity: {Math.round(shapeSettings.opacity * 100)}%</label>
                  <input
                    type="range"
                    value={shapeSettings.opacity}
                    onChange={(e) => setShapeSettings({...shapeSettings, opacity: Number(e.target.value)})}
                    min="0"
                    max="1"
                    step="0.1"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Border Width: {shapeSettings.borderWidth}px</label>
                  <input
                    type="range"
                    value={shapeSettings.borderWidth}
                    onChange={(e) => setShapeSettings({...shapeSettings, borderWidth: Number(e.target.value)})}
                    min="0"
                    max="10"
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Selected Element Editor */}
            {selectedElement && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold mb-4 text-gray-900">Edit Selected</h4>
                
                {selectedElement.type === 'text' && (() => {
                  const text = texts.find(t => t.id === selectedElement.id);
                  if (!text) return null;
                  return (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Text</label>
                        <textarea
                          value={text.text}
                          onChange={(e) => updateElement({ text: e.target.value })}
                          className="w-full px-3 py-2 border rounded resize-none"
                          rows="2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Size: {text.size}px</label>
                        <input
                          type="range"
                          value={text.size}
                          onChange={(e) => updateElement({ size: Number(e.target.value) })}
                          min="8"
                          max="72"
                          className="w-full"
                        />
                      </div>
                    </div>
                  );
                })()}
                
                {selectedElement.type === 'image' && (() => {
                  const image = images.find(i => i.id === selectedElement.id);
                  if (!image) return null;
                  return (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Width: {Math.round(image.width)}px</label>
                        <input
                          type="range"
                          value={image.width}
                          onChange={(e) => updateElement({ width: Number(e.target.value) })}
                          min="50"
                          max="500"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Height: {Math.round(image.height)}px</label>
                        <input
                          type="range"
                          value={image.height}
                          onChange={(e) => updateElement({ height: Number(e.target.value) })}
                          min="50"
                          max="500"
                          className="w-full"
                        />
                      </div>
                    </div>
                  );
                })()}
                
                {selectedElement.type === 'shape' && (() => {
                  const shape = shapes.find(s => s.id === selectedElement.id);
                  if (!shape) return null;
                  return (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Width: {Math.round(shape.width)}px</label>
                        <input
                          type="range"
                          value={shape.width}
                          onChange={(e) => updateElement({ width: Number(e.target.value) })}
                          min="20"
                          max="400"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Height: {Math.round(shape.height)}px</label>
                        <input
                          type="range"
                          value={shape.height}
                          onChange={(e) => updateElement({ height: Number(e.target.value) })}
                          min="20"
                          max="400"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Opacity: {Math.round(shape.opacity * 100)}%</label>
                        <input
                          type="range"
                          value={shape.opacity}
                          onChange={(e) => updateElement({ opacity: Number(e.target.value) })}
                          min="0"
                          max="1"
                          step="0.1"
                          className="w-full"
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Element Count Summary */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold mb-2 text-gray-900">Elements</h4>
              <div className="text-sm space-y-1 text-gray-600">
                <p>Texts: {texts.length}</p>
                <p>Images: {images.length}</p>
                <p>Shapes: {shapes.length}</p>
                <p>Watermark: {watermark ? 'Yes' : 'No'}</p>
              </div>
            </div>

            {/* Undo */}
            {(texts.length > 0 || images.length > 0 || shapes.length > 0) && (
              <button
                onClick={() => {
                  if (shapes.length > 0) setShapes(shapes.slice(0, -1));
                  else if (images.length > 0) setImages(images.slice(0, -1));
                  else if (texts.length > 0) setTexts(texts.slice(0, -1));
                }}
                className="w-full mt-4 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Undo Last
              </button>
            )}
          </div>

          {/* PDF Canvas */}
          <div className="flex-1 overflow-auto p-4 bg-gray-100">
            <div className="flex flex-col items-center">
              <div 
                className="relative bg-white shadow-lg" 
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: tool === 'select' ? 'default' : 'crosshair' }}
              >
                <Document
                  file={file}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Loading PDF...</p>
                    </div>
                  }
                >
                  <Page
                    pageNumber={currentPage}
                    scale={scale}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </Document>
                
                {/* Overlay for showing edits */}
                <div className="absolute inset-0 pointer-events-none">
                  {texts.filter(t => t.page === currentPage - 1).map((t) => (
                    <div
                      key={t.id}
                      style={{
                        position: 'absolute',
                        left: t.x * scale,
                        top: (800 - t.y) * scale,
                        fontSize: t.size * scale,
                        color: `rgb(${t.color.r * 255}, ${t.color.g * 255}, ${t.color.b * 255})`,
                        fontWeight: t.bold ? 'bold' : 'normal',
                        fontStyle: t.italic ? 'italic' : 'normal',
                        cursor: 'move',
                        pointerEvents: 'auto',
                        border: selectedElement?.id === t.id ? '2px dashed #3B82F6' : 'none',
                        padding: '2px'
                      }}
                      onMouseDown={(e) => handleMouseDown(e, t, 'text')}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElement({ type: 'text', id: t.id });
                      }}
                    >
                      {t.text}
                    </div>
                  ))}
                  {shapes.filter(s => s.page === currentPage - 1).map((s) => (
                    <div
                      key={s.id}
                      style={{
                        position: 'absolute',
                        left: s.x * scale,
                        top: (800 - s.y) * scale,
                        width: s.width * scale,
                        height: s.height * scale,
                        backgroundColor: `rgba(${s.fillColor.r * 255}, ${s.fillColor.g * 255}, ${s.fillColor.b * 255}, ${s.opacity})`,
                        border: selectedElement?.id === s.id ? '2px dashed #3B82F6' : `${s.borderWidth}px solid rgb(${s.borderColor.r * 255}, ${s.borderColor.g * 255}, ${s.borderColor.b * 255})`,
                        borderRadius: s.type === 'circle' ? '50%' : '0',
                        cursor: 'move',
                        pointerEvents: 'auto',
                        boxShadow: selectedElement?.id === s.id ? '0 0 0 2px #3B82F6' : 'none'
                      }}
                      onMouseDown={(e) => handleMouseDown(e, s, 'shape')}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElement({ type: 'shape', id: s.id });
                      }}
                    />
                  ))}
                  {images.filter(i => i.page === currentPage - 1).map((i) => (
                    <img
                      key={i.id}
                      src={i.imageData}
                      alt="Annotation"
                      style={{
                        position: 'absolute',
                        left: i.x * scale,
                        top: (800 - i.y) * scale,
                        width: i.width * scale,
                        height: i.height * scale,
                        cursor: 'move',
                        pointerEvents: 'auto',
                        border: selectedElement?.id === i.id ? '2px dashed #3B82F6' : 'none',
                        boxShadow: selectedElement?.id === i.id ? '0 0 0 2px #3B82F6' : 'none'
                      }}
                      onMouseDown={(e) => handleMouseDown(e, i, 'image')}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElement({ type: 'image', id: i.id });
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Page Navigation & Zoom */}
              <div className="flex items-center justify-between w-full max-w-2xl mt-4 bg-white rounded-lg shadow p-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-300"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-medium">
                    Page {currentPage} of {numPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                    disabled={currentPage >= numPages}
                    className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-300"
                  >
                    Next
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    -
                  </button>
                  <span className="text-sm font-medium min-w-[60px] text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    onClick={() => setScale(s => Math.min(2.0, s + 0.1))}
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input for images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
};

export default PdfEditorAdvanced;
