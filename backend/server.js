require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const explainProvider = require('./services/explainProvider');
const leaderboardService = require('./services/leaderboard');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// In-memory cache for questions by topic
const questionCache = {};

// Load questions for a given topic
function loadQuestions(topic = 'general') {
  const validTopics = ['general', 'math', 'science'];
  const selectedTopic = validTopics.includes(topic) ? topic : 'general';
  
  if (!questionCache[selectedTopic]) {
    const filePath = path.join(__dirname, 'questions', `${selectedTopic}.json`);
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      questionCache[selectedTopic] = JSON.parse(data);
      console.log(`✓ Loaded ${questionCache[selectedTopic].length} questions for topic: ${selectedTopic}`);
    } catch (error) {
      console.error(`Error loading questions for ${selectedTopic}:`, error.message);
      questionCache[selectedTopic] = [];
    }
  }
  return questionCache[selectedTopic];
}

// API Routes

// Get a random question
app.get('/api/question', (req, res) => {
  const topic = req.query.topic || 'general';
  const questions = loadQuestions(topic);
  
  if (questions.length === 0) {
    return res.status(404).json({ error: 'No questions available for this topic' });
  }
  
  const randomIndex = Math.floor(Math.random() * questions.length);
  const question = questions[randomIndex];
  
  // Don't send the correctAnswer to the client initially
  const { correctAnswer, explanation, ...questionData } = question;
  
  console.log(`Served question ${question.id} from topic: ${topic}`);
  res.json(questionData);
});

// Check answer and get explanation
app.post('/api/check-answer', async (req, res) => {
  const { questionId, selectedAnswer, topic } = req.body;
  
  if (questionId === undefined || selectedAnswer === undefined) {
    return res.status(400).json({ error: 'Missing questionId or selectedAnswer' });
  }
  
  const questions = loadQuestions(topic || 'general');
  const question = questions.find(q => q.id === questionId);
  
  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }
  
  const isCorrect = question.correctAnswer === selectedAnswer;
  
  // Get explanation (AI-powered or canned)
  const explanation = await explainProvider.getExplanation(
    questionId,
    question.question,
    question.options[question.correctAnswer],
    question.explanation
  );
  
  console.log(`Answer checked for ${questionId}: ${isCorrect ? 'correct' : 'incorrect'}`);
  
  res.json({
    correct: isCorrect,
    correctAnswer: question.correctAnswer,
    explanation: explanation
  });
});

// Leaderboard endpoints
app.post('/api/leaderboard', (req, res) => {
  const { name, score } = req.body;
  
  if (!name || score === undefined) {
    return res.status(400).json({ error: 'Missing name or score' });
  }
  
  if (typeof score !== 'number' || score < 0) {
    return res.status(400).json({ error: 'Invalid score value' });
  }
  
  leaderboardService.addScore(name, score);
  console.log(`Added score to leaderboard: ${name} - ${score}`);
  
  res.json({ success: true, message: 'Score added to leaderboard' });
});

app.get('/api/leaderboard', (req, res) => {
  const topScores = leaderboardService.getTopScores();
  res.json(topScores);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 EduFlash server running on port ${PORT}`);
  console.log(`📚 Frontend: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
  console.log(`\nAvailable topics: general, math, science\n`);
});
