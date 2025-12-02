import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { userAPI, conversionAPI } from '../services/api';
import { FiDownload, FiTrash2, FiFileText, FiFolder, FiArrowRight, FiFilter } from 'react-icons/fi';
import { GridPattern } from '../components/GridPattern';

const MyFiles = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const data = await userAPI.getFiles();
      setFiles(data.files || []);
    } catch (error) {
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await userAPI.deleteFile(fileId);
      toast.success('File deleted successfully');
      setFiles(files.filter(f => f._id !== fileId));
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-secondary-50">
      <GridPattern
        className="absolute inset-0 stroke-primary-200/40 [mask-image:radial-gradient(white,transparent_85%)]"
        width={60}
        height={60}
      />
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-hero font-bold">My Files</h1>
              <p className="text-body-sm text-gray-600 mt-1">
                {files.length} {files.length === 1 ? 'file' : 'files'} stored
              </p>
            </div>
            <Link
              to="/"
              className="btn-primary flex items-center group"
            >
              <FiArrowRight className="mr-2 group-hover:translate-x-1 transition-transform" />
              Convert New File
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="section">
        {files.length === 0 ? (
          // Empty State
          <div className="card text-center py-16">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiFolder className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-heading-sm font-bold mb-2">No files yet</h3>
            <p className="text-body-sm text-gray-600 mb-8">
              Start converting files to see them here
            </p>
            <Link to="/" className="btn-primary inline-flex items-center group">
              Convert Your First File
              <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        ) : (
          // Files Grid
          <div>
            <div className="mb-6 flex items-center space-x-2">
              <FiFilter className="w-5 h-5 text-gray-400" />
              <p className="text-caption text-gray-600">Showing {files.length} files</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {files.map((file) => (
                <div
                  key={file._id}
                  className="card group cursor-pointer hover:shadow-lg transition-all"
                >
                  {/* File Icon / Preview */}
                  <div className="w-full h-32 bg-primary/5 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                    <FiFileText className="w-12 h-12 text-primary" />
                  </div>

                  {/* File Info */}
                  <h3 className="font-semibold text-gray-900 truncate text-body-sm mb-1">
                    {file.outputFileName}
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">
                    {file.conversionType?.toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    {formatFileSize(file.fileSize)} • {formatDate(file.createdAt)}
                  </p>

                  {/* Actions (show on hover) */}
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                    <a
                      href={conversionAPI.downloadFile(file.outputFileName)}
                      className="flex-1 btn-secondary py-2 px-3 text-xs flex items-center justify-center"
                    >
                      <FiDownload className="w-4 h-4 mr-1" /> Download
                    </a>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(file._id);
                      }}
                      className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyFiles;
