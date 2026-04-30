# TUK Chatbot: RAG Architecture Documentation

## 1. Overview
The TUK Chatbot has been upgraded to a **Retrieval-Augmented Generation (RAG)** architecture. This system allows the bot to handle massive amounts of university data (PDFs, JSON, TXT) without hitting LLM token limits or suffering from "hallucinations."

## 2. Data Distribution & Lifecycle

### Step 1: Ingestion (`/data/knowledge`)
All raw data files (PDFs, JSON, TXT) are stored in the `data/knowledge` directory. This is the "Source of Truth."

### Step 2: Processing & Chunking
When the ingestion API is called, the [documentProcessor.ts](file:///c:/Users/DENNISMUTUKU/Desktop/tuk_chatbot/src/lib/documentProcessor.ts) performs the following:
- **Parsing**: Extracts text from PDFs and structured data from JSON.
- **Chunking**: Breaks long text into ~1000 character pieces. This ensures that the context provided to the AI is specific and focused.
- **Embedding**: Each chunk is sent to the **Gemini Embedding API** (`text-embedding-004`), which converts the text into a 768-dimensional numerical vector.

### Step 3: Distribution (MongoDB)
The processed data is stored in the `Knowledge` collection in MongoDB:
- **`content`**: The actual text chunk.
- **`embedding`**: The numerical vector used for semantic search.
- **`category`**: The source filename (to track where the info came from).

## 3. Retrieval Mechanism
When a user asks a question:
1. The system generates an embedding for the **user's query**.
2. It performs a **Cosine Similarity** search against all stored chunks in MongoDB.
3. It retrieves the **Top 3 most relevant** chunks.
4. These chunks are injected into the LLM's system prompt as "Verified Context."

## 4. Strict Knowledge Constraint
The model is governed by a **"Closed-Knowledge" policy**. 

> [!IMPORTANT]
> The bot is strictly instructed to **only** answer using the information provided in the RAG context. If the information is not present in the retrieved chunks, it must politely decline to answer and direct the user to official TUK contacts.

## 5. System Prompt Efficiency
By moving ~95% of the university data to the RAG system, we have achieved:
- **Lower Latency**: Faster response times.
- **Lower Costs**: Reduced token usage per message.
- **Higher Accuracy**: The bot no longer guesses details about fees or admissions; it only reports what it finds in your documents.
