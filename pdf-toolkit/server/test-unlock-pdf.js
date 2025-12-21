const fs = require('fs').promises;
const path = require('path');
const { unlockPdf } = require('./controllers/conversionController');
const { PDFDocument } = require('pdf-lib');
const muhammara = require('muhammara');

// Mock Express Request/Response
const mockReq = (file, body = {}) => ({
    file,
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
        console.log('--- Testing Unlock PDF ---');

        // Setup test files
        const testPdfPath = path.join(__dirname, 'test-unlock-input.pdf');
        const testPdfEncryptedPath = path.join(__dirname, 'test-unlock-encrypted.pdf');

        // Create dummy PDF
        const doc = await PDFDocument.create();
        doc.addPage();
        const pdfBytes = await doc.save();
        await fs.writeFile(testPdfPath, pdfBytes);

        // Encrypt it using muhammara (simulating Protect PDF)
        muhammara.recrypt(testPdfPath, testPdfEncryptedPath, {
            userPassword: 'testpassword',
            ownerPassword: 'testpassword',
            userProtectionFlag: 4
        });

        // Test Unlock PDF
        console.log('\nTesting Unlock PDF...');
        const req = mockReq({
            path: testPdfEncryptedPath,
            filename: 'test-unlock-encrypted.pdf',
            originalname: 'test.pdf'
        }, { password: 'testpassword' });
        const res = mockRes();

        await unlockPdf(req, res);

        if (res.data) {
            console.log('Result:', res.data.message);

            // Verify it's unlocked
            const outputFileName = res.data.fileName;
            const outputPath = path.join(__dirname, 'uploads', outputFileName);

            try {
                const unlockedBytes = await fs.readFile(outputPath);
                // Should load WITHOUT password
                await PDFDocument.load(unlockedBytes);
                console.log('SUCCESS: PDF loaded without password.');

                // Cleanup output
                await fs.unlink(outputPath);
            } catch (e) {
                console.error('FAIL: PDF still requires password or is invalid:', e.message);
            }

        } else {
            console.error('Test Failed:', res);
        }

        // Cleanup inputs
        try {
            await fs.unlink(testPdfPath);
            await fs.unlink(testPdfEncryptedPath);
        } catch (e) { }

    } catch (error) {
        console.error('Test Error:', error);
    }
};

runTest();
