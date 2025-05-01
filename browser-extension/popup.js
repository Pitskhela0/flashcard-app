/**
 * Sets up the popup's functionality once the HTML DOM is fully loaded.
 * This includes getting element references, attempting to load selected text
 * from storage, setting up input validation, and adding button event listeners.
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
    /** @type {HTMLButtonElement|null} Button to trigger AI generation. */
    const aiGeneratorButton = document.getElementById("ai-generator-button");
  
    /** Key used to retrieve selected text from chrome.storage.local */
    const storageKey = "selectedTextForPopup";
    
    /** API endpoint for the flashcard backend service */
    const flashcardApiUrl = "http://localhost:3001/api/flashcards";
    
    /** API endpoint for AI generation (replace with your actual AI API endpoint) */
    const aiApiUrl = "http://localhost:3001/api/generate";
  
    // Check if core elements needed for functionality are found.
    if (!frontInput || !backInput || !saveButton || !aiGeneratorButton) {
      console.error(
        "Error: Could not find all required form elements."
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
        // Check if we can click on save button
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
  
    
    /**
     * Checks if we have entered valid sendable inputs. 
     * Front and back fields must not be empty.
     * Enables or disables save button according to validation result.
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
      
      // Also validate if the AI Generator button should be enabled
      // (only enable if we have front text)
      aiGeneratorButton.disabled = !frontValue;
    }
    
    // Listen to the change in input fields front and back to validate the inputs
    frontInput.addEventListener("input", validateInputs);
    backInput.addEventListener("input", validateInputs);
  
    /**
     * Handles AI Generator button click.
     * Sends the front text to an AI API and populates the back and hint fields
     * with the generated content.
     * @listens click
     */
    aiGeneratorButton.addEventListener("click", async () => {
      const frontValue = frontInput.value.trim();
      
      // Don't proceed if front is empty
      if (!frontValue) {
        messageArea.textContent = "Please enter text in the front field first.";
        messageArea.className = "error";
        return;
      }
      
      // Disable buttons and show loading message
      aiGeneratorButton.disabled = true;
      saveButton.disabled = true;
      messageArea.textContent = "Generating content...";
      messageArea.className = "processing";

      console.log("aaaaaaaaaaaaa");
      
      try {
        // Prepare data for the AI API
        const requestData = {
          prompt: frontValue
        };
        
        // Call the AI API
        const response = await fetch(aiApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });

        console.log("I am called");
        
        if (response.ok) {

          const data = await response.json();
          console.log("response is okay");
          
          // Populate the fields with the AI response
          backInput.value = data.back || "";
          hintInput.value = data.hint || "";
          
          // Show success message
          messageArea.textContent = "Content generated successfully!";
          messageArea.className = "success";
          
          // Validate inputs to enable save button if needed
          validateInputs();
        } else {
            // Get the error details
    let errorText = "";
    try {
      const errorData = await response.json();
      console.error("Error data:", errorData);
      errorText = errorData.error || errorData.details || "Unknown error";
    } catch (parseError) {
      console.error("Couldn't parse error response:", parseError);
      errorText = await response.text();
      console.error("Raw error response:", errorText);
    }
    
    messageArea.textContent = `Generation failed (${response.status}): ${errorText}`;
    messageArea.className = "error";
    
    // Re-enable the AI button
    aiGeneratorButton.disabled = false;
        }
      } catch (error) {
        // Handle network errors
        console.error("Network error or fetch failed:", error);
        messageArea.textContent = "Network error. Is the AI service running?";
        messageArea.className = "error";
        aiGeneratorButton.disabled = !frontValue;
      } finally {
        // Always re-validate inputs in case anything changed
        validateInputs();
      }
    });
  
    /**
     * Handles save button click.
     * Creates sendable data from input fields,
     * makes fetch request to backend to create flashcards,
     * after receiving response either shows success or error message.
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
  
      saveButton.disabled = true;
      aiGeneratorButton.disabled = true;
      messageArea.textContent = "Saving..."; // Provide immediate feedback
      messageArea.className = "processing";
      
      try {
        // Perform the fetch API call
        const response = await fetch(flashcardApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(flashcardData),
        });
  
        console.log("Received response:", response);
        
        if (response.ok) {
          console.log("Flashcard saved successfully! Status:", response.status);
          
          messageArea.textContent = "Success!";
          messageArea.className = "success"; 
  
          // Clear input fields
          frontInput.value = "";
          backInput.value = "";
          hintInput.value = "";
          
          // Close popup window after 1 second from submission
          setTimeout(() => {
            window.close(); 
          }, 1000);
        } else {
          console.error("Failed to save flashcard. Status:", response.status);
          
          const errorData = await response
            .json()
            .catch(() => ({ error: "Failed to parse error response" })); 
          
          messageArea.textContent = `Error: ${response.statusText} - ${
            errorData.error || "Unknown error"
          }`;
          messageArea.className = "error";
          
          // Re-enable buttons
          validateInputs();
        }
      } catch (error) {
        // Handle network problems 
        console.error("Network error or fetch failed:", error);
        messageArea.textContent = "Network error. Is the backend server running?";
        messageArea.className = "error";
        
        // Re-enable buttons
        validateInputs();
      }
    });
  });