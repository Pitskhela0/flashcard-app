document.addEventListener('mouseup', () => {
    const selectedText = window.getSelection().toString();
    if (selectedText && selectedText.trim() !== '') {
        console.log('Selected:', selectedText);
    }
});
