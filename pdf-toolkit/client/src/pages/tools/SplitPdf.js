import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import FileUploader from '../../components/FileUploader';
import VideoAdModal from '../../components/VideoAdModal';
import { conversionAPI } from '../../services/api';
import { FiDownload, FiLoader } from 'react-icons/fi';
import ToolContentSection from '../../components/ToolContentSection';

const SplitPdf = () => {
  const { user } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [pageRange, setPageRange] = useState('');
  const [loading, setLoading] = useState(false);
  const [convertedFile, setConvertedFile] = useState(null);
  const [showAdModal, setShowAdModal] = useState(false);

  const handleConvert = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select a PDF file');
      return;
    }

    if (!pageRange) {
      toast.error('Please specify page range (e.g., "1-3" or "1,3,5")');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFiles[0]);
    formData.append('pageRange', pageRange);
    formData.append('storageType', 'temporary');

    try {
      const data = await conversionAPI.convertFile('split-pdf', formData);
      setConvertedFile(data);

      if (!user || !user.isPremium) {
        setShowAdModal(true);
      } else {
        toast.success('PDF split successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Split failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Split PDF</h1>
          <p className="text-lg text-gray-600">Extract specific pages from your PDF</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <FileUploader
            onFilesSelect={(files) => setSelectedFiles(files)}
            acceptedFiles={{ 'application/pdf': ['.pdf'] }}
            maxFiles={1}
            maxSize={user?.isPremium ? 50 * 1024 * 1024 : 10 * 1024 * 1024}
            selectedFiles={selectedFiles}
            onRemoveFile={(i) => setSelectedFiles([])}
          />

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Page Range (e.g., "1-3" or "1,3,5")
            </label>
            <input
              type="text"
              value={pageRange}
              onChange={(e) => setPageRange(e.target.value)}
              placeholder="1-3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <button
            onClick={handleConvert}
            disabled={loading || selectedFiles.length === 0}
            className="w-full mt-6 py-4 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin mr-2" />
                Splitting...
              </>
            ) : (
              'Split PDF'
            )}
          </button>

          {/* Rich SEO Content */}
          <ToolContentSection
            title="Split PDF Online - Extract Pages"
            content={{
              introduction: [
                "Need to extract specific pages from a large PDF document? Our PDF Splitter gives you complete control. You can separate a single page, a range of pages, or split an entire document into individual PDF files.",
                "This tool is perfect for extracting a single invoice from a monthly statement, removing unwanted cover pages, or breaking down a large ebook into chapters."
              ],
              benefits: [
                "Extract specific page ranges (e.g., 1-5, 8, 11-13)",
                "Split every page into a separate file",
                "Instant preview of pages",
                "Fast and secure cloud processing",
                "Zero quality loss",
                "Free to use without registration"
              ],
              howToSteps: [
                "Upload the PDF you want to split.",
                "Enter the page numbers or ranges you want to extract.",
                "Select 'Split into single files' if desired.",
                "Click 'Split PDF' to process.",
                "Download your new, smaller PDF files."
              ],
              faqs: [
                {
                  question: "Can I extract non-consecutive pages?",
                  answer: "Yes! You can enter specific pages separated by commas (e.g., '1, 5, 10') or ranges (e.g., '1-5, 8-10') to get exactly what you need."
                },
                {
                  question: "Will the quality of the pages change?",
                  answer: "No. Our tool extracts the pages exactly as they are in the original document without re-compressing them, so the quality remains identical."
                },
                {
                  question: "Is there a page limit?",
                  answer: "Free users can split documents up to 50 pages long. Premium users can process much larger documents with hundreds of pages."
                }
              ]
            }}
          />

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
          onAdComplete={() => toast.success('Split complete!')}
          downloadUrl={conversionAPI.downloadFile(convertedFile.fileName)}
          fileName={convertedFile.fileName}
        />
      )}

    </div>
  );
};

export default SplitPdf;
