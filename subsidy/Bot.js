const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash"
];
const GEMINI_API_KEY = "AIzaSyAmFu5VKHyXQu1BQ3Ln5VtPC05cawP5Q9M";

const input = document.getElementById("userInput");
input.addEventListener("keypress", function (event) {
  if (event.key === "Enter") sendMessage();
});

let typingInterval;
let typingMsg;

function toggleChatbot() {
  const chatbotWindow = document.getElementById("chatbot-window");
  chatbotWindow.style.display = chatbotWindow.style.display === "none" ? "flex" : "none";
}

function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  addMessage("user", message);
  showTyping();
  processQuery(message);
  input.value = "";
}

function addMessage(sender, text) {
  const chatBox = document.getElementById("chatBox");
  const msg = document.createElement("div");
  msg.className = `msg ${sender}`;
  msg.innerText = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping() {
  const chatBox = document.getElementById("chatBox");
  typingMsg = document.createElement("div");
  typingMsg.className = "msg bot typing";
  typingMsg.innerText = "Typing";
  chatBox.appendChild(typingMsg);
  chatBox.scrollTop = chatBox.scrollHeight;

  let dotCount = 0;
  typingInterval = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    typingMsg.innerText = "Typing" + ".".repeat(dotCount);
  }, 500);
}

function removeTyping() {
  clearInterval(typingInterval);
  if (typingMsg) {
    typingMsg.remove();
    typingMsg = null;
  }
}

async function processQuery(message) {
  const msg = message.toLowerCase();

  // Greetings
  if (["hi", "hii", "hiii"].includes(msg)) {
    removeTyping();
    addMessage("bot", "Hello, ask your query about government schemes.");
    return;
  }
  if (["hello", "hey"].includes(msg)) {
    removeTyping();
    addMessage("bot", "Hi, ask your query about government schemes.");
    return;
  }
  if (msg.includes("how are you")) {
    removeTyping();
    addMessage("bot", "I am fine, ask your query about government schemes.");
    return;
  }

  if (msg.includes("okay")) {
    removeTyping();
    addMessage("bot", "Yes😊");
    return;
  }

  // Help
  if (
    msg.includes("how can you help") ||
    msg.includes("can you help") ||
    msg.includes("what can you do") ||
    msg.includes("how will you help") ||
    msg.includes("how could you help")
  ) {
    removeTyping();
    addMessage("bot", "I am here to help you about government schemes.");
    return;
  }

  // Check if message is scheme-related
  const isSchemeRelated = /(scheme|yojna|government|benefit|subsidy|support|loan|education|income|eligible|student|farmer|health|old|age|income)/i.test(msg);
  if (!isSchemeRelated) {
    removeTyping();
    addMessage("bot", "Please ask me about government schemes.");
    return;
  }

  // Extract filters
  const ageMatch = msg.match(/(\d{1,3})\s*(years?|yrs?)\s*old/i);
  const incomeMatch = msg.match(/income.*?(\d+(\.\d+)?)/i);

  const age = ageMatch ? ageMatch[1] : null;
  const income = incomeMatch ? incomeMatch[1] : null;

  let filters = "";
  if (age) filters += `Age: ${age} years.\n`;
  if (income) filters += `Annual Income: ₹${income} lakhs.\n`;

  const prompt = `You are a helpful assistant that suggests Indian government schemes based on age, income, and eligibility.
Respond only if the question is about Indian government schemes.

User details:
${filters || "No specific filters provided."}

User question: "${message}"

Only list schemes that match the filters above. If no filters apply, suggest general schemes. Remove all markdown formatting.`;

  try {
    const response = await fetch(`${API_BASE}/models/${MODEL_CANDIDATES[0]}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    const data = await response.json();
    removeTyping();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (reply) {
      const cleanReply = reply.replace(/\*/g, '').trim();
      addMessage("bot", cleanReply);
    } else {
      addMessage("bot", "Sorry, I couldn't get that. Please try again later.");
    }
  } catch (err) {
    console.error(err);
    removeTyping();
    addMessage("bot", "Something went wrong while contacting Gemini.");
  }
}

