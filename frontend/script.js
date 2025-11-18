const API_BASE = window.location.origin;

const TIMER_DURATION = 30;
const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

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
    const response = await fetch(`${API_BASE}/api/check-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: state.currentQuestion.id,
        selectedAnswer: -1,
        topic: state.currentTopic
      })
    });
    
    if (!response.ok) throw new Error('Failed to check answer');
    
    const result = await response.json();
    showResult(false, result.correctAnswer, null, 'Time expired! ⏰', result.explanation);
    
    console.log('✓ Timeout processed with explanation');
  } catch (error) {
    console.error('Error processing timeout:', error);
    alert('Failed to load explanation due to network error. Please check your connection.');
    document.getElementById('resultSection').style.display = 'block';
    const resultMessage = document.getElementById('resultMessage');
    resultMessage.className = 'result-message incorrect';
    resultMessage.textContent = 'Time expired! ⏰ (Unable to load explanation)';
  }
}

async function fetchQuestion() {
  try {
    const response = await fetch(`${API_BASE}/api/question?topic=${state.currentTopic}`);
    if (!response.ok) throw new Error('Failed to fetch question');
    
    const question = await response.json();
    state.currentQuestion = question;
    displayQuestion(question);
    startTimer();
    console.log('✓ Question loaded:', question.id);
  } catch (error) {
    console.error('Error fetching question:', error);
    alert('Failed to load question. Please check your connection.');
  }
}

function displayQuestion(question) {
  state.rounds++;
  updateStats();
  
  document.getElementById('questionNumber').textContent = `Question #${state.rounds}`;
  document.getElementById('questionText').textContent = question.question;
  
  const optionsContainer = document.getElementById('optionsContainer');
  optionsContainer.innerHTML = '';
  
  question.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.className = 'option-btn';
    button.innerHTML = `
      <span class="option-letter">${OPTION_LETTERS[index]}</span>
      <span>${option}</span>
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
    const response = await fetch(`${API_BASE}/api/check-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: state.currentQuestion.id,
        selectedAnswer: selectedIndex,
        topic: state.currentTopic
      })
    });
    
    if (!response.ok) throw new Error('Failed to check answer');
    
    const result = await response.json();
    showResult(result.correct, result.correctAnswer, selectedIndex, null, result.explanation);
    
    if (result.correct) {
      state.score += 10;
      state.correct++;
    }
    updateStats();
    saveProgress();
    
    console.log('✓ Answer checked:', result.correct ? 'Correct' : 'Incorrect');
  } catch (error) {
    console.error('Error checking answer:', error);
    alert('Failed to check answer. Please try again.');
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
  
  try {
    const response = await fetch(`${API_BASE}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score: state.score })
    });
    
    if (!response.ok) throw new Error('Failed to submit score');
    
    console.log('✓ Score submitted to leaderboard');
    alert('Score submitted successfully!');
    nameInput.value = '';
    document.getElementById('submitScoreSection').style.display = 'none';
    
    loadLeaderboard();
  } catch (error) {
    console.error('Error submitting score:', error);
    alert('Failed to submit score. Please try again.');
  }
}

async function loadLeaderboard() {
  try {
    const response = await fetch(`${API_BASE}/api/leaderboard`);
    if (!response.ok) throw new Error('Failed to load leaderboard');
    
    const scores = await response.json();
    const list = document.getElementById('leaderboardList');
    
    if (scores.length === 0) {
      list.innerHTML = '<li class="empty-state">No scores yet. Be the first!</li>';
      return;
    }
    
    list.innerHTML = scores.map(entry => {
      const rankClass = entry.rank === 1 ? 'gold' : entry.rank === 2 ? 'silver' : entry.rank === 3 ? 'bronze' : '';
      const timeAgo = formatTimeAgo(entry.timestamp);
      
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
    }).join('');
    
    console.log('✓ Leaderboard loaded:', scores.length, 'entries');
  } catch (error) {
    console.error('Error loading leaderboard:', error);
  }
}

function formatTimeAgo(timestamp) {
  const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + ' hr ago';
  return Math.floor(seconds / 86400) + ' days ago';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.getElementById('startBtn').addEventListener('click', startQuiz);
document.getElementById('nextBtn').addEventListener('click', nextQuestion);
document.getElementById('finishBtn').addEventListener('click', finishQuiz);
document.getElementById('submitScoreBtn').addEventListener('click', submitScore);

setupTopicSelector();
loadProgress();
loadLeaderboard();

setInterval(loadLeaderboard, 30000);

console.log('✓ EduFlash initialized');
