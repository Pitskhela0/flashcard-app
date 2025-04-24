import { Flashcard, BucketMap, AnswerDifficulty } from "./logic/flashcards";
import { PracticeRecord } from "./types";
import { FlashcardInterface } from "./types";
import { randomUUID } from "crypto";

const initialCards: Flashcard[] = [
  new Flashcard(
    "1",
    "What is the capital of France?",
    "Paris",
    "It's known as the city of love.",
    ["geography"]
  ),
  new Flashcard("2", "2 + 2", "4", "Basic math", ["math"]),
  new Flashcard(
    "3",
    "What does HTTP stand for?",
    "HyperText Transfer Protocol",
    "Internet protocol",
    ["tech"]
  ),
];
let currentBuckets: BucketMap = new Map();
currentBuckets.set(0, new Set(initialCards));
let practiceHistory: PracticeRecord[] = [];
let currentDay: number = 1;

export function getBuckets(): BucketMap {
  return currentBuckets;
}

export function getHistory(): PracticeRecord[] {
  return [...practiceHistory];
}

export function addHistoryRecord(record: PracticeRecord): void {
  practiceHistory.push(record);
}

export function getCurrentDay(): number {
  return currentDay;
}

export function incrementDay(): void {
  currentDay++;
}

export function findCard(front: string, back: string): Flashcard | undefined {
  for (const bucket of currentBuckets.values()) {
    for (const card of bucket) {
      if (card.front === front && card.back === back) {
        return card;
      }
    }
  }
  return undefined;
}

export function findCardBucket(cardToFind: Flashcard): number | undefined {
  for (const [bucketNumber, bucket] of currentBuckets.entries()) {
    if (bucket.has(cardToFind)) {
      return bucketNumber;
    }
  }
  return undefined;
}

/**
 * 
 * @returns the total number of flashcards in our currentBucket
 */

export function totalflashcards(): number {
  let res = 0;
  currentBuckets.forEach((val,key) => res += val.size)
  return res;
}

/**
 * adds the flashcard with given parameters to currentBuckets
 * 
 * @param front represents the front side of the flashcard
 * @param back represents the back side of the flashcard
 * @param hint represnts the hint for your flashcard it might be empty
 * @returns nothing  
 */
export function addFlashcard({
  front,
  back,
  hint,
}: {
  front: string;
  back: string;
  hint: string;
}): void {
  const flashcard: Flashcard = new Flashcard(
    randomUUID(),
    front,
    back,
    hint,
    []
  );
  if (!currentBuckets.has(0)) {
    currentBuckets.set(0, new Set<Flashcard>());
  }

  currentBuckets.get(0)!.add(flashcard);
  
}

console.log("✅ In-memory flashcard state initialized");
