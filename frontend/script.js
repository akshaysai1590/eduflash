// Auto-detect API base URL - works for same-origin and cross-origin deployments
// If deployed separately, set this to your backend URL (e.g., 'https://your-backend.vercel.app')
// For same-origin deployments (frontend and backend together), leave as empty string
const API_BASE = (() => {
  // Check if we're in a development environment (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  // For production, use same origin (empty string) - backend should be on same domain
  // If backend is on different domain, uncomment and set:
  // return 'https://your-backend-url.vercel.app';
  return '';
})();

const TIMER_DURATION = 30;
const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Helper function to create a fetch with timeout
function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  
  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => {
    clearTimeout(timeoutId);
  });
}

let state = {
  score: 0,
  rounds: 0,
  correct: 0,
  currentTopic: 'general',
  currentQuestion: null,
  timerInterval: null,
  timeRemaining: TIMER_DURATION
};

function loadProgress() {
  const saved = localStorage.getItem('eduflash_progress');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      state.score = data.score || 0;
      state.rounds = data.rounds || 0;
      state.correct = data.correct || 0;
      updateStats();
      console.log('✓ Progress loaded from localStorage');
    } catch (e) {
      console.log('Error loading progress:', e);
    }
  }
}

function saveProgress() {
  localStorage.setItem('eduflash_progress', JSON.stringify({
    score: state.score,
    rounds: state.rounds,
    correct: state.correct,
    timestamp: new Date().toISOString()
  }));
  console.log('✓ Progress saved to localStorage');
}

function updateStats() {
  document.getElementById('scoreDisplay').textContent = state.score;
  document.getElementById('roundsDisplay').textContent = state.rounds;
  const accuracy = state.rounds > 0 ? Math.round((state.correct / state.rounds) * 100) : 0;
  document.getElementById('accuracyDisplay').textContent = accuracy + '%';
}

function setupTopicSelector() {
  document.querySelectorAll('.topic-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.topic-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentTopic = btn.dataset.topic;
      console.log('Topic changed to:', state.currentTopic);
    });
  });
}

function startTimer() {
  state.timeRemaining = TIMER_DURATION;
  const timerBar = document.getElementById('timerBar');
  const timerProgress = document.getElementById('timerProgress');
  
  timerBar.style.display = 'block';
  timerProgress.style.width = '100%';

  if (state.timerInterval) {
    clearInterval(state.timerInterval);
  }

  state.timerInterval = setInterval(() => {
    state.timeRemaining--;
    const percentage = (state.timeRemaining / TIMER_DURATION) * 100;
    timerProgress.style.width = percentage + '%';

    if (state.timeRemaining <= 0) {
      clearInterval(state.timerInterval);
      handleTimeout();
    }
  }, 1000);
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
  document.getElementById('timerBar').style.display = 'none';
}

async function handleTimeout() {
  console.log('⏰ Time expired');
  const optionBtns = document.querySelectorAll('.option-btn');
  optionBtns.forEach(btn => btn.disabled = true);
  
  try {
    if (!state.currentQuestion || !state.currentQuestion.id) {
      throw new Error('No question loaded');
    }
    
    const response = await fetchWithTimeout(`${API_BASE}/api/check-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: state.currentQuestion.id,
        selectedAnswer: -1,
        topic: state.currentTopic
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Validate result structure
    if (result.correctAnswer === undefined) {
      throw new Error('Invalid response format from server');
    }
    
    showResult(false, result.correctAnswer, null, 'Time expired! ⏰', result.explanation || '');
    
    console.log('✓ Timeout processed with explanation');
  } catch (error) {
    console.error('Error processing timeout:', error);
    
    // Show result even if explanation fails to load
    document.getElementById('resultSection').style.display = 'block';
    const resultMessage = document.getElementById('resultMessage');
    resultMessage.className = 'result-message incorrect';
    resultMessage.textContent = 'Time expired! ⏰';
    
    // Try to show explanation box with error message if available
    const explanationBox = document.getElementById('explanationBox');
    const explanationText = document.getElementById('explanationText');
    if (error.message && !error.message.includes('Failed to fetch')) {
      explanationText.textContent = 'Unable to load explanation due to network error.';
      explanationBox.style.display = 'block';
    }
  }
}

async function fetchQuestion() {
  try {
    const url = `${API_BASE}/api/question?topic=${state.currentTopic}`;
    console.log('Fetching question from:', url);
    
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    
    const question = await response.json();
    
    // Validate question structure
    if (!question || !question.id || !question.question || !question.options) {
      throw new Error('Invalid question format received from server');
    }
    
    state.currentQuestion = question;
    displayQuestion(question);
    startTimer();
    console.log('✓ Question loaded:', question.id);
  } catch (error) {
    console.error('Error fetching question:', error);
    
    // Provide more helpful error messages
    let errorMessage = 'Failed to load question. ';
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      errorMessage += 'The request timed out. Please check your connection and try again.';
    } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      errorMessage += 'Unable to connect to the server. Please check your internet connection and ensure the backend is running.';
    } else if (error.message.includes('Server error')) {
      errorMessage += error.message;
    } else {
      errorMessage += error.message || 'Please check your connection and try again.';
    }
    
    alert(errorMessage);
    
    // Reset UI state on error
    document.getElementById('startSection').style.display = 'block';
    document.getElementById('questionSection').style.display = 'none';
  }
}

function displayQuestion(question) {
  // Validate question before displaying
  if (!question || !question.question || !question.options || !Array.isArray(question.options)) {
    console.error('Invalid question data:', question);
    alert('Error: Invalid question data received. Please try again.');
    document.getElementById('startSection').style.display = 'block';
    document.getElementById('questionSection').style.display = 'none';
    return;
  }
  
  // Validate options array is not empty
  if (question.options.length === 0) {
    console.error('Question has no options:', question);
    alert('Error: Question has no options. Please try again.');
    document.getElementById('startSection').style.display = 'block';
    document.getElementById('questionSection').style.display = 'none';
    return;
  }
  
  state.rounds++;
  updateStats();
  
  document.getElementById('questionNumber').textContent = `Question #${state.rounds}`;
  document.getElementById('questionText').textContent = question.question || 'No question text available';
  
  const optionsContainer = document.getElementById('optionsContainer');
  optionsContainer.innerHTML = '';
  
  question.options.forEach((option, index) => {
    // Validate option text
    const optionText = option || `Option ${index + 1}`;
    const letter = OPTION_LETTERS[index] || String.fromCharCode(65 + index); // Fallback to A, B, C, etc.
    
    const button = document.createElement('button');
    button.className = 'option-btn';
    button.innerHTML = `
      <span class="option-letter">${letter}</span>
      <span>${optionText}</span>
    `;
    button.addEventListener('click', () => handleAnswer(index));
    optionsContainer.appendChild(button);
  });
  
  document.getElementById('startSection').style.display = 'none';
  document.getElementById('questionSection').style.display = 'block';
  document.getElementById('resultSection').style.display = 'none';
}

async function handleAnswer(selectedIndex) {
  stopTimer();
  
  const optionBtns = document.querySelectorAll('.option-btn');
  optionBtns.forEach(btn => btn.disabled = true);
  
  try {
    if (!state.currentQuestion || !state.currentQuestion.id) {
      throw new Error('No question loaded');
    }
    
    const response = await fetchWithTimeout(`${API_BASE}/api/check-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: state.currentQuestion.id,
        selectedAnswer: selectedIndex,
        topic: state.currentTopic
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Validate result structure
    if (result.correct === undefined || result.correctAnswer === undefined) {
      throw new Error('Invalid response format from server');
    }
    
    showResult(result.correct, result.correctAnswer, selectedIndex, null, result.explanation || '');
    
    if (result.correct) {
      state.score += 10;
      state.correct++;
    }
    updateStats();
    saveProgress();
    
    console.log('✓ Answer checked:', result.correct ? 'Correct' : 'Incorrect');
  } catch (error) {
    console.error('Error checking answer:', error);
    
    let errorMessage = 'Failed to check answer. ';
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      errorMessage += 'The request timed out. Please try again.';
    } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      errorMessage += 'Unable to connect to the server. Please check your connection.';
    } else {
      errorMessage += error.message || 'Please try again.';
    }
    
    alert(errorMessage);
    
    // Show result section even on error (without explanation)
    document.getElementById('resultSection').style.display = 'block';
    const resultMessage = document.getElementById('resultMessage');
    resultMessage.className = 'result-message incorrect';
    resultMessage.textContent = '❌ Unable to verify answer';
  }
}

function showResult(isCorrect, correctIndex, selectedIndex = null, customMessage = null, explanation = '') {
  const optionBtns = document.querySelectorAll('.option-btn');
  optionBtns.forEach((btn, index) => {
    if (index === correctIndex) {
      btn.classList.add('correct');
    } else if (!isCorrect && selectedIndex !== null && index === selectedIndex) {
      btn.classList.add('incorrect');
    }
  });
  
  const resultMessage = document.getElementById('resultMessage');
  resultMessage.className = 'result-message ' + (isCorrect ? 'correct' : 'incorrect');
  resultMessage.textContent = customMessage || (isCorrect ? '🎉 Correct!' : '❌ Incorrect');
  
  if (explanation) {
    document.getElementById('explanationText').textContent = explanation;
    document.getElementById('explanationBox').style.display = 'block';
  }
  
  document.getElementById('resultSection').style.display = 'block';
}

function startQuiz() {
  console.log('🚀 Quiz started');
  fetchQuestion();
}

function nextQuestion() {
  document.getElementById('explanationBox').style.display = 'none';
  fetchQuestion();
}

function finishQuiz() {
  console.log('🏁 Quiz finished. Final score:', state.score);
  
  if (state.score > 0) {
    document.getElementById('submitScoreSection').style.display = 'flex';
    document.getElementById('playerName').focus();
  }
  
  document.getElementById('questionSection').style.display = 'none';
  document.getElementById('startSection').style.display = 'block';
  stopTimer();
  
  alert(`Quiz finished!\n\nFinal Score: ${state.score}\nRounds: ${state.rounds}\nAccuracy: ${Math.round((state.correct / state.rounds) * 100)}%`);
}

async function submitScore() {
  const nameInput = document.getElementById('playerName');
  const name = nameInput.value.trim();
  
  if (!name) {
    alert('Please enter your name');
    return;
  }
  
  // Validate name length
  if (name.length > 50) {
    alert('Name must be 50 characters or less');
    return;
  }
  
  try {
    const response = await fetchWithTimeout(`${API_BASE}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score: state.score })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('✓ Score submitted to leaderboard');
    alert('Score submitted successfully!');
    nameInput.value = '';
    document.getElementById('submitScoreSection').style.display = 'none';
    
    loadLeaderboard();
  } catch (error) {
    console.error('Error submitting score:', error);
    
    let errorMessage = 'Failed to submit score. ';
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      errorMessage += 'The request timed out. Please try again.';
    } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      errorMessage += 'Unable to connect to the server. Please check your connection.';
    } else {
      errorMessage += error.message || 'Please try again.';
    }
    
    alert(errorMessage);
  }
}

async function loadLeaderboard() {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/api/leaderboard`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      // Don't show error for leaderboard - it's not critical
      console.warn('Failed to load leaderboard:', response.status);
      return;
    }
    
    const scores = await response.json();
    const list = document.getElementById('leaderboardList');
    
    // Validate scores is an array
    if (!Array.isArray(scores)) {
      console.warn('Invalid leaderboard data format');
      return;
    }
    
    if (scores.length === 0) {
      list.innerHTML = '<li class="empty-state">No scores yet. Be the first!</li>';
      return;
    }
    
    list.innerHTML = scores.map(entry => {
      // Validate entry structure
      if (!entry || entry.rank === undefined || !entry.name || entry.score === undefined) {
        return '';
      }
      
      const rankClass = entry.rank === 1 ? 'gold' : entry.rank === 2 ? 'silver' : entry.rank === 3 ? 'bronze' : '';
      const timeAgo = formatTimeAgo(entry.timestamp || new Date().toISOString());
      
      return `
        <li class="leaderboard-item">
          <div class="rank ${rankClass}">${entry.rank}</div>
          <div class="player-info">
            <div class="player-name">${escapeHtml(entry.name)}</div>
            <div class="player-time">${timeAgo}</div>
          </div>
          <div class="player-score">${entry.score}</div>
        </li>
      `;
    }).filter(html => html !== '').join('');
    
    console.log('✓ Leaderboard loaded:', scores.length, 'entries');
  } catch (error) {
    // Silently fail for leaderboard - it's not critical functionality
    console.warn('Error loading leaderboard:', error.message);
  }
}

function formatTimeAgo(timestamp) {
  try {
    const date = new Date(timestamp);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'recently';
    }
    
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 0) return 'just now'; // Handle future dates
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hr ago';
    return Math.floor(seconds / 86400) + ' days ago';
  } catch (error) {
    console.warn('Error formatting time:', error);
    return 'recently';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Wait for DOM to be fully loaded before initializing
function initializeApp() {
  // Verify all required elements exist
  const requiredElements = [
    'startBtn', 'nextBtn', 'finishBtn', 'submitScoreBtn',
    'scoreDisplay', 'roundsDisplay', 'accuracyDisplay',
    'questionSection', 'startSection', 'resultSection',
    'optionsContainer', 'questionText', 'questionNumber',
    'leaderboardList', 'playerName'
  ];
  
  const missingElements = requiredElements.filter(id => !document.getElementById(id));
  
  if (missingElements.length > 0) {
    console.error('Missing required elements:', missingElements);
    alert('Error: Some required page elements are missing. Please refresh the page.');
    return;
  }
  
  // Initialize event listeners
  document.getElementById('startBtn').addEventListener('click', startQuiz);
  document.getElementById('nextBtn').addEventListener('click', nextQuestion);
  document.getElementById('finishBtn').addEventListener('click', finishQuiz);
  document.getElementById('submitScoreBtn').addEventListener('click', submitScore);
  
  setupTopicSelector();
  loadProgress();
  loadLeaderboard();
  
  setInterval(loadLeaderboard, 30000);
  
  console.log('✓ EduFlash initialized');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM is already loaded
  initializeApp();
}
