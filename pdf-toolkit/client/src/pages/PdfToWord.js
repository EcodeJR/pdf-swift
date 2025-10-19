import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { conversionAPI } from '../services/api';
import { toast } from 'react-toastify';
import FileUploader from '../components/FileUploader';
import { FiDownload, FiFileText, FiInfo } from 'react-icons/fi';

const PdfToWord = () => {
  const { isAuthenticated, user } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadFileName, setDownloadFileName] = useState('');

  const handleFileSelect = (files) => {
    setSelectedFiles(files);
    setDownloadUrl(null);
  };

  const handleRemoveFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
  };

  const handleConvert = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select a PDF file to convert');
      return;
    }

    setIsConverting(true);
    try {
      const response = await conversionAPI.convertFile('pdf-to-word', selectedFiles[0]);
      
      // Create download URL
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadFileName(selectedFiles[0].name.replace('.pdf', '.docx'));
      
      toast.success('Conversion completed successfully!');
    } catch (error) {
      console.error('Conversion error:', error);
      toast.error(error.response?.data?.error || 'Conversion failed');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const maxFileSize = user?.isPremium ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for premium, 10MB for free

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center">
              <FiFileText className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            PDF to Word Converter
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Convert your PDF documents to editable Word files. Perfect for editing and formatting your documents.
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          {/* File Upload Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload PDF File</h2>
            <FileUploader
              onFileSelect={handleFileSelect}
              selectedFiles={selectedFiles}
              onRemoveFile={handleRemoveFile}
              maxFiles={1}
              maxSize={maxFileSize}
              acceptedFileTypes={{
                'application/pdf': ['.pdf']
              }}
              disabled={isConverting}
            />
          </div>

          {/* Convert Button */}
          <div className="mb-8">
            <button
              onClick={handleConvert}
              disabled={selectedFiles.length === 0 || isConverting}
              className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConverting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Converting...
                </div>
              ) : (
                'Convert to Word'
              )}
            </button>
          </div>

          {/* Download Section */}
          {downloadUrl && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FiFileText className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Conversion Complete!</p>
                    <p className="text-sm text-green-600">{downloadFileName}</p>
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FiDownload className="h-4 w-4 mr-2" />
                  Download
                </button>
              </div>
            </div>
          )}

          {/* How It Works */}
          <div className="border-t pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How it works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary-600 font-bold">1</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Upload PDF</h4>
                <p className="text-sm text-gray-600">Select your PDF file from your computer</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary-600 font-bold">2</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Convert</h4>
                <p className="text-sm text-gray-600">Our tool extracts text and creates a Word document</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary-600 font-bold">3</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Download</h4>
                <p className="text-sm text-gray-600">Get your editable Word file instantly</p>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <FiInfo className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Tips for best results</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use PDFs with selectable text for better conversion quality</li>
                  <li>• Scanned PDFs may not convert perfectly</li>
                  <li>• Complex layouts might need manual adjustment in Word</li>
                  <li>• Maximum file size: {user?.isPremium ? '50MB' : '10MB'}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Ad Banner for Free Users */}
        {!isAuthenticated && (
          <div className="mt-8">
            <div className="bg-gray-200 h-32 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Advertisement Space</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfToWord;
