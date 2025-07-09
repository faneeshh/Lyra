const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Bookmark = require('../models/Bookmark');
const Journal = require('../models/JournalEntry');

// ✅ TOGGLE BOOKMARK
router.post('/:journalId', protect, async (req, res) => {
  const journalId = req.params.journalId;
  const userId = req.user._id;

  try {
    const existing = await Bookmark.findOne({
      user: userId,
      journal: journalId,
    });

    if (existing) {
      await existing.deleteOne();
      return res.json({ bookmarked: false });
    }

    await Bookmark.create({ user: userId, journal: journalId });
    res.json({ bookmarked: true });
  } catch (err) {
    console.error('Bookmark toggle error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GET MY BOOKMARKS
router.get('/', protect, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user._id })
      .populate('journal')
      .sort({ createdAt: -1 });

    res.json(bookmarks.map((b) => b.journal));
  } catch (err) {
    console.error('Get bookmarks error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ CHECK IF A JOURNAL IS BOOKMARKED
router.get('/:journalId/check', protect, async (req, res) => {
  const exists = await Bookmark.exists({
    user: req.user._id,
    journal: req.params.journalId,
  });

  res.json({ bookmarked: !!exists });
});

module.exports = router;
