import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiUser, FiLogOut, FiSettings, FiFolder, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isToolsOpen, SetIsToolsOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const toolsRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target)) {
        SetIsToolsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tools = [
    { name: 'PDF to Word', path: '/pdf-to-word' },
    { name: 'PDF to Excel', path: '/pdf-to-excel' },
    { name: 'PDF to JPG', path: '/pdf-to-jpg' },
    { name: 'Word to PDF', path: '/word-to-pdf' },
    { name: 'Excel to PDF', path: '/excel-to-pdf' },
    { name: 'JPG to PDF', path: '/jpg-to-pdf' },
    { name: 'Compress PDF', path: '/compress-pdf' },
    { name: 'Merge PDF', path: '/merge-pdf' },
    { name: 'Split PDF', path: '/split-pdf' },
    { name: 'Edit PDF', path: '/edit-pdf' },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-primary-600">PDF Toolkit</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="relative" ref={toolsRef}>
              <button 
                className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 font-medium" 
                onClick={() => SetIsToolsOpen(!isToolsOpen)}
              >
                <span>Tools</span>
                <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${isToolsOpen ? 'rotate-180' : ''}`} />
              </button>
              {isToolsOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-100 py-1">
                  {tools.map((tool) => (
                    <Link
                      key={tool.path}
                      to={tool.path}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50"
                      onClick={() => SetIsToolsOpen(false)}
                    >
                      {tool.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link to="/pricing" className="text-gray-700 hover:text-primary-600 font-medium">
              Pricing
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600"
                >
                  <FiUser className="w-5 h-5" />
                  <span className="font-medium">{user?.name || user?.email?.split('@')[0]}</span>
                  {user?.isPremium && (
                    <span className="px-2 py-1 text-xs font-semibold text-white bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full">
                      Premium
                    </span>
                  )}
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg">
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 flex items-center"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <FiUser className="mr-2" /> Dashboard
                    </Link>
                    <Link
                      to="/my-files"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 flex items-center"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <FiFolder className="mr-2" /> My Files
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 flex items-center"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <FiSettings className="mr-2" /> Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <FiLogOut className="mr-2" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-700 hover:text-primary-600"
          >
            {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 pt-2 pb-4 space-y-2">
            {tools.map((tool) => (
              <Link
                key={tool.path}
                to={tool.path}
                className="block px-4 py-2 text-gray-700 hover:bg-primary-50 rounded"
                onClick={() => setIsMenuOpen(false)}
              >
                {tool.name}
              </Link>
            ))}
            <Link
              to="/pricing"
              className="block px-4 py-2 text-gray-700 hover:bg-primary-50 rounded"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="block px-4 py-2 text-gray-700 hover:bg-primary-50 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/my-files"
                  className="block px-4 py-2 text-gray-700 hover:bg-primary-50 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Files
                </Link>
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-gray-700 hover:bg-primary-50 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-4 py-2 text-gray-700 hover:bg-primary-50 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-4 py-2 bg-primary-600 text-white rounded text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
