type GestureId = "THUMBS_UP" | "THUMBS_DOWN" | "THUMBS_SIDEWAYS" | "OTHER"| null;
type GestureOutcome = "easy" | "wrong" | "hard" | null;


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

export function useGestureControl() {
    

}


