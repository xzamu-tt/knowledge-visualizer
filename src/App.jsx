import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Search, Plus, Download, BrainCircuit, Hash,
  ChevronDown, BookOpen, Layers, Library, Info, Image as ImageIcon, X,
  Type, Sigma, Cloud, AlertCircle, Eye, EyeOff, Trash2
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

  // Update active deck IDs and expanded sections when sections load
  useEffect(() => {
    setActiveDeckIds(sections.flatMap(s => s.decks.map(d => d.id)));
    setExpandedSections(sections.map(s => s.id));
  }, [sections]);

  // Load External Libraries for Markdown (Marked) and LaTeX (KaTeX)
  useEffect(() => {
    let loaded = { marked: false, katex: false };

    const checkReady = () => {
      if (loaded.marked && loaded.katex && window.marked && window.katex) {
        setLibsReady(true);
      }
    };

    const markedScript = document.createElement('script');
    markedScript.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    markedScript.async = true;
    markedScript.onload = () => { loaded.marked = true; checkReady(); };
    document.head.appendChild(markedScript);

    const katexCSS = document.createElement('link');
    katexCSS.rel = 'stylesheet';
    katexCSS.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
    document.head.appendChild(katexCSS);

    const katexScript = document.createElement('script');
    katexScript.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
    katexScript.async = true;
    katexScript.onload = () => { loaded.katex = true; checkReady(); };
    document.head.appendChild(katexScript);

    return () => {
      [markedScript, katexCSS, katexScript].forEach(el => {
        if (document.head.contains(el)) document.head.removeChild(el);
      });
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

  // Listen for Ctrl+Z
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

  const toggleSection = (sectionId) => {
    setExpandedSections(prev =>
      prev.includes(sectionId) ? prev.filter(i => i !== sectionId) : [...prev, sectionId]
    );
  };

  const toggleDeck = (id) => {
    setActiveDeckIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
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
          <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
            <Download size={18} />
          </button>
        </div>
      </header>

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
                return (
                  <div key={section.id}>
                    {/* Section header — clickable to toggle */}
                    <div
                      onClick={() => toggleSection(section.id)}
                      className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                    >
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}
                      />
                      <BookOpen size={16} />
                      <span className="text-sm font-bold flex-1 truncate">{section.title}</span>
                      <span className="text-[10px] text-slate-400">{totalCards}</span>
                    </div>

                    {/* Decks under this section */}
                    {isExpanded && (
                      <div className="ml-4 space-y-1 border-l-2 border-slate-100 pl-2">
                        {section.decks.map(deck => (
                          <div
                            key={deck.id}
                            onClick={() => toggleDeck(deck.id)}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${activeDeckIds.includes(deck.id) ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
              {allVisibleCards.map(card => (
                <Flashcard
                  key={`${card.deckId}-${card.id}`}
                  card={card}
                  visibility={visibility}
                  onUpdate={(f, v) => updateCard(card.sectionId, card.deckId, card.id, f, v)}
                  onAdd={() => addCardToDeck(card.sectionId, card.deckId)}
                  onDelete={() => deleteCard(card.sectionId, card.deckId, card.id)}
                  libsReady={libsReady}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Flashcard({ card, visibility, onUpdate, onAdd, onDelete, libsReady }) {
  const [isFocused, setIsFocused] = useState(null);
  const [isBackRevealed, setIsBackRevealed] = useState(false);

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
    <div className="group bg-white rounded-2xl border-2 transition-all duration-300 flex flex-col overflow-hidden shadow-sm border-slate-100 hover:border-indigo-200 hover:shadow-lg min-h-[260px]">
      {/* CARD HEADER */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
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
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          <button onClick={onAdd} className="p-1 hover:bg-indigo-50 text-indigo-600 rounded" title="Add new card">
            <Plus size={14} />
          </button>
          <button onClick={onDelete} className="p-1 hover:bg-red-50 text-red-600 rounded" title="Delete card">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-4">
        {/* FRONT SECTION */}
        {(visibility === 'front' || visibility === 'both') && (
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest block">Question</label>
              {isFocused === 'front' && <span className="text-[8px] font-bold text-indigo-400 bg-indigo-50 px-1 rounded animate-pulse uppercase">Editing</span>}
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
                  onClick={() => setIsBackRevealed(!isBackRevealed)}
                  className="p-0.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  title={isBackRevealed ? "Hide answer" : "Show answer"}
                >
                  {isBackRevealed ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
              {isFocused === 'back' && <span className="text-[8px] font-bold text-emerald-400 bg-emerald-50 px-1 rounded animate-pulse uppercase">Editing</span>}
            </div>

            {isBackRevealed && (
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

function SmartField({ value, isEditing, libsReady, onFocus, onBlur, onPaste, className }) {
  const editRef = useRef(null);

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

  const getRenderedContent = () => {
    let text = value || '';

    // Step 1: Render LaTeX math with KaTeX before Markdown
    if (libsReady && window.katex) {
      // Display math first: $$...$$
      text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
        try {
          return window.katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
        } catch (e) {
          return `$$${math}$$`;
        }
      });

      // Inline math: $...$  (careful not to match already-processed $$)
      text = text.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
        try {
          return window.katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
        } catch (e) {
          return `$${math}$`;
        }
      });
    }

    // Step 2: Render Markdown
    if (libsReady && window.marked && window.marked.parse) {
      try {
        return window.marked.parse(text);
      } catch (e) {
        return text.replace(/\n/g, '<br/>');
      }
    }
    return text.replace(/\n/g, '<br/>');
  };

  return (
    <div
      onClick={onFocus}
      className={`${className} cursor-text hover:bg-slate-50/50 rounded p-1 transition-colors min-h-[1.5em] prose-sm prose-slate max-w-none`}
      dangerouslySetInnerHTML={{ __html: getRenderedContent() }}
    />
  );
}
