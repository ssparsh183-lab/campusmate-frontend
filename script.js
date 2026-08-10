// ✅ ✅ ✅ LIVE BACKEND URL
const BASE_URL = "https://campusmate-backend-axne.onrender.com";

const responseText = document.getElementById("responseText");
const voiceStatus = document.getElementById("voice-status");

// ------------------------------
// TEXT QUERY
// ------------------------------

function processQuery() {

    const input = document.getElementById("userInput");
    const query = input.value.trim();
    if (query === "") return;

    const chatBox = document.getElementById("responseCard");

    const defaultMsg = document.getElementById("responseText");
    if (defaultMsg) defaultMsg.remove();

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
        body: JSON.stringify({
            student_id: 1,
            message: query
        })
    })
    .then(res => res.json())
    .then(data => {

        conversation.removeChild(thinkingMsg);

        if (!data.success) {
            const errorMsg = document.createElement("p");
            errorMsg.classList.add("ai-msg");
            errorMsg.innerHTML = "Error: " + data.error;
            conversation.appendChild(errorMsg);
            return;
        }

        const speakingMsg = document.createElement("p");
        speakingMsg.classList.add("ai-msg");
        speakingMsg.innerHTML = "🔊 CampusMate is speaking...";
        conversation.appendChild(speakingMsg);

        speakResponse(data.message).then(() => {

            conversation.removeChild(speakingMsg);

            const aiMsg = document.createElement("p");
            aiMsg.classList.add("ai-msg");
            aiMsg.innerHTML = "🤖 CampusMate: " + data.message;
            conversation.appendChild(aiMsg);

        });

    })
    .catch(err => {
        conversation.removeChild(thinkingMsg);

        const errorMsg = document.createElement("p");
        errorMsg.classList.add("ai-msg");
        errorMsg.innerHTML = "Backend connection failed.";
        conversation.appendChild(errorMsg);

        console.error(err);
    });

    input.value = "";
}


// ------------------------------
// DAILY BRIEFING
// ------------------------------

function showBriefing() {

    fetch(`${BASE_URL}/intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            student_id: 1,
            message: "Good morning"
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            responseText.innerHTML = data.message;
        } else {
            responseText.innerHTML = "Error: " + data.error;
        }
    })
    .catch(err => {
        responseText.innerHTML = "Backend connection failed.";
        console.error(err);
    });
}


// ------------------------------
// VOICE
// ------------------------------

function speakResponse(text) {

    if (!text || !text.trim()) return Promise.resolve();

    return fetch(`${BASE_URL}/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text })
    })
    .then(res => {
        if (!res.ok) throw new Error("Voice generation failed");
        return res.blob();
    })
    .then(blob => {
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);

        return new Promise(resolve => {
            audio.onended = resolve;
            audio.play();
        });
    })
    .catch(err => {
        console.error("Voice error:", err);
    });
}


// ✅ Enter key
document.getElementById("userInput").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        processQuery();
    }
});