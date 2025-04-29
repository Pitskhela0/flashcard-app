
// --- Element Creation & Styling ---
const selectionIcon = document.createElement("span");
selectionIcon.setAttribute("id", "flashcard-helper-icon");
selectionIcon.textContent = "➕";
selectionIcon.style.position = "absolute";
selectionIcon.style.display = "none"; // Start hidden
selectionIcon.style.zIndex = "9999";
selectionIcon.style.cursor = "pointer";
selectionIcon.style.background = "lightblue";
selectionIcon.style.padding = "2px 5px";
selectionIcon.style.borderRadius = "3px";
selectionIcon.style.fontSize = "14px";
selectionIcon.style.userSelect = 'none'; // Prevent selecting the icon

document.body.appendChild(selectionIcon);

// --- Storage Key ---
const STORAGE_KEY = "selectedTextForPopup";

// --- Event Listeners ---
document.addEventListener('mouseup', handleDocMouseUp);
selectionIcon.addEventListener('click', handleIconClick);
document.addEventListener('mousedown', handleDocMouseDown);

// --- Functions ---

/**
 * Handles clicks specifically ON the selection icon.
 * Prevents the document mousedown handler from firing immediately.
 * Sends a message to the background script to open the popup.
 * @param {MouseEvent} event - The click event object
 */
function handleIconClick(event) {
  // Stop the click from bubbling up to the document's mousedown listener
  event.stopPropagation();
  console.log("Icon clicked! Requesting popup open...");

  // Send a message to the background script
  chrome.runtime.sendMessage({ action: "openPopupFromContentScript" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Error sending message:", chrome.runtime.lastError.message);
    } else if (response && response.success) {
      console.log("Background script confirmed popup opened (or attempt).");
      // Hide icon AFTER successful communication ensures popup has a chance to read storage
       selectionIcon.style.display = 'none';
    } else {
      console.warn("Background script did not report success opening popup:", response);
    }
  });
}

/**
 * Handles mouseup event ANYWHERE on the document.
 * Shows icon if text is selected, unless the mouseup was on the icon itself.
 * @param {MouseEvent} event
 */
function handleDocMouseUp(event) {
   // If mouseup happened on the icon, do nothing here.
   // The 'click' handler takes precedence for interaction.
   if (selectionIcon.contains(event.target)) {
       console.log("Mouseup target is within the icon, ignoring in document listener.");
       return;
   }

  // Use a small delay to ensure selection state is stable after mouseup
  setTimeout(() => {
    const selectedText = window.getSelection()?.toString() || "";

    if (selectedText && selectedText.trim() !== "") {
      console.log("Text selected:", selectedText);
      storeSelectedText(selectedText);
      positionAndShowIcon(); // Function to calculate position and set display: block
    } else {
      // If no text selected AND the icon is currently visible, hide it.
      // We DON'T clear storage here - that's handled by mousedown outside.
      if (selectionIcon.style.display === 'block') {
         console.log("Mouseup with no text selection, hiding icon.");
         selectionIcon.style.display = 'none';
      }
    }
  }, 10); // 10ms delay
}


/**
 * Calculates position and shows the icon.
 */
function positionAndShowIcon() {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const topPos = rect.bottom + window.scrollY + 5;
    const leftPos = rect.right + window.scrollX + 5; // Adjust as needed

    selectionIcon.style.top = `${topPos}px`;
    selectionIcon.style.left = `${leftPos}px`;
    selectionIcon.style.display = "block";
    console.log("Icon positioned and shown.");
  } else {
     console.warn("Could not get selection range to position icon.");
     selectionIcon.style.display = 'none';
  }
}


/**
 * Handles mousedown anywhere on the document.
 * Hides the icon and clears storage ONLY if the mousedown
 * was NOT on or inside the selection icon AND the icon is currently visible.
 * @param {MouseEvent} event The mousedown event object
 */
function handleDocMouseDown(event) {
  // Check if the target is the icon or inside it
  if (selectionIcon.contains(event.target)) {
    console.log("Mousedown target is within the icon, ignoring in document listener.");
    return; // Do nothing if click started on the icon
  }

  // If mousedown was truly outside AND the icon is visible
  if (selectionIcon.style.display === 'block') {
    console.log("Mousedown truly outside icon while visible, hiding and clearing storage.");
    selectionIcon.style.display = 'none'; // Hide the icon
    clearSelectedTextFromStorage(); // Clear storage because user clicked away
  }
}

/**
 * Stores the selected text in chrome.storage.local.
 * @param {string} text - The text string selected by the user.
 */
function storeSelectedText(text) {
  chrome.storage.local.set({ [STORAGE_KEY]: text }, () => {
    if (chrome.runtime.lastError) {
      console.error("Error setting selected text in storage:", chrome.runtime.lastError.message);
    } else {
      console.log("Selected text stored:", text);
    }
  });
}

/**
 * Removes the selected text key from chrome.storage.local.
 */
function clearSelectedTextFromStorage() {
  chrome.storage.local.remove(STORAGE_KEY, () => {
    if (chrome.runtime.lastError) {
      if (chrome.runtime.lastError.message && chrome.runtime.lastError.message !== "Key not found") {
         console.error("Error clearing selected text:", chrome.runtime.lastError.message);
      }
    } else {
      console.log("Cleared selected text key from storage (if it existed).");
    }
  });
}