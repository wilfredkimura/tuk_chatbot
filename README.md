# TUK Chatbot - Powered by Google Gemini

![TUK Logo](https://tukenya.ac.ke/sites/default/files/logo_0.png)

An advanced, RAG-powered chatbot designed for the students and staff of **The Technical University of Kenya**, powered by **Google Gemini 1.5 Flash**.

## 🚀 Features

- **Instant Answers**: Get immediate responses to questions about courses, fees, and campus life.
- **Powered by Gemini**: Utilizes Google's latest high-speed Gemini 1.5 Flash model for intelligent reasoning.
- **Academic Knowledge Base**: Powered by a custom-built retrieval system that understands TUK's official documents.
- **Memory & Personalization**: Remembers your previous interactions to provide better assistance.
- **Real-time Streaming**: Responses appear instantly as they are generated.
- **Local Intelligence**: Uses high-performance local embeddings (Transformers.js) for secure and fast document processing.

## 🛠️ Tech Stack

- **Large Language Model**: Google Gemini 1.5 Flash
- **Frontend**: Next.js 15 (App Router), Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB (Mongoose)
- **Vector Search**: Local Transformer-based embeddings (`all-MiniLM-L6-v2`)

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env.local` file:
   ```env
   MONGODB_URI=your_mongodb_uri
   AI_API_KEY=your_gemini_api_key
   NEXTAUTH_SECRET=your_secret
   ```

4. **Ingest Data**:
   Place your documents in `data/knowledge/` and visit `/api/admin/ingest` to sync the knowledge base.

5. **Run the app**:
   ```bash
   npm run dev
   ```

## 📄 License

Internal use for The Technical University of Kenya.