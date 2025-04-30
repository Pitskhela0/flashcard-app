// import React, { useState, useEffect, useCallback } from "react";
// import { Flashcard, AnswerDifficulty, UpdateRequest } from "../types";
// import { fetchPracticeCards, submitAnswer, advanceDay } from "../services/api";
// import FlashcardDisplay from "./FlashcardDisplay";
// import {
//   GestureOutcome,
//   GestureId,
//   useGestureControl,
// } from "../hooks/useGestureControl";

// const ThumbsUpIcon = ({ className = "" }: { className?: string }) => (
//   <span className={`icon ${className}`}>👍</span>
// );
// const ThumbsDownIcon = ({ className = "" }: { className?: string }) => (
//   <span className={`icon ${className}`}>👎</span>
// );
// const ThumbsSideIcon = ({ className = "" }: { className?: string }) => (
//   <span className={`icon ${className}`}>🤔</span>
// );

// export default function PracticeView() {
//   const [practiceCards, setPracticeCards] = useState<Flashcard[]>([]);
//   const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
//   const [showBack, setShowBack] = useState<boolean>(false);
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   const [day, setDay] = useState<number>(0);
//   const [sessionFinished, setSessionFinished] = useState<boolean>(false);

//   const handleGestureAnswer = useCallback(
//     (outcome: GestureOutcome) => {
//       console.log(`Gesture Confirmed in Component: ${outcome}`);

//       let difficulty: AnswerDifficulty | null = null;
//       switch (outcome) {
//         case "easy":
//           difficulty = AnswerDifficulty.Easy;
//           break;
//         case "hard":
//           difficulty = AnswerDifficulty.Hard;
//           break;
//         case "wrong":
//           difficulty = AnswerDifficulty.Wrong;
//           break;
//         default:
//           // Decide what to do on timeout (outcome is null)
//           // Option 1: Do nothing
//           // Option 2: Treat as 'Wrong'
//           // difficulty = AnswerDifficulty.Wrong;
//           console.log("Gesture timed out or was null.");
//           break;
//       }

//       // If a valid difficulty was determined by the gesture, call handleAnswer
//       if (difficulty !== null && practiceCards[currentCardIndex]) {
//         handleAnswer(difficulty); // Reuse existing answer submission logic
//       }
//       // If outcome was null (timeout), we currently do nothing, user must click a button
//       // or you could trigger handleAnswer(AnswerDifficulty.Wrong) above.
//     },
//     [currentCardIndex, practiceCards]
//   );

//   const { processDetectedGesture, timeoutNotificationShown, feedbackGesture } =
//     useGestureControl({
//       isActive: showBack, 
//       onGestureConfirmed: handleGestureAnswer,
//     });

//   const loadPracticeCards = async () => {
//     setIsLoading(true);
//     setError(null);
//     setSessionFinished(false);
//     try {
//       const response = await fetchPracticeCards();
//       setPracticeCards(response.cards);
//       setDay(response.day);
//       if (response.cards.length === 0) setSessionFinished(true);
//     } catch {
//       setError("Failed to load practice cards.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadPracticeCards();
//   }, []);

//   const handleShowBack = () => setShowBack(true);

//   const handleAnswer = useCallback(
//     async (difficulty: AnswerDifficulty) => {
//       if (!practiceCards[currentCardIndex]) {
//         console.error("Attempted to answer with no current card.");
//         return;
//       }
//       const card = practiceCards[currentCardIndex];
//       try {
//         const ans: UpdateRequest = {
//           cardFront: card.front,
//           cardBack: card.back,
//           difficulty,
//         };
//         await submitAnswer(ans);
//         if (currentCardIndex + 1 < practiceCards.length) {
//           setCurrentCardIndex(currentCardIndex + 1);
//           setShowBack(false); // Reset showBack for the next card
//         } else {
//           setSessionFinished(true);
//         }
//       } catch {
//         setError("Failed to submit answer.");
//       }
//     },
//     [currentCardIndex, practiceCards]
//   );

//   useEffect(() => {
//     // --- Add sessionFinished check ---
//     // Don't simulate if the hook isn't active (answer not shown)
//     // OR if the session is already finished.
//     if (!showBack || sessionFinished) {
//         // If timers were running from a previous render, the cleanup
//         // function (returned below) will handle clearing them when
//         // this effect re-runs due to showBack/sessionFinished/currentCardIndex changing.
//         return;
//     }

//     console.log(`Starting gesture simulation for card index ${currentCardIndex} because answer is shown...`);

//     // Example sequence:
//     const t1 = setTimeout(() => processDetectedGesture("THUMBS_UP"), 1500);
//     const t2 = setTimeout(() => processDetectedGesture("THUMBS_SIDEWAYS"), 3000);
//     const t3 = setTimeout(() => processDetectedGesture("THUMBS_DOWN"), 4000);
//     // Let DOWN confirm after 750ms (total 4750ms)
//     const t4 = setTimeout(() => processDetectedGesture(null), 6000);

//     // Cleanup function to clear timers
//     return () => {
//       console.log(`Cleaning up gesture simulation timers for card index ${currentCardIndex}...`);
//       clearTimeout(t1);
//       clearTimeout(t2);
//       clearTimeout(t3);
//       clearTimeout(t4);
//     };
//   // --- Add dependencies: currentCardIndex and sessionFinished ---
//   // processDetectedGesture is memoized and stable unless its own dependencies change.
//   }, [showBack, processDetectedGesture, currentCardIndex, sessionFinished]); // <-- ADD DEPENDENCIES HERE

//   const handleNextDay = async () => {
//     try {
//       await advanceDay();
//       setCurrentCardIndex(0);
//       setShowBack(false);
//       loadPracticeCards();
//     } catch {
//       setError("Failed to advance day.");
//     }
//   };

//   if (isLoading)
//     return <div className="text-center text-gray-600">Loading...</div>;
//   if (error) return <div className="text-center text-red-500">{error}</div>;

//   if (sessionFinished) {
//     return (
//       <div className="p-6 text-center bg-white dark:bg-gray-800 shadow-lg rounded-xl max-w-md mx-auto">
//         <h2 className="text-2xl font-semibold text-green-700 mb-4">
//           Session Complete!
//         </h2>
//         <button
//           onClick={handleNextDay}
//           className="px-5 py-2.5 bg-green-600 hover:bg-green-700 transition text-white rounded-lg shadow"
//         >
//           Go to Next Day
//         </button>
//       </div>
//     );
//   }

//   const currentCard = practiceCards[currentCardIndex];

//   return (
//     <div className="w-full bg-gray-50 dark:bg-gray-900 flex items-start justify-center px-4 py-8">
//       <div className="p-6 w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-md space-y-6">
//         <div className="text-sm font-medium text-gray-600 dark:text-gray-300 text-center">
//           Day <span className="font-bold text-blue-700">{day}</span> — Card{" "}
//           <span className="font-bold text-blue-700">
//             {currentCardIndex + 1}
//           </span>{" "}
//           of{" "}
//           <span className="font-bold text-blue-700">
//             {practiceCards.length}
//           </span>
//         </div>

//         {/* Flashcard with flexible height */}
//         <div className="overflow-auto">
//           <FlashcardDisplay card={currentCard} showBack={showBack} />
//         </div>

//         <div className="flex flex-col gap-3">
//           {!showBack ? (
//             <button
//               onClick={handleShowBack}
//               className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition"
//             >
//               Show Answer
//             </button>
//           ) : (
//             // --- WHEN ANSWER IS SHOWN ---
//             <>
//               {/* ================================================= */}
//               {/* START: ADD GESTURE FEEDBACK UI HERE */}
//               {/* ================================================= */}
//               <div className="gesture-feedback my-4 p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-md text-center">
//                 <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
//                   Gesture Rating
//                 </h3>

//                 {/* Timeout Notification - Render only if timeoutNotificationShown is true */}
//                 {timeoutNotificationShown && (
//                   <p className="timeout-warning mb-2 rounded border border-red-400 bg-red-100 px-2 py-1 text-sm font-bold text-red-600 dark:border-red-600 dark:bg-red-900/30 dark:text-red-400">
//                     Gesture time out! Please rate.
//                   </p>
//                 )}

//                 {/* Icons with Conditional Glow based on feedbackGesture state */}
//                 <div className="gesture-icons text-3xl flex justify-center gap-4 mb-1">
//                   {/* Add 'glow' class if feedbackGesture matches */}
//                   <ThumbsUpIcon
//                     className={feedbackGesture === "THUMBS_UP" ? "glow" : ""}
//                   />
//                   <ThumbsSideIcon
//                     className={
//                       feedbackGesture === "THUMBS_SIDEWAYS" ? "glow" : ""
//                     }
//                   />
//                   <ThumbsDownIcon
//                     className={feedbackGesture === "THUMBS_DOWN" ? "glow" : ""}
//                   />
//                 </div>

//                 {/* Optional: Instruction text */}
//                 <p className="text-xs text-gray-500 dark:text-gray-400">
//                   Hold gesture for ~1s
//                 </p>
//                 {/* Optional: Display raw feedback for debugging
//                  <p className="text-xs text-gray-400 mt-1">Feedback: {feedbackGesture ?? 'None'}</p>
//                  */}
//               </div>
//               {/* ================================================= */}
//               {/* END: ADD GESTURE FEEDBACK UI HERE */}
//               {/* ================================================= */}

//               {/* Existing Answer Buttons */}
//               <button
//                 onClick={() => handleAnswer(AnswerDifficulty.Easy)}
//                 className="w-full py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow transition"
//               >
//                 Easy
//               </button>
//               <button
//                 onClick={() => handleAnswer(AnswerDifficulty.Hard)}
//                 className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg shadow transition"
//               >
//                 Hard
//               </button>
//               <button
//                 onClick={() => handleAnswer(AnswerDifficulty.Wrong)}
//                 className="w-full py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow transition"
//               >
//                 Wrong
//               </button>
//             </>
//             // --- END OF SECTION WHEN ANSWER IS SHOWN ---
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect, useCallback } from "react";
import { Flashcard, AnswerDifficulty, UpdateRequest } from "../types";
import { fetchPracticeCards, submitAnswer, advanceDay } from "../services/api";
import FlashcardDisplay from "./FlashcardDisplay";
import {
  GestureOutcome,
  GestureId,
  useGestureControl,
} from "../hooks/useGestureControl";
import { useHandGestureDetection } from "../hooks/useHandGestureDetection";

const ThumbsUpIcon = ({ className = "" }: { className?: string }) => (
  <span className={`icon ${className}`}>👍</span>
);
const ThumbsDownIcon = ({ className = "" }: { className?: string }) => (
  <span className={`icon ${className}`}>👎</span>
);
const ThumbsSideIcon = ({ className = "" }: { className?: string }) => (
  <span className={`icon ${className}`}>🤔</span>
);

export default function PracticeView() {
  const [practiceCards, setPracticeCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [showBack, setShowBack] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [day, setDay] = useState<number>(0);
  const [sessionFinished, setSessionFinished] = useState<boolean>(false);
  const [webcamActive, setWebcamActive] = useState<boolean>(false);

  
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
          console.log("Gesture timed out or was null.");
          break;
      }

      // If a valid difficulty was determined by the gesture, call handleAnswer
      if (difficulty !== null && practiceCards[currentCardIndex]) {
        handleAnswer(difficulty); // Reuse existing answer submission logic
      }
    },
    [currentCardIndex, practiceCards]
  );

  const { processDetectedGesture, timeoutNotificationShown, feedbackGesture } =
    useGestureControl({
      isActive: showBack && !sessionFinished,
      onGestureConfirmed: handleGestureAnswer,
    });

  // This callback will be called whenever the hand gesture detection identifies a gesture
  const handleGestureDetected = useCallback((gesture: GestureId) => {
    // Pass the detected gesture to our gesture control system
    processDetectedGesture(gesture);
  }, [processDetectedGesture]);

  // Initialize the hand gesture detection system
  const { videoRef, isLoading: isHandDetectionLoading, error: handDetectionError } = 
    useHandGestureDetection({
      isActive: showBack && !sessionFinished && webcamActive,
      onGestureDetected: handleGestureDetected
    });

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

  // Handle any webcam/hand detection errors
  useEffect(() => {
    if (handDetectionError) {
      setError(prev => prev || handDetectionError);
    }
  }, [handDetectionError]);

  const handleShowBack = () => setShowBack(true);

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

  // REMOVE the simulation useEffect - replaced by real gesture detection
  // You can delete the entire useEffect block with setTimeout calls

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

  const toggleWebcam = () => {
    setWebcamActive(!webcamActive);
  };

  if (isLoading || isHandDetectionLoading)
    return <div className="text-center text-gray-600">
      Loading{isHandDetectionLoading ? " (preparing gesture detection...)" : ""}
    </div>;
  
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
      {/* Hidden video element for webcam */}
      <div className="webcam-container" style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
        <video 
          ref={videoRef}
          width="640"
          height="480"
          autoPlay
          playsInline
          muted
        />
      </div>

      <div className="p-6 w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-md space-y-6">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Day <span className="font-bold text-blue-700">{day}</span> — Card{" "}
            <span className="font-bold text-blue-700">
              {currentCardIndex + 1}
            </span>{" "}
            of{" "}
            <span className="font-bold text-blue-700">
              {practiceCards.length}
            </span>
          </div>
          <button
            onClick={toggleWebcam}
            className={`text-xs px-2 py-1 rounded-md ${
              webcamActive 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {webcamActive ? '📹 Webcam On' : '📷 Webcam Off'}
          </button>
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
              <div className="gesture-feedback my-4 p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-md text-center">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {webcamActive ? 'Make a Gesture to Rate' : 'Gesture Rating'}
                </h3>

                {/* Webcam instructions when active */}
                {webcamActive && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                    Show a thumbs up 👍, sideways 🤔, or down 👎 gesture to rate
                  </p>
                )}

                {/* Timeout Notification - Render only if timeoutNotificationShown is true */}
                {timeoutNotificationShown && (
                  <p className="timeout-warning mb-2 rounded border border-red-400 bg-red-100 px-2 py-1 text-sm font-bold text-red-600 dark:border-red-600 dark:bg-red-900/30 dark:text-red-400">
                    Gesture time out! Please rate.
                  </p>
                )}

                {/* Icons with Conditional Glow based on feedbackGesture state */}
                <div className="gesture-icons text-3xl flex justify-center gap-4 mb-1">
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

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Hold gesture for ~1s
                </p>
              </div>

              {/* Existing Answer Buttons */}
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