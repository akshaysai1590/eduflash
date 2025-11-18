# 🎓 EduFlash - Interactive Learning Quiz App

An interactive flashcard quiz application with AI-powered explanations, multiple topics, real-time scoring, and leaderboards.

## ✨ Features

- **📚 Multiple Topics**: Choose from General Knowledge, Math, and Science
- **⏱️ Timed Questions**: 30-second countdown timer for each question
- **🎯 Smart Scoring**: Track your score, rounds, and accuracy
- **💾 Progress Tracking**: Scores and progress saved in localStorage
- **💡 AI Explanations**: Get AI-powered explanations (with fallback to curated content)
- **🏆 Leaderboard**: Compete with others and see top scores
- **📱 Mobile Responsive**: Beautiful UI that works on all devices
- **🎨 Polished Design**: Modern interface with smooth animations

## 🚀 Quick Start (Replit)

This project is ready to run on Replit:

1. Click the **Run** button at the top
2. The app will start automatically on port 3000
3. Open the webview to start learning!

## 🛠️ Local Development

### Prerequisites

- Node.js 14+ installed
- npm or yarn

### Installation

```bash
# Install backend dependencies
cd backend
npm install

# Return to root
cd ..
```

### Running Locally

```bash
# Start the server
cd backend
npm start
```

The server will start on `http://localhost:3000`

## 🔧 Environment Variables

Create a `backend/.env` file based on `backend/.env.example`:

### Optional: AI-Powered Explanations

To enable AI-generated explanations, add one of these API keys:

```env
# OpenAI (recommended)
OPENAI_KEY=your_openai_api_key_here

# OR HuggingFace
HF_KEY=your_huggingface_api_key_here
```

**Getting API Keys:**
- **OpenAI**: https://platform.openai.com/api-keys
- **HuggingFace**: https://huggingface.co/settings/tokens

**Note**: If no API key is provided, the app will use curated explanations from the question banks.

### Optional: Persistent Leaderboard with Firebase

To enable persistent leaderboard storage:

```env
FIREBASE_CONFIG={"apiKey":"xxx","authDomain":"xxx","databaseURL":"xxx","projectId":"xxx"}
```

See `docs/firebase-setup.md` for detailed instructions.

## 📦 Project Structure

```
eduflash/
├── backend/
│   ├── server.js              # Express server with API endpoints
│   ├── services/
│   │   ├── explainProvider.js # AI explanation service with caching
│   │   ├── leaderboard.js     # In-memory leaderboard
│   │   └── leaderboard.firebase.js  # Firebase leaderboard (scaffold)
│   ├── questions/
│   │   ├── general.json       # General knowledge questions
│   │   ├── math.json          # Math questions
│   │   └── science.json       # Science questions
│   └── .env.example           # Environment variables template
├── frontend/
│   ├── index.html            # Main HTML structure
│   ├── script.js             # Frontend logic and API calls
│   └── style.css             # Modern, responsive styling
├── docs/
│   ├── architecture.md       # Architecture overview
│   └── firebase-setup.md     # Firebase integration guide
└── README.md                 # This file
```

## 🌐 Deployment

### Deploy to Vercel (Frontend + Backend)

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel --prod`
3. Set environment variables in Vercel dashboard

### Deploy Frontend Only to Vercel

The frontend can be deployed separately as a static site that connects to your Replit backend:

1. In your Vercel project settings, set:
   - **Root Directory**: `frontend`
   - **Build Command**: (leave empty)
   - **Output Directory**: `.`

2. Update `frontend/script.js` to point to your Replit backend URL:
   ```js
   const API_BASE = 'https://your-replit-backend-url.replit.dev';
   ```

3. Deploy: `vercel --prod`

### Deploy to Replit Deployments

1. Click the **Deploy** button in Replit
2. Configure environment variables in the Secrets tab
3. Your app will be live with a production URL

## 🎮 How to Use

### For Players

1. **Select a Topic**: Choose from General, Math, or Science
2. **Start Quiz**: Click "Start Quiz" to begin
3. **Answer Questions**: You have 30 seconds per question
4. **View Explanations**: Learn from detailed explanations after each answer
5. **Track Progress**: See your score, rounds completed, and accuracy
6. **Submit Score**: Add your name to the leaderboard when you finish

### For Developers

See `docs/architecture.md` for technical details and extension points.

## 🎬 Demo Script (1-minute)

**"Welcome to EduFlash, your interactive learning companion!"**

1. **Topic Selection** (10s): "Choose from General Knowledge, Math, or Science - each with unique questions."

2. **Live Quiz** (30s): "Answer questions with a 30-second timer. Get instant feedback and detailed explanations."

3. **Progress Tracking** (10s): "Your score, accuracy, and progress are saved automatically."

4. **Leaderboard** (10s): "Compete with others and climb the leaderboard!"

**"Start learning smarter with EduFlash!"**

## 🤝 Contributing

Feel free to:
- Add new question topics in `backend/questions/`
- Improve AI prompts in `backend/services/explainProvider.js`
- Enhance UI/UX in `frontend/`
- Add more features!

## 📄 License

MIT License - feel free to use and modify!

## 🙋 Support

- Check `docs/` folder for detailed documentation
- Review API endpoints in `backend/server.js`
- For Firebase setup, see `docs/firebase-setup.md`

---

Made with 💜 for learners everywhere
