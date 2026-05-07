# Technical & Operational Manual: TUK AI Chatbot System
**Date:** May 7, 2026  
**Subject:** Deep-Dive into RAG Architecture, Data Lifecycle, and Token Management  

---

## 1. Abstract
The TUK Chatbot is a sophisticated **Retrieval-Augmented Generation (RAG)** system designed to provide accurate, real-time information about The Technical University of Kenya (TUK). Unlike standard AI bots that "guess" answers (hallucination), this system operates on a "closed-knowledge" principle, meaning it only answers based on verified university documents.

## 2. The Core Architecture
Our system is built on a modern "Full-Stack AI" infrastructure:
*   **Frontend & Logic:** Built with **Next.js**, handling the user interface and the orchestration of data between the user and the AI.
*   **The Brain:** Powered by **Google Gemini (Flash series)**. We use `gemini-3-flash-preview` for high-speed, intelligent reasoning.
*   **The Memory (Database):** **MongoDB** serves as our primary storage for chat history, user preferences, and the massive library of university knowledge.

---

## 3. Data Lifecycle: From Document to Intelligence
One of the most important parts of this system is how we handle data. We don't just "upload" a PDF; we transform it into machine-understandable math.

### Step A: The Source of Truth
All data starts in the `/data/knowledge` folder. These are raw files like:
*   **PDFs:** Fee structures, admission letters, rules.
*   **JSON:** Structured data like course codes or department lists.
*   **TXT:** General announcements.

### Step B: The "Meat Grinder" (Processing)
When we ingest data, the system performs **Chunking**. A 50-page PDF is too big for an AI to "read" at once. We break it into small pieces (chunks) of about 1000 characters each. This ensures we only give the AI the exact paragraph it needs to answer a specific question.

### Step C: Vectorization (The Secret Sauce)
Computers don't read English; they read numbers. Each text chunk is sent to the **Gemini Embedding API**. It converts the text into a **768-dimensional vector** (a long list of numbers). 
*   *Example:* The word "Admission" and "Enrollment" will have vectors that are numerically "close" to each other.

---

## 4. How the System Functions (The Flow)
When a student types: *"What are the fees for Engineering?"*

1.  **Request:** Next.js sends the question to the `/api/chat` route.
2.  **Search:** The system converts the student's question into a vector.
3.  **Retrieval:** It searches MongoDB for text chunks whose vectors are most similar to the question's vector.
4.  **Injection:** It picks the Top 2 or 3 most relevant paragraphs (e.g., the exact Engineering fee table).
5.  **Generation:** It sends the **System Instructions** + **The Found Chunks** + **The Question** to Gemini.
6.  **Response:** Gemini reads the chunks and writes a friendly reply.

---

## 5. Token Data: The Currency of AI
In our system, we don't measure data in "Megabytes" but in **Tokens**. 1,000 tokens is roughly 750 words.

### What Token Data Looks Like
Every time a message is sent, the system records exactly how much "effort" was used. Here is how the data is stored in our database:

```json
"usage": {
  "promptTokens": 1450,    // The size of the instructions + retrieved knowledge
  "completionTokens": 210, // The size of the bot's answer
  "totalTokens": 1660      // The total cost of this interaction
}
```

### Why this matters?
*   **Prompt Tokens:** These are expensive. By using RAG, we only send the relevant 2 paragraphs instead of the whole 50-page PDF, saving us thousands of tokens per message.
*   **Efficiency:** We cap the context at 5,000 characters to ensure the bot remains fast and cost-effective.

---

## 6. Personalization & Memory
The system doesn't just forget you. It uses a **Memory Model**. If you mention you are an "Engineering student," the system saves this in a dedicated `Memory` collection in MongoDB.

*   **Stored Data:** `keyDetails: ["Interested in Engineering", "Asked about admissions"]`
*   **Result:** The next time you say "Hi," the bot remembers your context and provides a more personalized experience.

---

## 7. Security & Constraints
To prevent the bot from talking about things it shouldn't (like politics or other universities), we implemented a **Strict Knowledge Constraint**. 
*   If the information is **NOT** in our retrieved MongoDB chunks, the bot is programmed to say: *"I am sorry, but I don't have official information on that. Please contact the TUK administration."*

---

## 8. Summary for Non-Tech Members
Think of the system as a **Librarian**:
1.  The **Knowledge Base** is the library (our data files).
2.  The **Vectors** are the Index Cards that tell the librarian where every book is.
3.  The **RAG System** is the librarian who goes to the shelf, finds the exact page you need, and reads it to you.
4.  **Next.js** is the desk where you talk to the librarian.
5.  **Tokens** are the "ink and paper" used to write down the answer.

---
*End of Manual*
