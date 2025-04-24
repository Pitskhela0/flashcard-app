import express, { Request, Response } from "express";
import cors from "cors";


import {
  toBucketSets,
  practice,
  update,
  getHint,
  computeProgress,
} from "./logic/algorithm";
import {
  getBuckets,
  getHistory,
  addHistoryRecord,
  getCurrentDay,
  incrementDay,
  findCard,
  findCardBucket,
  addFlashcard,
} from "./state";
import { AnswerDifficulty, Flashcard } from "./logic/flashcards";
import { FlashcardInterface, PracticeRecord } from "./types";

interface UpdateRequestBody {
  cardFront: string;
  cardBack: string;
  difficulty: AnswerDifficulty;
}

export const app = express();

const PORT = process.env.PORT || 3001;

app.use(cors());

app.use(express.json());

app.post("/api/flashcards", (req, res) => {
  try {
    const { front, back, hint } = req.body;
    if (!front || !back || typeof front !== 'string' || typeof back !== 'string') {
      res.status(400).json({ error: "invalid data was sent" });
      return;

    }
    const newFlashcard = {
      front: front,
      back: back,
      hint: hint
    } 
    addFlashcard(newFlashcard);
    res.status(201).json(newFlashcard);

  } catch (error) {
    res.status(500).json({ error: "Internal server error" })
  }
});

app.get("/api/practice", (req, res) => {
  try {
    const day = getCurrentDay();
    const bucketMap = getBuckets();
    const bucketSets = toBucketSets(bucketMap);
    const cardsSet = practice(bucketSets, day);
    const cardsArray = Array.from(cardsSet);
    console.log(`[Practice] Found ${cardsArray.length} cards for day ${day}`);
    res.json({ cards: cardsArray, day });
  } catch (error) {
    res.status(500).json({ error: "Failed to get practice cards." });
  }
});

app.post("/api/update", (req, res): void => {
  try {
    const { cardFront, cardBack, difficulty } = req.body;

    // 1. Validate difficulty
    if (!Object.values(AnswerDifficulty).includes(difficulty)) {
      res.status(400).json({ error: "Invalid difficulty value." });
      return;
    }

    // 2. Find the card
    const card = findCard(cardFront, cardBack);
    if (!card) {
      res.status(404).json({ error: "Card not found." });
      return;
    }

    // 3. Update buckets
    const currentBuckets = getBuckets();
    const previousBucket = findCardBucket(card)!;
    update(currentBuckets, card, difficulty); // not so clean

    const newBucket = findCardBucket(card)!;

    // 4. Record history
    const record: PracticeRecord = {
      cardFront,
      cardBack,
      timestamp: Date.now(),
      difficulty,
      previousBucket,
      newBucket,
    };
    addHistoryRecord(record);
    console.log(`[Update] "${cardFront}": ${previousBucket} → ${newBucket}`);
    res.status(200).json({ message: "Card updated." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update card." });
  }
});

app.get("/api/hint", (req, res) => {
  try {
    const { cardFront, cardBack } = req.query;

    if (typeof cardFront !== "string" || typeof cardBack !== "string") {
      res.status(400).json({ error: "Missing or invalid query parameters." });
      return;
    }

    const card = findCard(cardFront, cardBack);
    if (!card) {
      res.status(404).json({ error: "Card not found." });
      return;
    }

    const hint = getHint(card);
    console.log(`[Hint] Requested hint for ${cardFront}`);
    res.json({ hint });
  } catch (error) {
    res.status(500).json({ error: "Failed to get hint." });
  }
});

app.get("/api/progress", (req, res) => {
  try {
    const buckets = getBuckets();
    const history = getHistory();
    const progress = computeProgress(buckets, history);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: "Failed to compute progress." });
  }
});

app.post("/api/day/next", (req: Request, res: Response) => {
  try {
    incrementDay();
    const newDay = getCurrentDay();
    console.log(`[Day] Advanced to Day ${newDay}`);
    // Return only the currentDay field
    res.status(200).json({ currentDay: newDay });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to advance day." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
