function submitAnswer() {
    const answer = document.getElementById("answerInput").value;

    fetch("/submit-answer", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({answer})
    })
    .then(res => res.json())
    .then(data => {
        const feedback = document.getElementById("feedback");
        if (data.status === "correct") {
            feedback.style.color = "green";
            feedback.innerText = data.message;
            document.getElementById("question").innerText = data.next_question;
            document.getElementById("answerInput").value = "";
        } else {
            feedback.style.color = "red";
            feedback.innerText = data.message;
        }
    });
}

function toggleChat() {
    const panel = document.getElementById("chat-panel");
    panel.style.display = panel.style.display === "none" ? "block" : "none";
}

function clearChat() {
    document.getElementById("chat-messages").innerHTML = "";
}


function sendChat() {
    const msg = document.getElementById("chatInput").value;
    const messages = document.getElementById("chat-messages");

    messages.innerHTML += `<div><b>You:</b> ${msg}</div>`;

    fetch("/chat", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({message: msg})
    })
    .then(res => res.json())
    .then(data => {
        messages.innerHTML += `<div><b>AI:</b> ${data.reply}</div>`;
        messages.scrollTop = messages.scrollHeight;
    });

    document.getElementById("chatInput").value = "";
}
