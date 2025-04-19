import { Flashcard, AnswerDifficulty, BucketMap } from "@logic/flashcards";

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
