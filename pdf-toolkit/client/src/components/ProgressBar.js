import React from 'react';

const ProgressBar = ({ progress, fileName, status = 'uploading' }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-600';
      case 'processing':
        return 'bg-yellow-600';
      case 'complete':
        return 'bg-green-600';
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-blue-600';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing...';
      case 'complete':
        return 'Complete!';
      case 'error':
        return 'Error';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      {/* File Name */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-700 truncate flex-1 mr-4">
          {fileName}
        </p>
        <span className="text-xs font-medium text-gray-500">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ease-out ${getStatusColor()}`}
          style={{ width: `${progress}%` }}
        >
          {/* Animated shimmer effect for active progress */}
          {progress < 100 && status !== 'error' && (
            <div className="h-full w-full animate-pulse bg-white opacity-20"></div>
          )}
        </div>
      </div>

      {/* Status Text */}
      <p className={`text-xs ${
        status === 'error' ? 'text-red-600' : 
        status === 'complete' ? 'text-green-600' : 
        'text-gray-500'
      }`}>
        {getStatusText()}
      </p>
    </div>
  );
};

export default ProgressBar;
