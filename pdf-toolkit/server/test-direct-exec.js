const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');
const execAsync = util.promisify(exec);

async function test() {
    try {
        console.log('Testing direct soffice execution...');

        const librePath = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';
        const inputPath = path.join(__dirname, 'test.docx');
        const outputDir = __dirname;

        // Create dummy file
        if (!fs.existsSync(inputPath)) {
            fs.writeFileSync(path.join(__dirname, 'test.txt'), 'Hello World');
        }
        const fileToConvert = fs.existsSync(inputPath) ? inputPath : path.join(__dirname, 'test.txt');

        const command = `"${librePath}" --headless --convert-to pdf --outdir "${outputDir}" "${fileToConvert}"`;

        console.log('Running command:', command);

        const { stdout, stderr } = await execAsync(command);

        console.log('STDOUT:', stdout);
        console.log('STDERR:', stderr);

        console.log('Success! Check for PDF in directory.');

    } catch (err) {
        console.error('Error:', err);
    }
}

test();
