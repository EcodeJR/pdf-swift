# Progress Bar Integration Guide

## Overview
This guide shows how to integrate the new ProgressBar component into conversion tool pages.

## Components Created
1. **ProgressBar.js** - Displays upload/processing progress
2. **Enhanced conversionAPI** - Now supports `onUploadProgress` callback

## Integration Steps

### 1. Import the ProgressBar Component

```javascript
import ProgressBar from '../../components/ProgressBar';
```

### 2. Add State for Progress Tracking

```javascript
const [uploadProgress, setUploadProgress] = useState(0);
const [progressStatus, setProgressStatus] = useState('uploading'); // 'uploading', 'processing', 'complete', 'error'
```

### 3. Update the Convert Function

```javascript
const handleConvert = async () => {
  if (selectedFiles.length === 0) {
    toast.error('Please select a file to convert');
    return;
  }

  if (storageType === 'cloud' && !isAuthenticated) {
    toast.error('Please login to use cloud storage');
    return;
  }

  setLoading(true);
  setUploadProgress(0);
  setProgressStatus('uploading');
  
  const formData = new FormData();
  formData.append('file', selectedFiles[0]);
  formData.append('storageType', storageType);

  try {
    // Pass progress callback to track upload
    const data = await conversionAPI.convertFile(
      'pdf-to-word', 
      formData,
      (progress) => {
        setUploadProgress(progress);
        if (progress === 100) {
          setProgressStatus('processing');
        }
      }
    );
    
    setProgressStatus('complete');
    setConvertedFile(data);
    
    // Show ad modal for free users
    if (!user || !user.isPremium) {
      setShowAdModal(true);
    } else {
      toast.success('Conversion complete! Download your file below.');
    }
  } catch (error) {
    setProgressStatus('error');
    const message = error.response?.data?.message || 'Conversion failed';
    if (error.response?.data?.limitExceeded) {
      toast.error(message + ' Upgrade to Premium for unlimited conversions!');
    } else {
      toast.error(message);
    }
  } finally {
    setLoading(false);
  }
};
```

### 4. Add Progress Bar to UI

```javascript
{/* Show progress bar when loading */}
{loading && selectedFiles.length > 0 && (
  <div className="mt-6">
    <ProgressBar 
      progress={uploadProgress}
      fileName={selectedFiles[0].name}
      status={progressStatus}
    />
  </div>
)}
```

## Complete Example

Here's a complete example of PdfToWord with progress tracking:

```javascript
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import FileUploader from '../../components/FileUploader';
import ProgressBar from '../../components/ProgressBar';
import VideoAdModal from '../../components/VideoAdModal';
import AdBanner from '../../components/AdBanner';
import { conversionAPI } from '../../services/api';
import { FiDownload, FiLoader } from 'react-icons/fi';

const PdfToWord = () => {
  const { user, isAuthenticated } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [convertedFile, setConvertedFile] = useState(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const [storageType, setStorageType] = useState('temporary');
  
  // Progress tracking states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('uploading');

  const handleFilesSelect = (files) => {
    setSelectedFiles(files);
    setConvertedFile(null);
    setUploadProgress(0);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select a file to convert');
      return;
    }

    if (storageType === 'cloud' && !isAuthenticated) {
      toast.error('Please login to use cloud storage');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setProgressStatus('uploading');
    
    const formData = new FormData();
    formData.append('file', selectedFiles[0]);
    formData.append('storageType', storageType);

    try {
      const data = await conversionAPI.convertFile(
        'pdf-to-word', 
        formData,
        (progress) => {
          setUploadProgress(progress);
          if (progress === 100) {
            setProgressStatus('processing');
          }
        }
      );
      
      setProgressStatus('complete');
      setConvertedFile(data);
      
      if (!user || !user.isPremium) {
        setShowAdModal(true);
      } else {
        toast.success('Conversion complete! Download your file below.');
      }
    } catch (error) {
      setProgressStatus('error');
      const message = error.response?.data?.message || 'Conversion failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ... Header and other content ... */}
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* File Uploader */}
        <FileUploader
          onFilesSelect={handleFilesSelect}
          acceptedFiles={{ 'application/pdf': ['.pdf'] }}
          maxFiles={1}
          maxSize={user?.isPremium ? 50 * 1024 * 1024 : 10 * 1024 * 1024}
          selectedFiles={selectedFiles}
          onRemoveFile={handleRemoveFile}
        />

        {/* Progress Bar */}
        {loading && selectedFiles.length > 0 && (
          <div className="mt-6">
            <ProgressBar 
              progress={uploadProgress}
              fileName={selectedFiles[0].name}
              status={progressStatus}
            />
          </div>
        )}

        {/* Convert Button */}
        <button
          onClick={handleConvert}
          disabled={loading || selectedFiles.length === 0}
          className="w-full mt-6 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {loading ? (
            <>
              <FiLoader className="animate-spin mr-2" />
              Converting...
            </>
          ) : (
            'Convert to Word'
          )}
        </button>

        {/* ... Rest of the component ... */}
      </div>
    </div>
  );
};

export default PdfToWord;
```

## Progress Status Values

- **uploading**: File is being uploaded to server (0-100%)
- **processing**: Server is processing the file (stays at 100%)
- **complete**: Conversion is complete
- **error**: An error occurred

## Styling

The ProgressBar component includes:
- Smooth animations
- Color-coded status (blue=uploading, yellow=processing, green=complete, red=error)
- Percentage display
- File name truncation for long names
- Responsive design

## Notes

1. Progress tracking only works for upload phase (client → server)
2. Server-side processing doesn't report progress (shows as "Processing..." at 100%)
3. For very fast conversions, progress bar may flash briefly
4. Progress bar automatically resets when new files are selected

## Apply to All Tools

To add progress bars to all conversion tools, repeat steps 1-4 for each tool page:
- PdfToWord.js ✅ (example above)
- PdfToExcel.js
- PdfToJpg.js
- WordToPdf.js
- ExcelToPdf.js
- JpgToPdf.js
- CompressPdf.js
- MergePdf.js
- SplitPdf.js
- EditPdf.js
