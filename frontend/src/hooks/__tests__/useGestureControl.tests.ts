import { getOutcomeForGesture } from "../useGestureControl";



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
    expect(getOutcomeForGesture("SIDEWAYS")).toBe("hard");
  });
  it("should return 'wrong' for 'THUMBS_DOWN'", () => {
    expect(getOutcomeForGesture("THUMBS_DOWN")).toBe("wrong");
  });
  it('should return null for any other string', () => {
    expect(getOutcomeForGesture("OTHER")).toBeNull();
  });
});
