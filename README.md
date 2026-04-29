# TUK Chatbot - Institutional Academic Assistant

The official intelligent companion for the Technical University of Kenya, designed to provide accurate and up-to-date information to students, staff, and visitors.

<div align="center">
  <br/>
  <img src="https://img.shields.io/badge/Google%20Gemini-8E75C2?style=for-the-badge&logo=googlegemini&logoColor=white" height="40" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" height="40" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" height="40" />
  <img src="https://img.shields.io/badge/Groq-f55036?style=for-the-badge&logo=fastapi&logoColor=white" height="40" />
  <br/><br/>
</div>

## 🚀 Features

- **TUK Knowledge Base**: Built-in institutional knowledge about faculties, departments, and admissions.
- **Smart Conversations**: Powered by advanced LLMs (Gemini / Groq) for natural interactions.
- **Context Awareness**: Remembers past user interactions to provide personalized support.
- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS.
- **Secure Architecture**: Robust protection against prompt injection and role-play bypass.

## 🛠️ Technology Stack

- **Frontend**: Next.js 15+, React 19, Tailwind CSS
- **Backend**: Next.js Route Handlers
- **AI Engine**: Google Gemini / Groq (Llama 3)
- **Database**: MongoDB Atlas (with Mongoose)
- **Authentication**: NextAuth.js

## ⚙️ Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/dennismutuku2005/tuk_chatbot.git
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file with the following:
   ```env
   MONGODB_URI=your_mongodb_uri
   GROQ_API_KEY=your_groq_api_key
   GEMINI_API_KEY=your_gemini_api_key
   NEXTAUTH_SECRET=your_secret
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

## 📄 License
This project is for use within The Technical University of Kenya ecosystem.