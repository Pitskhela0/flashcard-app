/**
 * API Service Module
 * 
 * Specifications:
 * - Provides interface functions for all backend API interactions
 * - Implements consistent error handling across all API calls
 * - Uses Axios for HTTP requests with base URL configuration
 * - Exposes typed functions for each API endpoint
 * - Includes functions for:
 *   - Fetching practice cards for the current session
 *   - Submitting answers/ratings for flashcards
 *   - Fetching hints for difficult cards
 *   - Retrieving progress statistics
 *   - Advancing to the next day's practice session
 */
import axios from "axios";
import {
  AnswerDifficulty,
  Flashcard,
  PracticeSession,
  ProgressStats,
  UpdateRequest,
} from "../types";

/**
 * API Base URL
 * 
 * Specifications:
 * - Base URL for all API requests
 * - Can be configured for different environments (dev, test, prod)
 */
const API_BASE_URL = "http://56.228.27.159:3000/api";

/**
 * API Client Instance
 * 
 * Specifications:
 * - Pre-configured Axios instance for making API requests
 * - Uses consistent base URL for all requests
 * - Could be extended with auth headers, timeout settings, etc.
 */
const apiClient = axios.create({ baseURL: API_BASE_URL });

/**
 * Fetch Practice Cards
 * 
 * Specifications:
 * - Retrieves the current set of flashcards for practice
 * - Returns the cards array and current day number
 * - GET /api/practice endpoint
 * 
 * @returns Promise resolving to PracticeSession object with cards and day
 */
export const fetchPracticeCards = async (): Promise<PracticeSession> => {
  const response = await apiClient.get("/practice");
  return response.data;
};

/**
 * Submit Answer
 * 
 * Specifications:
 * - Sends a card rating to the server after user answers
 * - Takes card front/back text and difficulty rating
 * - POST /api/update endpoint
 * 
 * @param payload The update request with card info and difficulty rating
 * @returns Promise resolving to void on success
 */
export const submitAnswer = async (payload: UpdateRequest): Promise<void> => {
  await apiClient.post("/update",  payload );
};

/**
 * Fetch Hint
 * 
 * Specifications:
 * - Retrieves a hint for a specific flashcard
 * - Uses card front/back text to identify the card
 * - GET /api/hint endpoint with query parameters
 * 
 * @param card The flashcard to get a hint for
 * @returns Promise resolving to hint string
 */
export const fetchHint = async (card: Flashcard): Promise<string> => {
  const response = await apiClient.get("/hint", {
    params: { cardFront: card.front, cardBack: card.back },
  });
  return response.data.hint;
};

/**
 * Fetch Progress
 * 
 * Specifications:
 * - Retrieves the user's overall learning progress statistics
 * - Includes metrics like mastered cards, correctness rate, etc.
 * - GET /api/progress endpoint
 * 
 * @returns Promise resolving to ProgressStats object
 */
export const fetchProgress = async (): Promise<ProgressStats> => {
  const response = await apiClient.get("/progress");
  return response.data;
};

/**
 * Advance Day
 * 
 * Specifications:
 * - Advances the spaced repetition system to the next day
 * - Returns the new current day number
 * - POST /api/day/next endpoint
 * 
 * @returns Promise resolving to object with currentDay number
 */
export const advanceDay = async (): Promise<{ currentDay: number }> => {
    const response = await apiClient.post("/day/next");
    // response.data now is { currentDay: number }
    return response.data;
  };