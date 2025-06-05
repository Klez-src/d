const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const session = require('express-session');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public')); // Serve frontend files
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Helper functions
async function readDB() {
    const data = await fs.readFile('db.json', 'utf8');
    return JSON.parse(data);
}

async function writeDB(data) {
    await fs.writeFile('db.json', JSON.stringify(data, null, 2));
}

function generateInviteCode() {
    const part1 = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    const part2 = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
    const part3 = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    const part4 = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    return `${part1}-${part2}-${part3}-${part4}`;
}

// Initialize database if it doesn't exist
async function initDB() {
    try {
        await fs.access('db.json');
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

// API Endpoints
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const db = await readDB();
    const user = db.users.find(u => u.username === username && u.password === password && !u.banned);
    if (user) {
        req.session.userId = user.uid;
        res.json({ user });
    } else {
        res.status(401).json({ message: 'Wrong credentials or account banned.' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.post('/api/register', async (req, res) => {
    const { username, password, inviteCode } = req.body;
    const db = await readDB();
    
    if (db.users.some(u => u.username === username)) {
        return res.status(400).json({ message: 'Username already taken.' });
    }
    
    const invite = db.invites.find(i => i.code === inviteCode && !i.used);
    if (!invite) {
        return res.status(400).json({ message: 'Invalid or already used invitation code.' });
    }
    
    db.userCount++;
    const user = {
        username,
        password, // Note: In production, hash passwords using bcrypt
        pfp: 'https://i.pinimg.com/736x/83/bc/8b/83bc8b88cf6bc4b4e04d153a418cde62.jpg',
        uid: db.userCount,
        banned: false
    };
    db.users.push(user);
    invite.used = true;
    await writeDB(db);
    req.session.userId = user.uid;
    res.json({ user });
});

app.get('/api/user', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Not logged in.' });
    }
    const db = await readDB();
    const user = db.users.find(u => u.uid === req.session.userId);
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: 'User not found.' });
    }
});

app.put('/api/user/username', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Not logged in.' });
    }
    const { newUsername } = req.body;
    const db = await readDB();
    if (db.users.some(u => u.username === newUsername)) {
        return res.status(400).json({ message: 'Username already taken.' });
    }
    const user = db.users.find(u => u.uid === req.session.userId);
    if (user) {
        user.username = newUsername;
        await writeDB(db);
        res.json({ user });
    } else {
        res.status(404).json({ message: 'User not found.' });
    }
});

app.put('/api/user/password', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Not logged in.' });
    }
    const { currentPassword, newPassword } = req.body;
    const db = await readDB();
    const user = db.users.find(u => u.uid === req.session.userId);
    if (user && user.password === currentPassword) {
        user.password = newPassword; // Note: Hash in production
        await writeDB(db);
        res.json({ success: true });
    } else {
        res.status(400).json({ message: 'Current password is incorrect.' });
    }
});

app.put('/api/user/pfp', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Not logged in.' });
    }
    const { pfp } = req.body;
    const db = await readDB();
    const user = db.users.find(u => u.uid === req.session.userId);
    if (user) {
        user.pfp = pfp;
        await writeDB(db);
        res.json({ user });
    } else {
        res.status(404).json({ message: 'User not found.' });
    }
});

app.get('/api/users', async (req, res) => {
    const db = await readDB();
    res.json(db.users);
});

app.get('/api/invites', async (req, res) => {
    const db = await readDB();
    res.json(db.invites);
});

app.put('/api/user/:uid/ban', async (req, res) => {
    const { uid } = req.params;
    const db = await readDB();
    const user = db.users.find(u => u.uid === parseInt(uid));
    if (user) {
        user.banned = true;
        await writeDB(db);
        res.json({ success: true });
    } else {
        res.status(404).json({ message: 'User not found.' });
    }
});

app.put('/api/user/:uid/uid', async (req, res) => {
    const { uid } = req.params;
    const { newUid } = req.body;
    const db = await readDB();
    if (db.users.some(u => u.uid === parseInt(newUid))) {
        return res.status(400).json({ message: 'User ID already taken.' });
    }
    const user = db.users.find(u => u.uid === parseInt(uid));
    if (user) {
        user.uid = parseInt(newUid);
        await writeDB(db);
        if (req.session.userId === parseInt(uid)) {
            req.session.userId = parseInt(newUid);
        }
        res.json({ success: true });
    } else {
        res.status(404).json({ message: 'User not found.' });
    }
});

app.put('/api/user/:uid/password', async (req, res) => {
    const { uid } = req.params;
    const { newPassword } = req.body;
    const db = await readDB();
    const user = db.users.find(u => u.uid === parseInt(uid));
    if (user) {
        user.password = newPassword; // Note: Hash in production
        await writeDB(db);
        res.json({ success: true });
    } else {
        res.status(404).json({ message: 'User not found.' });
    }
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});