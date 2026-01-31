// backend/server.js

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');

// --- THIS IS THE MISSING PART ---
const app = express();
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));
// ---------------------------------

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN || '').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Origin not allowed by CORS'));
    }
  }
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

app.get('/', (req, res) => res.json({ message: 'Mangalore Mania backend is running' }));

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'A "messages" array is required.' });
  }

  if (!process.env.GOOGLE_API_KEY) {
    return res.status(500).json({ error: 'Server misconfigured: GOOGLE_API_KEY is missing' });
  }

  const geminiHistory = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  })).filter(msg => msg.role !== 'system');
  
  const latestUserMessage = geminiHistory.pop();

  try {
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GOOGLE_API_KEY}`;
    
    const response = await axios.post(GEMINI_API_URL, {
      contents: [...geminiHistory, latestUserMessage],
    });

    const botReply = response.data.candidates[0].content.parts[0].text;
    
    res.json({
      choices: [{ message: { role: 'assistant', content: botReply } }]
    });

  } catch (error) {
    console.error('Google AI Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'An unexpected error occurred with the AI service.' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Backend server listening on http://localhost:${port}`));