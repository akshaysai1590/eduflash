/**
 * In-memory leaderboard implementation
 * For persistent storage, see leaderboard.firebase.js
 */

// In-memory storage (non-persistent)
let scores = [];

/**
 * Add a score to the leaderboard
 * @param {string} name - Player name
 * @param {number} score - Score value
 */
function addScore(name, score) {
  const entry = {
    name: name.substring(0, 50), // Limit name length
    score: score,
    timestamp: new Date().toISOString()
  };
  
  scores.push(entry);
  
  // Sort by score descending, then by timestamp ascending
  scores.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return new Date(a.timestamp) - new Date(b.timestamp);
  });
  
  // Keep only top 100 to prevent memory bloat
  if (scores.length > 100) {
    scores = scores.slice(0, 100);
  }
  
  console.log(`✓ Leaderboard updated: ${name} scored ${score}`);
}

/**
 * Get top scores from the leaderboard
 * @param {number} limit - Maximum number of scores to return (default: 10)
 * @returns {Array} - Array of top score entries
 */
function getTopScores(limit = 10) {
  return scores.slice(0, limit).map((entry, index) => ({
    rank: index + 1,
    name: entry.name,
    score: entry.score,
    timestamp: entry.timestamp
  }));
}

/**
 * Get total number of scores
 * @returns {number}
 */
function getScoreCount() {
  return scores.length;
}

/**
 * Clear all scores (useful for testing)
 */
function clearScores() {
  scores = [];
  console.log('✓ Leaderboard cleared');
}

module.exports = {
  addScore,
  getTopScores,
  getScoreCount,
  clearScores
};
