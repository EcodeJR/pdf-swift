import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import FileUploader from '../../components/FileUploader';
import VideoAdModal from '../../components/VideoAdModal';
import AdBanner from '../../components/AdBanner';
import { conversionAPI } from '../../services/api';
import { FiDownload, FiLoader } from 'react-icons/fi';
import { GridPattern } from '../../components/GridPattern';

const JpgToPdf = () => {
  const { user } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [convertedFile, setConvertedFile] = useState(null);
  const [showAdModal, setShowAdModal] = useState(false);

  const handleConvert = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select images to convert');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('files', file));
    formData.append('storageType', 'temporary');

    try {
      const data = await conversionAPI.convertFile('jpg-to-pdf', formData);
      setConvertedFile(data);

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
    <div className="relative min-h-screen bg-secondary-50">
      {/* Grid Pattern Background */}
      <GridPattern
        className="absolute inset-0 stroke-primary-200/20 [mask-image:radial-gradient(white,transparent_85%)]"
        width={60}
        height={60}
      />
      {/* Header Ad Banner */}
      {(!user || !user.isPremium) && (
        <div className="bg-gray-100 py-2">
          <div className="max-w-4xl mx-auto px-4">
            <AdBanner />
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">JPG to PDF Converter</h1>
          <p className="text-lg text-gray-600">Convert images (JPG, PNG) to PDF format</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <FileUploader
            onFilesSelect={(files) => setSelectedFiles(files)}
            acceptedFiles={{ 'image/*': ['.jpg', '.jpeg', '.png'] }}
            maxFiles={10}
            maxSize={user?.isPremium ? 50 * 1024 * 1024 : 10 * 1024 * 1024}
            selectedFiles={selectedFiles}
            onRemoveFile={(i) => setSelectedFiles(selectedFiles.filter((_, idx) => idx !== i))}
          />

          <button
            onClick={handleConvert}
            disabled={loading || selectedFiles.length === 0}
            className="w-full mt-6 py-4 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin mr-2" />
                Converting...
              </>
            ) : (
              'Convert to PDF'
            )}
          </button>

          {convertedFile && user && user.isPremium && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
              <p className="font-medium text-gray-900">{convertedFile.fileName}</p>
              <a
                href={conversionAPI.downloadFile(convertedFile.fileName)}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
              >
                <FiDownload className="mr-2" />
                Download
              </a>
            </div>
          )}
        </div>
      </div>

      {showAdModal && convertedFile && (
        <VideoAdModal
          isOpen={showAdModal}
          onClose={() => setShowAdModal(false)}
          onAdComplete={() => toast.success('Conversion complete!')}
          downloadUrl={conversionAPI.downloadFile(convertedFile.fileName)}
          fileName={convertedFile.fileName}
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

export default JpgToPdf;
