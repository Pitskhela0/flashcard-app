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
        jest.useFakeTimers();
      });

  describe("Confirmation Timing", () => {
    it("should set confirmedOutcome to 'easy' after holding 'THUMBS_UP' for 0.75 seconds", () => {
      const mockOnGestureConfirmed = jest.fn();
      const HOLD_DURATION_MS = 750;

      const { result } = renderHook(() =>
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
      expect(result.current.confirmedOutcome).toBe("easy");
    });

    it('should set confirmedOutcome to "hard" after holding "SIDEWAYS" for 0.75 seconds', () => {
      const mockOnGestureConfirmed = jest.fn();
      const { result } = renderHook(() =>
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
      expect(result.current.confirmedOutcome).toBe("hard");
    });

    it('should set confirmedOutcome to "wrong" after holding "DOWN" for 0.75 seconds', () => {
      const mockOnGestureConfirmed = jest.fn();
      const { result } = renderHook(() =>
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
      expect(result.current.confirmedOutcome).toBe("wrong");
    });
  });
});
