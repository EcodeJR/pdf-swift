import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import PdfEditorAdvanced from '../../components/PdfEditorAdvanced';
import VideoAdModal from '../../components/VideoAdModal';
import AdBanner from '../../components/AdBanner';
import api from '../../services/api';
import { logEvent } from '../../services/analytics';
import { FiUpload, FiEdit3, FiCheckCircle } from 'react-icons/fi';

const EditPdf = () => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showAdModal, setShowAdModal] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
        setResult(null);
      }
    }
  });

  const handleStartEditing = () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file first');
      return;
    }
    setShowEditor(true);
  };

  const handleSaveEdits = async (edits) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Add edits to form data
      if (edits.texts && edits.texts.length > 0) {
        formData.append('texts', JSON.stringify(edits.texts));
      }
      if (edits.images && edits.images.length > 0) {
        formData.append('images', JSON.stringify(edits.images));
      }
      if (edits.annotations && edits.annotations.length > 0) {
        formData.append('annotations', JSON.stringify(edits.annotations));
      }
      if (edits.watermark) {
        formData.append('watermark', JSON.stringify(edits.watermark));
      }
      if (edits.rotate) {
        formData.append('rotate', JSON.stringify(edits.rotate));
      }

      const response = await api.post('/convert/edit-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResult(response.data);
      setShowEditor(false);

      // Show ad for free users
      if (!user || !user.isPremium) {
        setShowAdModal(true);
      } else {
        toast.success('PDF edited successfully!');
      }

      // Track successful edit event
      logEvent('Tool Usage', 'Edit PDF Success', selectedFile.name);
    } catch (error) {
      console.error('Edit error:', error);
      toast.error(error.response?.data?.message || 'Failed to edit PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (result?.downloadUrl) {
      try {
        // Construct absolute URL
        let downloadUrl = result.downloadUrl;
        if (!downloadUrl.startsWith('http')) {
          const baseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
          if (!downloadUrl.startsWith('/')) downloadUrl = `/${downloadUrl}`;
          downloadUrl = `${baseUrl}${downloadUrl}`;
        }

        // Fetch as blob to bypass router completely
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error('Download failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.fileName || 'edited.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Download error:', error);
        toast.error('Failed to download file. Please try again.');
      }
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    setShowEditor(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Header Ad Banner */}
      {(!user || !user.isPremium) && (
        <div className="bg-gray-100 py-2 mb-4 sm:mb-8">
          <div className="max-w-4xl mx-auto px-4">
            <AdBanner />
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-4">
            <FiEdit3 className="text-4xl sm:text-5xl text-blue-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Edit PDF</h1>
          <p className="text-base sm:text-lg text-gray-600">
            Add text, highlights, watermarks, and annotations to your PDF
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
          {!result ? (
            <>
              {/* File Upload */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 sm:p-12 text-center cursor-pointer transition-colors ${isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400'
                  }`}
              >
                <input {...getInputProps()} />
                <FiUpload className="mx-auto text-4xl sm:text-5xl text-gray-400 mb-4" />
                {isDragActive ? (
                  <p className="text-lg text-blue-600">Drop your PDF here...</p>
                ) : (
                  <>
                    <p className="text-lg text-gray-700 mb-2">
                      Drag & drop your PDF here, or click to select
                    </p>
                    <p className="text-sm text-gray-500">
                      Only PDF files are supported
                    </p>
                  </>
                )}
              </div>

              {/* Selected File Info */}
              {selectedFile && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-600">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Features List */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <FiCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Add Text</h3>
                    <p className="text-sm text-gray-600">
                      Insert custom text anywhere on your PDF
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <FiCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Highlight</h3>
                    <p className="text-sm text-gray-600">
                      Add colored highlights to important sections
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <FiCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Watermark</h3>
                    <p className="text-sm text-gray-600">
                      Add diagonal watermarks to all pages
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <FiCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Annotations</h3>
                    <p className="text-sm text-gray-600">
                      Draw shapes and add visual markers
                    </p>
                  </div>
                </div>
              </div>

              {/* Start Editing Button */}
              <div className="mt-8">
                <button
                  onClick={handleStartEditing}
                  disabled={!selectedFile || loading}
                  className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Processing...' : 'Start Editing'}
                </button>
              </div>
            </>
          ) : (
            /* Success Result */
            <div className="text-center">
              <div className="mb-6">
                <FiCheckCircle className="mx-auto text-6xl text-green-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  PDF Edited Successfully!
                </h2>
                <p className="text-gray-600">{result.message}</p>
              </div>

              {/* Edit Summary */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Edits Applied</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Texts</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {result.editsApplied?.texts || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Highlights</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {result.editsApplied?.annotations || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Watermark</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {result.editsApplied?.watermark ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">File Size</p>
                    <p className="text-2xl font-bold text-gray-700">
                      {(result.fileSize / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleDownload}
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download Edited PDF
                </button>
                <button
                  onClick={handleReset}
                  className="px-8 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Edit Another PDF
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Your PDF will be automatically deleted after 1 hour for security.
          </p>
          <p className="mt-2">
            Premium users can save edited PDFs to cloud storage.
          </p>
        </div>
      </div>

      {/* PDF Editor Modal */}
      {showEditor && selectedFile && (
        <PdfEditorAdvanced
          file={selectedFile}
          onSave={handleSaveEdits}
          onCancel={() => setShowEditor(false)}
        />
      )}

      {/* Video Ad Modal */}
      {showAdModal && result && (
        <VideoAdModal
          isOpen={showAdModal}
          onClose={() => setShowAdModal(false)}
          onAdComplete={() => toast.success('PDF edited successfully!')}
          downloadUrl={result.downloadUrl}
          fileName={result.fileName}
        />
      )}

      {/* Bottom Ad Banner */}
      {(!user || !user.isPremium) && (
        <div className="bg-gray-100 py-4">
          <div className="max-w-4xl mx-auto px-4">
            <AdBanner />
          </div>
        </div>
      )}
    </div>
  );
};

export default EditPdf;
