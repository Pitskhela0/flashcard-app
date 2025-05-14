import express, { Request, Response } from "express";
import cors from "cors";
import axios from "axios"; // installed
import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();


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

import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules (equivalent to __dirname in CommonJS)



interface UpdateRequestBody {
  cardFront: string;
  cardBack: string;
  difficulty: AnswerDifficulty;
}

interface GenerateRequestBody {
  prompt: string;
}

interface GenerateResponseBody {
  back: string;
  hint: string;
}

// API key for OpenAI - store in environment variables in production
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const app = express();

const PORT = process.env.PORT || 3001;

app.use(cors());

app.use(express.json());

/**
 * Handles POST requests on the `/api/flashcards` endpoint to create a new flashcard.
 *
 * Expects a JSON request body containing `front` (string) and `back` (string).
 * An optional `hint` (string) can also be included.
 *
 * Validation checks:
 * - Ensures `front` and `back` are provided and are non-empty strings.
 *
 * Responses:
 * - On Success: Sends a `201 Created` status code and returns the newly created
 *   flashcard object as JSON in the response body.
 * - On Validation Error: Sends a `400 Bad Request` status code with a JSON body:
 *   `{ error: "invalid data was sent" }`.
 * - On Internal Server Error: Sends a `500 Internal Server Error` status code with a JSON body:
 *   `{ error: "Internal server error" }`.
 *
 * @param  req - The Express request object. Expected `req.body` to contain flashcard data.
 * @param  res - The Express response object used to send the response.
 */
app.post("/api/flashcards", (req, res) => {
  try {
    const { front, back, hint } = req.body;
    if (
      !front ||
      !back ||
      typeof front !== "string" ||
      typeof back !== "string"
    ) {
      res.status(400).json({ error: "invalid data was sent" });
      return;
    }
    const newFlashcard = {
      front: front,
      back: back,
      hint: hint,
    };
    addFlashcard(newFlashcard);

    res.status(201).json(newFlashcard);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * flashcard generation endpoint
 * that directly mirrors the successful test script structure.
 */
app.post("/api/generate", (req: Request, res: Response) => {
    (async () => {
      try {
        const { prompt } = req.body;
        
        if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
          return res.status(400).json({ error: "A valid prompt is required" });
        }
  
        console.log(`[Generate] Processing prompt: "${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}"`);
        
        // Use axios to call OpenAI API - matching the structure of the successful test
        const openaiResponse = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "You are a helpful flashcard creator. Generate concise content for the back of a flashcard and a hint based on the front text. The back should clearly explain the concept, and the hint should give a clue without revealing the answer."
              },
              {
                role: "user",
                content: `Generate flashcard content for: "${prompt}". Return JSON with "back" and "hint" fields.`
              }
            ],
            temperature: 0.7
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
  
        // Extract the content from the response
        const messageContent = openaiResponse.data.choices[0].message.content;
        console.log("Raw API response content:", messageContent);
        
        // Try to parse the content as JSON
        let contentObj;
        try {
          // Check if the content is already JSON or needs parsing
          if (typeof messageContent === 'string') {
            // Look for JSON object in the string - handles cases where model might include commentary
            const jsonMatch = messageContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              contentObj = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error("Could not find JSON object in response");
            }
          } else {
            contentObj = messageContent;
          }
          
          // Validate the parsed content
          if (!contentObj.back) {
            contentObj.back = "Explanation: " + prompt;
          }
          if (!contentObj.hint) {
            contentObj.hint = "Think about the key concepts related to this topic.";
          }
          
        } catch (parseError) {
          console.error("Failed to parse JSON from API response:", parseError);
          console.log("Attempting to extract content manually");
          
          // Fallback: Manually extract content if JSON parsing fails
          const backMatch = messageContent.match(/back["']?\s*:\s*["']([^"']+)["']/i);
          const hintMatch = messageContent.match(/hint["']?\s*:\s*["']([^"']+)["']/i);
          
          contentObj = {
            back: backMatch ? backMatch[1] : "Explanation: " + prompt,
            hint: hintMatch ? hintMatch[1] : "Consider the key concepts in this topic."
          };
        }
        
        console.log("[Generate] Successfully generated content");
        
        // Return the processed content
        res.json({
          back: contentObj.back,
          hint: contentObj.hint
        });
        
      } catch (error: any) {
        console.error("OpenAI API error:", error);
        console.error("Error details:", error.response?.data || error.message);
        
        res.status(502).json({ 
          error: "Failed to generate content from AI service",
          details: error.response?.data?.error?.message || error.message
        });
      }
    })();
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
// Make sure you have body parsing middleware enabled
app.use(express.json());

// Variable to store the most recent data
let mostRecentData = "";

// Endpoint to receive data
app.post('/api/create-answer', (req, res) => {
  const { data } = req.body;
  
  if (data) {
    // Store the data
    mostRecentData = data;
    console.log("Received data:", data);
    res.status(200).json({ success: true, message: "Data received" });
  } else {
    res.status(400).json({ success: false, message: "No data provided" });
  }
});

// Endpoint to get the most recent data
app.get('/api/get-answer', (req, res) => {
  res.status(200).json({ data: mostRecentData });
});



// Handle all frontend routes (if needed)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});


app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
});
