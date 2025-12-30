import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { initGA, logPageView } from './services/analytics';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import CookieConsent from './components/CookieConsent';
import ScrollToTop from './components/ScrollToTop';
import LoadingPage from './components/LoadingPage';

// Pages
import Home from './pages/HomeModern';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import Success from './pages/Success';
import MyFiles from './pages/MyFiles';
import Settings from './pages/Settings';

// Tool Pages
import PdfToWord from './pages/tools/PdfToWord';
import PdfToExcel from './pages/tools/PdfToExcel';
import PdfToJpg from './pages/tools/PdfToJpg';
import WordToPdf from './pages/tools/WordToPdf';
import ExcelToPdf from './pages/tools/ExcelToPdf';
import JpgToPdf from './pages/tools/JpgToPdf';
import CompressPdf from './pages/tools/CompressPdf';
import MergePdf from './pages/tools/MergePdf';
import SplitPdf from './pages/tools/SplitPdf';
import EditPdf from './pages/tools/EditPdf';
import ProtectPdf from './pages/tools/ProtectPdf';
import WatermarkPdf from './pages/tools/WatermarkPdf';
import UnlockPdf from './pages/tools/UnlockPdf';

// Legal Pages
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CookiePolicy from './pages/CookiePolicy';

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    logPageView(location.pathname + location.search);
  }, [location]);

  return null;
};

function App() {
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Initialize GA4
    initGA();

    // Show loading page for 2.3 seconds (1.5s display + 0.8s exit animation)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <AnalyticsTracker />
            {loading && <LoadingPage />}
            <ScrollToTop />
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/success" element={<Success />} />

                  {/* Tool Routes (Public) */}
                  <Route path="/pdf-to-word" element={<PdfToWord />} />
                  <Route path="/pdf-to-excel" element={<PdfToExcel />} />
                  <Route path="/pdf-to-jpg" element={<PdfToJpg />} />
                  <Route path="/word-to-pdf" element={<WordToPdf />} />
                  <Route path="/excel-to-pdf" element={<ExcelToPdf />} />
                  <Route path="/jpg-to-pdf" element={<JpgToPdf />} />
                  <Route path="/compress-pdf" element={<CompressPdf />} />
                  <Route path="/merge-pdf" element={<MergePdf />} />
                  <Route path="/split-pdf" element={<SplitPdf />} />
                  <Route path="/edit-pdf" element={<EditPdf />} />
                  <Route path="/protect-pdf" element={<ProtectPdf />} />
                  <Route path="/watermark-pdf" element={<WatermarkPdf />} />
                  <Route path="/unlock-pdf" element={<UnlockPdf />} />

                  {/* Protected Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/my-files"
                    element={
                      <ProtectedRoute>
                        <MyFiles />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />

                  {/* Legal Pages */}
                  <Route path="/about-us" element={<AboutUs />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/cookie-policy" element={<CookiePolicy />} />
                </Routes>
              </main>
              <Footer />

              {/* Cookie Consent Banner */}
              <CookieConsent />
            </div>
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
