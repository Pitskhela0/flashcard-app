import React from 'react';
import PracticeView from './components/PracticeView';


export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-100 p-6">
      <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-md">
        <h1 className="text-4xl font-extrabold text-center text-blue-900 mb-8 drop-shadow">
          Flashcard Learner
        </h1>
        <PracticeView />
      </div>
    </div>
  );
}


