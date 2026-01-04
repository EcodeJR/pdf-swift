import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import FileUploader from '../../components/FileUploader';
import VideoAdModal from '../../components/VideoAdModal';
import { conversionAPI } from '../../services/api';
import { FiDownload, FiLoader, FiFileText } from 'react-icons/fi';
import ToolContentSection from '../../components/ToolContentSection';

const WordToPdf = () => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [convertedFile, setConvertedFile] = useState(null);
  const [showAdModal, setShowAdModal] = useState(false);

  const handleConvert = async () => {
    if (!selectedFile) {
      toast.error('Please select a Word document');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('storageType', 'temporary');

    try {
      const data = await conversionAPI.convertFile('word-to-pdf', formData);
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
    <div className="relative min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Word to PDF Converter</h1>
          <p className="text-lg text-gray-600">Convert Word documents (.doc, .docx) to PDF format</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <FileUploader
            acceptedFiles={{
              'application/msword': ['.doc'],
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
            }}
            onFilesSelect={(files) => setSelectedFile(files[0])}
            maxFiles={1}
            maxSize={user?.isPremium ? 50 * 1024 * 1024 : 10 * 1024 * 1024}

          />

          {selectedFile && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FiFileText className="text-blue-600" size={24} />
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
                    <span>Convert to PDF</span>
                  )}
                </button>
              </div>
            </div>
          )}

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
          title="Convert Word to PDF Free and Securely"
          content={{
            introduction: [
              "Sharing Microsoft Word documents can be risky—formatting often shifts when opened on different devices. Our Word to PDF converter locks in your layout, ensuring your document looks exactly the same on every screen.",
              "Whether it's a resume, a legal contract, or a school assignment, converting it to PDF is the best way to share it professionally. Our tool accepts both .doc and .docx formats and generates a high-quality PDF in seconds."
            ],
            benefits: [
              "Preserves original layout and fonts",
              "Locks content for professional sharing",
              "Compatible with all PDF viewers",
              "Supports both DOC and DOCX formats",
              "Secure encryption during transfer",
              "No watermarks on converted files"
            ],
            howToSteps: [
              "Upload your Microsoft Word document.",
              "Choose 'Temporary' or 'Cloud' storage.",
              "Click 'Convert to PDF'.",
              "We generate a print-ready PDF file.",
              "Download and share your document with confidence."
            ],
            faqs: [
              {
                question: "Will my custom fonts be preserved?",
                answer: "Yes. Our conversion engine embeds standard fonts to ensure your document looks consistent. For highly specialized fonts, we recommend embedding them in the Word file before uploading."
              },
              {
                question: "Can I convert older .doc files?",
                answer: "Absolutely. We support both the legacy .doc format (Word 97-2003) and the modern .docx format."
              },
              {
                question: "Is it free?",
                answer: "Yes, you can convert documents for free. We also offer a Premium plan for users who need to convert larger files or need unlimited daily processing."
              }
            ]
          }}
        />

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900 mb-2">High Quality</h3>
            <p className="text-sm text-gray-600">
              Preserves formatting, fonts, and layout from your Word document
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900 mb-2">Fast Conversion</h3>
            <p className="text-sm text-gray-600">
              Convert Word to PDF in seconds using LibreOffice engine
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
          onAdComplete={() => toast.success('Conversion complete!')}
          downloadUrl={conversionAPI.downloadFile(convertedFile.fileName)}
          fileName={convertedFile.fileName}
        />
      )}
    </div>
  );
};

export default WordToPdf;
