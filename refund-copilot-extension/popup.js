async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

// This tries to talk to content.js.
// If content.js isn't injected, we inject it and try again.
async function getSelectionFromPage(tabId) {
  // 1) Try to message existing content script
  const firstTry = await new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: "GET_SELECTION" }, (response) => {
      // If there's an error, response will be undefined.
      if (chrome.runtime.lastError) resolve(null);
      else resolve(response);
    });
  });

  if (firstTry?.selectedText !== undefined) return firstTry;

  // 2) If not present, inject content.js into the page, then retry
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"]
  });

  const secondTry = await new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: "GET_SELECTION" }, (response) => {
      if (chrome.runtime.lastError) resolve(null);
      else resolve(response);
    });
  });

  return secondTry;
}

async function loadSelection() {
  const tab = await getActiveTab();
  const textarea = document.getElementById("message");

  // Some pages block injection (chrome://, web store etc.)
  if (!tab?.id) {
    textarea.value = "Could not access this tab.";
    return;
  }

  const res = await getSelectionFromPage(tab.id);

  if (!res) {
    textarea.value =
      "Could not read highlighted text on this page.\nTry a normal website tab (not chrome:// pages) and refresh it.";
    return;
  }

  textarea.value = res.selectedText || "";
}

function mockAI(message) {
  const text = message.toLowerCase();

  let intent = "other";
  let action = "escalate_to_human";

  if (text.includes("where is") || text.includes("tracking") || text.includes("arrive")) {
    intent = "order_status";
    action = "provide_tracking_update";
  } else if (text.includes("refund")) {
    intent = "refund_request";
    action = "ask_for_order_number_and_reason";
  } else if (text.includes("damaged") || text.includes("broken")) {
    intent = "damaged_item";
    action = "request_photos_offer_replacement_or_refund";
  } else if (text.includes("wrong item") || text.includes("incorrect item")) {
    intent = "wrong_item";
    action = "apologize_offer_replacement";
  }

  const reply =
`Hi there — thanks for reaching out.

I’m sorry about this. To help you quickly, could you please confirm:
1) Your order number
2) A photo of the issue (if damaged / incorrect)

Once I have that, I can proceed with the best option (replacement or refund) right away.

Thank you,
Support Team`;

  return { intent, recommended_action: action, reply };
}

async function callBackend(message) {
  try {
    const res = await fetch("http://127.0.0.1:8000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    return data;

  } catch (err) {
    console.error(err);
    return {
      intent: "error",
      recommended_action: "backend_error",
      reply: "Error connecting to backend."
    };
  }
}

function showResult(data) {
  document.getElementById("result").style.display = "block";
  document.getElementById("intent").textContent = data.intent;
  document.getElementById("action").textContent = data.recommended_action;
  document.getElementById("reply").textContent = data.reply;
}

function copyReply() {
  const reply = document.getElementById("reply").textContent || "";
  navigator.clipboard.writeText(reply);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("load").addEventListener("click", loadSelection);

  document.getElementById("generate").addEventListener("click", async () => {
    const message = document.getElementById("message").value.trim();
    if (!message) return;

    const data = await callBackend(message);
    showResult(data);
  });

  document.getElementById("copy").addEventListener("click", copyReply);
});
