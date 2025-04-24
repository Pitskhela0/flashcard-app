// This file should NOT be modified.
// It is a placeholder to ensure the project structure is complete.
// You will work with the Flashcard, AnswerDifficulty, and BucketMap types
// defined here in your implementation and tests.

/**
 * Represents a flashcard with a front and back.
 * Flashcards are immutable.
 */
import { FlashcardInterface } from "@models/index";

export class Flashcard implements FlashcardInterface{
  public readonly id : string;
  public readonly front: string;
  public readonly back: string;
  public readonly hint: string;
  public readonly tags: ReadonlyArray<string>;

  constructor(
    id: string,
    front: string,
    back: string,
    hint: string,
    tags: ReadonlyArray<string>
  ) {
    this.id = id;
    this.front = front;
    this.back = back;
    this.hint = hint;
    this.tags = tags;
  }
  
}

/**
 * Represents the user's answer difficulty for a flashcard practice trial.
 */
export enum AnswerDifficulty {
  Wrong = 0,
  Hard = 1,
  Easy = 2,
}

/**
 * Represents the learning buckets as a Map.
 * Keys are bucket numbers (0, 1, 2, ...).
 * Values are Sets of Flashcards in that bucket.
 */
export type BucketMap = Map<number, Set<Flashcard>>;
