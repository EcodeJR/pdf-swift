import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import FileUploader from '../../components/FileUploader';
import VideoAdModal from '../../components/VideoAdModal';
import { conversionAPI } from '../../services/api';
import { FiDownload, FiLoader, FiImage } from 'react-icons/fi';

const PdfToJpg = () => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [convertedFiles, setConvertedFiles] = useState(null);
  const [showAdModal, setShowAdModal] = useState(false);

  const handleConvert = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('storageType', 'temporary');

    try {
      const data = await conversionAPI.convertFile('pdf-to-jpg', formData);
      setConvertedFiles(data);

      if (!user || !user.isPremium) {
        setShowAdModal(true);
      } else {
        toast.success('Conversion complete!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Conversion failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">PDF to JPG Converter</h1>
          <p className="text-lg text-gray-600">Convert PDF pages to high-quality JPG images</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <FileUploader
            acceptedFiles={{ 'application/pdf': ['.pdf'] }}
            onFilesSelect={(files) => setSelectedFile(files[0])}
            maxFiles={1}
            maxSize={user?.isPremium ? 50 * 1024 * 1024 : 10 * 1024 * 1024}
            selectedFiles={selectedFile ? [selectedFile] : []}
          />

          {selectedFile && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FiImage className="text-blue-600" size={24} />
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-600">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleConvert}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <FiLoader className="animate-spin" />
                      <span>Converting...</span>
                    </>
                  ) : (
                    <span>Convert to JPG</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {convertedFiles && user && user.isPremium && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
              <p className="font-medium text-gray-900">{convertedFiles.fileName}</p>
              <a
                href={conversionAPI.downloadFile(convertedFiles.fileName)}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
              >
                <FiDownload className="mr-2" />
                Download
              </a>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900 mb-2">High Quality</h3>
            <p className="text-sm text-gray-600">
              Converts each PDF page to a high-resolution JPG image
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900 mb-2">All Pages</h3>
            <p className="text-sm text-gray-600">
              Converts all pages in your PDF to separate image files
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900 mb-2">Secure</h3>
            <p className="text-sm text-gray-600">
              Files are automatically deleted after 1 hour for your privacy
            </p>
          </div>
        </div>
      </div>

      {showAdModal && convertedFiles && (
        <VideoAdModal
          isOpen={showAdModal}
          onClose={() => setShowAdModal(false)}
          onAdComplete={() => toast.success('Conversion complete!')}
          downloadUrl={conversionAPI.downloadFile(convertedFiles.fileName)}
          fileName={convertedFiles.fileName}
        />
      )}
    </div>
  );
};

export default PdfToJpg;
