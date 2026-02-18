# 📚 Hierarchical Sections Implementation

## What Changed

Your Knowledge Visualizer now supports **hierarchical organization** just like Obsidian vaults. Decks are now organized under sections (books), which can expand and collapse.

## New Architecture

### Before: Flat Structure
```
decks (array)
├── Deck 1: "Data-Intensive Basics"
├── Deck 2: "Chapter 2: Data Models"
└── Deck 3: "Chapter 3: Storage Engines"
```

### After: Hierarchical Structure
```
sections (array)
└── Section: "Data Intensive Apps"
    ├── Deck 1: "Data-Intensive Basics"
    ├── Deck 2: "Chapter 2: Data Models"
    └── Deck 3: "Chapter 3: Storage Engines"
```

## Data Structure in `data/decks.json`

```json
[
  {
    "id": "section-1",
    "title": "Data Intensive Apps",
    "decks": [
      {
        "id": "deck-1",
        "title": "Data-Intensive Basics",
        "cards": [...]
      },
      {
        "id": "deck-2",
        "title": "Chapter 2: Data Models",
        "cards": [...]
      }
    ]
  }
]
```

## New Features

✨ **Expandable Sections**
- Click section header → arrow rotates, decks expand/collapse
- All decks under a section show/hide together

🎨 **Visual Feedback**
- ChevronDown icon rotates when section toggles
- Hover effect on section header
- Total card count shown per section

🔄 **Independent Toggle States**
- Section expand/collapse: UI-only (not persistent)
- Deck active/inactive: Still controls card visibility in workspace

## UI Changes

### Sidebar
The sidebar now shows a proper hierarchical structure:

```
┌─────────────────────────────┐
│ Library                      │
├─────────────────────────────┤
│ ▼ Data Intensive Apps    [4]│
│   ├─ Data-Intensive...      │
│   ├─ Chapter 2: Data...     │
│   └─ Chapter 3: Storage...  │
├─────────────────────────────┤
│ Shortcuts                   │
└─────────────────────────────┘
```

- **▼** (ChevronDown) - Click to collapse section
- **[4]** - Total cards in section
- Indented decks appear only when section is expanded

## Implementation Details

### State Management

```js
// New state: which sections are expanded
const [expandedSections, setExpandedSections] = useState(() =>
  sections.map(s => s.id)  // Start all expanded
);

// Still tracks active decks (which ones show cards in workspace)
const [activeDeckIds, setActiveDeckIds] = useState(() =>
  sections.flatMap(s => s.decks.map(d => d.id))
);
```

### New Functions

```js
// Toggle section expand/collapse
const toggleSection = (sectionId) => {
  setExpandedSections(prev =>
    prev.includes(sectionId)
      ? prev.filter(i => i !== sectionId)
      : [...prev, sectionId]
  );
};
```

### Updated Functions

Functions now traverse the hierarchy:

```js
// Signature: updateCard(sectionId, deckId, cardId, field, value)
const updateCard = (sectionId, deckId, cardId, field, value) => {
  setSections(prev => prev.map(section => {
    if (section.id !== sectionId) return section;
    return {
      ...section,
      decks: section.decks.map(deck => {
        if (deck.id !== deckId) return deck;
        return {
          ...deck,
          cards: deck.cards.map(card =>
            card.id === cardId ? { ...card, [field]: value } : card
          )
        };
      })
    };
  }));
};

// Same pattern for addCardToDeck(sectionId, deckId)
```

## Files Modified

1. **`data/decks.json`** ✅
   - Migrated from flat array to nested structure
   - All decks now wrapped in a "Data Intensive Apps" section

2. **`src/App.jsx`** ✅
   - Renamed `decks` → `sections`
   - Added `expandedSections` state
   - Added `toggleSection()` function
   - Updated `updateCard()` and `addCardToDeck()` to take `sectionId`
   - Updated `allVisibleCards` to iterate sections → decks → cards
   - Completely rewrote sidebar rendering with nested loops
   - Updated Flashcard calls to pass `sectionId`

3. **`src/hooks/useDecksSync.js`** ✅
   - Parameter renamed from `initialDecks` to `initialData` (cosmetic)
   - No functional changes (handles any JSON structure)

## Behavior

### Expanding/Collapsing Sections
1. Click the section header
2. ChevronDown icon rotates
3. All decks under that section appear/disappear

### Toggling Individual Decks
1. Click a deck name (still indented under section)
2. Deck's cards appear/disappear in workspace
3. Section stays expanded/collapsed as before

### Search
- Search works across all cards, regardless of section expand state
- Search bar filters cards by question, answer, or ID

### Sync
- All changes sync to `data/decks.json` with nested structure
- Git tracks the hierarchical organization

## Expansion State

**Important:** Section expand/collapse state is **NOT persisted**. Every time you reload the page:
- All sections start expanded
- Deck active/inactive state is remembered

This keeps the data file simple and respects user expectations (common in note-taking apps).

## Future Enhancements

Potential improvements (not implemented yet):
- 🔒 Persist expand/collapse state to localStorage
- ➕ Add new section UI
- ✏️ Edit section names
- 🗑️ Delete sections
- 📦 Move decks between sections
- 🎨 Custom section colors/icons

## Verification Checklist

✅ Hierarchical data structure in `data/decks.json`
✅ Sidebar shows "Data Intensive Apps" section with ChevronDown
✅ Clicking section header toggles expand/collapse
✅ Arrow icon rotates on toggle
✅ Decks appear/disappear when section expands/collapses
✅ Individual deck toggle still works
✅ Cards are filterable by section
✅ Edits sync to `data/decks.json` with new structure
✅ Search works across all cards
✅ App builds without errors

## Testing

Run the app:
```bash
npm run dev:all
```

Test the hierarchy:
1. Open sidebar
2. See "Data Intensive Apps" section with 3 decks
3. Click section header → decks collapse
4. Click again → decks expand
5. Click a deck → its cards hide from workspace
6. Edit a card → syncs to `data/decks.json` (nested structure)
7. Refresh page → section starts expanded again

---

**Summary:** Your Knowledge Visualizer now has proper hierarchical organization with expandable sections, making it easier to manage large collections of flashcards! 🎉
