# 🔥 Firebase Setup Guide

This guide walks you through setting up Firebase for persistent leaderboard storage in EduFlash.

## Prerequisites

- A Google account
- Node.js installed
- Firebase CLI (optional, but recommended)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `eduflash` (or your preferred name)
4. Disable Google Analytics (optional for this project)
5. Click **"Create project"**

## Step 2: Enable Realtime Database

1. In Firebase Console, select your project
2. Click **"Build"** in the left sidebar
3. Click **"Realtime Database"**
4. Click **"Create Database"**
5. Choose a location (select closest to your users)
6. Select **"Start in test mode"** for development
   - **Note**: Change to production rules before deploying!
7. Click **"Enable"**

### Production Security Rules

Before deploying, update your database rules:

```json
{
  "rules": {
    "leaderboard": {
      ".read": true,
      ".write": true,
      "$score": {
        ".validate": "newData.hasChildren(['name', 'score', 'timestamp'])",
        "name": {
          ".validate": "newData.isString() && newData.val().length <= 50"
        },
        "score": {
          ".validate": "newData.isNumber() && newData.val() >= 0"
        },
        "timestamp": {
          ".validate": "newData.isNumber()"
        }
      }
    }
  }
}
```

## Step 3: Get Firebase Configuration

1. In Firebase Console, click the **gear icon** ⚙️ next to "Project Overview"
2. Click **"Project settings"**
3. Scroll to **"Your apps"** section
4. Click the **web icon** (`</>`)
5. Register app name: `eduflash-web`
6. **Don't** enable Firebase Hosting (we're deploying elsewhere)
7. Copy the `firebaseConfig` object

Example:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "eduflash-xxxx.firebaseapp.com",
  databaseURL: "https://eduflash-xxxx-default-rtdb.firebaseio.com",
  projectId: "eduflash-xxxx",
  storageBucket: "eduflash-xxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

## Step 4: Configure Environment Variable

### On Replit

1. Click the **"Secrets"** tab (🔒 icon) in left sidebar
2. Click **"+ New Secret"**
3. Key: `FIREBASE_CONFIG`
4. Value: Paste the config as a single-line JSON string:
   ```
   {"apiKey":"AIza...","authDomain":"eduflash...","databaseURL":"https://...","projectId":"eduflash..."}
   ```
5. Click **"Add Secret"**

### On Local Machine

Create `backend/.env`:
```env
FIREBASE_CONFIG={"apiKey":"AIza...","authDomain":"eduflash...","databaseURL":"https://...","projectId":"eduflash..."}
```

## Step 5: Install Firebase Admin SDK

```bash
cd backend
npm install firebase-admin
```

## Step 6: Enable Firebase Leaderboard

Edit `backend/services/leaderboard.firebase.js`:

1. **Uncomment** all the Firebase code (remove `/*` and `*/`)
2. **Comment out** or remove the fallback line at the bottom:
   ```javascript
   // module.exports = require('./leaderboard');
   ```

Edit `backend/server.js`:

**No changes needed!** It already imports from `leaderboard.js`, which will use Firebase if configured.

Actually, to use Firebase, change the import line:
```javascript
// Change this line:
const leaderboardService = require('./services/leaderboard');

// To this:
const leaderboardService = require('./services/leaderboard.firebase');
```

## Step 7: Test the Integration

1. Restart your server
2. Check logs for: `✓ Firebase initialized successfully`
3. Play a quiz and submit your score
4. Check Firebase Console → Realtime Database
5. You should see your score under `/leaderboard/`

## Firebase CLI Setup (Optional)

For advanced management, install Firebase CLI:

```bash
# Install globally
npm install -g firebase-tools

# Login
firebase login

# Initialize in project (optional)
firebase init

# Select:
# - Realtime Database
# - Your project
# - Use default database rules file
```

## Monitoring & Analytics

### View Database in Real-Time

1. Firebase Console → Realtime Database
2. See live updates as users submit scores

### Export Data

```bash
# Using Firebase CLI
firebase database:get /leaderboard > leaderboard-backup.json
```

### Clear All Scores

**Warning**: This deletes all data!

1. Firebase Console → Realtime Database
2. Click on `/leaderboard` node
3. Click **"Delete"** (trash icon)

Or via code:
```javascript
// Add this endpoint to server.js for admin use only
app.delete('/api/leaderboard/clear', async (req, res) => {
  await leaderboardService.clearScores();
  res.json({ success: true });
});
```

## Troubleshooting

### Error: "FIREBASE_CONFIG not properly set"

- Check that your secret is valid JSON
- Ensure no extra spaces or newlines
- Verify you've restarted the server after adding secret

### Error: "Permission denied"

- Check your database rules allow writes
- Verify `databaseURL` in config is correct

### Scores not appearing

- Check browser console for errors
- Verify network requests in DevTools
- Check Firebase Console logs

## Cost Considerations

Firebase Realtime Database pricing:

- **Spark Plan (Free)**:
  - 1 GB stored
  - 10 GB/month downloaded
  - 100 simultaneous connections

For EduFlash, the free tier is sufficient for:
- ~10,000 leaderboard entries
- ~1,000,000 leaderboard views/month

Monitor usage: Firebase Console → Usage and Billing

## Next Steps

- Set up Firebase Authentication for user accounts
- Add Firebase Cloud Functions for server-side logic
- Use Firebase Hosting for frontend deployment
- Enable Firebase Analytics for usage insights

---

**Need Help?**
- [Firebase Documentation](https://firebase.google.com/docs)
- [Realtime Database Guide](https://firebase.google.com/docs/database)
