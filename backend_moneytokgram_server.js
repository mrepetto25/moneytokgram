
// server.js
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.post('/auth/login', (req, res) => {
  const { email } = req.body;
  // Simular token
  res.json({ token: 'demo-jwt-token', user: { email } });
});

app.get('/metrics', (req, res) => {
  res.json({
    views: 10500,
    likes: 1200,
    roi: 3.4
  });
});

app.get('/wallet', (req, res) => {
  res.json({
    balance: 235.5,
    transactions: [
      { date: '2025-07-15', amount: 120.0, type: 'earn' },
      { date: '2025-07-22', amount: -50.0, type: 'withdraw' }
    ]
  });
});

app.post('/wallet/withdraw', (req, res) => {
  res.json({ success: true, message: 'Retiro procesado con Stripe' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
