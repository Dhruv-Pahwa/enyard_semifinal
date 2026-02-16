let currentContext = "general";


document.addEventListener("DOMContentLoaded", () => {
    // Theme logic
    const toggleBtn = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'light';

    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    toggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    // --- Draggable chatbot icon ---
    initDraggableChatIcon();

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

    // Close chat panel when clicking outside
    document.addEventListener('click', (e) => {
        const panel = document.getElementById('chat-panel');
        const icon = document.getElementById('chatbot-icon');
        if (!panel || panel.style.display === 'none' || panel.style.display === '') return;
        // If click is inside the panel or on the icon, do nothing
        if (panel.contains(e.target) || icon.contains(e.target)) return;
        panel.style.display = 'none';
    });
});

function updateThemeIcon(theme) {
    const toggleBtn = document.getElementById('theme-toggle');
    toggleBtn.innerText = theme === 'light' ? '🌙' : '☀️';
}

// --- Draggable chatbot icon logic ---
function initDraggableChatIcon() {
    const icon = document.getElementById('chatbot-icon');
    if (!icon) return;

    let isDragging = false;
    let wasDragged = false;
    let startX, startY, initialLeft, initialTop;

    const MARGIN = 24;
    const CORNER_NAMES = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
    let cornerIndicators = {};

    // The 4 fixed corner positions
    function getCornerPositions() {
        const iconW = icon.offsetWidth;
        const iconH = icon.offsetHeight;
        return {
            'bottom-right': { left: window.innerWidth - iconW - MARGIN, top: window.innerHeight - iconH - MARGIN },
            'bottom-left': { left: MARGIN, top: window.innerHeight - iconH - MARGIN },
            'top-right': { left: window.innerWidth - iconW - MARGIN, top: MARGIN },
            'top-left': { left: MARGIN, top: MARGIN }
        };
    }

    // Create corner indicator dots
    function createCornerIndicators() {
        const positions = getCornerPositions();
        const iconW = icon.offsetWidth;
        const iconH = icon.offsetHeight;
        CORNER_NAMES.forEach(name => {
            const dot = document.createElement('div');
            dot.className = 'corner-indicator';
            dot.id = 'corner-' + name;
            const pos = positions[name];
            // Center the dot on where the icon center would be
            dot.style.left = (pos.left + iconW / 2) + 'px';
            dot.style.top = (pos.top + iconH / 2) + 'px';
            document.body.appendChild(dot);
            cornerIndicators[name] = dot;
        });
    }

    function showCornerIndicators() {
        const positions = getCornerPositions();
        const iconW = icon.offsetWidth;
        const iconH = icon.offsetHeight;
        CORNER_NAMES.forEach(name => {
            const dot = cornerIndicators[name];
            const pos = positions[name];
            dot.style.left = (pos.left + iconW / 2) + 'px';
            dot.style.top = (pos.top + iconH / 2) + 'px';
            dot.classList.add('visible');
            dot.classList.remove('active');
        });
    }

    function hideCornerIndicators() {
        CORNER_NAMES.forEach(name => {
            cornerIndicators[name].classList.remove('visible', 'active');
        });
    }

    function highlightNearestIndicator(x, y) {
        const nearest = getNearestCorner(x, y);
        CORNER_NAMES.forEach(name => {
            if (name === nearest) {
                cornerIndicators[name].classList.add('active');
            } else {
                cornerIndicators[name].classList.remove('active');
            }
        });
    }

    createCornerIndicators();

    function snapToCorner(corner) {
        const positions = getCornerPositions();
        const pos = positions[corner] || positions['bottom-right'];
        icon.style.transition = 'left 0.35s cubic-bezier(.34,1.56,.64,1), top 0.35s cubic-bezier(.34,1.56,.64,1)';
        icon.style.right = 'auto';
        icon.style.bottom = 'auto';
        icon.style.left = pos.left + 'px';
        icon.style.top = pos.top + 'px';
        localStorage.setItem('chatIconCorner', corner);
        // Reset transition after animation
        setTimeout(() => { icon.style.transition = ''; }, 400);
    }

    function getNearestCorner(x, y) {
        const positions = getCornerPositions();
        let closest = 'bottom-right';
        let minDist = Infinity;
        for (const [name, pos] of Object.entries(positions)) {
            const dist = Math.hypot(x - pos.left, y - pos.top);
            if (dist < minDist) {
                minDist = dist;
                closest = name;
            }
        }
        return closest;
    }

    // Restore saved corner (default: bottom-right)
    const savedCorner = localStorage.getItem('chatIconCorner') || 'bottom-right';
    // Apply position immediately without animation on load
    const initPos = getCornerPositions()[savedCorner];
    icon.style.right = 'auto';
    icon.style.bottom = 'auto';
    icon.style.left = initPos.left + 'px';
    icon.style.top = initPos.top + 'px';

    function onPointerDown(e) {
        if (e.button && e.button !== 0) return;
        isDragging = true;
        wasDragged = false;
        icon.setPointerCapture(e.pointerId);

        const rect = icon.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = rect.left;
        initialTop = rect.top;

        icon.style.transition = 'none';
        icon.style.cursor = 'grabbing';
        e.preventDefault();
    }

    function onPointerMove(e) {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            if (!wasDragged) {
                wasDragged = true;
                // Show corner indicators when actual drag starts
                showCornerIndicators();
            }
        }

        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;

        const iconW = icon.offsetWidth;
        const iconH = icon.offsetHeight;
        newLeft = Math.max(0, Math.min(window.innerWidth - iconW, newLeft));
        newTop = Math.max(0, Math.min(window.innerHeight - iconH, newTop));

        icon.style.right = 'auto';
        icon.style.bottom = 'auto';
        icon.style.left = newLeft + 'px';
        icon.style.top = newTop + 'px';

        // Highlight nearest corner indicator
        if (wasDragged) {
            highlightNearestIndicator(newLeft, newTop);
        }
    }

    function onPointerUp(e) {
        if (!isDragging) return;
        isDragging = false;
        icon.releasePointerCapture(e.pointerId);
        icon.style.cursor = '';

        // Hide corner indicators
        hideCornerIndicators();

        // Snap to the nearest fixed corner
        const currentLeft = parseInt(icon.style.left);
        const currentTop = parseInt(icon.style.top);
        const corner = getNearestCorner(currentLeft, currentTop);
        snapToCorner(corner);

        // Update chat panel after snap animation
        setTimeout(() => updateChatPanelPosition(), 400);
    }

    icon.addEventListener('pointerdown', onPointerDown);
    icon.addEventListener('pointermove', onPointerMove);
    icon.addEventListener('pointerup', onPointerUp);

    // Override the click handler to prevent toggling chat if user was dragging
    icon.removeAttribute('onclick');
    icon.addEventListener('click', (e) => {
        if (wasDragged) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        toggleChat();
    });

    // Re-snap on window resize so it stays in its corner
    window.addEventListener('resize', () => {
        const corner = localStorage.getItem('chatIconCorner') || 'bottom-right';
        const pos = getCornerPositions()[corner];
        icon.style.left = pos.left + 'px';
        icon.style.top = pos.top + 'px';
        updateChatPanelPosition();
    });
}

function updateChatPanelPosition() {
    const icon = document.getElementById('chatbot-icon');
    const panel = document.getElementById('chat-panel');
    if (!icon || !panel) return;

    const rect = icon.getBoundingClientRect();
    const panelW = 380;
    const panelH = panel.offsetHeight || 500;
    const corner = localStorage.getItem('chatIconCorner') || 'bottom-right';

    // Place panel above icon for bottom corners, below for top corners
    let panelTop;
    if (corner.startsWith('top')) {
        panelTop = rect.bottom + 12;
    } else {
        panelTop = rect.top - panelH - 12;
        if (panelTop < 10) panelTop = rect.bottom + 12;
    }

    // Align panel horizontally: towards the center of the screen
    let panelLeft;
    if (corner.endsWith('left')) {
        panelLeft = rect.left;
    } else {
        panelLeft = rect.right - panelW;
    }
    panelLeft = Math.max(10, Math.min(window.innerWidth - panelW - 10, panelLeft));

    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    panel.style.left = panelLeft + 'px';
    panel.style.top = panelTop + 'px';
}

function detectThemeCommand(msg) {
    const lower = msg.toLowerCase().trim();

    // Patterns for dark mode
    const darkPatterns = [
        /\b(turn\s+on|enable|activate|switch\s+to|go\s+to|set)\s+(the\s+)?dark\s*(mode|theme)?\b/,
        /\bdark\s*(mode|theme)\s*(on|please|enable|activate)?\b/,
        /\bmake\s+it\s+dark\b/,
        /\bi\s+want\s+dark\s*(mode|theme)?\b/
    ];

    // Patterns for light mode
    const lightPatterns = [
        /\b(turn\s+on|enable|activate|switch\s+to|go\s+to|set)\s+(the\s+)?light\s*(mode|theme)?\b/,
        /\blight\s*(mode|theme)\s*(on|please|enable|activate)?\b/,
        /\b(turn\s+off|disable|deactivate)\s+(the\s+)?dark\s*(mode|theme)?\b/,
        /\bdark\s*(mode|theme)\s*(off|disable|deactivate)\b/,
        /\bmake\s+it\s+light\b/,
        /\bi\s+want\s+light\s*(mode|theme)?\b/
    ];

    for (const pattern of darkPatterns) {
        if (pattern.test(lower)) return 'dark';
    }
    for (const pattern of lightPatterns) {
        if (pattern.test(lower)) return 'light';
    }

    return null;
}

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
    const isHidden = panel.style.display === "none" || panel.style.display === "";
    panel.style.display = isHidden ? "flex" : "none";
    if (isHidden) {
        updateChatPanelPosition();
    }
}

function clearChat() {
    document.getElementById("chat-messages").innerHTML = `
        <div id="welcome-card" class="welcome-card">
            <h3>Hello! <span class="emoji">👋</span></h3>
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

    // User message bubble
    const userMsgDiv = document.createElement("div");
    userMsgDiv.className = "message-bubble user-message";
    userMsgDiv.innerHTML = `<b>You:</b> ${msg}`;
    messages.appendChild(userMsgDiv);

    // Check for local theme commands
    const themeAction = detectThemeCommand(msg);
    let themeHandledLocally = false;

    if (themeAction) {
        // Apply theme immediately
        applyTheme(themeAction);
        themeHandledLocally = true;
    }

    // Check if the message is PURELY a theme command (nothing else meaningful)
    const strippedMsg = msg.replace(/turn\s+on|enable|activate|switch\s+to|go\s+to|set|the|please|mode|theme|dark|light|make\s+it|i\s+want/gi, '').trim();
    const isPurelyThemeCommand = themeHandledLocally && strippedMsg.length < 3;

    if (isPurelyThemeCommand) {
        // Only a theme command — no need to call the API
        const confirmMsg = themeAction === 'dark'
            ? "🌙 Dark mode activated! Easy on the eyes, right?"
            : "☀️ Light mode activated! Bright and fresh.";

        const aiMsgDiv = document.createElement("div");
        aiMsgDiv.className = "message-bubble ai-message";
        aiMsgDiv.innerHTML = `<b>AI:</b> ${confirmMsg}`;
        messages.appendChild(aiMsgDiv);
        messages.scrollTop = messages.scrollHeight;

        input.value = "";
        updateCharCount();
        return;
    }

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

            // Handle theme from API response (if not already handled locally)
            if (data.theme && !themeHandledLocally) {
                applyTheme(data.theme);
            }

            // Display reply
            const reply = data.reply;
            if (reply) {
                const aiMsgDiv = document.createElement("div");
                aiMsgDiv.className = "message-bubble ai-message";
                aiMsgDiv.innerHTML = `<b>AI:</b> ${reply}`;
                messages.appendChild(aiMsgDiv);
            }

            // Handle navigation — can be an array of section IDs
            if (data.navigation && Array.isArray(data.navigation) && data.navigation.length > 0) {
                // Scroll to each section sequentially with a delay
                data.navigation.forEach((sectionId, index) => {
                    setTimeout(() => {
                        const section = document.querySelector(sectionId);
                        if (section) {
                            section.scrollIntoView({ behavior: 'smooth' });
                        }
                    }, index * 1500); // 1.5s delay between navigations
                });
            } else if (data.navigation && typeof data.navigation === 'string') {
                // Backward compatibility: single string
                const section = document.querySelector(data.navigation);
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth' });
                }
            }

            messages.scrollTop = messages.scrollHeight;
        })
        .catch(err => {
            removeTypingIndicator();
            console.error("Error:", err);
            const errorDiv = document.createElement("div");
            errorDiv.className = "message-bubble ai-message";
            errorDiv.innerHTML = `<b>AI:</b> Sorry, something went wrong.`;
            messages.appendChild(errorDiv);
        });

    input.value = "";
    updateCharCount();
}

// Helper: Apply theme and update the icon
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeIcon(theme);
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
        countDiv.innerText = `${input.value.length}/100`;
    }
}
