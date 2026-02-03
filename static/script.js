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
    document.getElementById("start-view").style.display = "none";
    document.getElementById("question-view").style.display = "block";
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
    document.getElementById("chat-messages").innerHTML = "";
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

    const messages = document.getElementById("chat-messages");
    messages.innerHTML += `<div><b>You:</b> ${msg}</div>`;

    console.log("Sending chat with context:", currentContext);

    fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, context: currentContext })
    })
        .then(res => res.json())
        .then(data => {
            const reply = data.reply.trim();
            if (reply.startsWith("NAVIGATE:")) {
                const sectionId = reply.split(":")[1].trim();
                const section = document.querySelector(sectionId);
                if (section) {
                    messages.innerHTML += `<div><b>AI:</b> Navigating to section...</div>`;
                    section.scrollIntoView({ behavior: 'smooth' });
                } else {
                    messages.innerHTML += `<div><b>AI:</b> I couldn't find that section.</div>`;
                }
            } else {
                messages.innerHTML += `<div><b>AI:</b> ${reply}</div>`;
            }
            messages.scrollTop = messages.scrollHeight;
        });

    input.value = "";
}
