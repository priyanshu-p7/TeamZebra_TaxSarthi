// ================= CONFIG =================
// To use this, set the key in your HTML before loading this script:
// <script>window.GEMINI_API_KEY = "YOUR_REAL_KEY";</script>
// <script src="bot.js" defer></script>
const API_KEY = (window.GEMINI_API_KEY || "").trim();

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash"
];

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
  if (!chatbotWindow.style.display || chatbotWindow.style.display === "none") {
    chatbotWindow.style.display = "flex";
  } else {
    chatbotWindow.style.display = "none";
  }
}

// ================= INSERT SUGGESTION =================
function insertSuggestion(element) {
  input.value = element.textContent.trim();
  input.focus();
  sendMessage();
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
function toSimpleBullets(text) {
  const clean = (text || "").replace(/\*/g, "").trim();
  if (!clean) return "";

  const lines = clean
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-�\d.)\s]+/, "").trim())
    .filter(Boolean);

  if (lines.length >= 2) {
    return lines.slice(0, 6).map((line) => `\u2022 ${line}`).join("\n");
  }

  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);

  return sentences.map((s) => `\u2022 ${s}`).join("\n");
}

async function tryGenerateWithModel(modelName, prompt) {
  console.log(`Sending request to Gemini using ${modelName}...`);

  const response = await fetch(
    `${API_BASE}/models/${modelName}:generateContent?key=${encodeURIComponent(API_KEY)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function discoverGenerateModel() {
  const response = await fetch(`${API_BASE}/models?key=${encodeURIComponent(API_KEY)}`);
  if (!response.ok) return null;

  const data = await response.json().catch(() => ({}));
  const models = data?.models || [];

  const match = models.find((m) => {
    const methods = m?.supportedGenerationMethods || [];
    return methods.includes("generateContent");
  });

  if (!match?.name) return null;
  return match.name.replace(/^models\//, "");
}

async function generateWithFallback(prompt) {
  const tried = [];

  for (const model of MODEL_CANDIDATES) {
    tried.push(model);
    const { response, data } = await tryGenerateWithModel(model, prompt);

    if (response.ok) {
      return {
        text: data?.candidates?.[0]?.content?.parts?.[0]?.text,
        model
      };
    }

    if (response.status !== 404) {
      const apiMessage = data?.error?.message || `HTTP ${response.status}`;
      throw new Error(`API error (${model}): ${apiMessage}`);
    }
  }

  const discoveredModel = await discoverGenerateModel();
  if (discoveredModel && !tried.includes(discoveredModel)) {
    const { response, data } = await tryGenerateWithModel(discoveredModel, prompt);
    if (response.ok) {
      return {
        text: data?.candidates?.[0]?.content?.parts?.[0]?.text,
        model: discoveredModel
      };
    }

    const apiMessage = data?.error?.message || `HTTP ${response.status}`;
    throw new Error(`API error (${discoveredModel}): ${apiMessage}`);
  }

  throw new Error("No available Gemini text model found for this API key/project.");
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
      addMessage("bot", "Missing API key. Please configure window.GEMINI_API_KEY.");
      return;
    }

    const prompt = `You are an expert Indian tax advisor.
User Question: "${message}"
Answer in very simple Indian English.
Return 4 to 6 short bullet points.
Each bullet should be one sentence.
No markdown symbols like * or #.
Use plain lines starting with a bullet point.`;

    const result = await generateWithFallback(prompt);
    const botReply = result?.text?.trim();

    if (botReply) {
      addMessage("bot", toSimpleBullets(botReply));
    } else {
      addMessage("bot", "Unable to process your request right now. Please try again.");
    }
  } catch (error) {
    console.error("Error:", error);
    addMessage("bot", `Error processing your request: ${error.message}`);
  } finally {
    removeTyping();
    setLoading(false);
  }
}



