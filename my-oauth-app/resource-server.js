/**
 * Example Resource Server
 * A protected API that validates tokens from the OAuth Authorization Server
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const ISSUER = 'http://localhost:3001';

// ─── Auth middleware ──────────────────────────────────────────────────────────
function requireAuth(scopes = []) {
  return (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'Missing Bearer token',
      });
    }

    try {
      const payload = jwt.verify(auth.slice(7), JWT_SECRET, { issuer: ISSUER });

      // Check required scopes
      const tokenScopes = (payload.scope || '').split(' ');
      const missing = scopes.filter(s => !tokenScopes.includes(s));
      if (missing.length > 0) {
        return res.status(403).json({
          error: 'insufficient_scope',
          error_description: `Required scopes: ${missing.join(', ')}`,
        });
      }

      req.user = payload;
      next();
    } catch (err) {
      res.status(401).json({
        error: 'invalid_token',
        error_description: err.message,
      });
    }
  };
}

// ─── Protected routes ─────────────────────────────────────────────────────────
app.get('/api/me', requireAuth(['profile']), (req, res) => {
  res.json({
    id: req.user.sub,
    name: req.user.name,
    email: req.user.email,
    scopes: req.user.scope,
  });
});

app.get('/api/data', requireAuth(['read']), (req, res) => {
  res.json({
    message: 'Here is your protected data',
    requestedBy: req.user.sub,
    items: [
      { id: 1, name: 'Item A', value: 100 },
      { id: 2, name: 'Item B', value: 200 },
    ],
  });
});

app.post('/api/data', requireAuth(['write']), (req, res) => {
  res.status(201).json({
    message: 'Data written successfully',
    createdBy: req.user.sub,
    data: req.body,
  });
});

app.get('/api/admin', requireAuth(['admin']), (req, res) => {
  res.json({ message: 'Admin only endpoint' });
});

app.listen(3002, () => {
  console.log('🛡️  Resource Server running on http://localhost:3002');
  console.log('   GET  /api/me     requires: profile scope');
  console.log('   GET  /api/data   requires: read scope');
  console.log('   POST /api/data   requires: write scope');
});