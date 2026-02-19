import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';
import archiver from 'archiver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const DATA_FILE = path.join(__dirname, 'data', 'decks.json');

// Ensure data directory exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

app.use(express.json({ limit: '50mb' }));

// Load decks from file
app.get('/api/decks', (req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return res.json(JSON.parse(data));
    }
    // Return empty array if file doesn't exist (will use INITIAL_DECKS on client)
    res.json([]);
  } catch (error) {
    console.error('Error reading decks:', error);
    res.status(500).json({ error: 'Failed to read decks' });
  }
});

// Save decks to file
app.post('/api/decks/save', (req, res) => {
  try {
    const decks = req.body;
    fs.writeFileSync(DATA_FILE, JSON.stringify(decks, null, 2), 'utf-8');
    res.json({ success: true, message: 'Decks saved successfully' });
  } catch (error) {
    console.error('Error saving decks:', error);
    res.status(500).json({ error: 'Failed to save decks' });
  }
});

// Export decks as JSON file
app.get('/api/decks/export', (req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="decks-export.json"');
      res.send(data);
    } else {
      res.status(404).json({ error: 'No decks to export' });
    }
  } catch (error) {
    console.error('Error exporting decks:', error);
    res.status(500).json({ error: 'Failed to export decks' });
  }
});

// Convert HTML/markdown to plain text for Anki
function htmlToPlain(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

// Extract images from HTML/markdown
function extractImages(htmlContent) {
  const images = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = imgRegex.exec(htmlContent)) !== null) {
    const src = match[1];
    if (src.startsWith('data:')) {
      images.push(src);
    }
  }
  return images;
}

// Generate unique Anki IDs (epoch milliseconds with random jitter)
function generateAnkiId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

// Calculate SHA1 checksum of first field (for note deduplication)
function fieldChecksum(text) {
  const hash = crypto.createHash('sha1').update(text || '', 'utf8').digest('hex');
  return parseInt(hash.substring(0, 8), 16);
}

// Convert base64 image to buffer
function base64ToBuffer(base64String) {
  const base64Data = base64String.split(',')[1] || base64String;
  return Buffer.from(base64Data, 'base64');
}

// Create Anki .apkg using sql.js + archiver
app.post('/api/decks/export-anki', async (req, res) => {
  let tempDir = null;

  try {
    const { selectedDeckIds, filename, sections } = req.body;

    if (!selectedDeckIds || selectedDeckIds.length === 0) {
      return res.status(400).json({ error: 'No decks selected for export' });
    }

    // Initialize sql.js
    const SQL = await initSqlJs();
    const db = new SQL.Database();

    // Create Anki tables
    db.run(`
      CREATE TABLE col (
        id INTEGER PRIMARY KEY,
        crt INTEGER,
        mod INTEGER,
        scm INTEGER,
        ver INTEGER,
        dty INTEGER,
        usn INTEGER,
        ls INTEGER,
        conf TEXT,
        models TEXT,
        decks TEXT,
        dconf TEXT,
        tags TEXT
      );
    `);

    db.run(`
      CREATE TABLE notes (
        id INTEGER PRIMARY KEY,
        guid TEXT,
        mid INTEGER,
        mod INTEGER,
        usn INTEGER,
        tags TEXT,
        flds TEXT,
        sfld TEXT,
        csum INTEGER,
        flags INTEGER,
        data TEXT
      );
    `);

    db.run(`
      CREATE TABLE cards (
        id INTEGER PRIMARY KEY,
        nid INTEGER,
        did INTEGER,
        ord INTEGER,
        mod INTEGER,
        usn INTEGER,
        type INTEGER,
        queue INTEGER,
        due INTEGER,
        ivl INTEGER,
        factor INTEGER,
        reps INTEGER,
        lapses INTEGER,
        left INTEGER,
        odue INTEGER,
        odid INTEGER,
        flags INTEGER,
        data TEXT
      );
    `);

    db.run(`
      CREATE TABLE revlog (
        id INTEGER PRIMARY KEY,
        cid INTEGER,
        usn INTEGER,
        ease INTEGER,
        ivl INTEGER,
        lastIvl INTEGER,
        factor INTEGER,
        time INTEGER,
        type INTEGER
      );
    `);

    db.run(`CREATE TABLE graves (usn INTEGER, oid INTEGER, type INTEGER);`);

    // Create metadata
    const now = Date.now();
    const nowSeconds = Math.floor(now / 1000);

    const modelId = now;
    const models = {
      [String(modelId)]: {
        id: modelId,
        name: 'Knowledge Visualizer',
        type: 0,
        did: 1,
        mod: nowSeconds,
        usn: -1,
        sortf: 0,
        latexPre: '\\documentclass[12pt]{article}\\special{papersize=3in,5in}\\usepackage[utf8]{inputenc}\\usepackage{amssymb,amsmath}\\pagestyle{empty}\\setlength{\\parindent}{0in}\\begin{document}',
        latexPost: '\\end{document}',
        css: '.card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; }',
        flds: [
          { name: 'Front', ord: 0, sticky: false, rtl: false, font: 'Arial', size: 20, media: [] },
          { name: 'Back', ord: 1, sticky: false, rtl: false, font: 'Arial', size: 20, media: [] }
        ],
        tmpls: [
          {
            name: 'Card 1',
            ord: 0,
            qfmt: '{{Front}}',
            afmt: '{{FrontSide}}<hr id=answer>{{Back}}',
            bqfmt: '',
            bafmt: '',
            did: null,
            brid: null
          }
        ],
        req: [[0, 'all', [0]]],
        vers: [],
        tags: []
      }
    };

    const decks = {
      '1': {
        id: 1,
        name: 'Default',
        mod: nowSeconds,
        usn: 0,
        collapsed: false,
        browserCollapsed: true,
        desc: '',
        dyn: 0,
        conf: 1,
        lrnToday: [0, 0],
        revToday: [0, 0],
        newToday: [0, 0],
        timeToday: [0, 0],
        extendNew: 0,
        extendRev: 0
      }
    };

    const dconf = {
      '1': {
        id: 1,
        mod: nowSeconds,
        name: 'Default',
        usn: 0,
        maxTaken: 60,
        autoplay: true,
        timer: 0,
        replayq: true,
        new: { delays: [1, 10], ints: [1, 4, 7], initialFactor: 2500, separate: true, order: 1, perDay: 20, bury: true },
        lapse: { delays: [10], mult: 0.5, minInt: 1, leechFails: 8, leechAction: 0 },
        rev: { perDay: 200, hardFactor: 1.2, ivlFct: 1, maxIvl: 36500, ease4: 1.3, bury: true, minSpace: 1, fuzz: 0.05 }
      }
    };

    const conf = {
      activeDecks: [1],
      addToCur: true,
      collapseTime: 1200,
      curDeck: 1,
      curModel: String(modelId),
      dueCounts: true,
      estTimes: true,
      newBury: true,
      newSpread: 0,
      nextPos: 1,
      sortBackwards: false,
      sortType: 'noteFld',
      timeLim: 0
    };

    // Insert collection metadata
    const colStmt = db.prepare(
      'INSERT INTO col VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    colStmt.bind([1, nowSeconds, nowSeconds, now, 11, 0, 0, 0, JSON.stringify(conf), JSON.stringify(models), JSON.stringify(decks), JSON.stringify(dconf), '{}']);
    colStmt.step();
    colStmt.free();

    // Track media files and card count
    const mediaMap = {};
    const mediaBuffers = {}; // Store base64 images for later
    let mediaIndex = 0;
    let noteIndex = 0;
    let totalCardCount = 0;

    // Create nested decks and cards
    sections.forEach(section => {
      section.decks.forEach(deck => {
        if (!selectedDeckIds.includes(deck.id)) return;

        const deckId = generateAnkiId();
        const deckName = `Default::${section.title}::${deck.title}`;

        decks[String(deckId)] = {
          id: deckId,
          name: deckName,
          mod: nowSeconds,
          usn: 0,
          collapsed: false,
          browserCollapsed: false,
          desc: deck.title,
          dyn: 0,
          conf: 1,
          lrnToday: [0, 0],
          revToday: [0, 0],
          newToday: [0, 0],
          timeToday: [0, 0],
          extendNew: 0,
          extendRev: 0
        };

        // Add cards
        deck.cards.forEach((card, cardIdx) => {
          try {
            const separator = String.fromCharCode(31);
            const frontText = htmlToPlain(card.front || '');
            let backHtml = card.back || '';

            // Extract and track images from back field
            if (card.backImage && card.backImage.startsWith('data:')) {
              const mediaIdx = mediaIndex;
              mediaMap[String(mediaIdx)] = `image-${mediaIdx}.png`;
              mediaBuffers[mediaIdx] = card.backImage; // Store for later use
              backHtml += `<br/><img src="${String(mediaIdx)}" style="max-width:100%;" />`;
              mediaIndex++;
            }

            const fieldString = `${frontText}${separator}${backHtml}`;
            const noteId = nowSeconds * 1000 + noteIndex; // Use ms timestamp for note IDs
            const guid = 'note-' + noteId + '-' + card.id; // Simple GUID
            const checksum = fieldChecksum(frontText); // SHA1 checksum of front field
            const tags = ` ${card.category || 'general'} ${deck.title} `;

            // Insert note
            const noteStmt = db.prepare(
              'INSERT INTO notes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            noteStmt.bind([
              noteId,
              guid,
              modelId,
              nowSeconds,
              0,
              tags,
              fieldString,
              frontText,
              checksum,
              0,
              ''
            ]);
            noteStmt.step();
            noteStmt.free();

            // Insert card
            const cardId = nowSeconds * 1000 + noteIndex + 1000000;
            const cardStmt = db.prepare(
              'INSERT INTO cards VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            cardStmt.bind([
              cardId,            // id
              noteId,            // nid (note ID)
              deckId,            // did (deck ID)
              0,                 // ord (template ordinal)
              nowSeconds,        // mod (modification time in seconds)
              0,                 // usn
              0,                 // type (0=new)
              0,                 // queue (0=new)
              totalCardCount,    // due (position in new card queue)
              0,                 // ivl
              0,                 // factor
              0,                 // reps
              0,                 // lapses
              0,                 // left
              0,                 // odue
              0,                 // odid
              0,                 // flags
              ''                 // data
            ]);
            cardStmt.step();
            cardStmt.free();

            noteIndex++;
            totalCardCount++;
          } catch (err) {
            console.warn(`Error adding card ${card.id}:`, err.message);
          }
        });
      });
    });

    // Update decks in collection (note: we already inserted with all decks, but ensure models are correct)
    const updateStmt = db.prepare('UPDATE col SET models = ?, decks = ? WHERE id = 1');
    updateStmt.bind([JSON.stringify(models), JSON.stringify(decks)]);
    updateStmt.step();
    updateStmt.free();

    // Export database
    const data = db.export();
    const dbBuffer = Buffer.from(data);

    // Create temp directory
    tempDir = path.join(__dirname, 'temp', `export-${Date.now()}`);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Save database
    fs.writeFileSync(path.join(tempDir, 'collection.anki2'), dbBuffer);

    // Create ZIP archive
    const outputPath = path.join(tempDir, `${filename}.apkg`);
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        // Send file
        res.download(outputPath, `${filename}.apkg`, (err) => {
          if (err) console.error('Download error:', err);
          // Clean up
          setTimeout(() => {
            try {
              fs.rmSync(tempDir, { recursive: true });
            } catch (e) {
              console.warn('Cleanup error:', e.message);
            }
          }, 1000);
          resolve();
        });
      });

      archive.on('error', reject);
      archive.pipe(output);

      // Add collection database
      archive.file(path.join(tempDir, 'collection.anki2'), { name: 'collection.anki2' });

      // Add media files
      Object.keys(mediaBuffers).forEach(mediaIdx => {
        try {
          const imageBuffer = base64ToBuffer(mediaBuffers[mediaIdx]);
          archive.append(imageBuffer, { name: String(mediaIdx) });
        } catch (err) {
          console.warn(`Error adding media ${mediaIdx}:`, err.message);
        }
      });

      // Add media manifest
      archive.append(JSON.stringify(mediaMap), { name: 'media' });

      archive.finalize();
    });

  } catch (error) {
    console.error('Export error:', error);
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true });
      } catch (e) {}
    }
    res.status(500).json({ error: `Failed to export Anki deck: ${error.message}` });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n✨ Sync server running on http://localhost:${PORT}`);
  console.log(`📁 Data file: ${DATA_FILE}\n`);
});
