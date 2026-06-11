const express = require('express');
const cookieSession = require('cookie-session');
const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

const OAUTH_SERVER = 'http://localhost:3001';
const CLIENT = {
    client_id: 'client_myapp',
    client_secret: 'secret_myapp',
    redirect_uri: `http://localhost:${PORT}/callback`
};

function generateCodeVerifier() {
    return crypto.randomBytes(32).toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function generateCodeChallenge(verifier) {
    return crypto.createHash('sha256').update(verifier).digest('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
    maxAge: 24 * 60 * 60 * 1000
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    const isLoggedIn = !!req.session.accessToken;
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>My Website</title>
            <style>
                body { font-family: Arial; background: linear-gradient(135deg,#667eea,#764ba2); display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); text-align: center; }
                .btn { background: #667eea; color: white; padding: 15px 30px; border: none; font-size: 16px; cursor: pointer; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>${isLoggedIn ? '✅ Welcome Back!' : 'My Website'}</h1>
                <p>${isLoggedIn ? 'Logged in!' : 'Please login'}</p>
                ${isLoggedIn ? '<a href="/logout"><button class="btn" style="background:#f44336">Logout</button></a>' : '<a href="/auth"><button class="btn">Login with OAuth</button></a>'}
            </div>
        </body>
        </html>
    `);
});

app.get('/auth', (req, res) => {
    const state = uuidv4();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    
    req.session.oauth_state = state;
    req.session.code_verifier = codeVerifier;
    
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT.client_id,
        redirect_uri: CLIENT.redirect_uri,
        scope: 'openid profile email',
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    });
    
    res.redirect(`${OAUTH_SERVER}/oauth/authorize?${params}`);
});

app.get('/callback', async (req, res) => {
    const { code, state, error } = req.query;
    
    if (error) return res.send(`Error: ${error}`);
    if (state !== req.session.oauth_state) return res.status(403).send('State mismatch!');
    
    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', CLIENT.redirect_uri);
        params.append('client_id', CLIENT.client_id);
        params.append('client_secret', CLIENT.client_secret);
        params.append('code_verifier', req.session.code_verifier);
        
        const tokenRes = await axios.post(`${OAUTH_SERVER}/oauth/token`, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        req.session.accessToken = tokenRes.data.access_token;
        res.redirect('/');
    } catch (err) {
        res.status(500).send('Error: ' + (err.response?.data?.error_description || err.message));
    }
});

app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
});

app.get('/profile', async (req, res) => {
    if (!req.session.accessToken) return res.redirect('/');
    try {
        const userRes = await axios.get(`${OAUTH_SERVER}/oauth/userinfo`, {
            headers: { Authorization: `Bearer ${req.session.accessToken}` }
        });
        res.json(userRes.data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user info' });
    }
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Client App: http://localhost:${PORT}`);
    });
}

module.exports = {
    app,
    generateCodeVerifier,
    generateCodeChallenge
};