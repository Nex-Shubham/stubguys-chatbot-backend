# 🚀 StubGuys AI Chatbot Backend

This is the high-performance backend server for the StubGuys AI Chatbot. It uses a **RAG (Retrieval-Augmented Generation)** architecture to provide accurate, location-aware responses about events using Google's Gemini AI.

---

## 🏗️ Core Features
- **RAG Engine**: Combines real-time knowledge retrieval with Generative AI.
- **AI Model**: Google Gemini 1.5 Flash for fast and smart responses.
- **Vector Search**: OpenSearch integration for similarity-based data fetching.
- **Location Filtering**: Dynamically adjusts event suggestions based on user coordinates (Lat/Lng).
- **Session Persistence**: Maintains conversation context for up to 10 messages per session.
- **Streaming API**: Efficiently streams AI responses to the client for better UX.

---

## 🛠️ Technical Stack
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Orchestration**: LangChain
- **AI Provider**: Google Generative AI
- **Database**: OpenSearch (Vector) & Local History (JSON)

---

## ⚙️ Environment Variables
Create a `.env` file in the root directory with the following:

```env
# Server Config
PORT=5000

# AI Config
GEMINI_API_KEY=your_google_gemini_api_key

# OpenSearch Config (Vector DB)
OPENSEARCH_NODE=https://your-opensearch-node-url
OPENSEARCH_USERNAME=your_username
OPENSEARCH_PASSWORD=your_password

# Database (Optional for Chat, used for Prisma/Booking)
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
```

---

## 🚦 API Endpoints

### 1. AI Chat (Streaming)
- **Endpoint**: `POST /api/chat`
- **Body**:
  ```json
  {
    "message": "Tell me about upcoming events",
    "sessionId": "user-session-123",
    "lat": 28.6139,
    "lng": 77.2090
  }
  ```
- **Response**: Text Stream (text/plain)

### 2. Health Check
- **Endpoint**: `GET /health`
- **Response**: `AI Chatbot is Healthy 🚀`

---

## 🌐 Deployment on Render
1. **Repository**: Push your code to GitHub/GitLab.
2. **New Service**: Create a new **Web Service** on Render.
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. **Configuration**: Manually add all variables from `.env` to the **Environment** section in Render.

---

## 🧹 Maintenance
To keep the project clean, temporary files like logs and scratch scripts have been removed. The active code resides in:
- `src/controllers/`: Request handling logic.
- `src/services/`: Core AI and RAG logic.
- `src/routes/`: Endpoint definitions.

---
© 2026 STUBGUYS | POWERED BY MODERN ARCHITECTURE
