import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import FileUploader from '../../components/FileUploader';
import VideoAdModal from '../../components/VideoAdModal';
import { conversionAPI } from '../../services/api';
import { FiDownload, FiLoader } from 'react-icons/fi';
import ToolContentSection from '../../components/ToolContentSection';

const MergePdf = () => {
  const { user } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [convertedFile, setConvertedFile] = useState(null);
  const [showAdModal, setShowAdModal] = useState(false);

  const handleConvert = async () => {
    if (selectedFiles.length < 2) {
      toast.error('Please select at least 2 PDF files to merge');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('files', file));
    formData.append('storageType', 'temporary');

    try {
      const data = await conversionAPI.convertFile('merge-pdf', formData);
      setConvertedFile(data);

      if (!user || !user.isPremium) {
        setShowAdModal(true);
      } else {
        toast.success('PDFs merged successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Merge failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Merge PDF Files</h1>
          <p className="text-lg text-gray-600">Combine multiple PDF files into one document</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <FileUploader
            onFilesSelect={(files) => setSelectedFiles(files)}
            acceptedFiles={{ 'application/pdf': ['.pdf'] }}
            maxFiles={10}
            maxSize={user?.isPremium ? 50 * 1024 * 1024 : 10 * 1024 * 1024}
            selectedFiles={selectedFiles}
            onRemoveFile={(i) => setSelectedFiles(selectedFiles.filter((_, idx) => idx !== i))}
          />

          <button
            onClick={handleConvert}
            disabled={loading || selectedFiles.length < 2}
            className="w-full mt-6 py-4 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin mr-2" />
                Merging...
              </>
            ) : (
              'Merge PDFs'
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

        {/* Rich SEO Content */}
        <ToolContentSection
          title="Merge PDF Files Online"
          content={{
            introduction: [
              "Stop sending five separate attachments in one email. Use our PDF Merger to combine multiple PDF documents into a single, organized file. It's perfect for consolidating reports, invoices, or chapters of a book.",
              "Our drag-and-drop interface makes it easy to arrange your files in the exact order you want. Once merged, you get one clean file that's easy to store, share, and print."
            ],
            benefits: [
              "Combine unlimited PDF pages",
              "Drag-and-drop reordering",
              "Maintains original formatting",
              "Fast server-side processing",
              "Works on Mac, Windows, and Linux",
              "Simple and intuitive interface"
            ],
            howToSteps: [
              "Upload all the PDF files you want to merge.",
              "Drag the thumbnails to rearrange their order.",
              "Choose your preferred storage output.",
              "Click 'Merge PDF' to combine them.",
              "Download your single, unified document."
            ],
            faqs: [
              {
                question: "Can I merge PDF files with different page sizes?",
                answer: "Yes! Our merger handles documents with mixed orientations (landscape/portrait) and different page sizes seamlessly."
              },
              {
                question: "Is there a limit on the number of files?",
                answer: "Free users can merge multiple files up to a combined size of 10MB. Premium users enjoy higher limits and faster processing for large batches."
              },
              {
                question: "Can I merge password-protected files?",
                answer: "You will need to unlock password-protected files first using our 'Unlock PDF' tool before they can be merged."
              }
            ]
          }}
        />

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900 mb-2">Preserve Quality</h3>
            <p className="text-sm text-gray-600">
              Maintains original PDF quality and formatting when merging
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900 mb-2">Unlimited Pages</h3>
            <p className="text-sm text-gray-600">
              Merge PDFs with any number of pages into a single document
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

      {showAdModal && convertedFile && (
        <VideoAdModal
          isOpen={showAdModal}
          onClose={() => setShowAdModal(false)}
          onAdComplete={() => toast.success('Merge complete!')}
          downloadUrl={conversionAPI.downloadFile(convertedFile.fileName)}
          fileName={convertedFile.fileName}
        />
      )}
    </div>
  );
};

export default MergePdf;
