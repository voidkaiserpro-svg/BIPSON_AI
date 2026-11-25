
const input = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");

let recognition = null;
let currentUtterance = null;

// Add a message to the screen
function addMessage(text, sender) {
  const message = document.createElement("div");

  message.className =
    "message " +
    (sender === "user" ? "user-message" : "ai-message");

  message.textContent = text;
  messages.appendChild(message);

  document.getElementById("chatArea").scrollTop =
    document.getElementById("chatArea").scrollHeight;

  return message;
}

// Speak AI response
function speakResponse(text) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.lang = "en-US";
  currentUtterance.rate = 1;

  window.speechSynthesis.speak(currentUtterance);
}

// Send message to BIPSON AI backend
async function sendMessage() {
  const text = input.value.trim();

  if (!text || sendButton.disabled) return;

  welcome.style.display = "none";

  addMessage(text, "user");
  input.value = "";

  const loadingMessage = addMessage(
    "BIPSON is thinking...",
    "ai"
  );

  sendButton.disabled = true;

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/api/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: text
        })
      }
    );

    if (!response.ok) {
      throw new Error("Backend connection failed.");
    }

    const data = await response.json();

    const reply =
      data.reply || "Sorry, I couldn't generate an answer.";

    loadingMessage.textContent = reply;

    speakResponse(reply);

    document.getElementById("chatArea").scrollTop =
      document.getElementById("chatArea").scrollHeight;

  } catch (error) {
    console.error("BIPSON AI Error:", error);

    loadingMessage.textContent =
      "Sorry! BIPSON couldn't connect. " +
      "Please check that Ollama and the backend server are running.";

  } finally {
    sendButton.disabled = false;
  }
}

// Send button
sendButton.addEventListener("click", sendMessage);

// Enter key
input.addEventListener("keydown", function(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

// Suggested prompts
document.querySelectorAll(".suggestion").forEach(button => {
  button.addEventListener("click", () => {
    input.value = button.dataset.prompt;
    sendMessage();
  });
});

// New conversation
document.getElementById("newChat").addEventListener("click", () => {
  messages.innerHTML = "";
  welcome.style.display = "block";

  window.speechSynthesis?.cancel();

  if (recognition) {
    recognition.stop();
  }
});

// Light / dark theme
document.getElementById("themeButton").addEventListener("click", () => {
  document.body.classList.toggle("light");
});

// Mobile sidebar
document.getElementById("menuButton").addEventListener("click", () => {
  document.querySelector(".sidebar").classList.toggle("open");
});

// Voice input
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();

  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = event => {
    input.value = event.results[0][0].transcript;
    sendMessage();
  };

  recognition.onerror = () => {
    addMessage(
      "Voice input was unavailable. Please try typing.",
      "ai"
    );
  };

  document.getElementById("voiceButton").addEventListener("click", () => {
    try {
      recognition.start();
    } catch (error) {
      console.log("Voice recognition is already active.");
    }
  });

} else {
  document.getElementById("voiceButton").addEventListener("click", () => {
    addMessage(
      "Your browser does not support voice recognition.",
      "ai"
    );
  });
}

// Stop speaking
document.getElementById("stopButton").addEventListener("click", () => {
  window.speechSynthesis?.cancel();
});

// Service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then(() => console.log("BIPSON AI Service Worker registered!"))
      .catch(error => console.error("Service Worker error:", error));
  });
}

console.log("BIPSON AI 3.0 interface loaded.");
