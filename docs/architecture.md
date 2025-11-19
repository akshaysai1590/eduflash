# 🏗️ EduFlash Architecture

## System Overview

EduFlash is a full-stack web application built with vanilla JavaScript and Node.js/Express. It follows a clean client-server architecture with RESTful API endpoints.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (SPA)                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │
│  │ index.html │  │ script.js  │  │    style.css       │ │
│  │            │  │            │  │                    │ │
│  │ - Quiz UI  │  │ - State    │  │ - Responsive       │ │
│  │ - Timer    │  │ - API calls│  │ - Animations       │ │
│  │ - Stats    │  │ - localStorage│ - Mobile-first    │ │
│  └────────────┘  └────────────┘  └────────────────────┘ │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP/REST API
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    Backend (Express)                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │              server.js (Main)                     │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │  API Endpoints                             │  │   │
│  │  │  • GET  /api/question?topic=X             │  │   │
│  │  │  • POST /api/check-answer                 │  │   │
│  │  │  • POST /api/leaderboard                  │  │   │
│  │  │  • GET  /api/leaderboard                  │  │   │
│  │  │  • GET  /api/health                       │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────────────┐    │
│  │   Services       │  │    Data Sources          │    │
│  │                  │  │                          │    │
│  │ • explainProvider│  │ • questions/general.json │    │
│  │   - AI APIs      │  │ • questions/math.json    │    │
│  │   - Caching      │  │ • questions/science.json │    │
│  │   - Fallback     │  │                          │    │
│  │                  │  │ • In-memory leaderboard  │    │
│  │ • leaderboard    │  │ • Firebase (optional)    │    │
│  │   - In-memory    │  │                          │    │
│  │   - Firebase     │  └──────────────────────────┘    │
│  └──────────────────┘                                   │
└─────────────────────────────────────────────────────────┘
```

## Component Breakdown

### Frontend Components

**1. State Management**
- Client-side state stored in JavaScript object
- Persistent storage via localStorage API
- Tracks: score, rounds, accuracy, current topic

**2. Quiz Flow**
- Topic selection → Start quiz → Load question → Answer → Explanation → Next
- Timer countdown (30s per question)
- Automatic progression on timeout

**3. API Communication**
- Fetch API for all HTTP requests
- Error handling with user-friendly fallbacks
- Real-time leaderboard updates

### Backend Services

**1. Question Management**
- JSON-based question banks per topic
- Lazy loading with in-memory caching
- Random question selection

**2. Explanation Provider** (`explainProvider.js`)
- **Primary**: OpenAI GPT-3.5-turbo API
- **Fallback 1**: HuggingFace Inference API
- **Fallback 2**: Curated explanations from JSON
- **Caching**: In-memory Map (process lifetime)
- **Safety**: 100 token limit, 5s timeout

**3. Leaderboard Service**
- **Default**: In-memory array (top 100 scores)
- **Optional**: Firebase Realtime DB (persistent)
- Sorted by score (desc) → timestamp (asc)

## Data Flow

### Question Flow
```
1. User clicks "Start Quiz"
2. Frontend → GET /api/question?topic=math
3. Backend loads questions/math.json
4. Backend selects random question
5. Backend returns question WITHOUT correct answer
6. Frontend displays question + starts timer
7. User selects answer
8. Frontend → POST /api/check-answer {questionId, selectedAnswer}
9. Backend validates answer
10. Backend calls explainProvider for explanation
11. Backend returns {correct, correctAnswer, explanation}
12. Frontend shows result + explanation
```

### Leaderboard Flow
```
1. User finishes quiz
2. User enters name
3. Frontend → POST /api/leaderboard {name, score}
4. Backend validates and stores score
5. Backend → GET /api/leaderboard
6. Backend returns top 10 scores
7. Frontend displays leaderboard with rankings
```

## Key Design Decisions

### 1. Why JSON question banks?
- Easy to add new questions without code changes
- Version controllable and reviewable
- Can be externalized to CMS in future

### 2. Why in-memory caching?
- Reduces API costs (AI providers charge per request)
- Improves response time
- Acceptable cache lifetime (until server restart)

### 3. Why localStorage for progress?
- No backend session required
- Works offline for score tracking
- Simple implementation for MVP

### 4. Why vanilla JavaScript?
- No build step required
- Faster initial load
- Easier to understand for learners
- Can migrate to React/Vue later if needed

## Extension Points

### Adding New Topics
1. Create `backend/questions/newtopic.json`
2. Add topic to `validTopics` array in `server.js`
3. Add button in `frontend/index.html`

### Adding New AI Providers
1. Add provider function in `explainProvider.js`
2. Add to fallback chain in `getExplanation()`
3. Add API key to `.env.example`

### Persistent Leaderboard
1. Configure Firebase (see `docs/firebase-setup.md`)
2. Set `FIREBASE_CONFIG` environment variable
3. Uncomment code in `leaderboard.firebase.js`
4. Update server.js to use Firebase leaderboard

## Performance Considerations

- **Question caching**: Reduces file I/O
- **Explanation caching**: Prevents redundant API calls
- **Lazy loading**: Topics loaded on-demand
- **Leaderboard polling**: Updates every 30s (not every second)

## Security Considerations

- API keys never exposed to frontend
- User input sanitized (name length limit)
- CORS enabled (restrict in production)
- No SQL injection risk (JSON data source)

## Future Enhancements

- User authentication (Firebase Auth)
- Question difficulty levels
- Category-based achievements
- Multiplayer real-time quiz
- Analytics dashboard
- Admin panel for question management
