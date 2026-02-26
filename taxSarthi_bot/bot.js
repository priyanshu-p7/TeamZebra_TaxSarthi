// ================= CONFIG =================
// Prefer setting the key from outside this file:
// window.GEMINI_API_KEY = "your_key";
const API_KEY = (window.GEMINI_API_KEY || "AIzaSyAqdUBsa7dMdWtc9c9D6elTqhuccKTmcBk").trim();
const MODEL_NAME = "gemini-2.0-flash";

// ================= DOM ELEMENTS =================
const input = document.getElementById("userInput");
const chatBox = document.getElementById("chatBox");
const sendBtn = document.getElementById("sendBtn");

if (input) {
  input.addEventListener("keypress", function (event) {
    if (event.key === "Enter") sendMessage();
  });
}

let typingInterval;
let typingMsg;
let isProcessing = false;

// ================= TOGGLE CHATBOT =================
function toggleChatbot() {
  const chatbotWindow = document.getElementById("chatbot-window");
  chatbotWindow.style.display = chatbotWindow.style.display === "flex" ? "none" : "flex";
}

// ================= INSERT SUGGESTION =================
function insertSuggestion(element) {
  input.value = element.textContent.trim();
  input.focus();
}

// ================= SEND MESSAGE =================
function sendMessage() {
  if (isProcessing) return;

  const message = input.value.trim();
  if (!message) return;

  const suggestionBox = document.getElementById("suggestions");
  if (suggestionBox) suggestionBox.style.display = "none";

  addMessage("user", message);
  showTyping();
  input.value = "";
  processQuery(message);
}

// ================= ADD MESSAGE =================
function addMessage(sender, text) {
  const msg = document.createElement("div");
  msg.className = `msg ${sender}`;
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ================= TYPING EFFECT =================
function showTyping() {
  typingMsg = document.createElement("div");
  typingMsg.className = "msg bot typing";
  typingMsg.textContent = "Typing";
  chatBox.appendChild(typingMsg);
  chatBox.scrollTop = chatBox.scrollHeight;

  let dotCount = 0;
  typingInterval = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    typingMsg.textContent = "Typing" + ".".repeat(dotCount);
  }, 500);
}

function removeTyping() {
  clearInterval(typingInterval);
  if (typingMsg) {
    typingMsg.remove();
    typingMsg = null;
  }
}

function setLoading(loading) {
  isProcessing = loading;
  if (sendBtn) sendBtn.disabled = loading;
  if (input) input.disabled = loading;
}

// ================= MAIN LOGIC =================
async function processQuery(message) {
  try {
    setLoading(true);
    const msg = message.toLowerCase();

    if (["hi", "hello", "hey"].includes(msg)) {
      addMessage("bot", "Hello! Ask me about tax saving and government schemes.");
      return;
    }

    const isRelevant = /(tax|deduction|80c|80d|income|salary|itr|scheme|subsidy|government)/i.test(msg);

    if (!isRelevant) {
      addMessage("bot", "I can help with tax saving and government schemes. Please ask something related to tax.");
      return;
    }

    if (!API_KEY) {
      addMessage("bot", "Missing API key. Set window.GEMINI_API_KEY before loading this page.");
      return;
    }

    const prompt = `You are an expert Indian tax advisor.\nUser Question: "${message}"\nExplain in simple language without markdown.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${encodeURIComponent(API_KEY)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const apiMessage = data?.error?.message || `HTTP ${response.status}`;
      addMessage("bot", `API error: ${apiMessage}`);
      return;
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (reply) {
      addMessage("bot", reply.replace(/\*/g, "").trim());
    } else {
      addMessage("bot", "Sorry, I couldn't generate a response. Empty model output received.");
    }
  } catch (error) {
    addMessage("bot", `Something went wrong: ${error.message || "Unknown error"}`);
  } finally {
    removeTyping();
    setLoading(false);
  }
}
