// Similar structure to PdfToWord - Copy and modify
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import FileUploader from '../../components/FileUploader';
import VideoAdModal from '../../components/VideoAdModal';
import { conversionAPI } from '../../services/api';
import { FiDownload, FiLoader, FiFileText } from 'react-icons/fi';
import ToolContentSection from '../../components/ToolContentSection';

const PdfToExcel = () => {
  const { user, isAuthenticated } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [convertedFile, setConvertedFile] = useState(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const [storageType, setStorageType] = useState('temporary');

  const handleConvert = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select a file to convert');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFiles[0]);
    formData.append('storageType', storageType);

    try {
      const data = await conversionAPI.convertFile('pdf-to-excel', formData);
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            PDF to Excel Converter
          </h1>
          <p className="text-lg text-gray-600">
            Extract tables and data from PDF to Excel (XLSX) format
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <FileUploader
            onFilesSelect={(files) => setSelectedFiles(files)}
            acceptedFiles={{ 'application/pdf': ['.pdf'] }}
            maxFiles={1}
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
              'Convert to Excel'
            )}
          </button>

          {convertedFile && user && user.isPremium && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{convertedFile.fileName}</p>
              </div>
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
          title="Convert PDF to Excel Online"
          content={{
            introduction: [
              "Extracting financial tables, invoices, or reports from PDF documents into Excel spreadsheets can be tedious. Our PDF to Excel converter automates this process, saving you hours of manual data entry.",
              "Using advanced table recognition algorithms, we accurately identify rows and columns in your PDF and export them directly to a formatted Microsoft Excel (.xlsx) file. All data types are preserved, ensuring your spreadsheets are ready for analysis immediately."
            ],
            benefits: [
              "Accurate table recognition and extraction",
              "Preserves cell formatting and data types",
              "Converts multi-page tables seamlessly",
              "Secure processing with auto-deletion",
              "No software installation needed",
              "Works with scanned documents (OCR)"
            ],
            howToSteps: [
              "Upload your PDF document containing tables.",
              "Select your preferred storage mode.",
              "Click 'Convert to Excel' to begin extraction.",
              "Our engine analyzes the document structure.",
              "Download your editable Excel (.xlsx) spreadsheet."
            ],
            faqs: [
              {
                question: "Will the formulas in my PDF be preserved?",
                answer: "PDFs do not store Excel formulas, only the final values. Our tool extracts these values into cells. You can then re-apply formulas in Excel as needed."
              },
              {
                question: "How does it handle merged cells?",
                answer: "Our intelligent engine detects merged cells in the PDF layout and attempts to replicate that structure in the final Excel sheet to maintain the visual integrity of your table."
              },
              {
                question: "Can I convert bank statements?",
                answer: "Yes, our tool is excellent for converting bank statements to Excel for budgeting. However, always verify sensitive financial data after conversion."
              },
              {
                question: "Is my data secure?",
                answer: "Yes. We use enterprise-grade encryption for transmission. Your files, including sensitive financial documents, are permanently deleted from our servers after 1 hour."
              }
            ]
          }}
        />
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

export default PdfToExcel;
