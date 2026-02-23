// content.js runs inside the webpage you are visiting.
// Its job (for MVP) is to read the user's highlighted text and send it back to the popup.

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_SELECTION") {
    const selectedText = window.getSelection()?.toString()?.trim() || "";
    sendResponse({ selectedText });
  }
  return true; // keeps the message channel open (safe practice)
});
