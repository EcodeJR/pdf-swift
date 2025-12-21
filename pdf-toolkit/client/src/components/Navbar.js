import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiUser, FiLogOut, FiSettings, FiFolder, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isToolsOpen, SetIsToolsOpen] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const toolsRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
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
    { name: 'Watermark PDF', path: '/watermark-pdf' },
    { name: 'Protect PDF', path: '/protect-pdf' },
    { name: 'Unlock PDF', path: '/unlock-pdf' },
  ];

  return (
    <nav className="bg-[var(--surface)] shadow-md sticky top-0 z-50 border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center" onClick={() => setIsMenuOpen(false)}>
            <span className="text-2xl font-bold text-primary-600">PDF Toolkit</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="relative" ref={toolsRef}>
              <button
                className="flex items-center space-x-1 text-[var(--text-primary)] hover:text-[var(--primary)] font-medium transition-colors"
                onClick={() => SetIsToolsOpen(!isToolsOpen)}
              >
                <span>Tools</span>
                <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${isToolsOpen ? 'rotate-180' : ''}`} />
              </button>
              {isToolsOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-[var(--surface)] rounded-md shadow-lg border border-[var(--border)] py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  {tools.map((tool) => (
                    <Link
                      key={tool.path}
                      to={tool.path}
                      className="block px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--primary-50)] transition-colors"
                      onClick={() => SetIsToolsOpen(false)}
                    >
                      {tool.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link to="/pricing" className="text-[var(--text-primary)] hover:text-[var(--primary)] font-medium transition-colors">
              Pricing
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors"
                >
                  <FiUser className="w-5 h-5" />
                  <span className="font-medium">{user?.name || user?.email?.split('@')[0]}</span>
                  {user?.isPremium && (
                    <span className="px-2 py-1 text-xs font-semibold text-white bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full shadow-sm">
                      Premium
                    </span>
                  )}
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[var(--surface)] rounded-md shadow-lg border border-[var(--border)] animate-in fade-in slide-in-from-top-2 duration-200">
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--primary-50)] flex items-center transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <FiUser className="mr-2" /> Dashboard
                    </Link>
                    <Link
                      to="/my-files"
                      className="block px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--primary-50)] flex items-center transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <FiFolder className="mr-2" /> My Files
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--primary-50)] flex items-center transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <FiSettings className="mr-2" /> Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
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
                  className="text-[var(--text-secondary)] hover:text-[var(--primary)] font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-[var(--primary)] text-[var(--background)] rounded-lg hover:brightness-110 font-medium transition-all shadow-md active:scale-95"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => {
              setIsMenuOpen(!isMenuOpen);
              setIsMobileToolsOpen(false);
            }}
            className="md:hidden text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors p-2"
          >
            {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[var(--surface)] border-t border-[var(--border)] animate-in slide-in-from-top duration-300 overflow-y-auto max-h-[calc(100vh-64px)]">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {/* Mobile Tools Dropdown */}
            <div className="py-1">
              <button
                onClick={() => setIsMobileToolsOpen(!isMobileToolsOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-[var(--text-primary)] hover:bg-[var(--primary-50)] rounded-lg font-medium transition-colors"
              >
                <span>Tools</span>
                <FiChevronDown className={`w-5 h-5 transition-transform duration-200 ${isMobileToolsOpen ? 'rotate-180' : ''}`} />
              </button>
              {isMobileToolsOpen && (
                <div className="mt-1 ml-4 space-y-1 border-l-2 border-[var(--primary-100)] pl-2 animate-in slide-in-from-left duration-200">
                  {tools.map((tool) => (
                    <Link
                      key={tool.path}
                      to={tool.path}
                      className="block px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary-50)] rounded-lg transition-colors"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsMobileToolsOpen(false);
                      }}
                    >
                      {tool.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/pricing"
              className="block px-4 py-3 text-[var(--text-primary)] hover:bg-[var(--primary-50)] rounded-lg font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>

            {isAuthenticated ? (
              <div className="pt-4 border-t border-[var(--border)] space-y-1">
                <div className="px-4 py-2 mb-2">
                  <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Account</p>
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate mt-1">{user?.email}</p>
                </div>
                <Link
                  to="/dashboard"
                  className="flex items-center px-4 py-3 text-[var(--text-primary)] hover:bg-[var(--primary-50)] rounded-lg font-medium transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiUser className="mr-3" /> Dashboard
                </Link>
                <Link
                  to="/my-files"
                  className="flex items-center px-4 py-3 text-[var(--text-primary)] hover:bg-[var(--primary-50)] rounded-lg font-medium transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiFolder className="mr-3" /> My Files
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center px-4 py-3 text-[var(--text-primary)] hover:bg-[var(--primary-50)] rounded-lg font-medium transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiSettings className="mr-3" /> Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                >
                  <FiLogOut className="mr-3" /> Logout
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-[var(--border)] grid grid-cols-2 gap-4 px-2">
                <Link
                  to="/login"
                  className="px-4 py-3 text-center border border-[var(--border)] text-[var(--text-primary)] rounded-lg font-medium hover:bg-[var(--primary-50)] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-3 text-center bg-[var(--primary)] text-[var(--background)] rounded-lg font-medium shadow-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
