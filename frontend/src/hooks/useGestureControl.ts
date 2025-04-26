import { useCallback, useEffect, useRef, useState } from "react";

export type GestureId =
  | "THUMBS_UP"
  | "THUMBS_DOWN"
  | "THUMBS_SIDEWAYS"
  | "OTHER"
  | null;
export type GestureOutcome = "easy" | "wrong" | "hard" | null;

interface UseGestureControlProps {
    onGestureConfirmed: (outcome: GestureOutcome) => void;
    isActive: boolean;
    holdDurationMs?: number; // Make duration configurable, default to 750ms
  }

interface UseGestureControlReturn {
    confirmedOutcome: GestureOutcome;
    processDetectedGesture: (gesture: GestureId) => void;
    // We'll add more return values later for feedback (P3.6b)
  }
  const DEFAULT_HOLD_DURATION_MS = 750;

/**
 * helper function
 * recieves input gestureId which represents how well user knows the current flashcard.
 * based on that input returns the result which will guide how the flashcard will rearrange in buckets.
 * @param gestureId
 * @returns GestureOutcome which represents how hard was flashcard for the user
 *
 */
export function getOutcomeForGesture(gestureId: GestureId): GestureOutcome {
  switch (gestureId) {
    case "THUMBS_UP":
      return "easy";
    case "THUMBS_DOWN":
      return "wrong";
    case "THUMBS_SIDEWAYS":
      return "hard";
    default:
      return null;
  }
}

export const useGestureControl = ({
  onGestureConfirmed,
  isActive,
  holdDurationMs = DEFAULT_HOLD_DURATION_MS // Use default if not provided
}: UseGestureControlProps): UseGestureControlReturn => {

  // --- State ---
  const currentGestureRef = useRef<GestureId | null>(null);
  const [gestureStartTime, setGestureStartTime] = useState<number | null>(null);
  const [confirmedOutcome, setConfirmedOutcome] = useState<GestureOutcome>(null);

  // --- Refs ---
  // Ref to store the timeout ID for the confirmation timer
  const confirmationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Timer Cleanup Effect ---
  // Ensure timer is cleared if the component unmounts or if isActive changes to false
  useEffect(() => {
    // Cleanup function: clears the timer
    const clearTimer = () => {
      if (confirmationTimerRef.current) {
        clearTimeout(confirmationTimerRef.current);
        confirmationTimerRef.current = null;
        // console.log("Confirmation timer cleared by effect."); // Debug log
      }
    };

    // If the hook becomes inactive, clear the timer and reset state
    if (!isActive) {
      clearTimer();
      currentGestureRef.current = null;
      setGestureStartTime(null);
    }

    // Return the cleanup function to be called on unmount or before effect re-runs
    return clearTimer;
  }, [isActive]); 


  // --- Gesture Processing Function ---
  const processDetectedGesture = useCallback((detectedGesture: GestureId) => {
    // Ignore if the hook is not active
    if (!isActive) {
        return;
    }

    // console.log(`Processing gesture: ${detectedGesture}, Current: ${currentGesture}`); // Debug log

    // --- Clear existing confirmation timer on ANY new gesture input ---
    // (This handles gesture changes before confirmation - anticipating P3.4)
    if (confirmationTimerRef.current) {
        clearTimeout(confirmationTimerRef.current);
        confirmationTimerRef.current = null;
        // console.log("Cleared existing timer due to new gesture input."); // Debug log
    }

    // --- Reset confirmed outcome if gesture changes or is lost ---
    // (Anticipating P3.4)
    if (detectedGesture !== currentGestureRef.current) {
        setConfirmedOutcome(null);
        // console.log("Reset confirmedOutcome due to gesture change/loss."); // Debug log
    }

    // Update the current gesture state
    currentGestureRef.current = detectedGesture;

    // --- Handle Start of a New Valid Gesture ---
    if (detectedGesture !== null && detectedGesture !== "OTHER") {
        // console.log(`Starting timer for: ${detectedGesture}`); // Debug log
        setGestureStartTime(Date.now()); // Record start time

        // Start a new timer
        confirmationTimerRef.current = setTimeout(() => {
            // console.log(`Timer finished for initial gesture: ${detectedGesture}`); // Debug log
            // --- Timer Completion Logic ---
            // Double-check if the gesture *still* matches the one that started timer
            // Note: We check against the 'detectedGesture' captured in this callback's closure
            // Or alternatively, re-read state if preferred, but closure is common.
            // Let's read state for simplicity:
            // const currentGestureSnapshot = currentGesture; // Read state inside timeout

            // Using the closure variable `detectedGesture` is simpler here:
             if (currentGestureRef.current === detectedGesture) { 
                const outcome = getOutcomeForGesture(detectedGesture);
                
                setConfirmedOutcome(outcome);

                onGestureConfirmed(outcome)

                
            } else {
                // console.log(`Timer finished, but gesture changed from ${detectedGesture} to ${currentGesture}. No confirmation.`); // Debug log
            }
             confirmationTimerRef.current = null; 
        }, holdDurationMs);

    } else {
        
        setGestureStartTime(null);
        
    }

  }, [isActive, currentGestureRef, holdDurationMs]); // Dependencies for useCallback



  return {
    confirmedOutcome,
    processDetectedGesture,
  };
};