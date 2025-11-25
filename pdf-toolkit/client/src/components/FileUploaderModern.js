import React from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud, FiFile, FiX } from 'react-icons/fi';

const FileUploaderModern = ({ accept, onFileSelect, maxFiles = 1, maxSize, selectedFiles = [] }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxFiles,
    maxSize,
    onDrop: (acceptedFiles) => {
      onFileSelect(acceptedFiles);
    },
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`
          relative overflow-hidden rounded-xl border-2 border-dashed p-12 text-center cursor-pointer
          transition-all duration-300 ease-smooth
          ${isDragActive 
            ? 'border-primary bg-primary-100 border-solid scale-105' 
            : 'border-primary/40 bg-gradient-to-br from-primary-50 to-white hover:border-primary hover:bg-primary-100'
          }
        `}
      >
        <input {...getInputProps()} />
        
        {/* Upload Icon */}
        <div className={`
          mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6
          transition-all duration-300
          ${isDragActive ? 'scale-110 bg-primary/20' : ''}
        `}>
          <FiUploadCloud className={`w-10 h-10 text-primary transition-all duration-300 ${isDragActive ? 'scale-110' : ''}`} />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <p className="text-xl font-semibold text-gray-900">
            {isDragActive ? 'Drop your files here' : 'Drag & drop your files here'}
          </p>
          <p className="text-body-sm text-gray-600">
            or <span className="text-primary font-semibold">browse</span> to choose files
          </p>
          <p className="text-caption text-gray-500 mt-4">
            Max file size: {maxSize ? formatFileSize(maxSize) : '10 MB'} • 
            {maxFiles > 1 ? ` Up to ${maxFiles} files` : ' Single file'}
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent-purple/5 rounded-full -ml-12 -mb-12"></div>
      </div>

      {/* Selected Files */}
      {selectedFiles && selectedFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          <p className="text-sm font-semibold text-gray-700">Selected Files:</p>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-white border-2 border-gray-100 rounded-lg hover:border-primary/30 transition-all duration-300 group"
            >
              <div className="flex items-center space-x-4 flex-1">
                {/* File Icon */}
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FiFile className="w-6 h-6 text-primary" />
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>

              {/* Remove Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newFiles = selectedFiles.filter((_, i) => i !== index);
                  onFileSelect(newFiles);
                }}
                className="ml-4 w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors duration-200"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Supported Formats */}
      {accept && (
        <div className="mt-4 text-center">
          <p className="text-caption text-gray-500">
            Supported formats: {Object.keys(accept).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUploaderModern;
