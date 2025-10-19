import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PdfToWord from './pages/PdfToWord';

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Tool Routes */}
              <Route path="/pdf-to-word" element={<PdfToWord />} />
              <Route path="/pdf-to-excel" element={<PdfToWord />} />
              <Route path="/pdf-to-jpg" element={<PdfToWord />} />
              <Route path="/word-to-pdf" element={<PdfToWord />} />
              <Route path="/excel-to-pdf" element={<PdfToWord />} />
              <Route path="/jpg-to-pdf" element={<PdfToWord />} />
              <Route path="/compress-pdf" element={<PdfToWord />} />
              <Route path="/merge-pdf" element={<PdfToWord />} />
              <Route path="/split-pdf" element={<PdfToWord />} />
              <Route path="/edit-pdf" element={<PdfToWord />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
                      <p className="text-gray-600">Dashboard coming soon!</p>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              
              {/* 404 Route */}
              <Route path="*" element={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-gray-600 mb-4">Page not found</p>
                    <a href="/" className="btn-primary">Go Home</a>
                  </div>
                </div>
              } />
            </Routes>
          </main>
          
          {/* Toast Container */}
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
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
