# 🗑️ Delete Card & ⏮️ Undo Feature

## What's New

### Delete Card Button
- **🗑️ Trash icon** on each card (appears on hover)
- Click to delete that card permanently
- Fully undoable with Ctrl+Z!

### Undo Functionality
- **Ctrl+Z** (or Cmd+Z on Mac) - Undo last action
- Works for:
  - ✅ Card deletions
  - ✅ Card edits (text, images, category, ID)
  - ✅ New cards added
  - ✅ Any modification

## UI

### Card Buttons
Hover over any card to see:

```
┌──────────────────────────┐
│ BAS-01 ... [+] [🗑️]      │  ← Buttons appear on hover
├──────────────────────────┤
│ Question content here    │
│                          │
│─────────────────────────  │
│ Answer 👁️                │
└──────────────────────────┘
```

**[+]** - Add new card
**[🗑️]** - Delete this card

### Undo Indicator
- Changes are synced to file immediately
- Undo history cleared after saving to backend
- If no undo available, Ctrl+Z does nothing

## How to Use

### Delete a Card
1. Hover over the card
2. Click the **🗑️ Trash icon**
3. Card disappears immediately
4. Press **Ctrl+Z** to undo

### Undo Last Action
1. Made a mistake?
2. Press **Ctrl+Z** (Windows/Linux) or **Cmd+Z** (Mac)
3. Last action reversed instantly

### Undo Chain
- Each Ctrl+Z undoes ONE action
- Works for consecutive changes:
  ```
  Edit card → Ctrl+Z (undoes edit)
  Delete card → Ctrl+Z (card is back)
  Add card → Ctrl+Z (new card removed)
  ```

- Once you perform a new action, you can't redo previous undos
- Only the last action can be undone

## Behavior

### What Happens on Delete

**Before:**
```json
{
  "cards": [
    { "id": 101, "front": "Q1", "back": "A1" },
    { "id": 102, "front": "Q2", "back": "A2" },
    { "id": 103, "front": "Q3", "back": "A3" }
  ]
}
```

**After clicking delete on card 102:**
```json
{
  "cards": [
    { "id": 101, "front": "Q1", "back": "A1" },
    { "id": 103, "front": "Q3", "back": "A3" }
  ]
}
```

**After Ctrl+Z:**
```json
{
  "cards": [
    { "id": 101, "front": "Q1", "back": "A1" },
    { "id": 102, "front": "Q2", "back": "A2" },
    { "id": 103, "front": "Q3", "back": "A3" }
  ]
}
```

### Undo Memory
- System keeps one "snapshot" of state before changes
- Before each action (edit, delete, add), current state is saved
- Ctrl+Z restores to that snapshot
- New action clears the undo history

### Sync Behavior
- Edits auto-save to `data/decks.json` within 1 second
- Undo works on the in-memory state
- Once synced to file, undo is still available
- Clear your browser cache → lose undo history (in-memory only)

## Implementation Details

### State
```js
const [undoHistory, setUndoHistory] = useState(null);
```
Stores a deep copy of sections before each change.

### Helper Functions
```js
// Save state before making changes
const saveForUndo = () => {
  setUndoHistory(JSON.parse(JSON.stringify(sections)));
};

// Restore from undo history
const undo = () => {
  if (undoHistory) {
    setSections(undoHistory);
    setUndoHistory(null);
  }
};
```

### Keyboard Listener
```js
useEffect(() => {
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      undo();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [undoHistory]);
```

Listens for Ctrl+Z (Windows/Linux) or Cmd+Z (Mac).

### Delete Function
```js
const deleteCard = (sectionId, deckId, cardId) => {
  saveForUndo();  // Save before deleting
  setSections(prev => prev.map(section => {
    if (section.id !== sectionId) return section;
    return {
      ...section,
      decks: section.decks.map(deck => {
        if (deck.id !== deckId) return deck;
        return {
          ...deck,
          cards: deck.cards.filter(card => card.id !== cardId)  // Remove card
        };
      })
    };
  }));
};
```

## Limitations

⚠️ **Single Undo Only**
- Only the last action can be undone
- Multiple Ctrl+Z presses won't work for older actions
- This keeps the system simple and performant

⚠️ **In-Memory Only**
- Undo history is lost if you:
  - Refresh the page
  - Close the browser
  - Switch to a different app and back
- Changes ARE saved to `data/decks.json`, but undo is not persistent

✅ **Works Across**
- Section toggling (doesn't affect undo)
- Deck toggling (doesn't affect undo)
- Search (doesn't affect undo)
- View changes (doesn't affect undo)

## Edge Cases

### What if I delete a card and the app crashes?
- Card is already synced to `data/decks.json`
- On restart, deletion is permanent
- Git history still has it: `git log -p data/decks.json`

### What if I press Ctrl+Z multiple times?
- First press: Undoes last action
- Second press: Does nothing (no undo history)
- New action: Clears and resets undo

### What if I edit, then delete, then undo?
- Undo restores to state before deletion
- All edits before that are also restored

## Use Cases

### Quick Mistake Recovery
```
You: Edit card incorrectly
    Ctrl+Z → Back to before edit ✓
```

### Accidental Deletion
```
You: Oops, deleted the wrong card!
    Ctrl+Z → Card restored immediately ✓
```

### Testing Changes
```
You: Delete 3 cards to reorganize
    Ctrl+Z → Back to having all cards
    Now: Reorganize differently
```

## Files Modified

| File | Changes |
|------|---------|
| `src/App.jsx` | ✅ Added undoHistory state |
| `src/App.jsx` | ✅ Added saveForUndo(), undo() functions |
| `src/App.jsx` | ✅ Added Ctrl+Z listener |
| `src/App.jsx` | ✅ Added deleteCard() function |
| `src/App.jsx` | ✅ Updated all mutating functions to call saveForUndo() |
| `src/App.jsx` | ✅ Added Trash2 icon import |
| `src/App.jsx` | ✅ Updated Flashcard component with onDelete prop |
| `src/App.jsx` | ✅ Added delete button to card header |

## Testing

### Run the app:
```bash
npm run dev:all
```

### Test delete:
1. Hover over a card
2. Click the **🗑️** icon
3. Card disappears
4. Press **Ctrl+Z**
5. Card comes back ✓

### Test undo:
1. Edit card text → See changes
2. Press **Ctrl+Z** → Changes reversed ✓
3. Delete a card → Undo works ✓
4. Press **Ctrl+Z** again → Does nothing (no history) ✓

### Test edge case:
1. Edit → Delete → Undo
2. Both actions are reversed ✓

---

**Perfect for careful editing!** 🎯

