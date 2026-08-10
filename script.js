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

                const navText = data.recent_destination
                    ? `Last visited: ${data.recent_destination}`
                    : "No recent navigation history.";
                document.getElementById("nav-card-text").innerText = navText;

                const complaintText = data.last_complaint
                    ? `Last issue: ${data.last_complaint}`
                    : "No complaints filed yet.";
                document.getElementById("complaint-card-text").innerText = complaintText;

                document.getElementById("briefing-card-text").innerText =
                    "Tap to get today's full campus summary.";
            }
        })
        .catch(err => console.error("Memory load error:", err));
}


// ---------------- QUERY ----------------

async function processQuery() {

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

    input.value = "";

    try {
        const response = await fetch(`${BASE_URL}/intent`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ student_id: 1, message: query })
        });

        const data = await response.json();

        conversation.removeChild(thinkingMsg);

        if (!data.success) {
            const errorMsg = document.createElement("p");
            errorMsg.classList.add("ai-msg");
            errorMsg.innerText = "Error: " + data.error;
            conversation.appendChild(errorMsg);
            return;
        }

        loadMemory();

        const speakingMsg = document.createElement("p");
        speakingMsg.classList.add("ai-msg");
        speakingMsg.innerHTML = "🔊 CampusMate is speaking...";
        conversation.appendChild(speakingMsg);

        await speakResponse(data.message);

        conversation.removeChild(speakingMsg);

        const aiMsg = document.createElement("p");
        aiMsg.classList.add("ai-msg");
        aiMsg.innerHTML = "🤖 CampusMate: " + data.message;
        conversation.appendChild(aiMsg);

    } catch (err) {
        console.error("Backend error:", err);
    }
}


// ---------------- SPEAK (SYNCED) ----------------

function speakResponse(text) {

    if (!text) return Promise.resolve();

    return fetch(`${BASE_URL}/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
    })
    .then(res => {
        if (!res.ok) throw new Error("Voice generation failed");
        return res.blob();
    })
    .then(blob => {

        const audio = new Audio(URL.createObjectURL(blob));

        return new Promise((resolve) => {
            audio.onended = resolve;
            audio.play().catch(e => {
                console.error("Audio play error:", e);
                resolve();
            });
        });

    })
    .catch(err => {
        console.error("Voice error:", err);
    });
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