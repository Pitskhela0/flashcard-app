import React, { useState } from 'react';
import { Flashcard } from '../types';
import { fetchHint } from '../services/api';

interface Props {
  card: Flashcard;
  showBack: boolean;
}

export default function FlashcardDisplay({ card, showBack }: Props) {
  const [hint, setHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState<boolean>(false);
  const [hintError, setHintError] = useState<string | null>(null);

  const handleGetHint = async () => {
    setLoadingHint(true);
    setHintError(null);
    try {
      const fetchedHint = await fetchHint(card);
      setHint(fetchedHint);
    } catch {
      setHintError('Failed to fetch hint.');
    } finally {
      setLoadingHint(false);
    }
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm text-center space-y-4">
      <div className="text-lg font-semibold text-gray-800">{card.front}</div>

      <div className="text-md">
        {showBack ? (
          <span className="text-green-800 font-medium">{card.back}</span>
        ) : (
          <span className="italic text-gray-400">???</span>
        )}
      </div>

      {!showBack && (
        <button
          onClick={handleGetHint}
          disabled={loadingHint}
          className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition disabled:opacity-50"
        >
          {loadingHint ? 'Loading Hint...' : 'Get Hint'}
        </button>
      )}

      {hint && <div className="text-sm text-blue-700">💡 Hint: {hint}</div>}
      {hintError && <div className="text-sm text-red-500">{hintError}</div>}
    </div>
  );
}
