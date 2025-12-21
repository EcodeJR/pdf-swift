const fs = require('fs').promises;
const path = require('path');
const { protectPdf } = require('./controllers/conversionController');
const { PDFDocument } = require('pdf-lib');

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
        console.log('--- Testing Protect PDF ---');

        // Setup test file
        const testFileProtected = path.join(__dirname, 'test-protected-input.pdf');

        // Create dummy PDF
        const doc = await PDFDocument.create();
        console.log('Test Script - Doc methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(doc)));
        console.log('Test Script - Has encrypt?', typeof doc.encrypt);

        doc.addPage();
        const pdfBytes = await doc.save();
        await fs.writeFile(testFileProtected, pdfBytes);

        // Test Protect PDF
        console.log('\nTesting Protect PDF...');
        const req = mockReq({
            path: testFileProtected,
            filename: 'test-protected-input.pdf',
            originalname: 'test.pdf'
        }, {
            password: 'testpassword',
            permissions: {
                print: false, // Disable printing
                copy: false   // Disable copying
            }
        });
        const res = mockRes();

        await protectPdf(req, res);

        if (res.data) {
            console.log('Result:', res.data.message);

            // Verify encryption
            const outputFileName = res.data.fileName;
            const outputPath = path.join(__dirname, 'uploads', outputFileName);

            try {
                // Verify using muhammara (since pdf-lib has compatibility issues with muhammara encryption)
                const muhammara = require('muhammara');

                // 1. Try to open without password (should fail or return encrypted reader)
                try {
                    const reader = muhammara.createReader(outputPath);
                    if (reader.isEncrypted() && !reader.isDecrypted()) {
                        console.log('SUCCESS: PDF is encrypted.');
                    } else {
                        // Some readers might open but return garbage? 
                        // But usually createReader throws if encrypted and no password?
                        // Actually muhammara.createReader might succeed but operations fail?
                        // Let's check isEncrypted()
                        if (reader.isEncrypted()) {
                            console.log('SUCCESS: PDF is encrypted (checked via isEncrypted).');
                        } else {
                            console.error('FAIL: PDF is NOT encrypted!');
                        }
                    }
                } catch (e) {
                    console.log('SUCCESS: PDF failed to load without password (or threw error).');
                }

                // 2. Try to open with password (should succeed)
                try {
                    const reader = muhammara.createReader(outputPath, { password: 'testpassword' });
                    if (reader.isEncrypted()) {
                        // Verify we can read data
                        const pageCount = reader.getPagesCount();
                        console.log(`SUCCESS: PDF loaded with correct password (muhammara). Pages: ${pageCount}`);
                    } else {
                        console.error('FAIL: PDF is not encrypted?');
                    }
                } catch (e) {
                    console.error('FAIL: PDF failed to load with correct password:', e.message);
                }

                // Cleanup output
                await fs.unlink(outputPath);

            } catch (e) {
                console.error('Verification Error:', e);
            }

        } else {
            console.error('Test Failed:', res);
        }

        // Cleanup input
        try {
            await fs.unlink(testFileProtected);
        } catch (e) { }

    } catch (error) {
        console.error('Test Error:', error);
    }
};

runTest();
