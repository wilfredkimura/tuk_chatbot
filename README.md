# TUK Chatbot - Official Academic Assistant

![TUK Logo](https://tukenya.ac.ke/sites/default/files/logo_0.png)

An advanced, RAG-powered chatbot designed for the students and staff of **The Technical University of Kenya**.

## 🚀 Features

- **Instant Answers**: Get immediate responses to questions about courses, fees, and campus life.
- **Academic Knowledge Base**: Powered by a custom-built retrieval system that understands TUK's official documents.
- **Memory & Personalization**: Remembers your previous interactions to provide better assistance.
- **Real-time Streaming**: Responses appear instantly as they are generated.
- **Local Intelligence**: Uses high-performance local embeddings for secure and fast document processing.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB (Mongoose)
- **AI Core**: Advanced Large Language Models (LLMs) with RAG (Retrieval-Augmented Generation)
- **Vector Search**: Local Transformer-based embeddings

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
   AI_API_KEY=your_api_key
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