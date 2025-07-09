const express = require('express');
const router = express.Router();
const User = require('../models/User');
const JournalEntry = require('../models/JournalEntry');
const Follow = require('../models/Follow');

// GET /api/profiles/:handle
router.get('/:handle', async (req, res) => {
  try {
    const user = await User.findOne({ handle: req.params.handle });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const [followerCount, followingCount, journals] = await Promise.all([
      Follow.countDocuments({ following: user._id }),
      Follow.countDocuments({ follower: user._id }),
      JournalEntry.find({ author: user._id }).sort({ createdAt: -1 }).lean(),
    ]);

    res.json({
      handle: user.handle,
      avatar: user.avatar,
      pronouns: user.pronouns,
      username: user.username,
      followerCount,
      followingCount,
      journals,
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
