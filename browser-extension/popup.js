/**
 * Sets up the popup's functionality once the HTML DOM is fully loaded.
 * This includes getting element references, attempting to load selected text
 * from storage, setting up input validation, and adding the save button listener.
 * @listens DOMContentLoaded
 */

document.addEventListener("DOMContentLoaded", () => {
  /**  @type {HTMLTextAreaElement|null} Textarea for the flashcards front */
  const frontInput = document.getElementById("front-input");
  /**  @type {HTMLTextAreaElement|null} Textarea for the flashcards back */

  const backInput = document.getElementById("back-input");
  /**  @type {HTMLTextAreaElement|null} Textarea for the flashcards hint */

  const hintInput = document.getElementById("hint-input");
  /**  @type {HTMLDivElement|null} Area to display success or error messages. */

  const messageArea = document.getElementById("message-area");
  /** @type {HTMLButtonElement|null} Button to trigger saving the flashcard. */
  const saveButton = document.getElementById("save-button");

  /** Key used to retrieve selected text from chrome.storage.local */
  const storageKey = "selectedTextForPopup";

  // check if core elements needed for functionality are found.
  if (!frontInput || !backInput || !saveButton) {
    console.error(
      "Error: Could not find all required form elements (front, back, save button)."
    );
    return;
  }

  // Asynchronously gets the text that might have been saved by the content script.
  chrome.storage.local.get([storageKey], (result) => {
    if (chrome.runtime.lastError) {
      console.error(
        "Error retrieving text from storage:",
        chrome.runtime.lastError
      );
      return;
    }
    const selectedText = result[storageKey];

    // If text was found in storage:
    if (selectedText) {
      frontInput.value = selectedText;
      // check if we can click on save button
      validateInputs();

      // Remove the text from storage immediately after using it,
      // so it's not reused accidentally next time the popup opens.
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
  
  /**  checks if we have entered valid sendable inputs. 
   * front and back fields must not be empty.
   * according to that disables or enables save button.
   * 
  */

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
  
  // listens to the change in input fields front and back to validate the inputs;
  frontInput.addEventListener("input", validateInputs);
  backInput.addEventListener("input", validateInputs);


  /**
   *
   * handles save button click
   * creates sendable data from input fields
   * makes fetch request to backend to create flashcards
   * after receiving response either shows success or error message
   * uses asynch function because it awaits for fetch
   * @listens click
   */
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

      
     
      if (response.ok) {
        
        console.log("Flashcard saved successfully! Status:", response.status);
        
        messageArea.textContent = "Success!";
        messageArea.className = "success"; 

        
        // clear input fields
        frontInput.value = "";
        backInput.value = "";
        hintInput.value = "";
        
        // close popup window after 1 second from submition
        setTimeout(() => {
          window.close(); 
        }, 1000);
      } else {
        console.error("Failed to save flashcard. Status:", response.status);
        // Basic error message (will be improved in P2.8)
        const errorData = await response
          .json()
          .catch(() => ({ error: "Failed to parse error response" })); 
        messageArea.textContent = `Error: ${response.statusText} - ${
          errorData.error || "Unknown error"
        }`;
        messageArea.className = "error";
        saveButton.disabled = false; 
      }
    } catch (error) {
      // handle network problems 
      console.error("Network error or fetch failed:", error);
      messageArea.textContent = "Network error. Is the backend server running?";
      messageArea.className = "error";
      saveButton.disabled = false; 
    }
  });
});
