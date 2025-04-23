/**
 * Problem Set 1: Flashcards - Algorithm Functions
 *
 * This file contains the implementations for the flashcard algorithm functions
 * as described in the problem set handout.
 *
 * Please DO NOT modify the signatures of the exported functions in this file,
 * or you risk failing the autograder.
 */

import { Flashcard, AnswerDifficulty, BucketMap } from "./flashcards";
import { PracticeRecord,ProgressStats } from "@models/index";

/**
 * Converts a Map representation of learning buckets into an Array-of-Set representation.
 * @param buckets Map where keys are bucket numbers and values are sets of Flashcards.
 * @returns Array of Sets, where element at index i is the set of flashcards in bucket i.
 *          Buckets with no cards will have empty sets in the array.
 * @spec.requires buckets is a valid representation of flashcard buckets.
 */
export function toBucketSets(buckets: BucketMap): Array<Set<Flashcard>> {
  const keys = [...buckets.keys()];
  const maxBucket = keys.length > 0 ? Math.max(...keys) : -1;

  const res: Array<Set<Flashcard>> = Array.from(
    { length: maxBucket + 1 },
    () => new Set()
  );

  buckets.forEach((flashcards, num) => {
    res[num] = flashcards;
  });

  return res;
}


/**
 * Finds the range of buckets that contain flashcards, as a rough measure of progress.
 *
 * @param buckets Array-of-Set representation of buckets.
 * @returns object with minBucket and maxBucket properties representing the range,
 *          or undefined if no buckets contain cards.
 * @spec.requires buckets is a valid Array-of-Set representation of flashcard buckets.
 */
export function getBucketRange(
  buckets: Array<Set<Flashcard>>
): { minBucket: number; maxBucket: number } | undefined {
  let min = -1;
  let max = -1;

  for (let i = 0; i < buckets.length; i++) {
    const bucket = buckets[i];
    if (bucket && bucket.size > 0) {
      if (min === -1) min = i;
      max = i;
    }
  }

  return min === -1 ? undefined : { minBucket: min, maxBucket: max };
}
/**
 * Selects cards to practice on a particular day.
 *
 * @param buckets Array-of-Set representation of buckets.
 * @param day current day number (starting from 0).
 * @returns a Set of Flashcards that should be practiced on day `day`,
 *          according to the Modified-Leitner algorithm.
 * @spec.requires buckets is a valid Array-of-Set representation of flashcard buckets.
 */
export function practice(
  buckets: Array<Set<Flashcard>>,
  day: number
): Set<Flashcard> {
  let res: Set<Flashcard> = new Set<Flashcard>()
  const length = buckets.length === 5 ?  4 : buckets.length;
  for(let i = 0; i < length; i++){
    if(day % Math.pow(2,i) === 0){
      buckets[i]!.forEach((card) => res.add(card));
    }
  }
  return res;
}

/**
 * Updates a card's bucket number after a practice trial.
 *
 * @param buckets Map representation of learning buckets.
 * @param card flashcard that was practiced.
 * @param difficulty how well the user did on the card in this practice trial.
 * @returns updated Map of learning buckets.
 * @spec.requires buckets is a valid representation of flashcard buckets.
 */
export function update(
  buckets: BucketMap,
  card: Flashcard,
  difficulty: AnswerDifficulty
): BucketMap {
  let currentBucket = -1;

  for (const [bucketNum, flashcards] of buckets.entries()) {
    if (flashcards.has(card)) {
      currentBucket = bucketNum;
      flashcards.delete(card);
      break;
    }
  }

  
  let newBucket = currentBucket;

  if (difficulty === AnswerDifficulty.Easy) {
    newBucket = Math.min(currentBucket + 1, buckets.size); 
  } else if (difficulty === AnswerDifficulty.Hard) {
    newBucket = Math.max(currentBucket - 1, 0);
  } else if (difficulty === AnswerDifficulty.Wrong) {
    newBucket = 0;
  }

  // Add card to the new bucket
  if (!buckets.has(newBucket)) {
    buckets.set(newBucket, new Set<Flashcard>());
  }
  buckets.get(newBucket)!.add(card);

  return buckets;
}

/**
 * Generates a hint for a flashcard.
 *
 * @param card flashcard to hint
 * @returns  a  hint for the front of the flashcard 
  such as revealing the first letters.
  requires card is a valid Flashcard with a non-empty front.
  effects Does not modify the flashcard.
  ensures The same input always produces the same hint.
 */
  export function getHint(card: Flashcard): string | undefined {
    if (card.hint !== ""){
      return card.hint
    }
    const back = card.back;
  
    if (!back || back.trim().length < 2) {
      return undefined; 
    }
  
    const chars = back.split("");
    const numToHide = Math.floor(chars.length / 2);
  
    let indices = Array.from({ length: chars.length }, (_, i) => i);

  
    // Replace about half of the characters with '_'
    for (let i = 0; i < numToHide; i++) {
      chars[indices[i]!] = "_";
    }
  
    return chars.join("");
  }
  
/**
 * Computes statistics about the user's learning progress.
 *
 * @param buckets - A Map where keys are bucket numbers (0, 1, 2, ...) and values are Sets of Flashcards.
 * @param history - An object where keys are flashcard identifiers (e.g., `card.front`) and values are AnswerDifficulty enums.
 * 
 * @returns An object containing:
 *   - `totalCards`: Total number of flashcards across all buckets.
 *   - `masteredCards`: Number of flashcards in the highest bucket (mastered).
 *   - `progress`: The percentage of flashcards that are mastered.
 *   - `totalCorrect`: The total number of flashcards answered correctly with "Easy" difficulty.
 *   - `totalAnswered`: The total number of flashcards attempted.
 *   - `correctnessRate`: The percentage of correct answers out of total answers.
 */
export function computeProgress(
    buckets: BucketMap,
    history: PracticeRecord[]
  ): ProgressStats {
    // Total number of cards across all buckets
    const totalCards = Array.from(buckets.values())
      .reduce((sum, bucket) => sum + bucket.size, 0);
  
    // Number of cards in the highest bucket (considered "mastered")
    const highestBucketIndex = buckets.size - 1;
    const masteredCards = buckets.get(highestBucketIndex)?.size ?? 0;
  
    // Total number of practice trials done
    const totalAnswered = history.length;
  
    // Total number of times the user answered "Easy"
    const totalCorrect = history.filter(
      (rec) => rec.difficulty === AnswerDifficulty.Easy
    ).length;
  
    // Percentage of cards mastered
    const progress = totalCards > 0
      ? (masteredCards / totalCards) * 100
      : 0;
  
    // Percentage of correct responses
    const correctnessRate = totalAnswered > 0
      ? (totalCorrect / totalAnswered) * 100
      : 0;
  
    return {
      totalCards,
      masteredCards,
      progress,
      totalCorrect,
      totalAnswered,
      correctnessRate,
    };
  }