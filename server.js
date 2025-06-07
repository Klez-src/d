const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const session = require('express-session');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from root
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Helper functions
async function readDB() {
  const data = await fs.readFile(path.join(__dirname, 'db.json'), 'utf8');
  return JSON.parse(data);
}

async function writeDB(data) {
  await fs.writeFile(path.join(__dirname, 'db.json'), JSON.stringify(data, null, 2));
}

function generateInviteCode() {
  const part1 = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  const part2 = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
  const part3 = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  const part4 = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  return `${part1}-${part2}-${part3}-${part4}`;
}

async function initDB() {
  try {
    await fs.access(path.join(__dirname, 'db.json'));
  } catch {
    const initialData = {
      users: [],
      invites: Array.from({ length: 100 }, () => ({ code: generateInviteCode(), used: false })),
      userCount: 0
    };
    await writeDB(initialData);
  }
}
initDB();

// API routes...
// (Paste in all your existing routes — unchanged)

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
