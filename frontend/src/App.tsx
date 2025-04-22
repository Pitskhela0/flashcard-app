import React, { useState, useEffect } from 'react';
import PracticeView from './components/PracticeView';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="absolute top-5 right-5">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded shadow"
        >
          {darkMode ? '☀ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-md">
        <h1 className="text-4xl font-extrabold text-center text-blue-900 dark:text-blue-300 mb-8 drop-shadow">
          Flashcard Learner
        </h1>
        <PracticeView />
      </div>
    </div>
  );
}

