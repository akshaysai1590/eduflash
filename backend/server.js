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
// CORS configuration - allow all origins for flexibility
app.use(cors({
  origin: '*', // Allow all origins (can be restricted in production)
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '10mb' })); // Parse JSON with increased payload limit
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
  try {
    const topic = req.query.topic || 'general';
    const questions = loadQuestions(topic);
    
    if (questions.length === 0) {
      console.error(`No questions available for topic: ${topic}`);
      return res.status(404).json({ error: 'No questions available for this topic' });
    }
    
    const randomIndex = Math.floor(Math.random() * questions.length);
    const question = questions[randomIndex];
    
    // Validate question structure
    if (!question || !question.id || !question.question || !question.options) {
      console.error(`Invalid question structure for topic: ${topic}`);
      return res.status(500).json({ error: 'Invalid question data structure' });
    }
    
    // Don't send the correctAnswer to the client initially
    const { correctAnswer, explanation, ...questionData } = question;
    
    console.log(`✓ Served question ${question.id} from topic: ${topic}`);
    res.json(questionData);
  } catch (error) {
    console.error('Error in /api/question:', error);
    res.status(500).json({ error: 'Internal server error while fetching question' });
  }
});

// Check answer and get explanation
app.post('/api/check-answer', async (req, res) => {
  try {
    const { questionId, selectedAnswer, topic } = req.body;
    
    // Validate request body
    if (questionId === undefined || selectedAnswer === undefined) {
      return res.status(400).json({ error: 'Missing questionId or selectedAnswer' });
    }
    
    if (typeof questionId !== 'string' && typeof questionId !== 'number') {
      return res.status(400).json({ error: 'Invalid questionId format' });
    }
    
    if (typeof selectedAnswer !== 'number' || selectedAnswer < -1) {
      return res.status(400).json({ error: 'Invalid selectedAnswer format' });
    }
    
    const questions = loadQuestions(topic || 'general');
    // Convert both to strings for comparison to handle type mismatches
    const question = questions.find(q => String(q.id) === String(questionId));
    
    if (!question) {
      console.error(`Question not found: ${questionId} in topic: ${topic || 'general'}`);
      return res.status(404).json({ error: 'Question not found' });
    }
    
    // Validate question has correctAnswer
    if (question.correctAnswer === undefined || question.correctAnswer === null) {
      console.error(`Question ${questionId} missing correctAnswer`);
      return res.status(500).json({ error: 'Question data is invalid' });
    }
    
    const isCorrect = question.correctAnswer === selectedAnswer;
    
    // Get explanation (AI-powered or canned)
    let explanation = '';
    try {
      explanation = await explainProvider.getExplanation(
        questionId,
        question.question,
        question.options[question.correctAnswer],
        question.explanation || ''
      );
    } catch (explanationError) {
      console.warn(`Failed to get explanation for ${questionId}:`, explanationError.message);
      // Use fallback explanation if available
      explanation = question.explanation || 'No explanation available.';
    }
    
    console.log(`✓ Answer checked for ${questionId}: ${isCorrect ? 'correct' : 'incorrect'}`);
    
    res.json({
      correct: isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: explanation || question.explanation || ''
    });
  } catch (error) {
    console.error('Error in /api/check-answer:', error);
    res.status(500).json({ error: 'Internal server error while checking answer' });
  }
});

// Leaderboard endpoints
app.post('/api/leaderboard', (req, res) => {
  try {
    const { name, score } = req.body;
    
    if (!name || score === undefined) {
      return res.status(400).json({ error: 'Missing name or score' });
    }
    
    // Validate name
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid name format' });
    }
    
    if (name.length > 50) {
      return res.status(400).json({ error: 'Name must be 50 characters or less' });
    }
    
    // Validate score
    if (typeof score !== 'number' || score < 0 || !isFinite(score)) {
      return res.status(400).json({ error: 'Invalid score value' });
    }
    
    leaderboardService.addScore(name.trim(), Math.floor(score));
    console.log(`✓ Added score to leaderboard: ${name.trim()} - ${Math.floor(score)}`);
    
    res.json({ success: true, message: 'Score added to leaderboard' });
  } catch (error) {
    console.error('Error in /api/leaderboard POST:', error);
    res.status(500).json({ error: 'Internal server error while adding score' });
  }
});

app.get('/api/leaderboard', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const topScores = leaderboardService.getTopScores(limit);
    res.json(topScores);
  } catch (error) {
    console.error('Error in /api/leaderboard GET:', error);
    res.status(500).json({ error: 'Internal server error while fetching leaderboard' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler for API routes (must be before error handler)
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Serve frontend
app.get('/', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  } catch (error) {
    console.error('Error serving frontend:', error);
    res.status(500).send('Error loading application');
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 EduFlash server running on port ${PORT}`);
  console.log(`📚 Frontend: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
  console.log(`\nAvailable topics: general, math, science\n`);
});
