# EduFlash - Interactive Learning Quiz App

## Overview

EduFlash is a full-stack web application that provides an interactive flashcard quiz experience with AI-powered explanations. Built with vanilla JavaScript on the frontend and Node.js/Express on the backend, the app offers multiple topic categories (General Knowledge, Math, Science), real-time scoring with progress tracking, timed questions with countdown timers, and a competitive leaderboard system. The application emphasizes mobile-responsive design, smooth animations, and graceful degradation when optional AI services are unavailable.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture (Vanilla JavaScript SPA)

**Problem**: Need a simple, fast-loading quiz interface without framework overhead.

**Solution**: Single-page application built with vanilla HTML/CSS/JavaScript that communicates with backend via REST API.

**Key Components**:
- **State Management**: Local JavaScript object (`state`) tracks score, rounds, accuracy, current topic, and timer state
- **Persistence**: localStorage for client-side progress tracking (score, rounds, correct answers)
- **Timer System**: 30-second countdown with visual progress bar; auto-submits when time expires
- **Topic Selection**: Three categories (general, math, science) with visual button toggles
- **Responsive UI**: Mobile-first CSS with flexbox/grid layouts and CSS transitions for feedback animations

**Design Decisions**:
- Chose vanilla JavaScript over frameworks for simplicity and faster load times
- localStorage chosen for progress persistence (no backend session management needed)
- Timer implemented with setInterval for cross-browser compatibility
- CSS custom properties (variables) for consistent theming
- **API Configuration**: Uses relative URLs (empty API_BASE) instead of `window.location.origin` to ensure compatibility with Replit's proxy environment

### Backend Architecture (Node.js/Express)

**Problem**: Serve static frontend, provide quiz questions, enable AI explanations, and manage leaderboard data.

**Solution**: Express server with modular service architecture and pluggable providers.

**Core API Endpoints**:
- `GET /api/question?topic={topic}` - Returns random question from specified topic
- `POST /api/check-answer` - Validates answer and returns explanation
- `POST /api/leaderboard` - Submits player score
- `GET /api/leaderboard` - Retrieves top 10 scores
- `GET /api/health` - Health check endpoint

**Service Layer Design**:

1. **Question Management**:
   - Questions stored in JSON files by topic (`backend/questions/{topic}.json`)
   - In-memory cache loads JSON files on first request per topic
   - Random selection algorithm for question variety

2. **Explanation Provider** (`services/explainProvider.js`):
   - **Abstraction Pattern**: Pluggable AI provider system
   - **Caching Strategy**: Map-based in-memory cache keyed by questionId (process lifetime)
   - **Graceful Degradation**: 
     - Primary: OpenAI API (if `OPENAI_KEY` set and valid)
     - Fallback 1: HuggingFace API (if `HF_KEY` set and valid)
     - Fallback 2: Canned explanations from question bank (always available)
   - **Rate Limiting**: Low token limits on AI requests to prevent cost overruns
   - **Rationale**: Provides enhanced explanations when possible while ensuring app always functions

3. **Leaderboard Service** (`services/leaderboard.js`):
   - **Default Implementation**: In-memory array (non-persistent, sorted by score)
   - **Design Pattern**: Interface-based service that can be swapped for Firebase implementation
   - **Sorting**: Descending by score, ascending by timestamp for ties
   - **Memory Management**: Maintains only top 100 scores to prevent bloat
   - **Firebase Alternative** (`services/leaderboard.firebase.js`):
     - Contains setup instructions and placeholder code for Firebase Realtime DB
     - Enables persistent storage when `FIREBASE_CONFIG` environment variable is set
     - Not enabled by default (requires user setup)

**Rationale**: Modular service design allows features to work independently. AI explanations enhance experience but aren't required. Leaderboard starts simple (in-memory) with clear upgrade path to persistence.

### Data Storage

**Question Banks**:
- Format: Static JSON files per topic
- Location: `backend/questions/{topic}.json`
- Structure: Array of question objects with id, question, options, correctAnswer, explanation
- Why: Simple, version-controllable, no database setup required

**User Progress**:
- Client-side localStorage (key: `eduflash_progress`)
- Stores: score, rounds, correct count, timestamp
- Why: No user accounts needed, works offline, instant access

**Leaderboard**:
- Default: In-memory JavaScript array (development/demo)
- Optional: Firebase Realtime Database (production with persistence)
- Why: Start simple, upgrade path available with clear documentation

### Authentication & Authorization

**Current State**: None implemented

**Rationale**: Educational quiz app doesn't require user accounts for core functionality. Leaderboard accepts any name (client-side input). Firebase implementation includes name length validation (max 50 chars) and basic score validation to prevent obvious abuse.

**Future Considerations**: If adding user accounts, Firebase Auth would integrate naturally with existing Firebase leaderboard option.

## External Dependencies

### Required Runtime Dependencies

1. **express** (^4.18.2)
   - Purpose: Web server and routing
   - Why: Industry standard, simple setup, middleware ecosystem

2. **cors** (^2.8.5)
   - Purpose: Enable cross-origin requests
   - Why: Frontend served separately during development

3. **dotenv** (^16.3.1)
   - Purpose: Load environment variables from .env file
   - Why: Secure API key management, different configs per environment

4. **node-fetch** (^2.6.7)
   - Purpose: Make HTTP requests to AI APIs
   - Why: Node.js lacks native fetch in older versions, consistent API with browser fetch

### Optional External APIs

1. **OpenAI API** (optional)
   - Service: GPT-based text generation
   - Environment Variable: `OPENAI_KEY`
   - Purpose: Generate AI-powered question explanations
   - Fallback: HuggingFace or canned explanations
   - Rate Limits: Low token limits configured in explainProvider
   - Cost: Per-token pricing from OpenAI

2. **HuggingFace Inference API** (optional)
   - Service: Open-source ML model hosting
   - Environment Variable: `HF_KEY`
   - Purpose: Alternative AI explanation provider
   - Fallback: Canned explanations
   - Cost: Free tier available, rate limits apply

3. **Firebase Realtime Database** (optional)
   - Service: NoSQL cloud database
   - Environment Variable: `FIREBASE_CONFIG` (JSON)
   - Purpose: Persistent leaderboard storage
   - Fallback: In-memory leaderboard
   - Setup: Requires Firebase project creation, documented in `docs/firebase-setup.md`
   - Cost: Free tier available (Spark plan), scales with usage

### Deployment Targets

**Frontend**:
- Recommended: Vercel (static site hosting)
- Configuration: Set root directory to `frontend/`
- Why: Free tier, automatic HTTPS, CDN, simple git integration

**Backend**:
- Recommended: Replit (current hosting)
- Alternative: Any Node.js hosting (Heroku, Railway, Render)
- Port: Configurable via `PORT` environment variable (default 3000)

**Environment Variables Required**:
- `PORT` - Server port (optional, default: 3000)
- `HF_KEY` - HuggingFace API key (optional, format: string)
- `OPENAI_KEY` - OpenAI API key (optional, format: "sk-...")
- `FIREBASE_CONFIG` - Firebase configuration (optional, format: JSON string)

### Browser Dependencies

**Client-Side**:
- Modern browser with ES6+ support
- localStorage API
- Fetch API
- No external JavaScript libraries or frameworks used

**Browser Compatibility**: Chrome 60+, Firefox 55+, Safari 11+, Edge 79+