// Backend simples para proxy Gemini API
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(bodyParser.json());

const apiKey = process.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.error('VITE_GEMINI_API_KEY não encontrada no .env');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

app.post('/api/gemini', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt é obrigatório' });
    const model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    res.json({ text });
  } catch (err) {
    console.error('Erro Gemini:', err);
    res.status(500).json({ error: err.message || 'Erro desconhecido' });
  }
});

const PORT = 3031;
app.listen(PORT, () => {
  console.log(`API Gemini rodando em http://localhost:${PORT}/api/gemini`);
});
