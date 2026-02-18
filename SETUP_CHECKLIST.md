# ✅ Git Sync Setup Checklist

Your Knowledge Visualizer now syncs with git! Here's what was implemented:

## ✨ What Changed

### New Files Created
- ✅ `server.js` - Backend API for file I/O (Express.js)
- ✅ `src/hooks/useDecksSync.js` - React hook handling sync logic
- ✅ `data/decks.json` - Your git-tracked flashcard database
- ✅ `SYNC_GUIDE.md` - Detailed sync documentation
- ✅ `README.md` - Updated with new features

### Files Modified
- ✅ `package.json` - Added Express, concurrently; new npm scripts
- ✅ `vite.config.js` - Added API proxy configuration
- ✅ `src/App.jsx` - Replaced localStorage logic with useDecksSync hook; added sync status UI

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```
*(Already done for you)*

### 2. Run Everything
```bash
npm run dev:all
```

This starts:
- **Vite dev server** - http://localhost:5173 (your app UI)
- **Sync server** - http://localhost:3001 (handles file I/O)

### 3. Start Editing!
- Edit flashcards in the app
- Changes save to localStorage **instantly**
- After 1 second, they sync to `data/decks.json`
- You'll see "Last sync: HH:MM:SS" in the header

### 4. Commit to Git
```bash
git add data/decks.json
git commit -m "Update flashcards"
git push
```

## 📊 How Sync Works

```
┌─────────────────────────────────────────────┐
│  User Edits Card in App                     │
└──────────────┬────────────────────────────┬─┘
               │                            │
               ↓                            ↓
          localStorage              Sync Status
         (instant)                  Updates UI
               │
               │ (1 second debounce)
               ↓
          Backend API
        POST /api/decks/save
               │
               ↓
        data/decks.json
          (git-tracked)
               │
               ↓
         git status shows
          uncommitted changes
```

## 🔄 Auto-Reload Feature

When you do a `git pull`:
1. Files on disk change
2. You switch back to the browser tab
3. App detects changes automatically
4. Cards reload from the new `data/decks.json`

**No manual refresh needed!** (unless you want to force it)

## 🎯 Three-Layer Persistence

| Layer | Purpose | Speed | Persistent |
|-------|---------|-------|------------|
| localStorage | Cache for fast edits | Instant | Browser only |
| Backend API | File I/O handler | 1-2s | Local disk |
| Git | Version control | Manual | Remote repo |

### Fallback Logic
1. **Try backend** → Load from `data/decks.json`
2. **If unavailable** → Use localStorage
3. **If both fail** → Use hardcoded defaults

This means you can keep working offline!

## 🔧 Troubleshooting

### "Syncing..." appears forever
- Check if both servers are running
- Check browser console (F12) for errors
- Make sure `data/` directory exists

### Don't see cards after git pull
- Click back to the browser tab (should auto-reload)
- Or hard-refresh: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)

### Backend won't start
```bash
# Make sure port 3001 is free
lsof -i :3001

# Or use a different port
PORT=3002 npm run dev:server
```

## 📚 Detailed Documentation

- **[SYNC_GUIDE.md](./SYNC_GUIDE.md)** - Full sync documentation with examples
- **[README.md](./README.md)** - Project overview and features

## 🎓 Example Workflow

### Day 1: Start Learning
```bash
npm run dev:all              # Start both servers
# Edit cards in the app
# Changes auto-save to data/decks.json
```

### Day 2: Share with Team
```bash
git add data/decks.json
git commit -m "Add 5 new flashcards"
git push
```

### Day 3: Pull Team Updates
```bash
git pull                     # Team's cards now in data/decks.json
# Switch to browser tab → App auto-reloads with new cards
# Start editing...
```

## ✨ Key Features

✅ **Auto-save** - Every keystroke saved locally + to file
✅ **Git integration** - All edits in version control
✅ **Offline-first** - Works without internet
✅ **Zero friction** - Just edit and forget about saving
✅ **Team-friendly** - Git workflow like Obsidian vaults
✅ **No database** - Just JSON files, easy to inspect/edit

## 🚀 Next Steps

1. **Run the app** - `npm run dev:all`
2. **Edit a card** - Make a small change
3. **Check git status** - `git status` should show `data/decks.json` modified
4. **Commit it** - `git add data/decks.json && git commit -m "Test sync"`

You're all set! 🎉

---

**Questions?** Check:
- Browser console (F12) for error logs
- Terminal output for server logs
- SYNC_GUIDE.md for detailed docs
