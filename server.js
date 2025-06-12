// --- Required Libraries ---
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

// --- App Setup ---
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- Image Upload Config ---
const upload = multer({ dest: 'uploads/' });

// --- OpenAI Setup ---
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- ROUTE: Image Upload + AI Skin Analysis ---
app.post('/api/vision', upload.single('photo'), async (req, res) => {
  try {
    const imagePath = path.join(__dirname, req.file.path);
    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString('base64');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `
You are Aura 💖 — a Gen-Z beauty AI bestie.

Your job is to:
1. Analyze the uploaded selfie image and DETECT:
   - Skin tone (fair, medium, deep + undertone)
   - Skin concerns (acne, dryness, oiliness, sensitivity, etc.)

2. Suggest a skincare routine:
   - Start with general advice (e.g., "use a gentle cleanser")
   - Then recommend 1–2 real products per step
     - Include name, image link, and store link (Amazon/Sephora/etc.)
     - But stay non-salesy — like a friend giving tips

3. End with 1 short paragraph of motivational glow-up talk 💖

Tone: Supportive, emoji-rich, Gen-Z style. Be casual and kind. Limit response to 400 words.
          `
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze my skin and suggest a routine with product links.' },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    });

    // Clean up uploaded file
    fs.unlinkSync(imagePath);

    const reply = response.choices[0].message.content;
    res.json({ markdown: reply });

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    res.status(500).json({
      error: 'Failed to get analysis from AI.',
      details: error.message
    });
  }
});

// --- Startup Message ---
console.log('All routes have been defined.');

const server = app.listen(PORT, () => {
  console.log('--- SUCCESS! ---');
  console.log(`Server is running and listening on http://localhost:${PORT}`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
});
