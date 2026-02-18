# 🚀 Quick Reference

## Start Your App
```bash
npm run dev:all
```
Opens: http://localhost:5173

## Edit & Auto-Save
1. Edit a card
2. Changes save to localStorage instantly
3. After ~1 second, syncs to `data/decks.json`
4. Header shows "Last sync: HH:MM:SS" ✓

## Commit to Git
```bash
git add data/decks.json
git commit -m "Update flashcards"
git push
```

## Pull Team Updates
```bash
git pull
# Switch to browser tab → Auto-reloads! ✓
```

---

## Commands Cheat Sheet

| Command | What it does |
|---------|-------------|
| `npm run dev:all` | Start Vite + backend (recommended) |
| `npm run dev` | Start Vite only (needs backend running separately) |
| `npm run dev:server` | Start backend only (needs Vite running separately) |
| `npm run build` | Build for production |
| `npm run lint` | Check for code issues |
| `PORT=3002 npm run dev:server` | Use custom port |

---

## Ports
- **5173** - Vite (your app UI)
- **3001** - Backend API (file I/O)

---

## API Endpoints

| Method | URL | Purpose |
|--------|-----|---------|
| GET | `/api/decks` | Load all decks |
| POST | `/api/decks/save` | Save decks to file |
| GET | `/api/decks/export` | Download as JSON |

Example:
```bash
curl http://localhost:3001/api/decks
curl http://localhost:3001/api/decks/export > backup.json
```

---

## File Locations

| File | Purpose | Git tracked |
|------|---------|------------|
| `data/decks.json` | Your flashcards | ✓ Yes |
| `src/App.jsx` | Main app component | ✓ Yes |
| `src/hooks/useDecksSync.js` | Sync logic | ✓ Yes |
| `server.js` | Backend API | ✓ Yes |
| `node_modules/` | Dependencies | ✗ No |
| `.claude/` | Claude Code settings | ✗ No |

---

## Troubleshooting (Quick)

| Issue | Solution |
|-------|----------|
| "Syncing..." forever | Check both servers running: `npm run dev:all` |
| Cards don't load | Hard refresh: Cmd+Shift+R or check console |
| Server won't start | Check port 3001 is free, or use `PORT=3002` |
| Git showing no changes | Wait 1-2 seconds after editing |
| Merge conflicts in `data/decks.json` | Use `git checkout --ours` or `--theirs` to resolve |

---

## Sync Status Indicators

**Header shows:**
- 🔄 "Syncing..." (blue) - Data being saved
- ❌ "Sync failed" (red) - Error occurred
- ⏱️ "Last sync: 10:45:32" (gray) - Success timestamp

---

## Three-Layer Sync Model
```
You type
  ↓
localStorage [instant ✓]
  ↓
[1 second later]
  ↓
data/decks.json [via /api/decks/save]
  ↓
git status shows changes
  ↓
You commit [manual]
```

---

## Pro Tips

💡 **Tip 1:** Commit frequently
```bash
git add data/decks.json && git commit -m "Add biology cards"
```

💡 **Tip 2:** Work offline - it just works
```bash
# Internet down? No problem. Keep editing.
# When you reconnect, changes auto-sync.
```

💡 **Tip 3:** Check git diff before committing
```bash
git diff data/decks.json  # See what changed
```

💡 **Tip 4:** Revert a mistake
```bash
git checkout data/decks.json  # Reset to last commit
# Refresh app → old cards reload
```

💡 **Tip 5:** Export backup
```bash
curl http://localhost:3001/api/decks/export > my-backup.json
```

---

## Documentation

- **[SYNC_GUIDE.md](./SYNC_GUIDE.md)** - Detailed sync docs
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design
- **[SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** - Setup guide
- **[README.md](./README.md)** - Project overview

---

## Common Workflows

### Daily Study
```bash
npm run dev:all            # Start
# Edit cards
# Changes auto-save
[Ctrl+C to quit]
```

### Weekly Team Sync
```bash
git pull                   # Get team's updates
# Switch to browser
# Auto-reloads!
# Edit new cards
git add data/decks.json
git commit -m "..."
git push
```

### Emergency Restore
```bash
git log --oneline data/decks.json  # See history
git checkout <hash> -- data/decks.json  # Restore version
# Refresh app
```

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Hard refresh | Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows) |
| Developer console | F12 or Cmd+Option+I |
| Search cards | Cmd+F (in header search) |

---

## One-Liners

```bash
# Start
npm run dev:all

# Edit

# Commit
git add data/decks.json && git commit -m "Update cards" && git push

# Collaborate
git pull  # App auto-reloads when you click back to tab
```

That's it! 🎉

---

**Need more?** See the full docs in [SYNC_GUIDE.md](./SYNC_GUIDE.md)
