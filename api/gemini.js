

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
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.0-pro';
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    res.json({ text });
  } catch (err) {
    console.error('Erro Gemini:', err);
    res.status(500).json({ error: err.message || 'Erro desconhecido' });
  }
});


// Endpoint para listar modelos disponíveis
app.get('/api/gemini-models', async (req, res) => {
  try {
    const models = await genAI.listModels();
    res.json(models);
  } catch (err) {
    console.error('Erro ao listar modelos Gemini:', err);
    res.status(500).json({ error: err.message || 'Erro desconhecido' });
  }
});

const PORT = 3031;
app.listen(PORT, () => {
  console.log(`API Gemini rodando em http://localhost:${PORT}/api/gemini`);
});
