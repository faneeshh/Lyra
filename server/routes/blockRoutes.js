const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

// ✅ TOGGLE BLOCK / UNBLOCK A USER
router.post('/toggle/:userId', protect, async (req, res) => {
  const blocker = req.user._id;
  const toBlock = req.params.userId;

  if (blocker.toString() === toBlock) {
    return res.status(400).json({ message: "You can't block yourself" });
  }

  try {
    const me = await User.findById(blocker);

    const alreadyBlocked = me.blocked.includes(toBlock);
    if (alreadyBlocked) {
      me.blocked = me.blocked.filter((id) => id.toString() !== toBlock);
      await me.save();
      return res.json({ blocked: false });
    } else {
      me.blocked.push(toBlock);
      await me.save();
      return res.json({ blocked: true });
    }
  } catch (err) {
    console.error('Block toggle error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GET BLOCKED USERS
router.get('/blocked', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'blocked',
      'handle username avatar'
    );
    res.json(user.blocked);
  } catch (err) {
    console.error('Fetch blocked error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
