const express = require('express');
const router = express.Router();

// HTML string for a beautiful, hand-made REST API Documentation console!
const docsHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SafeCompanion REST API Reference | Capgemini 2026</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Outfit', sans-serif;
      background-color: #081c15;
      color: #f0f5f2;
      margin: 0;
      padding: 40px 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    header {
      border-bottom: 1px solid rgba(82, 183, 136, 0.2);
      padding-bottom: 24px;
      margin-bottom: 40px;
    }
    h1 {
      font-size: 2.5rem;
      margin: 0 0 8px 0;
      color: #52b788;
    }
    .badge {
      background: rgba(217, 78, 52, 0.15);
      color: #d94e34;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .card {
      background: rgba(22, 54, 43, 0.5);
      border: 1px solid rgba(82, 183, 136, 0.15);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .endpoint {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      font-family: 'JetBrains Mono', monospace;
    }
    .method {
      padding: 6px 12px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.85rem;
    }
    .method.post { background: #52b788; color: #081c15; }
    .method.get { background: #40916c; color: white; }
    .method.put { background: #d94e34; color: white; }
    
    .path {
      font-size: 1.1rem;
      font-weight: 600;
      color: #f0f5f2;
    }
    pre {
      background: #040e0a;
      border: 1px solid rgba(82, 183, 136, 0.1);
      padding: 16px;
      border-radius: 8px;
      color: #a3b899;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.88rem;
      overflow-x: auto;
    }
    .lock-badge {
      font-size: 0.82rem;
      color: #d94e34;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🛡️ SafeCompanion API</h1>
      <span class="badge">Capgemini Buildathon 2026</span>
      <p style={{color: '#a3b899', marginTop: '12px'}}>Complete full-stack REST endpoint catalog for the MERN women safety companion suite.</p>
    </header>

    <!-- Endpoint 1 -->
    <div class="card">
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/auth/register</span>
      </div>
      <p style="color: #a3b899; font-size: 0.92rem; margin-bottom: 12px;">Registers a new employee or HR safety administrator profile in MongoDB.</p>
      <strong>Request Body Payload:</strong>
      <pre>{
  "username": "Akshita Sharma",
  "email": "akshita@corporate.com",
  "password": "secure_password_123",
  "role": "user", // "user" or "hr"
  "shiftTime": "22:00 - 06:00"
}</pre>
    </div>

    <!-- Endpoint 2 -->
    <div class="card">
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/auth/login</span>
      </div>
      <p style="color: #a3b899; font-size: 0.92rem; margin-bottom: 12px;">Validates user email/password credentials and issues a secure Bearer JWT authentication token.</p>
      <strong>Request Body Payload:</strong>
      <pre>{
  "email": "akshita@corporate.com",
  "password": "secure_password_123"
}</pre>
    </div>

    <!-- Endpoint 3 -->
    <div class="card">
      <div class="endpoint">
        <span class="method put">PUT</span>
        <span class="path">/api/auth/location</span>
        <span class="lock-badge">🔒 JWT Authed</span>
      </div>
      <p style="color: #a3b899; font-size: 0.92rem; margin-bottom: 12px;">Continuously updates employee's live GPS coordinates coordinates on the MERN map server.</p>
      <strong>Headers required:</strong>
      <pre>Authorization: Bearer &lt;JWT_TOKEN&gt;</pre>
      <strong>Request Body Payload:</strong>
      <pre>{
  "lat": 12.9716,
  "lng": 77.5946
}</pre>
    </div>

    <!-- Endpoint 4 -->
    <div class="card">
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/auth/evidence</span>
        <span class="lock-badge">🔒 JWT Authed</span>
      </div>
      <p style="color: #a3b899; font-size: 0.92rem; margin-bottom: 12px;">Secure cloud vault upload. Saves AES-256 encrypted micro-audio records and speech-to-text translations.</p>
      <strong>Request Body Payload:</strong>
      <pre>{
  "transcript": "Heavy breathing detected. Verbal scream: 'Help me!'",
  "audioLength": "0:15"
}</pre>
    </div>

    <!-- Endpoint 5 -->
    <div class="card">
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/auth/users</span>
        <span class="lock-badge">🔒 JWT Authed (HR Role restricted)</span>
      </div>
      <p style="color: #a3b899; font-size: 0.92rem; margin-bottom: 12px;">Pulls roster arrays of all late night shift employees to plot status grids on the B2B dashboard monitor.</p>
    </div>
  </div>
</body>
</html>
`;

router.get('/', (req, res) => {
  res.send(docsHTML);
});

module.exports = router;
