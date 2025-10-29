import React from 'react';

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center py-10">
    <div className="w-12 h-12 border-4 border-t-yellow-500 border-r-yellow-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
    <div className="absolute w-12 h-12 border-4 border-t-transparent border-r-transparent border-b-gray-800 border-l-gray-800 rounded-full animate-spin [animation-direction:reverse]"></div>
  </div>
);

export default LoadingSpinner;