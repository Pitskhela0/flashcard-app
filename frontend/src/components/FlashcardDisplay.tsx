/**
 * FlashcardDisplay Component
 * 
 * Specifications:
 * - Displays a single flashcard with front and back sides
 * - Implements a 3D flip animation when transitioning between sides
 * - Maintains a fixed height container to prevent layout shifts during transitions
 * - Provides a hint system that fetches additional help for difficult cards
 * - Handles loading states and errors for hint fetching
 * - Resets hint state when a new card is displayed
 * - Supports styling for both light and dark mode
 * - Front side shows the question/prompt with optional hint
 * - Back side shows the answer in a visually distinct style (green text)
 */
import React, { useEffect, useState } from "react";
import { Flashcard } from "../types";
import { fetchHint } from "../services/api";

interface Props {
  card: Flashcard;
  showBack: boolean;
}

export default function FlashcardDisplay({ card, showBack }: Props) {
  const [hint, setHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState<boolean>(false);
  const [hintError, setHintError] = useState<string | null>(null);
 
  useEffect(() => {
    setHint(null);
    setHintError(null);
    setLoadingHint(false);
  }, [card]);
  
  const handleGetHint = async () => {
    setLoadingHint(true);
    setHintError(null);
    try {
      const fetchedHint = await fetchHint(card);
      setHint(fetchedHint);
    } catch {
      setHintError("Failed to fetch hint.");
    } finally {
      setLoadingHint(false)
    }
  };

  return (
    <div className="w-full">
      {/* Container with fixed height to prevent overflow */}
      <div className="perspective w-full h-60">
        <div
          className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
            showBack ? "rotate-y-180" : ""
          }`}
        >
          {/* Front Face */}
          <div className="absolute inset-0 backface-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 flex flex-col justify-center items-center">
            <div className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              {card.front}
            </div>
            {!showBack && <div className="italic text-gray-400 mb-4">???</div>}

            {!showBack && (
              <>
                <button
                  onClick={handleGetHint}
                  disabled={loadingHint}
                  className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition disabled:opacity-50 mb-2"
                >
                  {loadingHint ? "Loading Hint..." : "Get Hint"}
                </button>
                {hint && (
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    💡 Hint: {hint}
                  </div>
                )}
                {hintError && (
                  <div className="text-sm text-red-500">{hintError}</div>
                )}
              </>
            )}
          </div>

          {/* Back Face */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 flex items-center justify-center">
            <div className="text-lg font-semibold text-green-800 dark:text-green-300">
              {card.back}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}