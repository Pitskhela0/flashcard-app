import React, { useState, useEffect } from "react";
import { Flashcard, AnswerDifficulty, UpdateRequest } from "../types";
import { fetchPracticeCards, submitAnswer, advanceDay } from "../services/api";
import FlashcardDisplay from "./FlashcardDisplay";

export default function PracticeView() {
  const [practiceCards, setPracticeCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [showBack, setShowBack] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [day, setDay] = useState<number>(0);
  const [sessionFinished, setSessionFinished] = useState<boolean>(false);

  const loadPracticeCards = async () => {
    setIsLoading(true);
    setError(null);
    setSessionFinished(false);
    try {
      const response = await fetchPracticeCards();
      setPracticeCards(response.cards);
      setDay(response.day);
      if (response.cards.length === 0) setSessionFinished(true);
    } catch {
      setError("Failed to load practice cards.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPracticeCards();
  }, []);

  const handleShowBack = () => setShowBack(true);

  const handleAnswer = async (difficulty: AnswerDifficulty) => {
    const card = practiceCards[currentCardIndex];
    try {
      const ans: UpdateRequest = {
        cardFront: card.front,
        cardBack: card.back,
        difficulty,
      };
      await submitAnswer(ans);
      if (currentCardIndex + 1 < practiceCards.length) {
        setCurrentCardIndex(currentCardIndex + 1);
        setShowBack(false);
      } else {
        setSessionFinished(true);
      }
    } catch {
      setError("Failed to submit answer.");
    }
  };

  const handleNextDay = async () => {
    try {
      await advanceDay();
      setCurrentCardIndex(0);
      setShowBack(false);
      loadPracticeCards();
    } catch {
      setError("Failed to advance day.");
    }
  };

  if (isLoading) return <div className="text-center text-gray-600">Loading...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;

  if (sessionFinished) {
    return (
      <div className="p-6 text-center bg-white dark:bg-gray-800 shadow-lg rounded-xl max-w-md mx-auto">
        <h2 className="text-2xl font-semibold text-green-700 mb-4">
          Session Complete!
        </h2>
        <button
          onClick={handleNextDay}
          className="px-5 py-2.5 bg-green-600 hover:bg-green-700 transition text-white rounded-lg shadow"
        >
          Go to Next Day
        </button>
      </div>
    );
  }

  const currentCard = practiceCards[currentCardIndex];

  return (
    <div className="w-full bg-gray-50 dark:bg-gray-900 flex items-start justify-center px-4 py-8">
      <div className="p-6 w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-md space-y-6">
        <div className="text-sm font-medium text-gray-600 dark:text-gray-300 text-center">
          Day <span className="font-bold text-blue-700">{day}</span> — Card{' '}
          <span className="font-bold text-blue-700">{currentCardIndex + 1}</span> of{' '}
          <span className="font-bold text-blue-700">{practiceCards.length}</span>
        </div>

        {/* Flashcard with flexible height */}
        <div className="overflow-auto">
          <FlashcardDisplay card={currentCard} showBack={showBack} />
        </div>

        <div className="flex flex-col gap-3">
          {!showBack ? (
            <button
              onClick={handleShowBack}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition"
            >
              Show Answer
            </button>
          ) : (
            <>
              <button
                onClick={() => handleAnswer(AnswerDifficulty.Easy)}
                className="w-full py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow transition"
              >
                Easy
              </button>
              <button
                onClick={() => handleAnswer(AnswerDifficulty.Hard)}
                className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg shadow transition"
              >
                Hard
              </button>
              <button
                onClick={() => handleAnswer(AnswerDifficulty.Wrong)}
                className="w-full py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow transition"
              >
                Wrong
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
