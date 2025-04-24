import { Flashcard, AnswerDifficulty, BucketMap } from "@logic/flashcards";

/**
 * defines the standard structure of for a flashcard object in backend system
 *
 * represents the data stroed for each flashcard
 */
export interface FlashcardInterface {
  /**  the unique identifier for the flashcard */
  id: string;
  /**  represents front side of the flashcard  */
  front: string;
  /** represents back side of the flashcard */
  back: string;
  /**  represents hint for the flashcard   */
  hint?: string;
}

export interface PracticeSession {
  cards: Flashcard[];
  day: number;
}

export interface UpdateRequest {
  cardFront: string;
  cardBack: string;
  difficulty: AnswerDifficulty;
}

export interface HintRequest {
  cardFront: string;
  cardBack: string;
}
export interface ProgressStats {
  totalCards: number;
  masteredCards: number;
  progress: number;
  totalCorrect: number;
  totalAnswered: number;
  correctnessRate: number;
}

export interface PracticeRecord {
  cardFront: string;
  cardBack: string;
  timestamp: number;
  difficulty: AnswerDifficulty;
  previousBucket: number;
  newBucket: number;
}
