const libre = require('libreoffice-convert');
const path = require('path');
const fs = require('fs');

// Configure path explicitly
process.env.LIBREOFFICE_PATH = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';
process.env.LIBREOFFICE_BIN = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';

// Manual wrapper to match server implementation
const convertAsync = (document, format, filter) => {
    return new Promise((resolve, reject) => {
        libre.convert(document, format, filter, (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
};

async function test() {
    try {
        console.log('Testing LibreOffice conversion...');
        console.log('LibreOffice Path:', process.env.LIBREOFFICE_PATH);

        const inputPath = path.join(__dirname, 'test.docx');
        const outputPath = path.join(__dirname, 'test.pdf');

        // Create a dummy DOCX file if it doesn't exist
        if (!fs.existsSync(inputPath)) {
            console.log('Creating dummy DOCX file...');
            fs.writeFileSync(path.join(__dirname, 'test.txt'), 'Hello World');
        }

        const file = fs.readFileSync(path.join(__dirname, 'test.txt'));

        console.log('Converting...');
        const pdfBuf = await convertAsync(file, '.pdf', undefined);

        fs.writeFileSync(outputPath, pdfBuf);
        console.log('Success! PDF created at:', outputPath);
    } catch (err) {
        console.error('Error:', err);
    }
}

test();
