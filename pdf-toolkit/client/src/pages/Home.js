import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiFileText, 
  FiFile, 
  FiImage, 
  FiCompress, 
  FiLayers, 
  FiScissors,
  FiEdit3,
  FiZap,
  FiShield,
  FiStar
} from 'react-icons/fi';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  const tools = [
    {
      name: 'PDF to Word',
      description: 'Convert PDF documents to editable Word files',
      icon: FiFileText,
      link: '/pdf-to-word',
      color: 'bg-blue-500'
    },
    {
      name: 'PDF to Excel',
      description: 'Extract tables and data from PDFs to Excel',
      icon: FiFile,
      link: '/pdf-to-excel',
      color: 'bg-green-500'
    },
    {
      name: 'PDF to JPG',
      description: 'Convert PDF pages to high-quality images',
      icon: FiImage,
      link: '/pdf-to-jpg',
      color: 'bg-purple-500'
    },
    {
      name: 'Word to PDF',
      description: 'Convert Word documents to PDF format',
      icon: FiFileText,
      link: '/word-to-pdf',
      color: 'bg-indigo-500'
    },
    {
      name: 'Excel to PDF',
      description: 'Convert Excel spreadsheets to PDF',
      icon: FiFile,
      link: '/excel-to-pdf',
      color: 'bg-emerald-500'
    },
    {
      name: 'JPG to PDF',
      description: 'Convert images to PDF documents',
      icon: FiImage,
      link: '/jpg-to-pdf',
      color: 'bg-pink-500'
    },
    {
      name: 'Compress PDF',
      description: 'Reduce PDF file size while maintaining quality',
      icon: FiCompress,
      link: '/compress-pdf',
      color: 'bg-orange-500'
    },
    {
      name: 'Merge PDF',
      description: 'Combine multiple PDFs into one document',
      icon: FiLayers,
      link: '/merge-pdf',
      color: 'bg-cyan-500'
    },
    {
      name: 'Split PDF',
      description: 'Extract specific pages from PDF documents',
      icon: FiScissors,
      link: '/split-pdf',
      color: 'bg-teal-500'
    },
    {
      name: 'Edit PDF',
      description: 'Add text, annotations, and signatures to PDFs',
      icon: FiEdit3,
      link: '/edit-pdf',
      color: 'bg-red-500'
    }
  ];

  const features = [
    {
      icon: FiZap,
      title: 'Fast & Efficient',
      description: 'Convert your files in seconds with our optimized processing engine'
    },
    {
      icon: FiShield,
      title: 'Secure & Private',
      description: 'Your files are processed securely and automatically deleted after conversion'
    },
    {
      icon: FiStar,
      title: 'No Limits with Premium',
      description: 'Unlimited conversions, larger files, and cloud storage with Premium'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Free Online PDF Tools
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Convert, compress, merge, and split PDFs instantly. No registration required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/tools"
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
              >
                Get Started Free
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-white hover:text-primary-600 transition-colors"
                >
                  Create Account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              All PDF Tools in One Place
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to work with PDFs, completely free
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {tools.map((tool, index) => {
              const IconComponent = tool.icon;
              return (
                <Link
                  key={index}
                  to={tool.link}
                  className="group bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                >
                  <div className={`w-12 h-12 ${tool.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {tool.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose PDF Toolkit?
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed for your productivity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Upgrade?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Get unlimited conversions, no ads, and cloud storage with Premium
          </p>
          <Link
            to="/pricing"
            className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
          >
            View Pricing
          </Link>
        </div>
      </section>

      {/* Ad Banner for Free Users */}
      {!isAuthenticated && (
        <div className="bg-gray-100 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-gray-200 h-20 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Advertisement Space</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
