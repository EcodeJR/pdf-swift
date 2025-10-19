const fs = require('fs').promises;
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const pdfParse = require('pdf-parse');
const { Document, Paragraph, TextRun, Packer } = require('docx');
const xlsx = require('xlsx');
const sharp = require('sharp');
const PDFDocument2 = require('pdfkit');
const Conversion = require('../models/Conversion');

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

    res.download(filePath, fileName, async (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ message: 'Error downloading file' });
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Error downloading file' });
  }
};

// Placeholder for other converters
exports.pdfToJpg = async (req, res) => {
  res.status(501).json({ 
    message: 'PDF to JPG conversion coming soon! This feature requires additional PDF rendering capabilities.'
  });
};

exports.wordToPdf = async (req, res) => {
  res.status(501).json({ 
    message: 'Word to PDF conversion coming soon! This feature requires additional document processing capabilities.'
  });
};

exports.excelToPdf = async (req, res) => {
  res.status(501).json({ 
    message: 'Excel to PDF conversion coming soon! This feature requires additional spreadsheet processing capabilities.'
  });
};

exports.editPdf = async (req, res) => {
  res.status(501).json({ 
    message: 'PDF editing coming soon! This feature will allow you to add text and annotations.'
  });
};
