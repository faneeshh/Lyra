const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const JournalEntry = require('../models/JournalEntry');
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/reflect/:journalId
router.post('/:journalId', protect, async (req, res) => {
  try {
    const journal = await JournalEntry.findById(req.params.journalId);
    if (!journal) return res.status(404).json({ message: 'Journal not found' });

    if (journal.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const prompt = `
You are a reflective assistant. A user has anonymously written the following journal entry:

"${journal.content}"

Please analyze the emotional tone, summarize the core themes, and offer a gentle, thoughtful reflection that encourages introspection. Your output should be structured like this:

Mood: (e.g., Anxious, Nostalgic, Angry)
Themes: (e.g., Abandonment, Fear of rejection, Identity crisis)
Reflection: (Short paragraph of 3–5 lines)

Respond only in the structure above. Do not add anything else.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const reflection = response.choices[0]?.message?.content;
    res.json({ reflection });
  } catch (err) {
    console.error('AI Reflect error:', err);
    res.status(500).json({ message: 'Reflection failed' });
  }
});

module.exports = router;
