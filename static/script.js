let currentContext = "general";

document.addEventListener("DOMContentLoaded", () => {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                console.log("Visible section:", id);
                if (id === "questions") {
                    currentContext = "questions";
                } else {
                    currentContext = id;
                }
            }
        });
    }, observerOptions);

    document.querySelectorAll('.page-section').forEach((section) => {
        observer.observe(section);
    });
});

function startChallenge() {
    fetch("/start-assessment", { method: "POST" })
        .then(() => {
            document.getElementById("start-view").style.display = "none";
            document.getElementById("question-view").style.display = "block";
        });
}

function restartChallenge() {
    if (!confirm("Are you sure you want to restart? Progress will be lost.")) return;

    fetch("/restart", { method: "POST" })
        .then(res => res.json())
        .then(data => {
            if (data.status === "restarted") {
                const qElem = document.getElementById("question");
                if (qElem) qElem.innerText = data.first_question;

                document.getElementById("feedback").innerText = "";
                document.getElementById("answerInput").value = "";

                document.getElementById("completion-view").style.display = "none";
                document.getElementById("question-view").style.display = "none";
                document.getElementById("start-view").style.display = "block";
            }
        });
}

function submitAnswer() {
    const input = document.getElementById("answerInput");
    const answer = input.value;

    fetch("/submit-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer })
    })
        .then(res => res.json())
        .then(data => {
            const feedback = document.getElementById("feedback");
            if (data.status === "correct") {
                feedback.style.color = "green";
                feedback.innerText = data.message;
                const qElem = document.getElementById("question");

                if (data.next_question === "Assessment complete!") {
                    setTimeout(() => {
                        document.getElementById("question-view").style.display = "none";
                        document.getElementById("completion-view").style.display = "block";
                    }, 1000);
                } else {
                    if (qElem) qElem.innerText = data.next_question;
                }

                input.value = "";
            } else if (data.status === "done") {
                document.getElementById("question-view").style.display = "none";
                document.getElementById("completion-view").style.display = "block";
            } else {
                feedback.style.color = "red";
                feedback.innerText = data.message;
            }
        });
}

function toggleChat() {
    const panel = document.getElementById("chat-panel");
    panel.style.display = panel.style.display === "none" || panel.style.display === "" ? "flex" : "none";
}

function clearChat() {
    // Keep the welcome card but clear other messages?
    // Or just clear everything and show welcome card logic.
    // Simpler: Reset innerHTML to just the welcome card if it exists in source, or just reload page logic.
    // Actually, since we modified layout.html, the welcome card is part of the initial HTML.
    // So we should just clear OTHER messages and ensure welcome card is visible.

    document.getElementById("chat-messages").innerHTML = `
        <div id="welcome-card" class="welcome-card">
            <h3>Hello!</h3>
            <p>I am Echo! Your AI tutor. With my help you will:</p>
            <ul class="welcome-features">
                <li><span class="icon">✨</span> Get real-time insights and suggestions from your actions on virtual machines.</li>
                <li><span class="icon">⏱️</span> Boost your learning speed and efficiency.</li>
                <li><span class="icon">💡</span> Get a better understanding of room concepts and tasks.</li>
            </ul>
            <p class="welcome-footer">Stuck or want to chat? Let me know!</p>
            <div class="welcome-buttons">
                <button class="quick-btn" onclick="sendQuickMessage('I\\'m stuck')">→ I'm stuck</button>
                <button class="quick-btn secondary" onclick="sendQuickMessage('Tell me more about yourself')">? Learn more about me</button>
            </div>
        </div>
    `;
}

function sendQuickMessage(text) {
    const input = document.getElementById("chatInput");
    input.value = text;
    sendChat();
}

function handleKeyPress(event) {
    if (event.key === "Enter") {
        sendChat();
    }
}

function sendChat() {
    const input = document.getElementById("chatInput");
    const msg = input.value;
    if (!msg.trim()) return;

    // Hide welcome card
    const welcomeCard = document.getElementById("welcome-card");
    if (welcomeCard) {
        welcomeCard.style.display = "none";
    }

    const messages = document.getElementById("chat-messages");
    messages.innerHTML += `<div><b>You:</b> ${msg}</div>`;

    // Show typing indicator
    showTypingIndicator();
    messages.scrollTop = messages.scrollHeight;

    console.log("Sending chat with context:", currentContext);

    fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, context: currentContext })
    })
        .then(res => res.json())
        .then(data => {
            // Remove typing indicator
            removeTypingIndicator();

            const reply = data.reply;
            if (reply) {
                messages.innerHTML += `<div><b>AI:</b> ${reply}</div>`;
            }

            if (data.navigation) {
                const sectionId = data.navigation;
                const section = document.querySelector(sectionId);
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth' });
                }
            }
            messages.scrollTop = messages.scrollHeight;
        })
        .catch(err => {
            removeTypingIndicator();
            console.error("Error:", err);
            messages.innerHTML += `<div><b>AI:</b> Sorry, something went wrong.</div>`;
        });

    input.value = "";
    updateCharCount();
}

function showTypingIndicator() {
    const messages = document.getElementById("chat-messages");
    const indicatorId = "typing-indicator";

    // Check if already exists
    if (!document.getElementById(indicatorId)) {
        const indicator = document.createElement("div");
        indicator.id = indicatorId;
        indicator.className = "typing-indicator";
        indicator.innerHTML = "<span></span><span></span><span></span>";
        messages.appendChild(indicator);
    }
}

function removeTypingIndicator() {
    const indicator = document.getElementById("typing-indicator");
    if (indicator) {
        indicator.remove();
    }
}

const chatInput = document.getElementById("chatInput");
if (chatInput) {
    chatInput.addEventListener("input", updateCharCount);
}

function updateCharCount() {
    const input = document.getElementById("chatInput");
    const countDiv = document.getElementById("char-count");
    if (input && countDiv) {
        countDiv.innerText = `${input.value.length}/200`;
    }
}
