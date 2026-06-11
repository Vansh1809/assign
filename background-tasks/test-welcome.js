const http = require('http');

const body = JSON.stringify({
  type: 'send-email',
  payload: {
    email: 'sk240461178@example.com',
    template: 'welcome',
    templateData: {
      name: 'Vansh',
      siteName: 'Auth Service'
    }
  }
});

const req = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/tasks',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
}, (res) => {
  let data = '';

  res.on('data', chunk => data += chunk);

  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', console.error);

req.write(body);
req.end();