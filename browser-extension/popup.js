document.addEventListener("DOMContentLoaded", () => {
  const frontInput = document.getElementById("front-input");
  const backInput = document.getElementById("back-input");
  const hintInput = document.getElementById("hint-input");
  const messageArea = document.getElementById("message-area");
  const saveButton = document.getElementById("save-button");

  const storageKey = "selectedTextForPopup";
  if (!frontInput || !backInput || !saveButton) {
    console.error(
      "Error: Could not find all required form elements (front, back, save button)."
    );
    return; // Stop execution if elements are missing
  }
  chrome.storage.local.get([storageKey], (result) => {
    if (chrome.runtime.lastError) {
      console.error(
        "Error retrieving text from storage:",
        chrome.runtime.lastError
      );
      return;
    }
    const selectedText = result[storageKey];

    if (selectedText) {
      frontInput.value = selectedText;
      validateInputs();
      chrome.storage.local.remove(storageKey, () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error removing text after retrieval:",
            chrome.runtime.lastError
          );
        } else {
          console.log("Cleared storage after populating input.");
        }
      });
    } else {
      validateInputs();
    }
  });

  function validateInputs() {
    const frontValue = frontInput.value.trim();
    const backValue = backInput.value.trim();

    if (frontValue && backValue) {
      saveButton.disabled = false;
      console.log("Validation: Inputs valid, button enabled.");
    } else {
      saveButton.disabled = true;
      console.log("Validation: Inputs invalid, button disabled.");
    }
  }

  frontInput.addEventListener("input", validateInputs);
  backInput.addEventListener("input", validateInputs);

  saveButton.addEventListener("click", async () => {
    const frontValue = frontInput.value;
    const backValue = backInput.value;
    const hintValue = hintInput.value;

    const flashcardData = {
      front: frontValue,
      back: backValue,
      ...(hintValue && { hint: hintValue }), // Use spread syntax conditionally
    };

    const apiUrl = "http://localhost:3001/api/flashcards";

    saveButton.disabled = true;
    messageArea.textContent = "Saving..."; // Provide immediate feedback
    messageArea.className = "";
    try {
      // --- Perform the fetch API call ---
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 'Accept': 'application/json' // Often good practice, but not always essential
        },
        body: JSON.stringify(flashcardData), // Convert JS object to JSON string
      });

      console.log("Received response:", response);

      // --- P2.8 will handle this response properly ---
      // For now, just log basic status
      if (response.ok) {
        // response.ok is true if status is 200-299
        console.log("Flashcard saved successfully! Status:", response.status);
        // Basic success message (will be improved in P2.8)
        messageArea.textContent = "Success!";
        messageArea.className = "success"; // Use CSS class for styling

        frontInput.value = "";
        backInput.value = "";
        hintInput.value = "";

        setTimeout(() => {
          window.close(); // Close the popup window
        }, 1000);
      } else {
        console.error("Failed to save flashcard. Status:", response.status);
        // Basic error message (will be improved in P2.8)
        const errorData = await response
          .json()
          .catch(() => ({ error: "Failed to parse error response" })); // Try to get error message from body
        messageArea.textContent = `Error: ${response.statusText} - ${
          errorData.error || "Unknown error"
        }`;
        messageArea.className = "error"; // Use CSS class for styling
        saveButton.disabled = false; // Re-enable button on failure
      }
    } catch (error) {
      // --- Handle Network Errors ---
      console.error("Network error or fetch failed:", error);
      messageArea.textContent = "Network error. Is the backend server running?";
      messageArea.className = "error";
      saveButton.disabled = false; // Re-enable button on network failure
    }
  });
});
