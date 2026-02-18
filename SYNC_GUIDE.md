# 📚 Knowledge Visualizer - Git Sync Guide

This app syncs flashcard edits to git-tracked files, just like Obsidian. All changes are automatically saved to `data/decks.json` and can be committed to git.

## ✨ How It Works

### Three-Layer Persistence
1. **localStorage** - Fast, instant saves while editing
2. **Backend API** - Persists to `data/decks.json` (git-tracked)
3. **Git** - Version control and collaboration

### Sync Flow
```
User edits → localStorage (instant)
          → Backend saves to data/decks.json (debounced 1s)
          → git status shows changes
```

## 🚀 Setup & Running

### Installation
```bash
npm install
```

### Development (Both Vite + Sync Server)
```bash
npm run dev:all
```

This starts:
- **Vite dev server** on `http://localhost:5173` (your UI)
- **Sync server** on `http://localhost:3001` (API for file I/O)

### Alternative: Run Separately
```bash
# Terminal 1
npm run dev:server

# Terminal 2
npm run dev
```

## 📝 Workflow

### 1. Edit Cards in the App
- All changes save to localStorage **instantly**
- After 1 second of inactivity, changes sync to `data/decks.json`
- Sync status shown in header: "Syncing..." → "Last sync: HH:MM:SS"

### 2. Commit to Git
```bash
# Changes are in data/decks.json
git status
git add data/decks.json
git commit -m "Update flashcards"
git push
```

### 3. Pull Updates from Git
```bash
git pull
```
- When you return to the app tab, it auto-detects changes and reloads
- Or hard-refresh the page to see latest data

## 🔄 Sync Features

### Auto-Sync When Tab Becomes Active
When you switch back to the browser tab:
- App checks if `data/decks.json` changed
- If yes, reloads cards automatically
- Perfect for: `git pull` scenarios

### Fallback Strategy
- **Online + Backend available** → Load from `data/decks.json`
- **Backend unavailable** → Use localStorage
- **Both unavailable** → Use INITIAL_DECKS hardcoded defaults

### Debouncing
- Saves are debounced 1 second after last edit
- Prevents hammering backend with 100s of requests
- localStorage saves immediately (always available)

## 📂 File Structure
```
knowledge-visualizer/
├── data/
│   └── decks.json          ← Git-tracked! Your source of truth
├── src/
│   ├── hooks/
│   │   └── useDecksSync.js ← Sync logic (load/save/detect changes)
│   └── App.jsx             ← Updated to use useDecksSync
├── server.js               ← Backend API server (handles file I/O)
├── vite.config.js          ← Proxies /api/* to server
└── package.json            ← Scripts to run everything
```

## 🎯 Typical Workflow

### Daily: Edit and Auto-Save
```
1. npm run dev:all              # Start everything
2. Edit cards in the app        # Changes auto-save locally
3. App syncs to data/decks.json # Every 1-2 seconds
```

### Weekly: Sync with Team
```
git pull                    # Get team's latest edits
# App detects changes and reloads when you click back to tab
git add data/decks.json     # Stage changes
git commit -m "..."        # Commit
git push                    # Share with team
```

### Offline: Keep Working
```
# No internet? No problem.
# All edits stay in localStorage
# When you reconnect, they'll sync to data/decks.json
```

## 🔧 Troubleshooting

### Sync says "error"
- Check if backend is running: `npm run dev:server`
- Check if `data/` directory exists and is writable
- Check browser console for error details

### Changes not syncing to file
- Wait 1 second after last edit (debounce timer)
- Check that backend server is running
- Check `data/decks.json` file permissions

### Don't see latest cards after `git pull`
- Click back to browser tab to trigger refresh
- Or hard-refresh the page (Cmd+Shift+R)
- Check browser console for errors

### Want to manually export/import
```bash
# Export current state
curl http://localhost:3001/api/decks/export > backup.json

# Manually restore from git
git checkout data/decks.json
# Then refresh app
```

## 🔐 Security Notes

- The sync server runs only on `localhost:3001` (local development)
- Never expose this server to the internet
- For production, implement proper auth and HTTPS
- `data/decks.json` contains your flashcard content (commit responsibly)

## 💡 Tips

- Commit `data/decks.json` frequently for easy rollbacks
- Use git branches for testing new card ideas
- Images in cards are stored as base64 in JSON (works, but can make files large)
- Use `.gitignore` if you want to store sensitive card content locally only

---

**Questions?** Check the app console (F12) for detailed sync logs.
