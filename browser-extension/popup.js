document.addEventListener("DOMContentLoaded", () => {
  const frontInput = document.getElementById("front-input");

  const storageKey = "selectedTextForPopup";

  if (!frontInput) {
    console.error("Could not find 'front-input' element in popup.html");
    return;
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
      console.log("No selected text found in storage.");
    }
  });
});
