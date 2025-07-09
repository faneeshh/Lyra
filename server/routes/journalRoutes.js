const express = require('express');
const router = express.Router();
const JournalEntry = require('../models/JournalEntry');
const { protect } = require('../middleware/authMiddleware');

// @POST /api/journals/
// Create a new journal entry
router.post('/', protect, async (req, res) => {
  try {
    const { content, isPrivate, moodTag } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Entry content is required' });
    }

    const entry = new JournalEntry({
      user: req.user._id,
      content,
      isPrivate: !!isPrivate,
      moodTag,
      createdAt: new Date(),
    });

    await entry.save();

    res.status(201).json(entry);
  } catch (err) {
    console.error('Create journal error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @GET /api/journals/public
// Get public journal entries (feed)
router.get('/public', async (req, res) => {
  try {
    const entries = await JournalEntry.find({ isPrivate: false })
      .populate('user', 'handle avatar moodTag')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(entries);
  } catch (err) {
    console.error('Fetch feed error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @GET /api/journals/me
// Get my own journal entries (private + public)
router.get('/me', protect, async (req, res) => {
  try {
    const entries = await JournalEntry.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.json(entries);
  } catch (err) {
    console.error('Fetch my entries error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @GET /api/journals/:id
// Get a specific journal entry (if public or owner)
router.get('/:id', protect, async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id).populate(
      'user',
      'handle avatar'
    );

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    const isOwner = entry.user._id.toString() === req.user._id.toString();

    if (!isOwner && entry.isPrivate) {
      return res.status(403).json({ message: 'This entry is private' });
    }

    res.json(entry);
  } catch (err) {
    console.error('Fetch entry error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
