
// -- Flashcard Type --
export interface Flashcard {
    front: string;
    back: string;
    hint?: string; // Optional, as hint may not always be included
    tags: ReadonlyArray<string>;

  }
  
  // -- AnswerDifficulty Enum --
  export enum AnswerDifficulty {
    Wrong = 0,
    Hard = 1,
    Easy = 2,
  }
  
  // -- PracticeSession (response from GET /api/practice) --
  export interface PracticeSession {
    cards: Flashcard[];
    day: number;
  }
  
  // -- UpdateRequest (request body for POST /api/update) --
  export interface UpdateRequest {
    cardFront: string;
    cardBack: string;
    difficulty: AnswerDifficulty;
  }
  
  // -- ProgressStats (response from GET /api/progress) --
  export interface ProgressStats {
    totalCards: number;
    masteredCards: number;
    progress: number;
    totalCorrect: number;
    totalAnswered: number;
    correctnessRate: number;
  }
  
  // -- Optional: PracticeRecord if needed for UI later --
  export interface PracticeRecord {
    cardFront: string;
    cardBack: string;
    timestamp: number;
    difficulty: AnswerDifficulty;
    previousBucket: number;
    newBucket: number;
  }