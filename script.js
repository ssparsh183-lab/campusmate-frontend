const BASE_URL = "https://campusmate-backend-axne.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    loadMemory();

    document.getElementById("userInput").addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            processQuery();
        }
    });
});


// ---------------- MEMORY ----------------

function loadMemory() {
    fetch(`${BASE_URL}/memory/1`)
        .then(res => res.json())
        .then(data => {
            if (!data.error) {
                document.getElementById("memory-hostel").innerText =
                    data.hostel || "N/A";

                document.getElementById("memory-complaint").innerText =
                    data.last_complaint || "No complaints";

                document.getElementById("memory-destination").innerText =
                    data.recent_destination || "No recent location";
            }
        })
        .catch(err => console.error("Memory error:", err));
}


// ---------------- QUERY ----------------

function processQuery() {

    const input = document.getElementById("userInput");
    const query = input.value.trim();
    if (!query) return;

    const chatBox = document.getElementById("responseCard");

    const conversation = document.createElement("div");
    conversation.classList.add("conversation-block");

    const userMsg = document.createElement("p");
    userMsg.classList.add("user-msg");
    userMsg.innerHTML = "🧑‍🎓 You: " + query;

    const thinkingMsg = document.createElement("p");
    thinkingMsg.classList.add("ai-msg");
    thinkingMsg.innerHTML = "🤖 CampusMate is thinking...";

    conversation.appendChild(userMsg);
    conversation.appendChild(thinkingMsg);
    chatBox.prepend(conversation);

    fetch(`${BASE_URL}/intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: 1, message: query })
    })
    .then(res => res.json())
    .then(data => {

        conversation.removeChild(thinkingMsg);

        if (!data.success) {
            const errorMsg = document.createElement("p");
            errorMsg.classList.add("ai-msg");
            errorMsg.innerText = "Error: " + data.error;
            conversation.appendChild(errorMsg);
            return;
        }

        loadMemory();

        const aiMsg = document.createElement("p");
        aiMsg.classList.add("ai-msg");
        aiMsg.innerHTML = "🤖 CampusMate: " + data.message;
        conversation.appendChild(aiMsg);

        speakResponse(data.message);

    })
    .catch(err => console.error("Backend error:", err));

    input.value = "";
}


// ---------------- SPEAK ----------------

function speakResponse(text) {
    if (!text) return;

    fetch(`${BASE_URL}/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
    })
    .then(res => res.blob())
    .then(blob => {
        const audio = new Audio(URL.createObjectURL(blob));
        audio.play();
    })
    .catch(err => console.error("Voice error:", err));
}


// ---------------- VOICE INPUT ----------------

function startListening() {

    const voiceStatus = document.getElementById("voice-status");
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Speech recognition only works in Google Chrome.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.start();

    recognition.onstart = () => {
        voiceStatus.innerText = "🎙 Listening...";
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById("userInput").value = transcript;
        voiceStatus.innerText = "You said: " + transcript;
        processQuery();
    };

    recognition.onerror = (event) => {
        console.error(event.error);
        voiceStatus.innerText = "Mic error";
    };

    recognition.onend = () => {
        voiceStatus.innerText = "Tap to speak";
    };
}