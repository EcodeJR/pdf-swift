import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import FileUploader from '../../components/FileUploader';
import VideoAdModal from '../../components/VideoAdModal';
import { conversionAPI } from '../../services/api';
import { FiDownload, FiLoader } from 'react-icons/fi';

const PdfToWord = () => {
  const { user, isAuthenticated } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [convertedFile, setConvertedFile] = useState(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const [storageType, setStorageType] = useState('temporary');

  const handleFilesSelect = (files) => {
    setSelectedFiles(files);
    setConvertedFile(null);
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
    const formData = new FormData();
    formData.append('file', selectedFiles[0]);
    formData.append('storageType', storageType);

    try {
      const data = await conversionAPI.convertFile('pdf-to-word', formData);
      setConvertedFile(data);

      // Show ad modal for free users
      if (!user || !user.isPremium) {
        setShowAdModal(true);
      } else {
        toast.success('Conversion complete! Download your file below.');
      }
    } catch (error) {
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

  const handleAdComplete = () => {
    toast.success('Conversion complete! Download your file below.');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            PDF to Word Converter
          </h1>
          <p className="text-lg text-gray-600">
            Convert your PDF files to editable Word documents (DOCX) in seconds
          </p>
        </div>

        {/* Main Conversion Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          {/* Storage Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Storage Option:
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="temporary"
                  checked={storageType === 'temporary'}
                  onChange={(e) => setStorageType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">
                  Quick Convert (1 hour)
                  {!isAuthenticated && <span className="text-gray-500"> - No login required</span>}
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="cloud"
                  checked={storageType === 'cloud'}
                  onChange={(e) => setStorageType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">
                  Save to Cloud
                  {!isAuthenticated && <span className="text-orange-600"> - Login required</span>}
                </span>
              </label>
            </div>
          </div>

          {/* File Uploader */}
          <FileUploader
            onFilesSelect={handleFilesSelect}
            acceptedFiles={{ 'application/pdf': ['.pdf'] }}
            maxFiles={1}
            maxSize={user?.isPremium ? 50 * 1024 * 1024 : 10 * 1024 * 1024}
            selectedFiles={selectedFiles}
            onRemoveFile={handleRemoveFile}
          />

          {/* Convert Button */}
          <button
            onClick={handleConvert}
            disabled={loading || selectedFiles.length === 0}
            className="w-full mt-6 py-4 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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

          {/* Download Section - for premium users */}
          {convertedFile && user && user.isPremium && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{convertedFile.fileName}</p>
                  <p className="text-sm text-gray-600">
                    Size: {(convertedFile.fileSize / 1024).toFixed(2)} KB
                  </p>
                </div>
                <a
                  href={conversionAPI.downloadFile(convertedFile.fileName)}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
                >
                  <FiDownload className="mr-2" />
                  Download
                </a>
              </div>
            </div>
          )}
        </div>

        {/* How It Works Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-xl">
                1
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Upload PDF</h3>
              <p className="text-sm text-gray-600">Select your PDF file to convert</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-xl">
                2
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Convert</h3>
              <p className="text-sm text-gray-600">We extract and format the text</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-xl">
                3
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Download</h3>
              <p className="text-sm text-gray-600">Get your editable Word document</p>
            </div>
          </div>
        </div>

        {/* Related Tools */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Tools</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href="/pdf-to-excel" className="text-center p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow">
              <p className="text-sm font-medium text-gray-700">PDF to Excel</p>
            </a>
            <a href="/compress-pdf" className="text-center p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow">
              <p className="text-sm font-medium text-gray-700">Compress PDF</p>
            </a>
            <a href="/merge-pdf" className="text-center p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow">
              <p className="text-sm font-medium text-gray-700">Merge PDF</p>
            </a>
            <a href="/split-pdf" className="text-center p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow">
              <p className="text-sm font-medium text-gray-700">Split PDF</p>
            </a>
          </div>
        </div>
      </div>

      {/* Video Ad Modal */}
      {showAdModal && convertedFile && (
        <VideoAdModal
          isOpen={showAdModal}
          onClose={() => setShowAdModal(false)}
          onAdComplete={handleAdComplete}
          downloadUrl={conversionAPI.downloadFile(convertedFile.fileName)}
          fileName={convertedFile.fileName}
        />
      )}
    </div>
  );
};

export default PdfToWord;
