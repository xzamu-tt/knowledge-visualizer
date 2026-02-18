import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n✨ Sync server running on http://localhost:${PORT}`);
  console.log(`📁 Data file: ${DATA_FILE}\n`);
});
