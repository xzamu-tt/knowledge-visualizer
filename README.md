# 🧠 Knowledge Visualizer

A flashcard app with **git-synced persistence**. Edit cards locally, auto-save to `data/decks.json`, and version control your learning materials.

## ✨ Features

- 📝 **Markdown & LaTeX support** - Write `**bold**`, `$x^2$`, formulas
- 🖼️ **Image support** - Paste screenshots directly into cards
- 🎨 **Beautiful UI** - Modern, responsive design with Tailwind CSS
- 💾 **Auto-save** - Instant localStorage + backend sync
- 🔄 **Git integration** - All changes tracked in `data/decks.json`
- 📱 **Offline-first** - Works without internet (syncs when reconnected)
- 🔍 **Full-text search** - Find cards by question, answer, or ID

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run everything (Vite + Sync Server)
npm run dev:all

# Open in browser
# http://localhost:5173
```

## 🔄 Git Sync Workflow

```bash
# 1. Edit cards in app (auto-saves to data/decks.json)
# 2. Commit changes
git add data/decks.json
git commit -m "Add new flashcards"
git push

# 3. Pull updates from team
git pull
# App auto-detects changes when you click back to tab
```

**See [SYNC_GUIDE.md](./SYNC_GUIDE.md) for detailed sync documentation.**

## 📦 What's Included

### Frontend (React + Vite)
- Component-based architecture
- Real-time Markdown rendering with **marked.js**
- LaTeX math rendering with **KaTeX**
- Tailwind CSS for styling

### Backend (Express + Node)
- Simple REST API for file I/O
- `/api/decks` - Load all decks
- `/api/decks/save` - Save decks to file
- `/api/decks/export` - Export as JSON

### Data Layer
- **localStorage** - Instant saves while editing
- **data/decks.json** - Git-tracked source of truth
- Automatic fallback chain

## 📁 Project Structure

```
knowledge-visualizer/
├── src/
│   ├── App.jsx                 # Main app component
│   ├── hooks/
│   │   └── useDecksSync.js     # Sync logic (load/save/detect changes)
│   ├── main.jsx
│   └── index.css
├── data/
│   └── decks.json              # ⭐ Your flashcards (git-tracked)
├── server.js                   # Express API server
├── vite.config.js              # Vite + API proxy config
├── SYNC_GUIDE.md               # Detailed sync documentation
└── package.json
```

## 🎯 Typical Workflow

### Daily Use
1. **Start the app** - `npm run dev:all`
2. **Edit cards** - Changes save instantly to localStorage
3. **Auto-sync** - After 1 second, changes sync to `data/decks.json`
4. **Keep working** - No interruptions, seamless editing

### Weekly Sync with Team
1. **Pull latest** - `git pull` (gets team's cards)
2. **App reloads** - When you click back to browser tab
3. **Add your cards** - Edit and create new flashcards
4. **Commit changes** - `git add data/decks.json && git commit -m "..."`
5. **Push** - `git push` (share with team)

### Offline Work
- Edit cards without internet
- All changes stored in localStorage
- When you reconnect, changes sync to `data/decks.json`

## 🔧 Scripts

```bash
npm run dev:all      # Start Vite + backend server (recommended)
npm run dev          # Start Vite dev server only
npm run dev:server   # Start backend sync server only
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 💡 Markdown & LaTeX Examples

### Markdown
```markdown
# Heading
**bold** and *italic*
- Lists
- Work too
`code snippets`
```

### LaTeX
```
Inline: $E = mc^2$
Display: $$\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$
```

### Images
Paste images directly onto cards using Cmd+V / Ctrl+V

## 🔄 How Sync Works

```
User Edit
   ↓
localStorage (instant)
   ↓
[debounce 1 second]
   ↓
Backend API
   ↓
data/decks.json (git-tracked)
   ↓
git status shows changes
```

**Auto-reload:** When you switch browser tabs back to the app after a `git pull`, it detects changes and reloads automatically.

## 📚 Deck Structure

```json
{
  "id": "deck-1",
  "title": "Chapter 1",
  "cards": [
    {
      "id": 101,
      "displayId": "BAS-01",
      "front": "Question (supports **Markdown** and $LaTeX$)",
      "back": "Answer with **formatting**",
      "category": "Basics",
      "frontImage": null,
      "backImage": "data:image/png;base64,..."
    }
  ]
}
```

## 🚨 Troubleshooting

**Sync says "error"?**
- Check that both servers are running: `npm run dev:all`
- Check browser console (F12) for error details
- Ensure `data/` directory exists

**Don't see changes after `git pull`?**
- Click back to the browser tab to trigger auto-reload
- Or hard-refresh: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)

**Want to export or backup?**
```bash
curl http://localhost:3001/api/decks/export > backup.json
```

## 📝 Notes

- All card images are stored as base64 in JSON (convenient but makes file size large)
- Changes are debounced 1 second to avoid excessive backend writes
- localStorage is always the fast cache; backend is the persistent source
- Works offline - edits are queued and synced when reconnected

## 📖 More Info

- [SYNC_GUIDE.md](./SYNC_GUIDE.md) - Detailed sync documentation
- [Marked.js](https://marked.js.org/) - Markdown parser
- [KaTeX](https://katex.org/) - LaTeX math rendering
- [Vite](https://vite.dev/) - Frontend build tool

---

**Happy learning!** 🚀
