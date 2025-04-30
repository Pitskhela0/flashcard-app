/**
 * Gesture Control Hook
 * 
 * Specifications:
 * - Provides a custom React hook for processing and confirming hand gestures
 * - Implements a state machine for tracking gesture detection, confirmation, and timeout
 * - Requires gestures to be held for a configurable duration to prevent accidental triggers
 * - Provides visual feedback about currently detected gestures
 * - Implements a timeout system to notify users when no gesture has been confirmed
 * - Maps raw gesture IDs to semantic outcomes (easy, hard, wrong)
 * - Cleans up timers and state when component is inactive
 * - Supports customizable hold duration and timeout thresholds
 */
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Gesture ID Type
 * 
 * Specifications:
 * - Defines the set of possible gesture detection results
 * - THUMBS_UP: Thumb pointing upward relative to wrist
 * - THUMBS_DOWN: Thumb pointing downward relative to wrist
 * - THUMBS_SIDEWAYS: Thumb pointing sideways relative to wrist
 * - OTHER: Hand detected but no recognizable gesture
 * - null: No hand detected
 */
export type GestureId =
  | "THUMBS_UP"
  | "THUMBS_DOWN"
  | "THUMBS_SIDEWAYS"
  | "OTHER"
  | null;

/**
 * Gesture Outcome Type
 * 
 * Specifications:
 * - Defines the semantic meaning of confirmed gestures
 * - Maps to flashcard difficulty ratings
 * - easy: User knows the card well (thumbs up)
 * - hard: User struggles with the card (thumbs sideways)
 * - wrong: User doesn't know the card (thumbs down)
 * - null: No confirmed gesture
 */
export type GestureOutcome = "easy" | "wrong" | "hard" | null;

/**
 * Hook Props Interface
 * 
 * Specifications:
 * - onGestureConfirmed: Callback function when a gesture is held long enough to confirm
 * - isActive: Whether the gesture control system should be active
 * - holdDurationMs: How long a gesture must be held to be confirmed (default 1500ms)
 * - overallTimeoutMs: How long to wait before showing a timeout notification (default 8000ms)
 */
interface UseGestureControlProps {
  onGestureConfirmed: (outcome: GestureOutcome) => void;
  isActive: boolean;
  holdDurationMs?: number;
  overallTimeoutMs?: number;
}

/**
 * Hook Return Interface
 * 
 * Specifications:
 * - confirmedOutcome: The currently confirmed gesture outcome (null if none)
 * - processDetectedGesture: Function to call when a new gesture is detected
 * - timeoutNotificationShown: Whether the timeout notification should be displayed
 * - feedbackGesture: The currently detected gesture for UI feedback
 */
interface UseGestureControlReturn {
  confirmedOutcome: GestureOutcome;
  processDetectedGesture: (gesture: GestureId) => void;
  timeoutNotificationShown: boolean;
  feedbackGesture: GestureId;
}

/**
 * Default Hold Duration (ms)
 * 
 * Specifications:
 * - How long a gesture must be continuously held to be confirmed
 * - Set to 1500ms (1.5 seconds) for a balance of responsiveness and preventing accidental triggers
 */
const DEFAULT_HOLD_DURATION_MS = 1500;

/**
 * Default Overall Timeout (ms)
 * 
 * Specifications:
 * - How long to wait before showing a timeout notification if no gesture is confirmed
 * - Set to 8000ms (8 seconds) to give users adequate time to make a decision
 */
const DEFAULT_OVERALL_TIMEOUT_MS = 8000;

/**
 * Get Outcome For Gesture Function
 * 
 * Specifications:
 * - Maps from detected gesture IDs to semantic outcomes
 * - THUMBS_UP → "easy" - User knows the card well
 * - THUMBS_DOWN → "wrong" - User doesn't know the card
 * - THUMBS_SIDEWAYS → "hard" - User struggles with the card
 * - OTHER or null → null - No recognizable gesture
 * 
 * @param gestureId The detected gesture ID
 * @returns The corresponding gesture outcome
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

/**
 * Use Gesture Control Hook
 * 
 * Specifications:
 * - Tracks and processes gestures to determine user intent
 * - Implements a confirmation system requiring gestures to be held
 * - Provides UI feedback about current gesture and confirmation status
 * - Manages timers for gesture confirmation and overall timeout
 * - Calls callback when gestures are confirmed
 * - Cleans up resources when component is inactive
 * 
 * @param props Hook configuration parameters
 * @returns State and functions for gesture processing
 */
export const useGestureControl = ({
  onGestureConfirmed,
  isActive,
  holdDurationMs = DEFAULT_HOLD_DURATION_MS,
  overallTimeoutMs = DEFAULT_OVERALL_TIMEOUT_MS,
}: UseGestureControlProps): UseGestureControlReturn => {
  /**
   * State and Refs
   * 
   * Specifications:
   * - currentGestureRef: Tracks the currently detected gesture (ref for timer access)
   * - gestureStartTime: When the current gesture began (for hold duration calculation)
   * - confirmedOutcome: The outcome that has been confirmed (if any)
   * - timeoutNotificationShown: Whether to show timeout warning UI
   * - feedbackGesture: The current gesture to highlight in the UI
   * - confirmationTimerRef: Reference to the gesture confirmation timeout
   * - overallTimeoutRef: Reference to the overall session timeout
   */
  const currentGestureRef = useRef<GestureId | null>(null);
  const [gestureStartTime, setGestureStartTime] = useState<number | null>(null);
  const [confirmedOutcome, setConfirmedOutcome] =
    useState<GestureOutcome>(null);
  const [timeoutNotificationShown, setTimeoutNotificationShown] =
    useState<boolean>(false);
  const [feedbackGesture,setFeedbackGesture] = useState<GestureId | null>(null)
  
  const confirmationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const overallTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Clear Overall Timer Function
   * 
   * Specifications:
   * - Safely clears the overall timeout timer
   * - Prevents memory leaks by ensuring timer is properly cleaned up
   * - Uses callback pattern for proper dependency management
   */
  const clearOverallTimer = useCallback(() => {
    if (overallTimeoutRef.current) {
      clearTimeout(overallTimeoutRef.current);
      overallTimeoutRef.current = null;
    }
  }, []);

  /**
   * Overall Timeout Effect
   * 
   * Specifications:
   * - Sets up and manages the overall timeout timer
   * - Shows notification UI when timeout occurs
   * - Resets timeout state when component becomes inactive
   * - Properly cleans up timer resources
   */
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

  /**
   * Confirmation Timer Cleanup Effect
   * 
   * Specifications:
   * - Cleans up confirmation timer when component becomes inactive
   * - Resets gesture state when component becomes inactive
   * - Prevents memory leaks from lingering timers
   */
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

  /**
   * Process Detected Gesture Function
   * 
   * Specifications:
   * - Processes new gesture detections from the webcam system
   * - Updates UI feedback immediately when gesture changes
   * - Starts confirmation timer when a valid gesture is detected
   * - Resets confirmation process when gesture changes
   * - Confirms gesture and calls callback when held for required duration
   * - Ignores gestures when component is inactive
   * 
   * @param detectedGesture The newly detected gesture from the webcam system
   */
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
      // else: gesture is same as before, do nothing (don't reset timer)
    },
    [isActive, onGestureConfirmed, holdDurationMs, clearOverallTimer]
  );
  
  /**
   * Return Hook Interface
   * 
   * Specifications:
   * - confirmedOutcome: The currently confirmed gesture outcome
   * - processDetectedGesture: Function to call when a new gesture is detected
   * - timeoutNotificationShown: Whether to show the timeout notification UI
   * - feedbackGesture: The current gesture to highlight in the UI
   */
  return {
    confirmedOutcome,
    processDetectedGesture,
    timeoutNotificationShown,
    feedbackGesture,
  };
};