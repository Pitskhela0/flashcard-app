import request from "supertest";
import { expect } from "chai";

import { app } from "../src/server";
import { describe, it } from "node:test";
import { equal } from "assert";

/*
Test for Flashcard API endpoint: /api/flashcards
*/
describe("Flashcard API Endpoint: /api/flashcards", () => {
  // test for post request
  describe("POST /api/flashcards", async () => {
    it("should return 201 Created and the new flashcard when given valid data", async () => {
      const validFlashcardData = {
        front: "What is Supertest?",
        back: "A library for testing Node.js HTTP servers.",
        hint: "Think integration testing for APIs",
      };
      const response = await request(app)
        .post("/api/flashcards")
        .set("Accept", "application/json")
        .send(validFlashcardData);

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property("front", validFlashcardData.front);
      expect(response.body).to.have.property("back", validFlashcardData.back);
      expect(response.body).to.have.property("hint", validFlashcardData.hint);
    });
    it("should return 400 bad request when given invalid data", async () => {
      const invalidFlashcardData = {
        front: "What is Supertest",
        hint: "Think integration testing for APIs",
      };

      const response = await request(app)
        .post("/api/flashcards")
        .send(invalidFlashcardData);
      
        expect(response.status).to.equal(400); 
        expect(response.body).to.have.property("error", "invalid data was sent");
    });
  });
});
