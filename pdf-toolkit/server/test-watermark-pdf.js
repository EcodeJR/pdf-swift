const fs = require('fs').promises;
const path = require('path');
const { watermarkPdf } = require('./controllers/conversionController');
const { PDFDocument } = require('pdf-lib');

// Mock Express Request/Response
const mockReq = (files, body = {}) => ({
    files,
    body,
    ip: '127.0.0.1',
    connection: { remoteAddress: '127.0.0.1' },
    user: { _id: 'test_user_id' }
});

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

const runTest = async () => {
    try {
        console.log('--- Testing Watermark PDF ---');

        // Setup test files
        const testPdfPath = path.join(__dirname, 'test-watermark-input.pdf');
        const testImagePath = path.join(__dirname, 'test-watermark-image.png');

        // Create dummy PDF
        const doc = await PDFDocument.create();
        doc.addPage();
        const pdfBytes = await doc.save();
        await fs.writeFile(testPdfPath, pdfBytes);

        // Create dummy Image (1x1 pixel PNG)
        const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
        await fs.writeFile(testImagePath, pngBuffer);

        // Test Text Watermark
        console.log('\nTesting Text Watermark...');
        const reqText = mockReq({
            file: [{ path: testPdfPath, filename: 'test-watermark-input.pdf', originalname: 'test.pdf' }]
        }, {
            type: 'text',
            text: 'TEST WATERMARK',
            color: '#ff0000',
            opacity: 0.5,
            size: 50,
            rotation: 45,
            position: 'top-left'
        });
        const resText = mockRes();

        await watermarkPdf(reqText, resText);

        if (resText.data) {
            console.log('Text Result:', resText.data.message);
            // Cleanup output
            try { await fs.unlink(path.join(__dirname, 'uploads', resText.data.fileName)); } catch (e) { }
        } else {
            console.error('Text Test Failed:', resText);
        }

        // Test Image Watermark
        console.log('\nTesting Image Watermark...');

        // Recreate PDF for second test (since first one deleted it)
        const doc2 = await PDFDocument.create();
        doc2.addPage();
        const pdfBytes2 = await doc2.save();
        await fs.writeFile(testPdfPath, pdfBytes2);

        const reqImage = mockReq({
            file: [{ path: testPdfPath, filename: 'test-watermark-input.pdf', originalname: 'test.pdf' }],
            watermarkImage: [{ path: testImagePath, mimetype: 'image/png' }]
        }, {
            type: 'image',
            opacity: 0.5,
            imageScale: 0.5,
            rotation: 0
        });
        const resImage = mockRes();

        await watermarkPdf(reqImage, resImage);

        if (resImage.data) {
            console.log('Image Result:', resImage.data.message);
            // Cleanup output
            try { await fs.unlink(path.join(__dirname, 'uploads', resImage.data.fileName)); } catch (e) { }
        } else {
            console.error('Image Test Failed:', resImage);
        }

        // Cleanup inputs
        try {
            await fs.unlink(testPdfPath);
            await fs.unlink(testImagePath);
        } catch (e) { }

    } catch (error) {
        console.error('Test Error:', error);
    }
};

runTest();
