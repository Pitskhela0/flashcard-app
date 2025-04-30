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
  holdDurationMs?: number;
  overallTimeoutMs?: number;
}

interface UseGestureControlReturn {
  confirmedOutcome: GestureOutcome;
  processDetectedGesture: (gesture: GestureId) => void;
  timeoutNotificationShown: boolean;
  feedbackGesture: GestureId;
  // We'll add more return values later for feedback (P3.6b)
}
const DEFAULT_HOLD_DURATION_MS = 1500;
const DEFAULT_OVERALL_TIMEOUT_MS = 8000;

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
  holdDurationMs = DEFAULT_HOLD_DURATION_MS,
  overallTimeoutMs = DEFAULT_OVERALL_TIMEOUT_MS,
}: UseGestureControlProps): UseGestureControlReturn => {
  // --- State ---
  const currentGestureRef = useRef<GestureId | null>(null);
  const [gestureStartTime, setGestureStartTime] = useState<number | null>(null);
  const [confirmedOutcome, setConfirmedOutcome] =
    useState<GestureOutcome>(null);
  const [timeoutNotificationShown, setTimeoutNotificationShown] =
    useState<boolean>(false);
  const [feedbackGesture,setFeedbackGesture] = useState<GestureId | null>(null)
  // --- Refs ---
  // Ref to store the timeout ID for the confirmation timer
  const confirmationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const overallTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearOverallTimer = useCallback(() => {
    if (overallTimeoutRef.current) {
      clearTimeout(overallTimeoutRef.current);
      overallTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      setTimeoutNotificationShown(false);
      clearOverallTimer();

      overallTimeoutRef.current = setTimeout(() => {
        setTimeoutNotificationShown(true);

        overallTimeoutRef.current = null;
      }, overallTimeoutMs);
    } else {
      clearOverallTimer();
    }
    return clearOverallTimer;
  }, [isActive, overallTimeoutMs, clearOverallTimer]);

  useEffect(() => {
    const clearTimer = () => {
      if (confirmationTimerRef.current) {
        clearTimeout(confirmationTimerRef.current);
        confirmationTimerRef.current = null;
      }
    };

    if (!isActive) {
      clearTimer();
      currentGestureRef.current = null;
      setGestureStartTime(null);
    }

    return clearTimer;
  }, [isActive]);

  const processDetectedGesture = useCallback(
    (detectedGesture: GestureId) => {
      console.log("processing gesture", detectedGesture);
  
      if (!isActive) return;
  
      // Only act if the gesture changed
      if (detectedGesture !== currentGestureRef.current) {
        // Update gesture state
        currentGestureRef.current = detectedGesture;
        setFeedbackGesture(detectedGesture);
        setGestureStartTime(Date.now());
        setConfirmedOutcome(null); // Reset confirmation state
  
        // Clear any existing timer
        if (confirmationTimerRef.current) {
          clearTimeout(confirmationTimerRef.current);
          confirmationTimerRef.current = null;
        }
  
        // Only start timer if gesture is valid
        if (detectedGesture !== null && detectedGesture !== "OTHER") {
          confirmationTimerRef.current = setTimeout(() => {
            if (currentGestureRef.current === detectedGesture) {
              const outcome = getOutcomeForGesture(detectedGesture);
              setConfirmedOutcome(outcome);
              clearOverallTimer();
              onGestureConfirmed(outcome);
            }
            confirmationTimerRef.current = null;
          }, holdDurationMs);
        } else {
          setGestureStartTime(null);
        }
      }
      // else: gesture is same as before, do nothing (don’t reset timer)
    },
    [isActive, onGestureConfirmed, holdDurationMs, clearOverallTimer]
  );
  

  return {
    confirmedOutcome,
    processDetectedGesture,
    timeoutNotificationShown,
    feedbackGesture,
  };
};
