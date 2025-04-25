// creates element to appear when text is selected
const selectionIcon = document.createElement("span");

selectionIcon.setAttribute("id", "flashcard-helper-icon");

selectionIcon.textContent = "➕";

//styling element
selectionIcon.style.position = "absolute";
selectionIcon.style.display = "none";
selectionIcon.style.zIndex = "9999";
selectionIcon.style.cursor = "pointer";
selectionIcon.style.background = "lightblue";
selectionIcon.style.padding = "2px 5px";
selectionIcon.style.borderRadius = "3px";
selectionIcon.style.fontSize = "14px";

// inject in body of given website
document.body.appendChild(selectionIcon);

// key in chrome local storage where selected text is saved
const STORAGE_KEY = "selectedTextForPopup";

/**
 * takes selected string and adds to local storage
 * shows its icon when text is selected;
 * @listens mouseup
 */
document.addEventListener(
  "mouseup",
  () => {
    // takes selected text
    const selectedText = window.getSelection().toString();

    if (selectedText && selectedText.trim() !== "") {
      console.log("Text selected:", selectedText);

      // saves the selected text in chrome local storage
      storeSelectedText(selectedText);

      // get the selection details to position the icon
      const selection = window.getSelection();

      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Calculate absolute position on the page, slightly offset
        const topPos = rect.bottom + window.scrollY + 5; // 5px below selection end

        const leftPos = rect.right + window.scrollX + 5; // 5px right of selection end


        // Apply position and make icon visible
        selectionIcon.style.top = `${topPos}px`;
        selectionIcon.style.left = `${leftPos}px`;

        selectionIcon.style.display = "block";
      }
    } else {
      // Hide icon if error occurs
      selectionIcon.style.display = "none";
      // remove text from storage
      clearSelectedTextFromStorage();
    }
  },
  10
);

/**
 * handles clicking anywhere
 * removes icon from webpage and selected text if present from storage
 */
document.addEventListener("mousedown", handleMouseDown);

function handleMouseDown() {
  selectionIcon.style.display = "none";

  clearSelectedTextFromStorage();
}


/**
 * takes selected text and puts it in chrome storage so it can be accessed from popup.js
 * @param text the string which is selected on webpage 
 *  
 */
function storeSelectedText(text) {
  chrome.storage.local.set({ [STORAGE_KEY]: text }, () => {
    if (chrome.runtime.lastError) {
      console.error("Error setting selected text in storage");
    } else {
      console.log("Selected text stored:", text);
    }
  });
}

// removes the selected string from chrome storage
function clearSelectedTextFromStorage() {
  chrome.storage.local.remove(STORAGE_KEY, () => {
    if (chrome.runtime.lastError) {
      console.error(
        "Error removing selected text from storage:",
        chrome.runtime.lastError
      );
    } else {
      console.log("Cleared selected text from storage.");
    }
  });
}
