import { useGestureControl, getOutcomeForGesture } from "../useGestureControl";
import { renderHook, act } from "@testing-library/react";
import { GestureId, GestureOutcome } from "../useGestureControl";

/**
 * partition on Test suite
 * input = THUMBS_UP
 * input = THUMBS_DOWN
 * input = THUMBS_SIDEWAYS
 * input = any other input
 */
describe("getOutcomeForGesture", () => {
  it("should return 'easy' for 'TUMHBS_UP'", () => {
    expect(getOutcomeForGesture("THUMBS_UP")).toBe("easy");
  });
  it("should return 'hard' for 'THUMBS_SIDEWAYS'", () => {
    expect(getOutcomeForGesture("THUMBS_SIDEWAYS")).toBe("hard");
  });
  it("should return 'wrong' for 'THUMBS_DOWN'", () => {
    expect(getOutcomeForGesture("THUMBS_DOWN")).toBe("wrong");
  });
  it("should return null for any other string", () => {
    expect(getOutcomeForGesture("OTHER")).toBeNull();
  });
});

describe("useGestureControl", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllTimers();
  });
  /**
   * test on Custom hooks useGestureControl
   * simulate gesture detection, simulate time passing and we check if gesture is confirmed.
   * partition:
   * gesture detection returns "easy" and 0.75 seconds pass
   * gesture detection returns "easy" and less than 0.75 seconds pass
   * gesture detection returns "hard" and 0.75 seconds pass
   * gesture detection returns "hard" and less than 0.75 seconds pass
   * gesture detection returns "wrong" and 0.75 seconds pass
   * gesture detection returns "wrong" and less than 0.75 seconds pass
   */
  describe("Confirmation Timing", () => {
    it("should set confirmedOutcome to 'easy' after holding 'THUMBS_UP' for 0.75 seconds", () => {
      const mockOnGestureConfirmed = jest.fn();
      const HOLD_DURATION_MS = 750;

      const { result, rerender } = renderHook(() =>
        useGestureControl({
          onGestureConfirmed: mockOnGestureConfirmed,
          isActive: true,
        })
      );

      expect(result.current.confirmedOutcome).toBeNull();
      act(() => {
        result.current.processDetectedGesture("THUMBS_UP");
      });

      act(() => {
        jest.advanceTimersByTime(HOLD_DURATION_MS - 1);
      });

      expect(result.current.confirmedOutcome).toBeNull();
      expect(mockOnGestureConfirmed).not.toHaveBeenCalled();
      act(() => {
        jest.advanceTimersByTime(1);
      });
      rerender();
      expect(result.current.confirmedOutcome).toBe("easy");
    });

    it('should set confirmedOutcome to "hard" after holding "SIDEWAYS" for 0.75 seconds', () => {
      const mockOnGestureConfirmed = jest.fn();
      const { result, rerender } = renderHook(() =>
        useGestureControl({
          onGestureConfirmed: mockOnGestureConfirmed,
          isActive: true,
        })
      );
      expect(result.current.confirmedOutcome).toBeNull();
      act(() => {
        result.current.processDetectedGesture("THUMBS_SIDEWAYS");
      });
      act(() => {
        jest.advanceTimersByTime(749);
      });
      expect(result.current.confirmedOutcome).toBeNull();
      act(() => {
        jest.advanceTimersByTime(1);
      });
      rerender();
      expect(result.current.confirmedOutcome).toBe("hard");
    });

    it('should set confirmedOutcome to "wrong" after holding "DOWN" for 0.75 seconds', () => {
      const mockOnGestureConfirmed = jest.fn();
      const { result, rerender } = renderHook(() =>
        useGestureControl({
          onGestureConfirmed: mockOnGestureConfirmed,
          isActive: true,
        })
      );
      expect(result.current.confirmedOutcome).toBeNull();
      act(() => {
        result.current.processDetectedGesture("THUMBS_DOWN");
      });
      act(() => {
        jest.advanceTimersByTime(749);
      });
      expect(result.current.confirmedOutcome).toBeNull();
      act(() => {
        jest.advanceTimersByTime(1);
      });
      rerender();
      expect(result.current.confirmedOutcome).toBe("wrong");
    });
  });

  describe("Timer Reset/Cancellation", () => {
    it("should Not confirm outcome if gesture is lost before 0.75s", () => {
      const mockOnGestureConfirmed = jest.fn();
      const HOLD_DURATION_MS = 750;

      const { result, rerender } = renderHook(() =>
        useGestureControl({
          onGestureConfirmed: mockOnGestureConfirmed,
          isActive: true,
        })
      );

      act(() => {
        result.current.processDetectedGesture("THUMBS_UP");
      });
      act(() => {
        jest.advanceTimersByTime(HOLD_DURATION_MS / 2);
      });

      expect(result.current.confirmedOutcome).toBeNull();

      act(() => {
        result.current.processDetectedGesture(null);
      });

      expect(result.current.confirmedOutcome).toBeNull();

      act(() => {
        jest.advanceTimersByTime(HOLD_DURATION_MS);
      });
      expect(result.current.confirmedOutcome).toBeNull();
      expect(mockOnGestureConfirmed).not.toHaveBeenCalled();
    });

    it("should reset timer and confirm NEW gesture if gesture changes before 0.75s", () => {
      const HOLD_DURATION_MS = 750;
      const mockOnGestureConfirmed = jest.fn();

      const { result, rerender } = renderHook(() =>
        useGestureControl({
          onGestureConfirmed: mockOnGestureConfirmed,
          isActive: true,
        })
      );

      act(() => {
        result.current.processDetectedGesture("THUMBS_DOWN");
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current.confirmedOutcome).toBeNull();
      expect(mockOnGestureConfirmed).not.toHaveBeenCalled();

      act(() => {
        result.current.processDetectedGesture("THUMBS_UP");
      });
      act(() => {
        jest.advanceTimersByTime(350);
      });
      expect(result.current.confirmedOutcome).toBeNull();
      expect(mockOnGestureConfirmed).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(400);
      });
      rerender();
      expect(result.current.confirmedOutcome).toBe("easy");
      expect(mockOnGestureConfirmed).toHaveBeenCalled();
    });
  });

  describe("Timer passes 8 seconds", () => {
    it("should set timeoutNotificationShown to true if no gesture confirmed within 8s", () => {
      const OVERALL_TIMEOUT_MS = 8000;

      const mockOnGestureConfirmed = jest.fn();

      const { result } = renderHook(() =>
        useGestureControl({
          onGestureConfirmed: mockOnGestureConfirmed,
          isActive: true,
        })
      );

      expect(result.current.timeoutNotificationShown).toBe(false);

      expect(result.current.confirmedOutcome).toBeNull();

      act(() => jest.advanceTimersByTime(OVERALL_TIMEOUT_MS - 1));

      expect(result.current.timeoutNotificationShown).toBe(false);
      expect(result.current.confirmedOutcome).toBeNull();
      expect(mockOnGestureConfirmed).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1); // Reach 8000ms
      });

      expect(result.current.timeoutNotificationShown).toBe(true);
      expect(result.current.confirmedOutcome).toBeNull();
      expect(mockOnGestureConfirmed).not.toHaveBeenCalled();
    });

    it("should NOT set timeoutNotificationShown if a gesture IS confirmed before 8s", () => {
      const HOLD_DURATION_MS = 750;
      const OVERALL_TIMEOUT_MS = 8000;

      const mockOnGestureConfirmed = jest.fn();

      const { result } = renderHook(() =>
        useGestureControl({
          onGestureConfirmed: mockOnGestureConfirmed,
          isActive: true,
        })
      );

      expect(result.current.timeoutNotificationShown).toBe(false);
      expect(result.current.confirmedOutcome).toBeNull();

      act(() => {
        result.current.processDetectedGesture("THUMBS_DOWN");
      });
      act(() => {
        jest.advanceTimersByTime(HOLD_DURATION_MS);
      });

      expect(result.current.confirmedOutcome).toBe("wrong");
      expect(result.current.timeoutNotificationShown).toBe(false);
      // (P3.7 will test that mockOnGestureConfirmed IS called here)

      act(() => {
        jest.advanceTimersByTime(OVERALL_TIMEOUT_MS);
      });

      expect(result.current.timeoutNotificationShown).toBe(false);
      expect(result.current.confirmedOutcome).toBe("wrong");
    });
  });
});
