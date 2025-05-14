import React, { useState, useEffect } from 'react';
import PracticeView from './components/PracticeView';
import Answer from './pages/Answer'; // Import the Answer component

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState('main'); // Add state for simple routing
  
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Check if the URL contains '/answer' and set the page accordingly
    if (window.location.pathname.includes('answer')) {
      setCurrentPage('answer');
    }
  }, [darkMode]);
  
  // Simple routing logic
  const renderPage = () => {
    switch(currentPage) {
      case 'answer':
        return <Answer />;
      default:
        return <PracticeView />;
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <div className="absolute top-5 right-5">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded"
        >
          {darkMode ? '☀ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>
      
      {/* Navigation */}
      <div className="absolute top-5 left-5">
        <button
          onClick={() => setCurrentPage('main')}
          className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded mr-2"
        >
          Main
        </button>
        <button
          onClick={() => setCurrentPage('answer')}
          className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded"
        >
          Answer Page
        </button>
      </div>
      
      {/* Main content */}
      {renderPage()}
    </div>
  );
}
