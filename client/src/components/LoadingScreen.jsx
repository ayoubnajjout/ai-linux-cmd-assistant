import React from 'react';

export default function LoadingScreen({ demoQuestion }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="8" rx="2" />
              <path d="M2 12h20" />
              <path d="M2 16h20" />
              <path d="M2 20h20" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Initializing Linux Assistant...</h2>
          <p className="text-gray-400">Your question: "{demoQuestion || 'Loading demo...'}"</p>
        </div>
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-400">Starting your Linux command session...</p>
      </div>
    </div>
  );
}