// background.js

// Listen for messages from content scripts or other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Log received messages for debugging
    console.log("Background script received message:", message);
  
    // Check if the message action is the one we expect from the content script
    if (message.action === "openPopupFromContentScript") {
      console.log("Received request to open popup.");
  
      // Use the chrome.action API (for Manifest V3) to open the popup
      chrome.action.openPopup({}, (popupWindow) => {
        // This callback function runs after attempting to open the popup
  
        if (chrome.runtime.lastError) {
          // Log an error if opening failed
          console.error("Error opening popup:", chrome.runtime.lastError.message);
          // Send a failure response back to the content script
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          // Log success if opening worked
          console.log("Popup opened successfully.");
          // Send a success response back to the content script
          sendResponse({ success: true });
        }
      });
  
      // IMPORTANT: Return true to indicate you will send a response asynchronously.
      // This keeps the message channel open until sendResponse is called inside the callback.
      return true;
    }
  
    // If the message action wasn't handled, you might want to indicate that.
    // Otherwise, the message channel closes automatically if you don't return true.
  });
  
  // Optional: Log that the background script has loaded
  console.log("Flashcard Helper Background Script Loaded.");