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
const { convert } = require('pdf-poppler');
const { exec } = require('child_process');
const execAsync = require('util').promisify(exec);
// LibreOffice path for Windows
const LIBREOFFICE_PATH = process.env.LIBREOFFICE_PATH || 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';
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
    const outputFileName = req.file.filename.replace(path.extname(req.file.filename), "") + ".docx";
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

    const outputFileName = req.file.filename.replace(path.extname(req.file.filename), "") + ".xlsx";
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

    const { compressionLevel } = req.body; // 'basic' or 'strong'
    const outputFileName = req.file.filename.replace(path.extname(req.file.filename), "") + "-compressed.pdf";
    const outputPath = path.join(__dirname, '../uploads', outputFileName);
    let compressedBytes;
    let originalSize;

    if (compressionLevel === 'strong') {
      // STRONG COMPRESSION (Rasterization)
      const inputPath = req.file.path;
      const outputDir = path.join(__dirname, '../uploads', `temp_${Date.now()}`);

      try {
        await fs.mkdir(outputDir);

        // 1. Convert to Images
        const opts = {
          format: 'jpeg',
          out_dir: outputDir,
          out_prefix: 'page',
          page: null
        };

        await convert(inputPath, opts);

        // 2. Compress Images & Build PDF
        const pdfDoc = await PDFDocument.create();
        const files = await fs.readdir(outputDir);
        const imageFiles = files.filter(f => f.startsWith('page') && f.endsWith('.jpg'));

        // Sort by page number
        imageFiles.sort((a, b) => {
          const numA = parseInt(a.match(/page-(\d+)/)[1]);
          const numB = parseInt(b.match(/page-(\d+)/)[1]);
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

    // Convert PDF to images
    await convert(pdfPath, opts);

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
      'word-to-word', // Should be 'word-to-pdf' but keeping consistent with previous code if any
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

// PDF Editor - Add text, images, and annotations
exports.editPdf = async (req, res) => {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }


    // Get editing instructions from request body
    // Parse JSON strings if they come as strings (from FormData)
    let texts = [];
    let images = [];
    let annotations = [];
    let watermark = null;
    let rotate = null;

    try {
      // Log raw request body for debugging
      console.log('Raw request body keys:', Object.keys(req.body));
      console.log('Raw texts:', req.body.texts);
      console.log('Raw images:', req.body.images);

      texts = typeof req.body.texts === 'string' ? JSON.parse(req.body.texts) : (req.body.texts || []);
      images = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : (req.body.images || []);
      annotations = typeof req.body.annotations === 'string' ? JSON.parse(req.body.annotations) : (req.body.annotations || []);
      watermark = typeof req.body.watermark === 'string' ? JSON.parse(req.body.watermark) : req.body.watermark;
      rotate = typeof req.body.rotate === 'string' ? JSON.parse(req.body.rotate) : req.body.rotate;
    } catch (parseError) {
      console.error('Error parsing edit data:', parseError);
      return res.status(400).json({ message: 'Invalid edit data format' });
    }

    console.log('Parsed edit data:', {
      textsCount: texts.length,
      imagesCount: images.length,
      annotationsCount: annotations.length,
      hasWatermark: !!watermark
    });

    // Load the PDF
    const pdfBytes = await fs.readFile(req.file.path);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    // Add text annotations
    for (const textItem of texts) {
      // Skip if text is undefined or empty
      if (!textItem.text || typeof textItem.text !== 'string') {
        console.warn('Skipping text item with invalid text:', textItem);
        continue;
      }

      const page = pages[textItem.page || 0];
      const { height } = page.getSize(); // Get actual page height
      const fontSize = textItem.size || 12;

      // Select font based on bold/italic
      let fontName = StandardFonts.Helvetica;
      if (textItem.bold && textItem.italic) {
        fontName = StandardFonts.HelveticaBoldOblique;
      } else if (textItem.bold) {
        fontName = StandardFonts.HelveticaBold;
      } else if (textItem.italic) {
        fontName = StandardFonts.HelveticaOblique;
      }
      const font = await pdfDoc.embedFont(fontName);

      // Parse color - handle both object {r, g, b} and string formats
      let textColor;
      if (textItem.color && typeof textItem.color === 'object') {
        const { r = 0, g = 0, b = 0 } = textItem.color;
        textColor = rgb(r, g, b);
      } else {
        textColor = rgb(0, 0, 0); // Default black
      }

      // Remove emojis and special characters that WinAnsi can't encode
      // WinAnsi only supports characters in the range 0x20-0xFF
      const cleanText = textItem.text.replace(/[^\x20-\xFF]/g, '');

      if (cleanText.length === 0) {
        console.warn('Text contains only unsupported characters (emojis/special chars), skipping');
        continue;
      }

      if (cleanText !== textItem.text) {
        console.warn('Removed unsupported characters from text:', {
          original: textItem.text,
          cleaned: cleanText
        });
      }

      // Convert top-left coordinates (frontend) to bottom-left (pdf-lib)
      // Subtract y from height to flip coordinate system
      page.drawText(cleanText, {
        x: textItem.x,
        y: height - textItem.y - fontSize, // Adjust for font size as drawText uses baseline
        size: fontSize,
        color: textColor,
        font: font
      });
    }

    // Add image annotations
    for (const imgItem of images) {
      console.log('Processing image:', { page: imgItem.page, x: imgItem.x, y: imgItem.y, hasData: !!imgItem.imageData });

      const page = pages[imgItem.page || 0];
      const { height } = page.getSize();

      // If image is base64 or URL, embed it
      if (imgItem.imageData) {
        let image;
        try {
          // Robustly handle data URL prefix
          const matches = imgItem.imageData.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);

          if (matches && matches.length === 3) {
            const imageType = matches[1].toLowerCase();
            const base64Data = matches[2];
            console.log(`Embedding ${imageType} image...`);
            const imageBytes = Buffer.from(base64Data, 'base64');

            if (imageType === 'png') {
              image = await pdfDoc.embedPng(imageBytes);
            } else if (imageType === 'jpeg' || imageType === 'jpg') {
              image = await pdfDoc.embedJpg(imageBytes);
            } else {
              console.warn(`Unsupported image type for embedding: ${imageType}`);
            }
          } else {
            // Fallback: try to detect type from data itself
            console.warn('Invalid data URL format, attempting fallback detection');

            // Try to extract base64 data even if format is wrong
            let base64Data = imgItem.imageData;
            if (base64Data.includes('base64,')) {
              base64Data = base64Data.split('base64,')[1];
            }

            try {
              const imageBytes = Buffer.from(base64Data, 'base64');

              // Try PNG first (most common)
              try {
                image = await pdfDoc.embedPng(imageBytes);
                console.log('Successfully embedded as PNG (fallback)');
              } catch (pngError) {
                // If PNG fails, try JPG
                try {
                  image = await pdfDoc.embedJpg(imageBytes);
                  console.log('Successfully embedded as JPG (fallback)');
                } catch (jpgError) {
                  console.error('Failed to embed as both PNG and JPG:', jpgError.message);
                }
              }
            } catch (decodeError) {
              console.error('Failed to decode base64 image data:', decodeError.message);
            }
          }

          if (image) {
            console.log(`Drawing image at x:${imgItem.x}, y:${height - imgItem.y - (imgItem.height || 100)}`);
            page.drawImage(image, {
              x: imgItem.x,
              y: height - imgItem.y - (imgItem.height || 100), // Adjust for image height (draws from bottom-left)
              width: imgItem.width || 100,
              height: imgItem.height || 100
            });
            console.log('Image drawn successfully');
          } else {
            console.error('Failed to create image object');
          }
        } catch (imgError) {
          console.error('Error embedding image:', imgError);
        }
      } else {
        console.warn('Image item has no imageData');
      }
    }

    // Add shape annotations (rectangles, highlights)
    for (const annotation of annotations) {
      const page = pages[annotation.page || 0];
      const { height } = page.getSize();

      // Parse color using rgb() function
      let annotationColor;
      if (annotation.color && typeof annotation.color === 'object') {
        const { r = 1, g = 1, b = 0 } = annotation.color;
        annotationColor = rgb(r, g, b);
      } else {
        annotationColor = rgb(1, 1, 0); // Default yellow
      }

      // Parse border color using rgb() function
      let borderColor;
      if (annotation.borderColor && typeof annotation.borderColor === 'object') {
        const { r = 0, g = 0, b = 0 } = annotation.borderColor;
        borderColor = rgb(r, g, b);
      } else {
        borderColor = undefined; // No border
      }

      const opacity = annotation.opacity || 0.3;

      if (annotation.type === 'rectangle' || annotation.type === 'highlight') {
        // Validate rectangle has required dimensions
        if (typeof annotation.x === 'number' && typeof annotation.y === 'number' &&
          typeof annotation.width === 'number' && typeof annotation.height === 'number') {
          page.drawRectangle({
            x: annotation.x,
            y: height - annotation.y - (annotation.height || 0), // Adjust for height (draws from bottom-left)
            width: annotation.width,
            height: annotation.height,
            color: annotationColor,
            opacity: opacity,
            borderColor: borderColor,
            borderWidth: annotation.borderWidth || 1
          });
        } else {
          console.warn('Skipping rectangle annotation with invalid dimensions:', annotation);
        }
      } else if (annotation.type === 'circle') {
        // Draw circle using ellipse
        if (typeof annotation.x === 'number' && typeof annotation.y === 'number' &&
          typeof annotation.width === 'number' && typeof annotation.height === 'number') {
          const centerX = annotation.x + annotation.width / 2;
          const centerY = height - annotation.y - annotation.height / 2;
          page.drawEllipse({
            x: centerX,
            y: centerY,
            xScale: annotation.width / 2,
            yScale: annotation.height / 2,
            color: annotationColor,
            opacity: opacity,
            borderColor: borderColor,
            borderWidth: annotation.borderWidth || 1
          });
        } else {
          console.warn('Skipping circle annotation with invalid dimensions:', annotation);
        }
      } else if (annotation.type === 'line') {
        // Validate line has required coordinates
        if (typeof annotation.x === 'number' && typeof annotation.y === 'number' &&
          typeof annotation.x2 === 'number' && typeof annotation.y2 === 'number') {
          page.drawLine({
            start: { x: annotation.x, y: height - annotation.y },
            end: { x: annotation.x2, y: height - annotation.y2 },
            thickness: annotation.thickness || 2,
            color: annotationColor
          });
        } else {
          console.warn('Skipping line annotation with invalid coordinates:', annotation);
        }
      }
    }

    // Add watermark to all pages
    if (watermark && watermark.text) {
      const font = await pdfDoc.embedFont('Helvetica');

      // Parse watermark color
      let watermarkColor;
      if (watermark.color && typeof watermark.color === 'object') {
        const { r = 0.5, g = 0.5, b = 0.5 } = watermark.color;
        watermarkColor = rgb(r, g, b);
      } else {
        watermarkColor = rgb(0.5, 0.5, 0.5); // Default gray
      }

      // Extract rotation angle from object or use directly
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
          rotate: degrees(rotationAngle)
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


