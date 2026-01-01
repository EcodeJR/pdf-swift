import React from 'react';
import { Link } from 'react-router-dom';
import { FiTwitter, FiFacebook, FiLinkedin } from 'react-icons/fi';
import { GridPattern } from '../components/GridPattern';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary-700 text-white relative">
      <GridPattern
        className="absolute inset-0 stroke-primary-200/40 [mask-image:radial-gradient(white,transparent_85%)] opacity-20"
        width={60}
        height={60}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: About */}
          <div>
            <h3 className="text-xl font-bold mb-4">PDF SWIFT</h3>
            <p className="text-gray-400 text-sm">
              Free online PDF converter and editor. Fast, secure, and easy to use.
            </p>
          </div>

          {/* Column 2: Tools */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Tools</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/pdf-to-word" className="text-gray-400 hover:text-white">
                  PDF to Word
                </Link>
              </li>
              <li>
                <Link to="/pdf-to-excel" className="text-gray-400 hover:text-white">
                  PDF to Excel
                </Link>
              </li>
              <li>
                <Link to="/compress-pdf" className="text-gray-400 hover:text-white">
                  Compress PDF
                </Link>
              </li>
              <li>
                <Link to="/merge-pdf" className="text-gray-400 hover:text-white">
                  Merge PDF
                </Link>
              </li>
              <li>
                <Link to="/split-pdf" className="text-gray-400 hover:text-white">
                  Split PDF
                </Link>
              </li>
              <li>
                <Link to="/watermark-pdf" className="text-gray-400 hover:text-white">
                  Watermark PDF
                </Link>
              </li>
              <li>
                <Link to="/protect-pdf" className="text-gray-400 hover:text-white">
                  Protect PDF
                </Link>
              </li>
              <li>
                <Link to="/unlock-pdf" className="text-gray-400 hover:text-white">
                  Unlock PDF
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/pricing" className="text-gray-400 hover:text-white">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/about-us" className="text-gray-400 hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy-policy" className="text-gray-400 hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-gray-400 hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="text-gray-400 hover:text-white">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {currentYear} PDF SWIFT. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white">
              <FiTwitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <FiFacebook className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <FiLinkedin className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
