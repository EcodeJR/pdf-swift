import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import FileUploader from '../../components/FileUploader';
import VideoAdModal from '../../components/VideoAdModal';
import { conversionAPI } from '../../services/api';
import { FiDownload, FiLoader } from 'react-icons/fi';
import ToolContentSection from '../../components/ToolContentSection';

const CompressPdf = () => {
  const { user } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [convertedFile, setConvertedFile] = useState(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState(null);

  const handleConvert = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select a PDF to compress');
      return;
    }

    if (!compressionLevel) {
      toast.error('Please select a compression level');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFiles[0]);
    formData.append('storageType', 'temporary');
    formData.append('compressionLevel', compressionLevel);

    try {
      const data = await conversionAPI.convertFile('compress-pdf', formData);
      setConvertedFile(data);

      if (!user || !user.isPremium) {
        setShowAdModal(true);
      } else {
        toast.success(`Compression complete! Reduced by ${data.reductionPercent}%`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Compression failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Compress PDF</h1>
          <p className="text-lg text-gray-600">Reduce PDF file size while maintaining quality</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <FileUploader
            onFilesSelect={(files) => {
              setSelectedFiles(files);
              setCompressionLevel(null); // Reset selection on new file
            }}
            acceptedFiles={{ 'application/pdf': ['.pdf'] }}
            maxFiles={1}
            maxSize={user?.isPremium ? 50 * 1024 * 1024 : 10 * 1024 * 1024}
            selectedFiles={selectedFiles}
            onRemoveFile={(i) => {
              setSelectedFiles([]);
              setCompressionLevel(null);
            }}
          />

          {selectedFiles.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => setCompressionLevel('basic')}
                className={`cursor-pointer p-6 rounded-lg border-2 transition-all ${compressionLevel === 'basic'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
                  }`}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">Basic Compression</h3>
                <p className="text-gray-600 text-sm">
                  Best for documents with text. Maintains high quality and text selectability. Standard reduction (~10-20%).
                </p>
              </div>

              <div
                onClick={() => setCompressionLevel('strong')}
                className={`cursor-pointer p-6 rounded-lg border-2 transition-all ${compressionLevel === 'strong'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
                  }`}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">Strong Compression</h3>
                <p className="text-gray-600 text-sm">
                  Best for scans and heavy images. Converts text to images (not selectable). Maximum reduction (~50%+).
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleConvert}
            disabled={loading || selectedFiles.length === 0 || !compressionLevel}
            className="w-full mt-6 py-4 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center transition-colors"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin mr-2" />
                Compressing...
              </>
            ) : (
              'Compress PDF'
            )}
          </button>

          {convertedFile && user && user.isPremium && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-900">{convertedFile.fileName}</p>
                <a
                  href={conversionAPI.downloadFile(convertedFile.fileName)}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
                >
                  <FiDownload className="mr-2" />
                  Download
                </a>
              </div>
              <p className="text-sm text-gray-600">
                Reduced by {convertedFile.reductionPercent}%
                ({(convertedFile.originalSize / 1024).toFixed(0)}KB → {(convertedFile.compressedSize / 1024).toFixed(0)}KB)
              </p>
            </div>
          )}
        </div>

        {/* Rich SEO Content */}
        <ToolContentSection
          title="Compress PDF File Size Online"
          content={{
            introduction: [
              "Is your PDF too large to email or upload to a website portal? Our PDF Compressor significantly reduces file size without compromising readability. We use smart compression algorithms to optimize images and fonts.",
              "Whether you have a 50MB marketing brochure or a scanned contract that needs to be under 2MB, our tool analyzes your file and removes unnecessary data overhead, making it light and easy to share."
            ],
            benefits: [
              "Reduces file size by up to 80%",
              "Maintains visual quality for reading",
              "Optimizes images and font subsets",
              "Fast processing in the cloud",
              "Secure handling of confidential docs",
              "Compatible with all email providers"
            ],
            howToSteps: [
              "Upload your large PDF file.",
              "Select your storage preference.",
              "Click 'Compress PDF'.",
              "Our engine optimizes the file structure.",
              "Download your smaller, lighter PDF."
            ],
            faqs: [
              {
                question: "How much will my file size be reduced?",
                answer: "Compression ratios vary depending on the content. Text-heavy files see moderate reduction, while image-heavy files (scans, brochures) can often be reduced by 50-80%."
              },
              {
                question: "Will readability be affected?",
                answer: "Our default compression setting balances quality and size. Text remains sharp, while images are optimized to a standard suitable for screen viewing and email."
              },
              {
                question: "Why is my PDF so big?",
                answer: "PDFs often contain high-resolution images, full font sets, and hidden metadata. Our compressor strips away this invisible weight without changing the visible content."
              }
            ]
          }}
        />
      </div>

      {showAdModal && convertedFile && (
        <VideoAdModal
          isOpen={showAdModal}
          onClose={() => setShowAdModal(false)}
          onAdComplete={() => toast.success('Compression complete!')}
          downloadUrl={conversionAPI.downloadFile(convertedFile.fileName)}
          fileName={convertedFile.fileName}
        />
      )}
    </div>
  );
};

export default CompressPdf;
