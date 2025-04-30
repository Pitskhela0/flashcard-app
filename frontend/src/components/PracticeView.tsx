/**
 * PracticeView Component
 * 
 * Specifications:
 * - Main container for the flashcard practice experience
 * - Manages the complete flashcard practice flow including:
 *   - Loading cards from the API
 *   - Displaying current card and tracking position in deck
 *   - Handling user interactions (show answer, submit ratings)
 *   - Processing hand gestures through the gesture control system
 *   - Managing camera permissions and setup
 *   - Providing visual feedback for gesture detection
 *   - Handling session completion and day advancement
 * - Implements responsive design that works across device sizes
 * - Provides loading, error, and success states for all operations
 * - Displays session progress information (day, card count)
 * - Supports both gesture-based and button-based rating inputs
 * - Shows real-time feedback of detected gestures
 * - Maintains consistent UI in both light and dark modes
 */
import React, { useState, useEffect, useCallback } from "react";
import { Flashcard, AnswerDifficulty, UpdateRequest } from "../types";
import { fetchPracticeCards, submitAnswer, advanceDay } from "../services/api";
import FlashcardDisplay from "./FlashcardDisplay";
import {
  GestureOutcome,
  GestureId,
  useGestureControl,
} from "../hooks/useGestureControl";
import WebcamGestureDetector from "./WebcamgestureDetector";
import CameraPermissionRequest from "./CameraPermissionRequest";

/**
 * Thumbs Up Icon Component
 * 
 * Specifications:
 * - Renders an emoji representation of a thumbs up gesture
 * - Accepts optional className for styling customization
 * - Used in the gesture feedback UI to indicate "Easy" rating
 */
const ThumbsUpIcon = ({ className = "" }: { className?: string }) => (
  <span className={`icon ${className}`}>👍</span>
);

/**
 * Thumbs Down Icon Component
 * 
 * Specifications:
 * - Renders an emoji representation of a thumbs down gesture
 * - Accepts optional className for styling customization
 * - Used in the gesture feedback UI to indicate "Wrong" rating
 */
const ThumbsDownIcon = ({ className = "" }: { className?: string }) => (
  <span className={`icon ${className}`}>👎</span>
);

/**
 * Thumbs Side Icon Component
 * 
 * Specifications:
 * - Renders an emoji representation of a thinking face for sideways thumbs
 * - Accepts optional className for styling customization 
 * - Used in the gesture feedback UI to indicate "Hard" rating
 */
const ThumbsSideIcon = ({ className = "" }: { className?: string }) => (
  <span className={`icon ${className}`}>🤔</span>
);

/**
 * Main Practice View Component
 * 
 * Specifications:
 * - Serves as the primary container for flashcard practice functionality
 * - Manages state for practice cards, current card, answer visibility, and session progress
 * - Implements camera permission flow and gesture detection integration
 * - Provides comprehensive UI for card viewing, rating, and gesture feedback
 */
export default function PracticeView() {
  const [practiceCards, setPracticeCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [showBack, setShowBack] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [day, setDay] = useState<number>(0);
  const [sessionFinished, setSessionFinished] = useState<boolean>(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState<boolean>(false);

  /**
   * Handle Gesture Answer
   * 
   * Specifications:
   * - Processes confirmed gestures from the gesture control system
   * - Maps gesture outcomes to appropriate difficulty ratings
   * - Triggers the answer submission process when valid gestures are detected
   * - Handles timeout and null gesture scenarios gracefully
   * - Includes logging for gesture confirmation debugging
   */
  const handleGestureAnswer = useCallback(
    (outcome: GestureOutcome) => {
      console.log(`Gesture Confirmed in Component: ${outcome}`);

      let difficulty: AnswerDifficulty | null = null;
      switch (outcome) {
        case "easy":
          difficulty = AnswerDifficulty.Easy;
          break;
        case "hard":
          difficulty = AnswerDifficulty.Hard;
          break;
        case "wrong":
          difficulty = AnswerDifficulty.Wrong;
          break;
        default:
          // Decide what to do on timeout (outcome is null)
          // Option 1: Do nothing
          // Option 2: Treat as 'Wrong'
          // difficulty = AnswerDifficulty.Wrong;
          console.log("Gesture timed out or was null.");
          break;
      }

      // If a valid difficulty was determined by the gesture, call handleAnswer
      if (difficulty !== null && practiceCards[currentCardIndex]) {
        handleAnswer(difficulty); // Reuse existing answer submission logic
      }
      // If outcome was null (timeout), we currently do nothing, user must click a button
      // or you could trigger handleAnswer(AnswerDifficulty.Wrong) above.
    },
    [currentCardIndex, practiceCards]
  );

  /**
   * Gesture Control Hook Integration
   * 
   * Specifications:
   * - Initializes the gesture control system with appropriate configuration
   * - Only activates gesture processing when card back is shown
   * - Provides callback for handling confirmed gestures
   * - Exposes state for UI feedback (confirmed outcome, timeout status, current gesture)
   */
  const { confirmedOutcome, processDetectedGesture, timeoutNotificationShown, feedbackGesture } =
  useGestureControl({
    isActive: showBack, 
    onGestureConfirmed: handleGestureAnswer,
  });

  /**
   * Load Practice Cards
   * 
   * Specifications:
   * - Fetches the current practice session data from the API
   * - Manages loading and error states during the fetch operation
   * - Updates state with fetched cards and current day information
   * - Handles empty card sets by showing session completion UI
   * - Resets session state when reloading cards
   */
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

  /**
   * Initial Load Effect
   * 
   * Specifications:
   * - Triggers the loading of practice cards when the component mounts
   * - Runs only once during component initialization
   */
  useEffect(() => {
    loadPracticeCards();
  }, []);

  /**
   * Handle Show Back
   * 
   * Specifications:
   * - Reveals the back (answer) side of the current flashcard
   * - Simple toggle function that updates the showBack state
   */
  const handleShowBack = () => setShowBack(true);

  /**
   * Handle Request Camera Permission
   * 
   * Specifications:
   * - Requests access to the user's camera via browser media API
   * - Updates permission state based on user's response
   * - Properly cleans up media streams after permission check
   * - Handles permission denial with appropriate error logging
   */
  const handleRequestCameraPermission = () => {
    // This will trigger the browser's permission dialog
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        // If successful, we got permission
        setCameraPermissionGranted(true);
        
        // Clean up the stream we just created for the permission check
        stream.getTracks().forEach(track => track.stop());
      })
      .catch(error => {
        console.error("Camera permission denied:", error);
        // We could show an error message here
      });
  };

  /**
   * Handle Answer
   * 
   * Specifications:
   * - Processes user ratings for the current flashcard
   * - Submits the rating to the API with appropriate card information
   * - Advances to the next card when submission is successful
   * - Sets session completion when all cards have been rated
   * - Handles errors during the submission process
   * - Uses callback pattern for proper dependency management
   */
  const handleAnswer = useCallback(
    async (difficulty: AnswerDifficulty) => {
      if (!practiceCards[currentCardIndex]) {
        console.error("Attempted to answer with no current card.");
        return;
      }
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
          setShowBack(false); // Reset showBack for the next card
        } else {
          setSessionFinished(true);
        }
      } catch {
        setError("Failed to submit answer.");
      }
    },
    [currentCardIndex, practiceCards]
  );

  /**
   * Handle Next Day
   * 
   * Specifications:
   * - Advances the practice session to the next day via API
   * - Resets the current session state (card index, card visibility)
   * - Triggers loading of new practice cards for the next day
   * - Handles errors during the day advancement process
   */
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

  /**
   * Loading State Render
   */
  if (isLoading)
    return <div className="text-center text-gray-600">Loading...</div>;
  
  /**
   * Error State Render
   */
  if (error) return <div className="text-center text-red-500">{error}</div>;

  /**
   * Session Finished State Render
   */
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

  /**
   * Main Practice Interface Render
   */
  return (
    <div className="w-full bg-gray-50 dark:bg-gray-900 flex items-start justify-center px-4 py-8">
      <div className="p-6 w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-md space-y-6">
        <div className="text-sm font-medium text-gray-600 dark:text-gray-300 text-center">
          Day <span className="font-bold text-blue-700">{day}</span> — Card{" "}
          <span className="font-bold text-blue-700">
            {currentCardIndex + 1}
          </span>{" "}
          of{" "}
          <span className="font-bold text-blue-700">
            {practiceCards.length}
          </span>
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
            // --- WHEN ANSWER IS SHOWN ---
            <>
              {/* Show camera permission request if not granted yet */}
              {!cameraPermissionGranted && (
                <CameraPermissionRequest onRequestPermission={handleRequestCameraPermission} />
              )}
              
              {/* Only show WebcamGestureDetector if permission was granted */}
              {cameraPermissionGranted && (
                <WebcamGestureDetector 
                  isActive={true} 
                  onGestureDetected={processDetectedGesture} 
                />
              )}

              {/* Gesture Feedback UI */}
              <div className="gesture-feedback my-4 p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-md text-center">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Gesture Rating
                </h3>

                {/* Timeout Notification - Render only if timeoutNotificationShown is true */}
                {timeoutNotificationShown && (
                  <p className="timeout-warning mb-2 rounded border border-red-400 bg-red-100 px-2 py-1 text-sm font-bold text-red-600 dark:border-red-600 dark:bg-red-900/30 dark:text-red-400">
                    Gesture time out! Please rate.
                  </p>
                )}

                {/* Icons with Conditional Glow based on feedbackGesture state */}
                <div className="gesture-icons text-3xl flex justify-center gap-4 mb-1">
                  {/* Add 'glow' class if feedbackGesture matches */}
                  <ThumbsUpIcon
                    className={feedbackGesture === "THUMBS_UP" ? "glow" : ""}
                  />
                  <ThumbsSideIcon
                    className={
                      feedbackGesture === "THUMBS_SIDEWAYS" ? "glow" : ""
                    }
                  />
                  <ThumbsDownIcon
                    className={feedbackGesture === "THUMBS_DOWN" ? "glow" : ""}
                  />
                </div>

                {/* Optional: Instruction text */}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Hold gesture for ~1s
                </p>
              </div>

              {/* Answer Buttons */}
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
            // --- END OF SECTION WHEN ANSWER IS SHOWN ---
          )}
        </div>
      </div>
    </div>
  );
}