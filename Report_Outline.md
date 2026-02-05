# Project Report Outline: Intelligent Context-Aware AI Chatbot Prototype

## 1. Project Name and Abstract (10 Marks)

**Project Name:** Context-Aware Educational AI Assistant (Prototype)

**Abstract:**
This project focuses on the design and implementation of an advanced, context-aware AI chatbot tailored for interactive web applications. Unlike generic chatbots, this prototype leverages Large Language Models (LLMs) via the Google Gemini API to provide situation-specific guidance rather than broad, unrelated answers. The key technical achievement is the integration of a "Pedagogical Guardrail" system—dynamic prompt engineering that filters user input and restricts the AI to offering hints rather than solutions. The system features a responsive frontend with real-time "thinking" animations to improve user experience (latency masking) and a command-based navigation protocol where the AI can control the web interface (e.g., scrolling to specific sections). While demonstrated within a "Rick and Morty" themed environment, the underlying architecture is content-agnostic and designed to be a universal module for educational or support platforms.

---

## 2. Software Requirement Specification / Tool Specification (5 Marks)

### 2.1 Hardware Requirements
*   **Processor:** Intel Core i5 or equivalent (for smooth local server execution).
*   **Network:** High-speed internet connection (Critical for real-time API communication with Gemini).

### 2.2 Software & Tools Used
*   **Backend Core:** Python 3.x (Flask Framework) for API routing and state management.
*   **AI Engine:** Google Generative AI (Gemini 2.5 Flash Model) for low-latency inference.
*   **Frontend Stack:**
    *   **Logic:** JavaScript (ES6+) for async API calls and DOM manipulation.
    *   **Styling:** Custom CSS with animation support (for the "Thinking..." UI indicators).
*   **Development Tools:** Git for version control, Postman for API testing.

### 2.3 Functional Requirements
*   **Context Awareness:** The chatbot must identify which section of the website the user is visiting (e.g., "Home", "Assessment") and adjust its personality/knowledge base accordingly.
*   **Prompt Injection Defense:** The system must strictly filter out keywords (e.g., "reveal answer", "ignore rules") to maintain operational integrity.
*   **Autonomous Navigation:** The chatbot must be able to interpret natural language requests (e.g., "Take me to the contact page") and execute valid JavaScript navigation commands.
*   **Latency Management:** A visual "Thinking" animation must activate immediately upon user input and persist until the API response is rendered to prevent perceived unresponsive states.

---

## 3. Application Design / Modules (10 Marks)

The system is architected around a centralized "Intelligent Orchestrator" model:

### Module 1: The Context Engine (Backend)
*   **Role:** The brain of the application. It constructs dynamic system prompts based on user session data.
*   **Key Feature:** Dynamic Prompt Injection. Before sending a message to the AI, the engine appends the current user state: `Current_Section={context} + User_Progress={index}`. This ensures the AI "knows" where the user is without the user explaining it.

### Module 2: The Guardrail Layer
*   **Role:** Security and Integrity.
*   **Logic:** Implements the `injection_detected()` algorithm. It pre-scans user input for forbidden distinct patterns before costing API tokens. If a violation is found, a hard-coded refusal is returned instantly, bypassing the LLM.

### Module 3: The Interactive Chat Interface (Frontend)
*   **Role:** User engagement and feedback.
*   **Key Feature:**
    *   **Asynchronous Communication:** Uses Python's `jsonify` and JS `fetch` to update the chat window without reloading the page.
    *   **Thinking State Implementation:** A dedicated UI module that renders a pulsing animation to indicate background processing, crucial for retaining user attention during API calls.
*   **Navigation Bridge:** A command parser in JavaScript that listens for specific tags (e.g., `NAVIGATE: #id`) in the AI's textual response and triggers smooth-scroll behaviors.

---

## 4. Initial Draft (10 Marks)

### 4.1 Introduction
The rise of Large Language Models has enabled conversational interfaces, but most implementations lack *context*. They behave as disconnected text generators. This project aims to bridge that gap by building a chatbot that is deeply integrated into the hosting application's state.

### 4.2 Core Innovations
1.  **"Guide, Don't Solve" Architecture:** The primary goal was to create an AI that can distinguish between *helping* and *solving*. This is achieved through a strict system instruction set (System Prompts) that penalizes direct answer revelation.
2.  **Bi-Directional Control:** Typical chatbots only display text. This prototype implements a two-way control channel: the user communicates with the AI, and the AI communicates with the Interface (ordering it to change views).

### 4.3 Technical Challenges & Solutions
*   **Challenge:** LLM Hallucinations (making up answers).
    *   **Solution:** Constraining the model temperature and providing a strict "Knowledge context" in the prompt ensuring it only discusses provided material.
*   **Challenge:** Latency/Delays.
    *   **Solution:** Implemented a CSS/JS-based "Thinking..." animation. This psychological cue transforms a 2-second delay from a "bug" into "processing time," significantly improving User Experience (UX).

### 4.4 Conclusion
The prototype successfully establishes a framework for Context-Aware AI. By decoupling the "Chat Logic" from the "Content," we created a versatile tool. The result is a chatbot that feels like an integrated part of the website, rather than an external widget pasted on top.
