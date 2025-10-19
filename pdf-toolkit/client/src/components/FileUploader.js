import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud, FiX, FiFile } from 'react-icons/fi';

const FileUploader = ({ 
  onFilesSelect, 
  acceptedFiles, 
  maxFiles = 1, 
  maxSize = 10 * 1024 * 1024,
  selectedFiles,
  onRemoveFile 
}) => {
  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) {
      const error = rejected[0].errors[0];
      if (error.code === 'file-too-large') {
        alert(`File is too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
      } else if (error.code === 'file-invalid-type') {
        alert('Invalid file type. Please upload the correct file format.');
      }
      return;
    }
    
    if (accepted.length > 0) {
      onFilesSelect(accepted);
    }
  }, [onFilesSelect, maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFiles,
    maxFiles,
    maxSize,
    multiple: maxFiles > 1
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
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <FiUploadCloud className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          {isDragActive ? 'Drop your files here' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-gray-500 mb-4">or click to browse</p>
        <p className="text-xs text-gray-400">
          Max file size: {maxSize / 1024 / 1024}MB
          {maxFiles > 1 && ` • Max ${maxFiles} files`}
        </p>
      </div>

      {selectedFiles && selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="font-medium text-gray-700">Selected Files:</h4>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <FiFile className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              {onRemoveFile && (
                <button
                  onClick={() => onRemoveFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <FiX className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
