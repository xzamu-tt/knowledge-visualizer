# 🏗️ Architecture: Before & After

## BEFORE: localStorage-only
```
┌──────────────────────────────────┐
│    React App (App.jsx)           │
│  - Edit cards                    │
│  - useEffect saves to localStorage│
└───────────────┬──────────────────┘
                │
                ↓
        ┌───────────────┐
        │ localStorage  │
        │ (browser)     │
        └───────────────┘
                │
                ✗ Survives page reload
                ✗ Survives npm restart
                ✓ Lost if browser cleared
                ✗ Can't sync with git
                ✗ Hard to back up
```

**Problem:** Cards not versioned with git; if you `git pull`, no way to sync cards.

---

## AFTER: Git-integrated sync
```
┌─────────────────────────────────────────────────────────────┐
│                      React App (App.jsx)                    │
│                 ↓ useDecksSync Hook                          │
│                                                              │
│  Edit Flow:                                                  │
│  1. User edits → setDecks()                                 │
│  2. React renders changes                                    │
│  3. useEffect triggers:                                      │
│     a) Save to localStorage (instant)                       │
│     b) Debounce 1s, then POST to /api/decks/save           │
│                                                              │
│  Load Flow:                                                  │
│  1. On mount: fetch /api/decks                              │
│  2. Fallback to localStorage                                │
│  3. Fallback to INITIAL_DECKS                               │
│  4. On tab visibility: detect external changes              │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────┐
        ↓                     ↓              ↓
   ┌──────────────┐  ┌───────────────┐  ┌─────────────┐
   │ localStorage │  │ Backend API   │  │ Git History │
   │ (browser)    │  │ (Node.js)     │  │             │
   │              │  │               │  │             │
   │ • Cache      │  │ • Express.js  │  │ • git log   │
   │ • Instant    │  │ • Port 3001   │  │ • Commits   │
   │ • Per-browser│  │ • File I/O    │  │ • Branches  │
   └──────────────┘  └───────┬───────┘  └─────────────┘
                              │
                              ↓
                    ┌──────────────────┐
                    │  data/decks.json │
                    │                  │
                    │ • Git-tracked    │
                    │ • Versioned      │
                    │ • Shareable      │
                    │ • Inspectable    │
                    └──────────────────┘
```

## Key Architectural Changes

### 1. Three-Layer Persistence Model
```
Layer 1: localStorage
├─ Speed: Instant
├─ Scope: Single browser
└─ Use: Fast cache during editing

Layer 2: Backend API (server.js)
├─ Speed: 1-2 seconds (debounced)
├─ Scope: Local filesystem
└─ Use: Persistent storage

Layer 3: Git + data/decks.json
├─ Speed: Manual (on commit)
├─ Scope: Version control
└─ Use: Team collaboration & history
```

### 2. Server Architecture
```
server.js (Express.js on port 3001)
├── GET /api/decks
│   └─ Read data/decks.json and return JSON
├── POST /api/decks/save
│   └─ Write updated JSON to data/decks.json
└── GET /api/decks/export
    └─ Export for backup/download
```

### 3. Data Flow Diagram
```
User Types → React State Changes
    ↓
useDecksSync detects change
    ↓
localStorage.setItem() [instant]
    ↓
[debounce 1 second]
    ↓
fetch POST /api/decks/save
    ↓
server.js writes to file
    ↓
data/decks.json updated
    ↓
git status shows changes
    ↓
User commits (optional)
    ↓
Team pulls changes
    ↓
Browser tab regains focus
    ↓
useDecksSync detects new data
    ↓
App reloads automatically
```

### 4. Fallback Chain (On App Load)
```
try GET /api/decks
    ↓ (success)
  Return backend data
    ↓ (fail: no server)
  try localStorage.getItem()
      ↓ (success)
    Return cached data
      ↓ (fail: no cache)
    return INITIAL_DECKS (hardcoded)
```

## File Structure Evolution

### Before
```
src/
├── App.jsx          ← Handles loading and saving to localStorage
├── main.jsx
└── index.css
```

### After
```
src/
├── App.jsx                    ← Uses useDecksSync hook
├── hooks/
│   └── useDecksSync.js       ← NEW: Handles all persistence logic
├── main.jsx
└── index.css

data/
└── decks.json                ← NEW: Git-tracked flashcard database

server.js                      ← NEW: Backend API for file I/O
vite.config.js                ← UPDATED: Added /api proxy
package.json                  ← UPDATED: Added Express, scripts
README.md                      ← UPDATED: New sync documentation
SYNC_GUIDE.md                 ← NEW: Detailed sync guide
SETUP_CHECKLIST.md            ← NEW: Setup instructions
ARCHITECTURE.md               ← NEW: This file
```

## Technology Stack Changes

### Before
- **Frontend:** React + Vite
- **State:** Component state + localStorage
- **Data:** Hardcoded INITIAL_DECKS
- **Persistence:** Browser's localStorage API

### After
- **Frontend:** React + Vite (unchanged)
- **State:** Component state + useDecksSync hook
- **Backend:** Express.js on port 3001
- **Data:** `data/decks.json` (git-tracked)
- **Persistence:**
  - Browser localStorage (cache)
  - Node.js file system (server)
  - Git (version control)

## Benefits

| Feature | Before | After |
|---------|--------|-------|
| **Version control** | ✗ Manual exports | ✓ Git integration |
| **Team sync** | ✗ Share JSON files | ✓ `git pull` updates |
| **Offline work** | ✓ Works | ✓ Still works |
| **Auto-save** | ✓ localStorage | ✓ 3-layer sync |
| **Persistence** | ✗ Browser only | ✓ Files + Git |
| **Inspectable** | ✗ JSON in localStorage | ✓ Plain JSON files |
| **Collaborative** | ✗ Difficult | ✓ Git workflow |

## Deployment Considerations

### Development
```bash
npm run dev:all
# Runs:
# - Vite on http://localhost:5173
# - Express on http://localhost:3001
# - Vite proxies /api to Express
```

### Production
- Need to build React: `npm run build`
- Need to run Express server separately
- Consider using PM2 or systemd for process management
- Add authentication/authorization
- Use HTTPS (not HTTP)
- Database option: Replace file I/O with DB

### Docker-Ready
```dockerfile
# Could containerize both:
# - React build output (static files)
# - Node.js Express server
# Both served from same container
```

## Security Notes

🔒 **Current State** (Development Only)
- Server runs on `localhost:3001` (local only)
- No authentication required
- Assumes trusted local filesystem

🔐 **For Production**
- Add JWT/session authentication
- Implement access control (who can edit which cards?)
- Use HTTPS only
- Add rate limiting
- Audit logging
- Database instead of file I/O
- Consider Electron for desktop app with IPC instead of HTTP

## Future Extensions

### Possible Enhancements
1. **Real-time collaboration** - WebSocket sync
2. **Conflict resolution** - Merge strategies for concurrent edits
3. **User accounts** - Multi-user support
4. **Cloud storage** - Sync to AWS S3 / Google Drive
5. **Diff viewer** - Show changes before commit
6. **Rich history** - Git history browser UI
7. **Export formats** - Anki, Quizlet, PDF
8. **Mobile sync** - Mobile app with same backend

---

**Summary:** Transformed from localStorage-only to a full git-integrated sync system with three-layer persistence, automatic change detection, and team collaboration support. All while keeping the same user-friendly editing experience!
