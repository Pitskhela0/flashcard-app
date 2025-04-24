const selectionIcon = document.createElement("span");

selectionIcon.setAttribute("id", "flashcard-helper-icon");

selectionIcon.textContent = "➕";

//initial styles
selectionIcon.style.position = "absolute";
selectionIcon.style.display = "none";
selectionIcon.style.zIndex = "9999";
selectionIcon.style.cursor = "pointer";
selectionIcon.style.background = "lightblue";
selectionIcon.style.padding = "2px 5px";
selectionIcon.style.borderRadius = "3px";
selectionIcon.style.fontSize = "14px";


document.body.appendChild(selectionIcon);

document.addEventListener(
  "mouseup",
  () => {
    const selectedText = window.getSelection().toString();

    if (selectedText && selectedText.trim() !== "") {
      console.log("Text selected:", selectedText);

      const selection = window.getSelection();

      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        const topPos = rect.bottom + window.scrollY + 5;

        const leftPos = rect.right + window.scrollX + 5;

        selectionIcon.style.top = `${topPos}px`;
        selectionIcon.style.left = `${leftPos}px`;

        selectionIcon.style.display = "block";
      }
    } else {
      selectionIcon.style.display = "none";
    }
  },
  10
);
document.addEventListener("mousedown", handleMouseDown);

function handleMouseDown() {
  selectionIcon.style.display = "none";
}
