/**
 * Firebase-based persistent leaderboard implementation
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. Create a Firebase project at https://console.firebase.google.com/
 * 
 * 2. Enable Realtime Database or Firestore:
 *    - Go to Build > Realtime Database (or Firestore)
 *    - Click "Create Database"
 *    - Choose location and security rules (start in test mode for development)
 * 
 * 3. Get your Firebase config:
 *    - Go to Project Settings > General
 *    - Scroll to "Your apps" section
 *    - Click the web icon (</>)
 *    - Copy the firebaseConfig object
 * 
 * 4. Set environment variable:
 *    Create a .env file with:
 *    FIREBASE_CONFIG={"apiKey":"xxx","authDomain":"xxx","databaseURL":"xxx","projectId":"xxx"}
 * 
 * 5. Install Firebase SDK:
 *    npm install firebase-admin
 * 
 * 6. Replace the in-memory leaderboard:
 *    In server.js, change:
 *    const leaderboardService = require('./services/leaderboard');
 *    to:
 *    const leaderboardService = require('./services/leaderboard.firebase');
 * 
 * USAGE NOTES:
 * - This implementation uses Firebase Realtime Database
 * - Scores are stored at /leaderboard/{id}
 * - Automatically sorts and maintains top 100 scores
 * - Includes timestamp and player name validation
 */

// Uncomment when ready to use:
/*
const admin = require('firebase-admin');

// Initialize Firebase Admin
let db;
try {
  const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG || '{}');
  
  if (!firebaseConfig.projectId) {
    throw new Error('FIREBASE_CONFIG not properly set in environment variables');
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
    databaseURL: firebaseConfig.databaseURL
  });
  
  db = admin.database();
  console.log('✓ Firebase initialized successfully');
} catch (error) {
  console.error('⚠ Firebase initialization failed:', error.message);
  console.error('Falling back to in-memory leaderboard');
  // Fall back to in-memory implementation
  module.exports = require('./leaderboard');
}

async function addScore(name, score) {
  try {
    const ref = db.ref('leaderboard');
    const newScoreRef = ref.push();
    
    await newScoreRef.set({
      name: name.substring(0, 50),
      score: score,
      timestamp: admin.database.ServerValue.TIMESTAMP
    });
    
    console.log(`✓ Score saved to Firebase: ${name} - ${score}`);
    
    // Clean up old scores, keep only top 100
    const snapshot = await ref.orderByChild('score').limitToLast(100).once('value');
    const allScores = snapshot.val();
    const scoreKeys = Object.keys(allScores || {});
    
    if (scoreKeys.length > 100) {
      const sortedKeys = scoreKeys.sort((a, b) => allScores[b].score - allScores[a].score);
      const keysToDelete = sortedKeys.slice(100);
      
      for (const key of keysToDelete) {
        await ref.child(key).remove();
      }
    }
  } catch (error) {
    console.error('Error saving score to Firebase:', error.message);
    throw error;
  }
}

async function getTopScores(limit = 10) {
  try {
    const ref = db.ref('leaderboard');
    const snapshot = await ref.orderByChild('score').limitToLast(limit).once('value');
    const scores = snapshot.val();
    
    if (!scores) {
      return [];
    }
    
    // Convert to array and sort descending
    const scoreArray = Object.entries(scores).map(([id, data]) => ({
      id,
      name: data.name,
      score: data.score,
      timestamp: new Date(data.timestamp).toISOString()
    }));
    
    scoreArray.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    return scoreArray.slice(0, limit).map((entry, index) => ({
      rank: index + 1,
      name: entry.name,
      score: entry.score,
      timestamp: entry.timestamp
    }));
  } catch (error) {
    console.error('Error fetching scores from Firebase:', error.message);
    return [];
  }
}

async function getScoreCount() {
  try {
    const snapshot = await db.ref('leaderboard').once('value');
    return snapshot.numChildren();
  } catch (error) {
    console.error('Error getting score count:', error.message);
    return 0;
  }
}

async function clearScores() {
  try {
    await db.ref('leaderboard').remove();
    console.log('✓ Firebase leaderboard cleared');
  } catch (error) {
    console.error('Error clearing Firebase leaderboard:', error.message);
    throw error;
  }
}

module.exports = {
  addScore,
  getTopScores,
  getScoreCount,
  clearScores
};
*/

// PLACEHOLDER: Until Firebase is configured, export the in-memory version
console.log('ℹ Using in-memory leaderboard. To use Firebase, configure FIREBASE_CONFIG and uncomment code in leaderboard.firebase.js');
module.exports = require('./leaderboard');
