const express = require('express');
const cors = require('cors');
const { Low, JSONFile } = require('lowdb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const SECRET = process.env.JWT_SECRET || 'clave-secreta';
const db = new Low(new JSONFile(path.join(__dirname, 'db.json')));

(async () => {
  await db.read();
  db.data ||= { users: [], campaigns: [] };

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/assets', express.static(path.join(__dirname, 'assets')));

  app.post('/register', async (req, res) => {
    const { username, password, role } = req.body;
    if (db.data.users.find(u => u.username === username)) {
      return res.status(400).json({ error: 'user exists' });
    }
    const hash = await bcrypt.hash(password, 10);
    db.data.users.push({ username, password: hash, role });
    await db.write();
    res.json({ ok: true });
  });

  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = db.data.users.find(u => u.username === username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'invalid credentials' });
    }
    const token = jwt.sign({ username, role: user.role }, SECRET, { expiresIn: '2h' });
    res.json({ token, role: user.role });
  });

  function auth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'no token' });
    try {
      req.user = jwt.verify(auth.split(' ')[1], SECRET);
      next();
    } catch {
      res.status(401).json({ error: 'invalid token' });
    }
  }

  app.post('/campaigns', auth, async (req, res) => {
    if (req.user.role !== 'brand') return res.status(403).json({ error: 'only brand' });
    const { name, product } = req.body;
    const id = Date.now().toString();
    db.data.campaigns.push({ id, name, product, clicks: 0, sales: 0 });
    await db.write();
    res.json({ id, name, product });
  });

  app.get('/campaigns', auth, (req, res) => {
    res.json(db.data.campaigns);
  });

  app.post('/campaigns/:id/click', async (req, res) => {
    const c = db.data.campaigns.find(x => x.id === req.params.id);
    if (!c) return res.status(404).json({ error: 'not found' });
    c.clicks++;
    await db.write();
    res.json({ ok: true });
  });

  app.post('/campaigns/:id/sale', async (req, res) => {
    const c = db.data.campaigns.find(x => x.id === req.params.id);
    if (!c) return res.status(404).json({ error: 'not found' });
    c.sales++;
    await db.write();
    res.json({ ok: true });
  });

  app.get('/', (_, res) => res.send('<h1>Moneytokgram API Online</h1>'));
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log('Moneytokgram en puerto', PORT));
})();
