import React from 'react';
import { Link } from 'react-router-dom';
import { FiFileText, FiTable, FiImage, FiMinimize2, FiLayers, FiScissors, FiEdit3, FiUpload, FiRefreshCw, FiZap, FiLock, FiStar, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const HomeModern = () => {
  const { user } = useAuth();

  const tools = [
    { name: 'PDF to Word', icon: FiFileText, path: '/pdf-to-word', description: 'Convert PDF to editable DOCX', color: 'from-blue-500 to-indigo-600' },
    { name: 'PDF to Excel', icon: FiTable, path: '/pdf-to-excel', description: 'Extract data to XLSX', color: 'from-green-500 to-emerald-600' },
    { name: 'PDF to JPG', icon: FiImage, path: '/pdf-to-jpg', description: 'Convert pages to images', color: 'from-purple-500 to-pink-600' },
    { name: 'Word to PDF', icon: FiUpload, path: '/word-to-pdf', description: 'Convert DOCX to PDF', color: 'from-orange-500 to-red-600' },
    { name: 'Excel to PDF', icon: FiRefreshCw, path: '/excel-to-pdf', description: 'Convert XLSX to PDF', color: 'from-teal-500 to-cyan-600' },
    { name: 'JPG to PDF', icon: FiImage, path: '/jpg-to-pdf', description: 'Convert images to PDF', color: 'from-yellow-500 to-amber-600' },
    { name: 'Compress PDF', icon: FiMinimize2, path: '/compress-pdf', description: 'Reduce PDF file size', color: 'from-rose-500 to-pink-600' },
    { name: 'Merge PDF', icon: FiLayers, path: '/merge-pdf', description: 'Combine multiple PDFs', color: 'from-violet-500 to-purple-600' },
    { name: 'Split PDF', icon: FiScissors, path: '/split-pdf', description: 'Extract specific pages', color: 'from-sky-500 to-blue-600' },
    { name: 'Edit PDF', icon: FiEdit3, path: '/edit-pdf', description: 'Add text & annotations', color: 'from-fuchsia-500 to-purple-600' },
  ];

  const features = [
    { 
      title: 'Lightning Fast', 
      description: 'Process your PDFs in seconds with our optimized conversion engine', 
      icon: FiZap,
      gradient: 'from-primary to-accent-purple'
    },
    { 
      title: 'Bank-Level Security', 
      description: 'Your files are encrypted and automatically deleted after 1 hour', 
      icon: FiLock,
      gradient: 'from-accent-blue to-primary'
    },
    { 
      title: 'Unlimited Power', 
      description: 'Premium users get unlimited conversions with priority processing', 
      icon: FiStar,
      gradient: 'from-accent-purple to-primary-600'
    },
  ];

  const stats = [
    { value: '10M+', label: 'Files Converted' },
    { value: '500K+', label: 'Happy Users' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'Support' },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary to-accent-purple">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white mb-8 border border-white/20">
              <span className="w-2 h-2 bg-accent-green rounded-full animate-pulse"></span>
              <span className="text-sm font-medium">Trusted by 500K+ users worldwide</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-display-sm md:text-display font-extrabold text-white mb-6 tracking-tight">
              Transform Your PDFs
              <br />
              <span className="bg-gradient-to-r from-white to-primary-100 bg-clip-text text-transparent">
                In Seconds
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
              The most powerful PDF toolkit on the web. Convert, compress, merge, and edit PDFs with professional-grade tools.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/register"
                className="btn-primary bg-white text-primary hover:bg-gray-50 shadow-lg hover:shadow-xl group"
              >
                <span>Start Free Trial</span>
                <FiArrowRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="#tools"
                className="btn-secondary border-white text-white hover:bg-white hover:text-primary"
              >
                Explore Tools
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl md:text-5xl font-extrabold text-white mb-2">{stat.value}</div>
                  <div className="text-white/80 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Tools Section */}
      <section id="tools" className="section bg-white">
        <div className="text-center mb-16">
          <h2 className="text-hero font-bold text-gray-900 mb-4">
            All-in-One PDF Toolkit
          </h2>
          <p className="text-body text-gray-600 max-w-2xl mx-auto">
            Everything you need to work with PDFs. No installation required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tools.map((tool, index) => (
            <Link
              key={tool.path}
              to={tool.path}
              className="group relative bg-white rounded-lg p-6 border-2 border-gray-100 hover:border-primary transition-all duration-300 hover:-translate-y-2"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Icon */}
              <div className="icon-wrapper group-hover:scale-110 transition-transform duration-300">
                <tool.icon className="w-7 h-7 text-primary" />
              </div>

              {/* Content */}
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                {tool.name}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {tool.description}
              </p>

              {/* Hover Arrow */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <FiArrowRight className="text-primary" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="section bg-light">
        <div className="text-center mb-16">
          <h2 className="text-hero font-bold text-gray-900 mb-4">
            Why Choose PDF Swift?
          </h2>
          <p className="text-body text-gray-600 max-w-2xl mx-auto">
            Built for speed, security, and simplicity.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card group"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-lg`}></div>

              {/* Icon */}
              <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-heading-sm font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-body-sm text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-dark text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-hero font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-body mb-10 text-gray-300">
            Join thousands of users who trust PDF Swift for their document needs.
            {!user && ' Start with 3 free conversions per hour, no credit card required.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <>
                <Link to="/register" className="btn-primary">
                  Create Free Account
                </Link>
                <Link to="/pricing" className="btn-secondary border-white text-white hover:bg-white hover:text-dark">
                  View Pricing
                </Link>
              </>
            ) : (
              <Link to="/dashboard" className="btn-primary">
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeModern;
