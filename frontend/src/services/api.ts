import axios from "axios";
import {
  AnswerDifficulty,
  Flashcard,
  PracticeSession,
  ProgressStats,
  UpdateRequest,
} from "../types";

const API_BASE_URL = "http://localhost:3001/api";
const a = 1;
const apiClient = axios.create({ baseURL: API_BASE_URL });

export const fetchPracticeCards = async (): Promise<PracticeSession> => {
  const response = await apiClient.get("/practice");
  return response.data;
};

// POST /update (submit answer for a flashcard)
export const submitAnswer = async (payload: UpdateRequest): Promise<void> => {
  await apiClient.post("/update",  payload );
};

// GET /hint
export const fetchHint = async (card: Flashcard): Promise<string> => {
  const response = await apiClient.get("/hint", {
    params: { cardFront: card.front, cardBack: card.back },
  });
  return response.data.hint;
};

// GET /progress
export const fetchProgress = async (): Promise<ProgressStats> => {
  const response = await apiClient.get("/progress");
  return response.data;
};


export const advanceDay = async (): Promise<{ currentDay: number }> => {
    const response = await apiClient.post("/day/next");
    // response.data now is { currentDay: number }
    return response.data;
  };
