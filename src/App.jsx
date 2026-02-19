import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Search, Plus, Download, BrainCircuit, Hash,
  ChevronDown, BookOpen, Layers, Library, Info, Image as ImageIcon, X,
  Type, Sigma, Cloud, AlertCircle, Eye, EyeOff, Trash2, ZoomIn, ZoomOut, Keyboard, FileDown, Check
} from 'lucide-react';
import { useDecksSync } from './hooks/useDecksSync';

/**
 * INITIAL_SECTIONS:
 * Sample data structure with hierarchical sections (books) containing decks.
 * Based on the concepts from "Designing Data-Intensive Applications".
 */
const INITIAL_SECTIONS = [
  {
    id: "section-1",
    title: "Data Intensive Apps",
    decks: [
      {
        id: "deck-1",
        title: "Data-Intensive Basics",
        cards: [
          {
            id: 101,
            displayId: "BAS-01",
            front: "What is **Reliability** in system design?",
            back: "The ability of a system to continue to work *correctly* even when things go wrong.\n\n### Key aspects:\n- Fault tolerance\n- Hardware redundancy\n- Error handling",
            category: "Basics",
            frontImage: null,
            backImage: null
          },
          {
            id: 102,
            displayId: "BAS-02",
            front: "What does the **CAP Theorem** state for a system $S$?",
            back: "In a distributed system, you can only provide two out of three:\n1. **Consistency** ($C$)\n2. **Availability** ($A$)\n3. **Partition Tolerance** ($P$)\n\n$\\text{If } P \\text{ exists} \\implies (C \\lor A)$ \n\nThis forces a trade-off during a network partition.",
            category: "Consistency",
            frontImage: null,
            backImage: null
          }
        ]
      },
      {
        id: "deck-2",
        title: "Chapter 2: Data Models",
        cards: [
          {
            id: 201,
            displayId: "MOD-01",
            front: "Explain **Impedance Mismatch**.",
            back: "The disconnect between the object-oriented model in application code and the relational model (tables/rows) in databases. \n\n$Objects \\neq Tables$\n\nOften requires an ORM layer.",
            category: "Concepts",
            frontImage: null,
            backImage: null
          }
        ]
      },
      {
        id: "deck-3",
        title: "Chapter 3: Storage Engines",
        cards: [
          {
            id: 301,
            displayId: "STO-01",
            front: "Analyze the time complexity of a **B-Tree** lookup.",
            back: "For a B-tree with $n$ elements and branching factor $b$:\n- Depth is $O(\\log_b n)$\n- Lookup is $O(\\log_b n)$\n\n`Index seeks` are minimized due to the high $b$, making it very disk-efficient.",
            category: "Engines",
            frontImage: null,
            backImage: null
          }
        ]
      }
    ]
  }
];

export default function App() {
  const { decks: sections, setDecks: setSections, syncStatus, lastSyncTime } = useDecksSync(INITIAL_SECTIONS);
  const [activeDeckIds, setActiveDeckIds] = useState(() =>
    sections.flatMap(s => s.decks.map(d => d.id))
  );
  const [expandedSections, setExpandedSections] = useState(() =>
    sections.map(s => s.id)
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [visibility, setVisibility] = useState('both');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [libsReady, setLibsReady] = useState(false);
  const [undoHistory, setUndoHistory] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [revealedCardIds, setRevealedCardIds] = useState(new Set());
  const [cardSize, setCardSize] = useState(3);
  const [editingCardId, setEditingCardId] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFilename, setExportFilename] = useState('');
  const [selectedExportDeckIds, setSelectedExportDeckIds] = useState(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const GRID_CLASSES = {
    1: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    2: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    3: 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 xl:grid-cols-2',
    5: 'grid-cols-1',
  };

  // Update active deck IDs and expanded sections when sections load
  useEffect(() => {
    setActiveDeckIds(sections.flatMap(s => s.decks.map(d => d.id)));
    setExpandedSections(sections.map(s => s.id));
  }, [sections]);

  // Load External Libraries for Syntax Highlighting (Highlight.js), Markdown (Marked), and LaTeX (KaTeX)
  useEffect(() => {
    let loaded = { hljs: false, marked: false, markedHighlight: false, katex: false };
    let markedHighlightScript = null;

    const checkReady = () => {
      if (!loaded.hljs || !loaded.marked || !loaded.markedHighlight || !loaded.katex) return;
      if (!window.hljs || !globalThis.marked?.Marked || !globalThis.markedHighlight || !window.katex) return;

      const { Marked } = globalThis.marked;
      const { markedHighlight } = globalThis.markedHighlight;

      // Create marked instance with highlight support
      window._markedInstance = new Marked();
      window._markedInstance.use(
        markedHighlight({
          emptyLangClass: 'hljs',
          langPrefix: 'hljs language-',
          highlight(code, lang) {
            const language = window.hljs.getLanguage(lang) ? lang : 'plaintext';
            return window.hljs.highlight(code, { language }).value;
          }
        })
      );

      // Store the diff detection function globally
      window._processDiffVisualization = (html) => {
        // Find all code blocks and wrap them with diff visualization
        return html.replace(/<pre><code class="hljs language-([^"]*)">([\s\S]*?)<\/code><\/pre>/g, (match, lang, code) => {
          const displayLang = lang && lang !== 'plaintext' ? lang : '';
          const decodedCode = new DOMParser().parseFromString('<!doctype html><body>' + code, 'text/html').body.textContent;

          const hasOk    = /\/\/[^\S\n]*✅/.test(decodedCode);
          const hasError = /\/\/[^\S\n]*❌/.test(decodedCode);
          let borderClass = '';
          if (hasOk && !hasError)      borderClass = ' code-diff-ok';
          else if (hasError && !hasOk) borderClass = ' code-diff-error';
          else if (hasOk && hasError)  borderClass = ' code-diff-mixed';

          return `<div class="code-block-wrapper${borderClass}">
  <div class="code-block-header">
    ${displayLang ? `<span class="code-lang-badge">${displayLang}</span>` : '<span></span>'}
    <button class="code-copy-btn" onclick="(function(btn){
      var codeEl = btn.closest('.code-block-wrapper').querySelector('code');
      if (codeEl && navigator.clipboard) {
        navigator.clipboard.writeText(codeEl.innerText).then(function(){
          var orig = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(function(){ btn.textContent = orig; }, 1500);
        });
      }
    })(this)">Copy</button>
  </div>
  <pre><code class="hljs language-${lang}">${code}</code></pre>
</div>`;
        });
      };

      setLibsReady(true);
    };

    // Inject code block styles once
    if (!document.getElementById('kv-code-styles')) {
      const style = document.createElement('style');
      style.id = 'kv-code-styles';
      style.textContent = `
        .code-block-wrapper { border-radius:8px; overflow:hidden; margin:0.75em 0; border:1px solid #e2e8f0; font-size:0.8rem; }
        .code-block-wrapper.code-diff-ok    { border-left:4px solid #22c55e; }
        .code-block-wrapper.code-diff-error { border-left:4px solid #ef4444; }
        .code-block-wrapper.code-diff-mixed { border-left:4px solid #f59e0b; }
        .code-block-header { display:flex; justify-content:space-between; align-items:center; padding:4px 10px; background:#f6f8fa; border-bottom:1px solid #e2e8f0; }
        .code-lang-badge { font-size:0.65rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#64748b; }
        .code-copy-btn { font-size:0.65rem; font-weight:600; color:#64748b; background:transparent; border:1px solid #cbd5e1; border-radius:4px; padding:1px 7px; cursor:pointer; }
        .code-copy-btn:hover { background:#e2e8f0; color:#334155; }
        .code-block-wrapper pre { margin:0; padding:0.75em 1em; background:#fff; overflow-x:auto; }
        .code-block-wrapper pre code.hljs { padding:0; background:transparent; font-size:0.8rem; line-height:1.55; }
      `;
      document.head.appendChild(style);
    }

    // CSS (no dependency, load immediately)
    const hljsCSS = document.createElement('link');
    hljsCSS.rel = 'stylesheet';
    hljsCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github.min.css';
    document.head.appendChild(hljsCSS);

    const katexCSS = document.createElement('link');
    katexCSS.rel = 'stylesheet';
    katexCSS.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
    document.head.appendChild(katexCSS);

    // hljs JS (independent)
    const hljsScript = document.createElement('script');
    hljsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js';
    hljsScript.async = true;
    hljsScript.onload = () => { loaded.hljs = true; checkReady(); };
    document.head.appendChild(hljsScript);

    // KaTeX JS (independent)
    const katexScript = document.createElement('script');
    katexScript.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
    katexScript.async = true;
    katexScript.onload = () => { loaded.katex = true; checkReady(); };
    document.head.appendChild(katexScript);

    // marked UMD → then chain marked-highlight
    const markedScript = document.createElement('script');
    markedScript.src = 'https://cdn.jsdelivr.net/npm/marked/lib/marked.umd.js';
    markedScript.async = true;
    markedScript.onload = () => {
      loaded.marked = true;
      markedHighlightScript = document.createElement('script');
      markedHighlightScript.src = 'https://cdn.jsdelivr.net/npm/marked-highlight/lib/index.umd.js';
      markedHighlightScript.async = true;
      markedHighlightScript.onload = () => { loaded.markedHighlight = true; checkReady(); };
      document.head.appendChild(markedHighlightScript);
    };
    document.head.appendChild(markedScript);

    return () => {
      [hljsCSS, katexCSS, hljsScript, markedScript, markedHighlightScript, katexScript]
        .filter(Boolean)
        .forEach(el => { if (document.head.contains(el)) document.head.removeChild(el); });
      const s = document.getElementById('kv-code-styles');
      if (s) document.head.removeChild(s);
    };
  }, []);

  const allVisibleCards = useMemo(() => {
    let combined = [];
    sections.forEach(section => {
      section.decks.forEach(deck => {
        if (activeDeckIds.includes(deck.id)) {
          const taggedCards = deck.cards.map(c => ({
            ...c,
            deckTitle: deck.title,
            deckId: deck.id,
            sectionId: section.id
          }));
          combined = [...combined, ...taggedCards];
        }
      });
    });
    if (!searchTerm) return combined;
    const lowerSearch = searchTerm.toLowerCase();
    return combined.filter(c =>
      c.front.toLowerCase().includes(lowerSearch) ||
      c.back.toLowerCase().includes(lowerSearch) ||
      c.displayId.toLowerCase().includes(lowerSearch)
    );
  }, [sections, activeDeckIds, searchTerm]);

  // Helper to save state before changes (for undo)
  const saveForUndo = () => {
    setUndoHistory(JSON.parse(JSON.stringify(sections)));
  };

  // Undo last action
  const undo = () => {
    if (undoHistory) {
      setSections(undoHistory);
      setUndoHistory(null);
    }
  };

  // Listen for all keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Handle Tab → switch sections while editing (works even in contentEditable)
      if (e.key === 'Tab' && editingCardId !== null) {
        e.preventDefault();
        setEditingSection(prev => prev === 'front' ? 'back' : 'front');
        return;
      }

      // Handle Cmd/Ctrl+S → save and exit edit mode (works even in contentEditable)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        if (editingCardId !== null) {
          e.preventDefault();
          setEditingCardId(null);
          setEditingSection(null);
          return;
        }
      }

      // Handle Escape → deselect (works even in contentEditable)
      if (e.key === 'Escape') {
        setSelectedCardId(null);
        return;
      }

      // Guard: don't handle other shortcuts while in contentEditable/INPUT
      if (e.target.isContentEditable || e.target.tagName === 'INPUT') return;

      // Undo (Cmd/Ctrl+Z)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }

      // Space → toggle reveal on selected card
      if (e.key === ' ' && selectedCardId !== null) {
        e.preventDefault();
        setRevealedCardIds(prev => {
          const next = new Set(prev);
          next.has(selectedCardId) ? next.delete(selectedCardId) : next.add(selectedCardId);
          return next;
        });
      }

      // Cmd/Ctrl+N → add new card
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (selectedCardId !== null) {
          const sel = allVisibleCards.find(c => `${c.deckId}-${c.id}` === selectedCardId);
          if (sel) addCardToDeck(sel.sectionId, sel.deckId);
        } else {
          for (const section of sections) {
            const deck = section.decks.find(d => activeDeckIds.includes(d.id));
            if (deck) { addCardToDeck(section.id, deck.id); break; }
          }
        }
      }

      // Cmd/Ctrl+E → enter/start edit mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        if (selectedCardId === null) return;
        // Start editing this card (front section first)
        setEditingCardId(selectedCardId);
        setEditingSection('front');
      }

      // + or = → bigger cards (fewer columns)
      if ((e.key === '+' || e.key === '=') && !e.ctrlKey && !e.metaKey) {
        setCardSize(p => Math.min(5, p + 1));
      }

      // - → smaller cards (more columns)
      if (e.key === '-' && !e.ctrlKey && !e.metaKey) {
        setCardSize(p => Math.max(1, p - 1));
      }

      // Arrow keys → navigate between cards
      if (['ArrowLeft', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        if (allVisibleCards.length === 0) return;
        if (selectedCardId === null) {
          setSelectedCardId(`${allVisibleCards[0].deckId}-${allVisibleCards[0].id}`);
        } else {
          const currentIndex = allVisibleCards.findIndex(c => `${c.deckId}-${c.id}` === selectedCardId);
          if (currentIndex > 0) {
            const prev = allVisibleCards[currentIndex - 1];
            setSelectedCardId(`${prev.deckId}-${prev.id}`);
          } else if (currentIndex === 0) {
            // Wrap to end
            const last = allVisibleCards[allVisibleCards.length - 1];
            setSelectedCardId(`${last.deckId}-${last.id}`);
          }
        }
      }

      if (['ArrowRight', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        if (allVisibleCards.length === 0) return;
        if (selectedCardId === null) {
          setSelectedCardId(`${allVisibleCards[0].deckId}-${allVisibleCards[0].id}`);
        } else {
          const currentIndex = allVisibleCards.findIndex(c => `${c.deckId}-${c.id}` === selectedCardId);
          if (currentIndex < allVisibleCards.length - 1) {
            const next = allVisibleCards[currentIndex + 1];
            setSelectedCardId(`${next.deckId}-${next.id}`);
          } else if (currentIndex === allVisibleCards.length - 1) {
            // Wrap to start
            setSelectedCardId(`${allVisibleCards[0].deckId}-${allVisibleCards[0].id}`);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoHistory, selectedCardId, sections, activeDeckIds, allVisibleCards, editingCardId])

  const toggleSection = (sectionId) => {
    setExpandedSections(prev =>
      prev.includes(sectionId) ? prev.filter(i => i !== sectionId) : [...prev, sectionId]
    );
  };

  const toggleDeck = (id) => {
    setActiveDeckIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAllInSection = (sectionId) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    const deckIds = section.decks.map(d => d.id);
    setActiveDeckIds(prev => {
      const newIds = new Set(prev);
      deckIds.forEach(id => newIds.add(id));
      return Array.from(newIds);
    });
  };

  const deselectAllInSection = (sectionId) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    const deckIds = new Set(section.decks.map(d => d.id));
    setActiveDeckIds(prev => prev.filter(id => !deckIds.has(id)));
  };

  const isolateDeck = (deckId, sectionId) => {
    setActiveDeckIds([deckId]);
    // Auto-expand the section
    setExpandedSections(prev =>
      prev.includes(sectionId) ? prev : [...prev, sectionId]
    );
  };

  const updateCard = (sectionId, deckId, cardId, field, value) => {
    saveForUndo();
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

  const addCardToDeck = (sectionId, deckId) => {
    saveForUndo();
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        decks: section.decks.map(deck => {
          if (deck.id !== deckId) return deck;
          const nextId = Date.now();
          const nextDisplay = `REF-${deck.cards.length + 101}`;
          return {
            ...deck,
            cards: [{ id: nextId, displayId: nextDisplay, front: "New Question", back: "New Answer", category: "General", frontImage: null, backImage: null }, ...deck.cards]
          };
        })
      };
    }));
  };

  const deleteCard = (sectionId, deckId, cardId) => {
    saveForUndo();
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        decks: section.decks.map(deck => {
          if (deck.id !== deckId) return deck;
          return {
            ...deck,
            cards: deck.cards.filter(card => card.id !== cardId)
          };
        })
      };
    }));
  };

  // Auto-scroll to selected card when it changes
  useEffect(() => {
    if (!selectedCardId) return;

    // Small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      const cardElement = document.querySelector(`[data-card-id="${selectedCardId}"]`);
      if (cardElement) {
        cardElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [selectedCardId]);

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden font-sans select-none">
      {/* HEADER */}
      <header className="h-16 flex-shrink-0 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <Library size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 rounded-lg text-white"><BrainCircuit size={20} /></div>
            <h1 className="text-lg font-bold tracking-tight hidden md:block">Knowledge Visualizer</h1>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search Markdown, IDs, or LaTeX formulas..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          {syncStatus === 'syncing' && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Cloud size={16} className="animate-pulse text-blue-500" />
              <span>Syncing...</span>
            </div>
          )}
          {syncStatus === 'error' && (
            <div className="flex items-center gap-2 text-xs text-red-600">
              <AlertCircle size={16} />
              <span>Sync failed</span>
            </div>
          )}
          {syncStatus === 'idle' && lastSyncTime && (
            <div className="text-[10px] text-slate-400">
              Last sync: {lastSyncTime.toLocaleTimeString()}
            </div>
          )}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setCardSize(p => Math.max(1, p - 1))}
              disabled={cardSize === 1}
              className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"
              title="More cards (−)"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-[10px] font-bold text-slate-400 w-4 text-center tabular-nums">{cardSize}</span>
            <button
              onClick={() => setCardSize(p => Math.min(5, p + 1))}
              disabled={cardSize === 5}
              className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"
              title="Bigger cards (+)"
            >
              <ZoomIn size={16} />
            </button>
          </div>
          <button
            onClick={() => {
              setSelectedExportDeckIds(new Set(activeDeckIds));
              setExportFilename(`export-${new Date().toISOString().split('T')[0]}`);
              setShowExportModal(true);
            }}
            className="p-2 text-slate-400 hover:text-amber-600 transition-colors"
            title="Export to Anki"
          >
            <FileDown size={18} />
          </button>
          <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
            <Download size={18} />
          </button>
        </div>
      </header>

      {/* EXPORT MODAL */}
      {showExportModal && (
        <ExportModal
          sections={sections}
          activeDeckIds={activeDeckIds}
          selectedExportDeckIds={selectedExportDeckIds}
          setSelectedExportDeckIds={setSelectedExportDeckIds}
          exportFilename={exportFilename}
          setExportFilename={setExportFilename}
          isExporting={isExporting}
          onExport={async () => {
            setIsExporting(true);
            try {
              const response = await fetch('/api/decks/export-anki', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  selectedDeckIds: Array.from(selectedExportDeckIds),
                  filename: exportFilename,
                  sections: sections
                })
              });

              if (!response.ok) throw new Error('Export failed');

              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${exportFilename}.apkg`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);

              setShowExportModal(false);
            } catch (error) {
              console.error('Export error:', error);
              alert('Export failed: ' + error.message);
            } finally {
              setIsExporting(false);
            }
          }}
          onCancel={() => setShowExportModal(false)}
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR */}
        {isSidebarOpen && (
          <aside className="w-72 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col z-20 shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Library</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {sections.map(section => {
                const isExpanded = expandedSections.includes(section.id);
                const totalCards = section.decks.reduce((acc, d) => acc + d.cards.length, 0);
                const selectedDecksInSection = section.decks.filter(d => activeDeckIds.includes(d.id)).length;
                const allSelected = selectedDecksInSection === section.decks.length;
                const someSelected = selectedDecksInSection > 0 && !allSelected;

                return (
                  <div key={section.id}>
                    {/* Section header — clickable to toggle, with checkbox */}
                    <div
                      className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors group"
                    >
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}
                        onClick={() => toggleSection(section.id)}
                      />
                      <BookOpen size={16} />
                      <span className="text-sm font-bold flex-1 truncate" onClick={() => toggleSection(section.id)}>{section.title}</span>
                      <span className="text-[10px] text-slate-400">{totalCards}</span>
                      {/* Section selection checkbox */}
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={el => {
                          if (el) el.indeterminate = someSelected;
                        }}
                        onChange={(e) => {
                          if (e.target.checked) {
                            selectAllInSection(section.id);
                          } else {
                            deselectAllInSection(section.id);
                          }
                        }}
                        className="w-4 h-4 rounded cursor-pointer"
                        title={allSelected ? 'Deselect all decks in this book' : someSelected ? 'Some decks selected' : 'Select all decks in this book'}
                      />
                    </div>

                    {/* Decks under this section */}
                    {isExpanded && (
                      <div className="ml-4 space-y-1 border-l-2 border-slate-100 pl-2">
                        {section.decks.map(deck => (
                          <div
                            key={deck.id}
                            onClick={() => toggleDeck(deck.id)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              isolateDeck(deck.id, section.id);
                            }}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${activeDeckIds.includes(deck.id) ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}
                            title="Right-click to isolate this deck"
                          >
                            <span className="text-sm font-medium truncate">{deck.title}</span>
                            <span className="text-[10px] bg-slate-200/50 px-1.5 rounded-full font-bold">{deck.cards.length}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Info size={14} />
                Shortcuts
              </div>
              <ul className="text-[10px] text-slate-500 space-y-2 list-none p-0 font-medium">
                <li className="flex gap-2 items-center">
                  <Type size={12} className="shrink-0 text-indigo-400" />
                  <span>Markdown: Use `**bold**` & `- lists`</span>
                </li>
                <li className="flex gap-2 items-center">
                  <Sigma size={12} className="shrink-0 text-emerald-400" />
                  <span>LaTeX: Use `$x^2 or `$...$`</span>
                </li>
                <li className="flex gap-2 items-center">
                  <ImageIcon size={12} className="shrink-0 text-orange-400" />
                  <span>Paste images directly onto cards</span>
                </li>
                <li className="flex gap-2 items-center">
                  <Keyboard size={12} className="shrink-0 text-violet-400" />
                  <span>Space → Reveal selected card</span>
                </li>
                <li className="flex gap-2 items-center">
                  <Keyboard size={12} className="shrink-0 text-violet-400" />
                  <span>⌘N → New card in deck</span>
                </li>
                <li className="flex gap-2 items-center">
                  <Keyboard size={12} className="shrink-0 text-violet-400" />
                  <span>+/− → Resize card grid</span>
                </li>
                <li className="flex gap-2 items-center">
                  <Keyboard size={12} className="shrink-0 text-violet-400" />
                  <span>←/→ or ↑/↓ → Navigate cards</span>
                </li>
                <li className="flex gap-2 items-center">
                  <Keyboard size={12} className="shrink-0 text-rose-400" />
                  <span>⌘E → Enter edit mode</span>
                </li>
                <li className="flex gap-2 items-center">
                  <Keyboard size={12} className="shrink-0 text-rose-400" />
                  <span>Tab (editing) → Switch section</span>
                </li>
                <li className="flex gap-2 items-center">
                  <Keyboard size={12} className="shrink-0 text-rose-400" />
                  <span>⌘S → Save & exit</span>
                </li>
              </ul>
            </div>
          </aside>
        )}

        {/* MAIN WORKSPACE */}
        <main className="flex-1 overflow-auto p-6 relative bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="font-black text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                  <Layers size={16} className="text-indigo-500" />
                  Interactive Workspace
                </h2>
                <div className="h-4 w-px bg-slate-300" />
                <div className="flex items-center gap-2">
                  {['front', 'both'].map(v => (
                    <button
                      key={v}
                      onClick={() => setVisibility(v)}
                      className={`px-3 py-1 text-[10px] font-black rounded uppercase tracking-widest transition-all ${visibility === v ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 bg-white border border-slate-200 hover:border-indigo-300'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={`grid ${GRID_CLASSES[cardSize]} gap-6 pb-20`}>
              {allVisibleCards.map(card => (
                <Flashcard
                  key={`${card.deckId}-${card.id}`}
                  card={card}
                  visibility={visibility}
                  onUpdate={(f, v) => updateCard(card.sectionId, card.deckId, card.id, f, v)}
                  onAdd={() => addCardToDeck(card.sectionId, card.deckId)}
                  onDelete={() => deleteCard(card.sectionId, card.deckId, card.id)}
                  libsReady={libsReady}
                  isSelected={selectedCardId === `${card.deckId}-${card.id}`}
                  isRevealed={revealedCardIds.has(`${card.deckId}-${card.id}`)}
                  onSelect={() => setSelectedCardId(`${card.deckId}-${card.id}`)}
                  onToggleReveal={() => {
                    const id = `${card.deckId}-${card.id}`;
                    setRevealedCardIds(prev => {
                      const next = new Set(prev);
                      next.has(id) ? next.delete(id) : next.add(id);
                      return next;
                    });
                  }}
                  isEditing={editingCardId === `${card.deckId}-${card.id}`}
                  editingSection={editingSection}
                  onExitEdit={() => {
                    setEditingCardId(null);
                    setEditingSection(null);
                  }}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Flashcard({ card, visibility, onUpdate, onAdd, onDelete, libsReady, isSelected, isRevealed, onSelect, onToggleReveal, isEditing, editingSection, onExitEdit }) {
  const [isFocused, setIsFocused] = useState(null);

  // Auto-focus the editing section when edit mode is enabled
  // Clear focus when exiting edit mode
  useEffect(() => {
    if (isEditing && editingSection) {
      setIsFocused(editingSection);
    } else {
      setIsFocused(null);
    }
  }, [isEditing, editingSection]);

  const handlePaste = (e, field) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageField = field === 'front' ? 'frontImage' : 'backImage';
          onUpdate(imageField, event.target.result);
        };
        reader.readAsDataURL(blob);
        e.preventDefault();
      }
    }
  };

  const ImageDisplay = ({ src, field }) => (
    <div className="relative group/image my-2 rounded-xl overflow-hidden border border-slate-100 shadow-inner bg-slate-50 flex items-center justify-center min-h-[100px]">
      <img src={src} alt="Reference" className="max-w-full max-h-[300px] object-contain" />
      <button
        onClick={(e) => { e.stopPropagation(); onUpdate(field === 'front' ? 'frontImage' : 'backImage', null); }}
        className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-red-500 shadow-lg"
      >
        <X size={14} />
      </button>
    </div>
  );

  return (
    <div
      data-card-id={`${card.deckId}-${card.id}`}
      onClick={(e) => { if (!e.target.isContentEditable) onSelect(); }}
      className={`group bg-white rounded-2xl border-2 transition-all duration-300 flex flex-col overflow-hidden shadow-sm min-h-[260px]
        ${isEditing
          ? 'ring-2 ring-amber-400 border-amber-300 shadow-lg'
          : isSelected
          ? 'ring-2 ring-indigo-400 border-indigo-300 shadow-lg'
          : 'border-slate-100 hover:border-indigo-200 hover:shadow-lg'
        }`}
    >
      {/* CARD HEADER */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${isEditing ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <div className="bg-white border border-slate-200 rounded px-2 py-0.5 text-[10px] font-black text-indigo-600 flex items-center gap-1 shadow-sm shrink-0">
            <Hash size={12} />
            <span contentEditable suppressContentEditableWarning onBlur={(e) => onUpdate('displayId', e.target.innerText)} className="outline-none">
              {card.displayId}
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[80px]">
            {card.deckTitle}
          </span>
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest px-1 bg-slate-200/30 rounded truncate">
            {card.category}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-2">
          {isEditing && (
            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${editingSection === 'front' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
              Editing {editingSection === 'front' ? '❓ Q' : '✓ A'}
            </span>
          )}
          <div className={`flex items-center gap-1 transition-opacity ${isEditing ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
            <button onClick={onAdd} className="p-1 hover:bg-indigo-50 text-indigo-600 rounded" title="Add new card">
              <Plus size={14} />
            </button>
            <button onClick={onDelete} className="p-1 hover:bg-red-50 text-red-600 rounded" title="Delete card">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-4">
        {/* FRONT SECTION */}
        {(visibility === 'front' || visibility === 'both') && (
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest block">Question</label>
              {isFocused === 'front' && (
                <span className="text-[8px] font-bold text-indigo-400 bg-indigo-50 px-1 rounded animate-pulse uppercase">
                  {isEditing ? 'Tab to answer • ⌘S save' : 'Editing'}
                </span>
              )}
            </div>
            <SmartField
              value={card.front}
              isEditing={isFocused === 'front'}
              libsReady={libsReady}
              onFocus={() => setIsFocused('front')}
              onBlur={(val) => {
                setIsFocused(null);
                onUpdate('front', val);
              }}
              onPaste={(e) => handlePaste(e, 'front')}
              className="text-sm font-bold"
            />
            {card.frontImage && <ImageDisplay src={card.frontImage} field="front" />}
          </div>
        )}

        {visibility === 'both' && <div className="h-px bg-slate-100" />}

        {/* BACK SECTION */}
        {visibility === 'front' && (
          // Front mode: Show toggle, answer hidden by default
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest block">Answer</label>
                <button
                  onClick={() => onToggleReveal()}
                  className="p-0.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  title={isRevealed ? "Hide answer" : "Show answer"}
                >
                  {isRevealed ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
              {isFocused === 'back' && (
                <span className="text-[8px] font-bold text-emerald-400 bg-emerald-50 px-1 rounded animate-pulse uppercase">
                  {isEditing ? 'Tab to question • ⌘S save' : 'Editing'}
                </span>
              )}
            </div>

            {isRevealed && (
              <div className="animate-in fade-in duration-200">
                <SmartField
                  value={card.back}
                  isEditing={isFocused === 'back'}
                  libsReady={libsReady}
                  onFocus={() => setIsFocused('back')}
                  onBlur={(val) => {
                    setIsFocused(null);
                    onUpdate('back', val);
                  }}
                  onPaste={(e) => handlePaste(e, 'back')}
                  className="text-sm leading-relaxed text-slate-600"
                />
                {card.backImage && <ImageDisplay src={card.backImage} field="back" />}
              </div>
            )}
          </div>
        )}

        {visibility === 'both' && (
          // Both mode: Always show answer, no toggle
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest block">Answer</label>
              {isFocused === 'back' && <span className="text-[8px] font-bold text-emerald-400 bg-emerald-50 px-1 rounded animate-pulse uppercase">Editing</span>}
            </div>

            <SmartField
              value={card.back}
              isEditing={isFocused === 'back'}
              libsReady={libsReady}
              onFocus={() => setIsFocused('back')}
              onBlur={(val) => {
                setIsFocused(null);
                onUpdate('back', val);
              }}
              onPaste={(e) => handlePaste(e, 'back')}
              className="text-sm leading-relaxed text-slate-600"
            />
            {card.backImage && <ImageDisplay src={card.backImage} field="back" />}
          </div>
        )}
      </div>
    </div>
  );
}

function ExportModal({
  sections,
  activeDeckIds,
  selectedExportDeckIds,
  setSelectedExportDeckIds,
  exportFilename,
  setExportFilename,
  isExporting,
  onExport,
  onCancel
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileDown size={24} className="text-amber-600" />
              <h2 className="text-xl font-bold text-slate-800">Export to Anki</h2>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Filename Input */}
          <div>
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Filename
            </label>
            <input
              type="text"
              value={exportFilename}
              onChange={(e) => setExportFilename(e.target.value)}
              placeholder="export-2025-02-18"
              className="w-full mt-2 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">.apkg extension will be added automatically</p>
          </div>

          {/* Deck Selection */}
          <div>
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider block mb-3">
              Select Decks to Export
            </label>
            <div className="border border-slate-200 rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
              {sections.map(section => (
                <div key={section.id}>
                  <div className="font-semibold text-sm text-slate-700 mb-2">{section.title}</div>
                  <div className="ml-4 space-y-2">
                    {section.decks.map(deck => (
                      <label key={deck.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedExportDeckIds.has(deck.id)}
                          onChange={(e) => {
                            const newIds = new Set(selectedExportDeckIds);
                            if (e.target.checked) {
                              newIds.add(deck.id);
                            } else {
                              newIds.delete(deck.id);
                            }
                            setSelectedExportDeckIds(newIds);
                          }}
                          className="w-4 h-4 rounded cursor-pointer"
                        />
                        <span className="text-sm text-slate-700">{deck.title}</span>
                        <span className="text-xs text-slate-500">({deck.cards.length} cards)</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Selected: {selectedExportDeckIds.size} deck(s)
            </p>
          </div>

          {/* Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
            <p className="font-semibold mb-1">ℹ️ Anki Export Info</p>
            <ul className="text-xs space-y-1 ml-4">
              <li>• Decks will be organized hierarchically (Section::Deck)</li>
              <li>• Images will be embedded in the .apkg file</li>
              <li>• Card fields: Question (front) and Answer (back)</li>
              <li>• Tags: Category and deck name</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isExporting}
            className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onExport}
            disabled={isExporting || selectedExportDeckIds.size === 0 || !exportFilename}
            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Exporting...
              </>
            ) : (
              <>
                <Check size={18} />
                Export to Anki
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function SmartField({ value, isEditing, libsReady, onFocus, onBlur, onPaste, className }) {
  const editRef = useRef(null);

  // Memoized rendered content (must come before conditional return)
  const renderedContent = useMemo(() => {
    let text = value || '';
    if (libsReady && window.katex) {
      text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
        try { return window.katex.renderToString(math.trim(), { displayMode: true, throwOnError: false }); }
        catch (e) { return `$$${math}$$`; }
      });
      text = text.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
        try { return window.katex.renderToString(math.trim(), { displayMode: false, throwOnError: false }); }
        catch (e) { return `$${math}$`; }
      });
    }
    if (libsReady && window._markedInstance) {
      try {
        let html = window._markedInstance.parse(text);
        // Apply diff visualization post-processing
        if (window._processDiffVisualization) {
          html = window._processDiffVisualization(html);
        }
        return html;
      }
      catch (e) { return text.replace(/\n/g, '<br/>'); }
    }
    return text.replace(/\n/g, '<br/>');
  }, [value, libsReady]);

  // Reliable auto-focus when entering edit mode
  useEffect(() => {
    if (isEditing && editRef.current) {
      const el = editRef.current;
      el.focus();
      // Place cursor at end of content
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <div
        ref={editRef}
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onBlur(e.currentTarget.innerText)}
        onPaste={onPaste}
        className={`${className} outline-none rounded p-1 bg-slate-50 ring-2 ring-indigo-300 transition-all font-mono whitespace-pre-wrap min-h-[1.5em] select-text`}
      >
        {value}
      </div>
    );
  }

  return (
    <div
      onClick={onFocus}
      className={`${className} cursor-text hover:bg-slate-50/50 rounded p-1 transition-colors min-h-[1.5em] prose-sm prose-slate max-w-none`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}
