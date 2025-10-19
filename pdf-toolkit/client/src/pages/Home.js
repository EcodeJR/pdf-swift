import React from 'react';
import { Link } from 'react-router-dom';
import { FiFileText, FiTable, FiImage, FiCompass, FiLayers, FiScissors, FiEdit3, FiDownload, FiUpload, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import AdBanner from '../components/AdBanner';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const tools = [
    { name: 'PDF to Word', icon: FiFileText, path: '/pdf-to-word', description: 'Convert PDF to editable DOCX' },
    { name: 'PDF to Excel', icon: FiTable, path: '/pdf-to-excel', description: 'Extract data to XLSX' },
    { name: 'PDF to JPG', icon: FiImage, path: '/pdf-to-jpg', description: 'Convert pages to images' },
    { name: 'Word to PDF', icon: FiUpload, path: '/word-to-pdf', description: 'Convert DOCX to PDF' },
    { name: 'Excel to PDF', icon: FiRefreshCw, path: '/excel-to-pdf', description: 'Convert XLSX to PDF' },
    { name: 'JPG to PDF', icon: FiImage, path: '/jpg-to-pdf', description: 'Convert images to PDF' },
    { name: 'Compress PDF', icon: FiCompress, path: '/compress-pdf', description: 'Reduce PDF file size' },
    { name: 'Merge PDF', icon: FiLayers, path: '/merge-pdf', description: 'Combine multiple PDFs' },
    { name: 'Split PDF', icon: FiScissors, path: '/split-pdf', description: 'Extract specific pages' },
    { name: 'Edit PDF', icon: FiEdit3, path: '/edit-pdf', description: 'Add text & annotations' },
  ];

  const features = [
    { title: 'Fast & Efficient', description: 'Lightning-fast conversions in seconds', icon: '⚡' },
    { title: 'Secure & Private', description: 'Your files are automatically deleted after 1 hour', icon: '🔒' },
    { title: 'No Limits', description: 'Unlimited conversions with Premium', icon: '⭐' },
  ];

  return (
    <div className="bg-white">
      {/* Header Ad Banner for non-premium users */}
      {!isAuthenticated && (
        <div className="bg-gray-100 py-2">
          <div className="max-w-7xl mx-auto px-4">
            <AdBanner />
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
              Free Online PDF Tools
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Convert, compress, merge, and split PDFs instantly
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                to="/register"
                className="px-8 py-3 bg-white text-primary-600 rounded-lg font-bold hover:bg-gray-100 transition"
              >
                Get Started Free
              </Link>
              <Link
                to="/pricing"
                className="px-8 py-3 bg-primary-700 text-white rounded-lg font-bold hover:bg-primary-800 border-2 border-white transition"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
          All PDF Tools
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-primary-500 hover:shadow-lg transition transform hover:-translate-y-1"
            >
              <tool.icon className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">{tool.name}</h3>
              <p className="text-sm text-gray-600">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Why Choose PDF Toolkit?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to upgrade?</h2>
          <p className="text-xl mb-8 text-primary-100">
            Get unlimited conversions, 50MB file limit, and zero ads for just $5/month
          </p>
          <Link
            to="/pricing"
            className="inline-block px-8 py-3 bg-white text-primary-600 rounded-lg font-bold hover:bg-gray-100 transition"
          >
            View Pricing Plans
          </Link>
        </div>
      </div>
    </div>
  );
};

// Fix missing import
const FiCompress = FiDownload;

export default Home;
