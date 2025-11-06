const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const pdfParse = require('pdf-parse');
const { Document, Paragraph, TextRun, Packer } = require('docx');
const xlsx = require('xlsx');
const sharp = require('sharp');
const PDFDocument2 = require('pdfkit');
const { convert } = require('pdf-poppler');
const libre = require('libreoffice-convert');
const { promisify } = require('util');
const libreConvert = promisify(libre.convert);
const Conversion = require('../models/Conversion');
const { lockFileWithTimeout, unlockFile } = require('../utils/fileManager');
const { streamFromGridFS } = require('../utils/gridfsHelper');
const { handleFileStorage, cleanupFile, validateStorageRequest, getStorageMetadata } = require('../utils/conversionHelper');

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

    const pdfBuffer = await fs.readFile(req.file.path);
    const pdfData = await pdfParse(pdfBuffer);
    
    // Extract text and create paragraphs
    const textLines = pdfData.text.split('\n').filter(line => line.trim());
    const paragraphs = textLines.map(line => 
      new Paragraph({
        children: [new TextRun(line)]
      })
    );

    // Create Word document
    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs.length > 0 ? paragraphs : [
          new Paragraph({
            children: [new TextRun('No text content found in PDF')]
          })
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    const outputFileName = req.file.filename.replace('.pdf', '.docx');
    const outputPath = path.join(__dirname, '../uploads', outputFileName);
    
    await fs.writeFile(outputPath, buffer);

    // Track conversion
    const ip = req.ip || req.connection.remoteAddress;
    await trackConversion(
      req.user ? req.user._id : null,
      ip,
      'pdf-to-word',
      req.file.originalname,
      outputFileName,
      buffer.length,
      req.body.storageType || 'temporary'
    );

    // Clean up original PDF
    await fs.unlink(req.file.path);

    const conversionTime = Date.now() - startTime;

    res.json({
      message: 'PDF converted to Word successfully',
      downloadUrl: `/api/convert/download/${outputFileName}`,
      fileName: outputFileName,
      fileSize: buffer.length,
      conversionTime
    });
  } catch (error) {
    console.error('PDF to Word error:', error);
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

    const pdfBuffer = await fs.readFile(req.file.path);
    const pdfData = await pdfParse(pdfBuffer);
    
    // Extract text and attempt to parse into rows
    const textLines = pdfData.text.split('\n').filter(line => line.trim());
    const data = textLines.map(line => [line]);

    // Create Excel workbook
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.aoa_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');

    const outputFileName = req.file.filename.replace('.pdf', '.xlsx');
    const outputPath = path.join(__dirname, '../uploads', outputFileName);
    
    xlsx.writeFile(wb, outputPath);

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
      message: 'PDF converted to Excel successfully',
      downloadUrl: `/api/convert/download/${outputFileName}`,
      fileName: outputFileName,
      fileSize: stats.size,
      conversionTime
    });
  } catch (error) {
    console.error('PDF to Excel error:', error);
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

    const pdfBuffer = await fs.readFile(req.file.path);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    
    // Save with compression options
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50
    });

    const outputFileName = req.file.filename.replace('.pdf', '-compressed.pdf');
    const outputPath = path.join(__dirname, '../uploads', outputFileName);
    
    await fs.writeFile(outputPath, compressedBytes);

    const originalSize = pdfBuffer.length;
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

    // Load and merge each PDF
    for (const file of req.files) {
      const pdfBuffer = await fs.readFile(file.path);
      const pdf = await PDFDocument.load(pdfBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach(page => mergedPdf.addPage(page));
      
      // Clean up individual file
      await fs.unlink(file.path);
    }

    const mergedBytes = await mergedPdf.save();
    const outputFileName = `merged-${Date.now()}.pdf`;
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
        } catch (e) {}
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
    const outputFileName = req.file.filename.replace('.pdf', `-split.pdf`);
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
      
      // Resize if needed
      const resized = await sharp(imageBytes)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toBuffer();

      let image;
      if (file.mimetype === 'image/png') {
        image = await pdfDoc.embedPng(resized);
      } else {
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
    const outputFileName = `converted-${Date.now()}.pdf`;
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
        } catch (e) {}
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

    // Convert PDF to images
    await convert(pdfPath, opts);

    // Find generated image files
    const files = await fs.readdir(outputDir);
    const imageFiles = files.filter(f => f.startsWith(baseFileName) && f.endsWith('.jpg'));

    if (imageFiles.length === 0) {
      throw new Error('No images generated from PDF');
    }

    // Use the first image as the primary output
    const outputFileName = imageFiles[0];
    const outputPath = path.join(outputDir, outputFileName);
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
exports.wordToPdf = async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Read the DOCX file
    const docxBuffer = await fs.readFile(req.file.path);
    
    // Convert to PDF using LibreOffice
    const pdfBuffer = await libreConvert(docxBuffer, '.pdf', undefined);
    
    const outputFileName = req.file.filename.replace(/\.(docx|doc)$/i, '.pdf');
    const outputPath = path.join(__dirname, '../uploads', outputFileName);
    
    await fs.writeFile(outputPath, pdfBuffer);

    // Track conversion
    const ip = req.ip || req.connection.remoteAddress;
    await trackConversion(
      req.user ? req.user._id : null,
      ip,
      'word-to-pdf',
      req.file.originalname,
      outputFileName,
      pdfBuffer.length,
      req.body.storageType || 'temporary'
    );

    // Clean up original file
    await fs.unlink(req.file.path);

    const conversionTime = Date.now() - startTime;

    res.json({
      message: 'Word document converted to PDF successfully',
      downloadUrl: `/api/convert/download/${outputFileName}`,
      fileName: outputFileName,
      fileSize: pdfBuffer.length,
      conversionTime
    });
  } catch (error) {
    console.error('Word to PDF error:', error);
    res.status(500).json({ 
      message: 'Error converting Word to PDF. Please ensure LibreOffice is installed and the file is valid.', 
      error: error.message 
    });
  }
};

// Excel to PDF Converter
exports.excelToPdf = async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Read the XLSX file
    const xlsxBuffer = await fs.readFile(req.file.path);
    
    // Convert to PDF using LibreOffice
    const pdfBuffer = await libreConvert(xlsxBuffer, '.pdf', undefined);
    
    const outputFileName = req.file.filename.replace(/\.(xlsx|xls)$/i, '.pdf');
    const outputPath = path.join(__dirname, '../uploads', outputFileName);
    
    await fs.writeFile(outputPath, pdfBuffer);

    // Track conversion
    const ip = req.ip || req.connection.remoteAddress;
    await trackConversion(
      req.user ? req.user._id : null,
      ip,
      'excel-to-pdf',
      req.file.originalname,
      outputFileName,
      pdfBuffer.length,
      req.body.storageType || 'temporary'
    );

    // Clean up original file
    await fs.unlink(req.file.path);

    const conversionTime = Date.now() - startTime;

    res.json({
      message: 'Excel spreadsheet converted to PDF successfully',
      downloadUrl: `/api/convert/download/${outputFileName}`,
      fileName: outputFileName,
      fileSize: pdfBuffer.length,
      conversionTime
    });
  } catch (error) {
    console.error('Excel to PDF error:', error);
    res.status(500).json({ 
      message: 'Error converting Excel to PDF. Please ensure LibreOffice is installed and the file is valid.', 
      error: error.message 
    });
  }
};

// PDF Editor - Add text, images, and annotations
exports.editPdf = async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }

    // Get editing instructions from request body
    const { 
      texts = [],        // Array of {text, x, y, page, size, color}
      images = [],       // Array of {imageUrl, x, y, page, width, height}
      annotations = [],  // Array of {type, x, y, page, width, height, color}
      watermark = null,  // {text, opacity, rotation}
      rotate = null      // {page, degrees}
    } = req.body;

    // Load the PDF
    const pdfBytes = await fs.readFile(req.file.path);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    // Add text annotations
    for (const textItem of texts) {
      const page = pages[textItem.page || 0];
      const fontSize = textItem.size || 12;
      const color = textItem.color || { r: 0, g: 0, b: 0 };
      
      page.drawText(textItem.text, {
        x: textItem.x,
        y: textItem.y,
        size: fontSize,
        color: color
      });
    }

    // Add image annotations
    for (const imgItem of images) {
      const page = pages[imgItem.page || 0];
      
      // If image is base64 or URL, embed it
      if (imgItem.imageData) {
        let image;
        if (imgItem.imageData.startsWith('data:image/png')) {
          const base64 = imgItem.imageData.split(',')[1];
          const imageBytes = Buffer.from(base64, 'base64');
          image = await pdfDoc.embedPng(imageBytes);
        } else if (imgItem.imageData.startsWith('data:image/jpeg') || imgItem.imageData.startsWith('data:image/jpg')) {
          const base64 = imgItem.imageData.split(',')[1];
          const imageBytes = Buffer.from(base64, 'base64');
          image = await pdfDoc.embedJpg(imageBytes);
        }
        
        if (image) {
          page.drawImage(image, {
            x: imgItem.x,
            y: imgItem.y,
            width: imgItem.width || 100,
            height: imgItem.height || 100
          });
        }
      }
    }

    // Add shape annotations (rectangles, highlights)
    for (const annotation of annotations) {
      const page = pages[annotation.page || 0];
      const color = annotation.color || { r: 1, g: 1, b: 0 };
      const opacity = annotation.opacity || 0.3;
      
      if (annotation.type === 'rectangle' || annotation.type === 'highlight') {
        page.drawRectangle({
          x: annotation.x,
          y: annotation.y,
          width: annotation.width,
          height: annotation.height,
          color: color,
          opacity: opacity,
          borderColor: annotation.borderColor || color,
          borderWidth: annotation.borderWidth || 1
        });
      } else if (annotation.type === 'line') {
        page.drawLine({
          start: { x: annotation.x, y: annotation.y },
          end: { x: annotation.x2, y: annotation.y2 },
          thickness: annotation.thickness || 2,
          color: color
        });
      }
    }

    // Add watermark to all pages
    if (watermark) {
      const font = await pdfDoc.embedFont('Helvetica');
      pages.forEach(page => {
        const { width, height } = page.getSize();
        page.drawText(watermark.text, {
          x: width / 2 - (watermark.text.length * 10),
          y: height / 2,
          size: watermark.size || 50,
          color: watermark.color || { r: 0.5, g: 0.5, b: 0.5 },
          opacity: watermark.opacity || 0.3,
          rotate: { angle: watermark.rotation || 45 }
        });
      });
    }

    // Rotate pages if specified
    if (rotate) {
      const page = pages[rotate.page];
      const currentRotation = page.getRotation().angle;
      page.setRotation({ angle: currentRotation + (rotate.degrees || 90) });
    }

    // Save the edited PDF
    const editedPdfBytes = await pdfDoc.save();
    const outputFileName = req.file.filename.replace('.pdf', '-edited.pdf');
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
      message: 'PDF edited successfully',
      downloadUrl: `/api/convert/download/${outputFileName}`,
      fileName: outputFileName,
      fileSize: editedPdfBytes.length,
      conversionTime,
      editsApplied: {
        texts: texts.length,
        images: images.length,
        annotations: annotations.length,
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
