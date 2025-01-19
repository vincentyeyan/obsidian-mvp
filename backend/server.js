const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

// SQLite Database Setup
const db = new sqlite3.Database('./notes.db');

// Create Notes Table
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY, title TEXT, content TEXT, tags TEXT, created_at TEXT)");
});

// Create Note API
app.post('/notes', (req, res) => {
    const { title, content, tags } = req.body;
    db.run("INSERT INTO notes (title, content, tags, created_at) VALUES (?, ?, ?, ?)",
        [title, content, tags, new Date().toISOString()],
        function (err) {
            if (err) return res.status(500).send(err.message);
            res.status(200).send({ id: this.lastID });
        });
});

// Get Notes API
app.get('/notes', (req, res) => {
    db.all("SELECT * FROM notes", [], (err, rows) => {
        if (err) return res.status(500).send(err.message);
        res.json(rows);
    });
});

// Root route handler
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the Notes API',
        endpoints: {
            'GET /': 'API information',
            'GET /notes': 'Retrieve all notes',
            'POST /notes': 'Create a new note'
        }
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
