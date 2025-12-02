const path = require('path');

/**
 * Configure LibreOffice path for Windows
 * The libreoffice-convert library needs to find the soffice executable
 */
function configureLibreOffice() {
    // Get LibreOffice path from environment or use default Windows installation path
    const libreofficePath = process.env.LIBREOFFICE_PATH || 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';

    // Check if it's Windows
    if (process.platform === 'win32') {
        // Set the binary path for libreoffice-convert to use
        const libreDir = path.dirname(libreofficePath);

        // Add to PATH if not already there
        if (!process.env.PATH.includes(libreDir)) {
            process.env.PATH = `${libreDir};${process.env.PATH}`;
            console.log(`✅ Added LibreOffice to PATH: ${libreDir}`);
        }

        // Set specific binary path for the library
        process.env.LIBREOFFICE_PATH = libreofficePath;
        process.env.LIBREOFFICE_BIN = libreofficePath;

        console.log(`✅ LibreOffice configured at: ${libreofficePath}`);
        return true;
    }

    // For Linux/Mac, LibreOffice is usually in PATH already
    console.log('✅ LibreOffice configuration (non-Windows platform)');
    return true;
}

/**
 * Verify LibreOffice is accessible
 */
async function verifyLibreOffice() {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
        const libreofficePath = process.env.LIBREOFFICE_PATH || 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';

        if (process.platform === 'win32') {
            // On Windows, test with the full path
            await execAsync(`"${libreofficePath}" --version`);
        } else {
            // On Linux/Mac, test with command
            await execAsync('soffice --version');
        }

        console.log('✅ LibreOffice is accessible and working');
        return true;
    } catch (error) {
        console.error('❌ LibreOffice verification failed:', error.message);
        console.error('Make sure LibreOffice is installed and the path is correct');
        return false;
    }
}

/**
 * Get LibreOffice version
 */
async function getLibreOfficeVersion() {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
        const libreofficePath = process.env.LIBREOFFICE_PATH || 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';

        let result;
        if (process.platform === 'win32') {
            result = await execAsync(`"${libreofficePath}" --version`);
        } else {
            result = await execAsync('soffice --version');
        }

        return result.stdout.trim();
    } catch (error) {
        return 'Unknown (LibreOffice not accessible)';
    }
}

module.exports = {
    configureLibreOffice,
    verifyLibreOffice,
    getLibreOfficeVersion,
};
