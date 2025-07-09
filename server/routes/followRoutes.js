const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Follow = require('../models/Follow');
const User = require('../models/User');

// ✅ TOGGLE FOLLOW / UNFOLLOW
router.post('/:userId', protect, async (req, res) => {
  const targetUserId = req.params.userId;
  const currentUserId = req.user._id.toString();

  if (currentUserId === targetUserId) {
    return res.status(400).json({ message: "You can't follow yourself" });
  }

  try {
    const existing = await Follow.findOne({
      follower: currentUserId,
      following: targetUserId,
    });

    if (existing) {
      await existing.deleteOne();
      return res.json({ followed: false });
    }

    const newFollow = new Follow({
      follower: currentUserId,
      following: targetUserId,
    });

    await newFollow.save();

    const sendEmail = require('../utils/sendEmail');
    const followedUser = await User.findById(targetUserId);
    const followerUser = await User.findById(currentUserId);

    if (followedUser?.email) {
      await sendEmail(
        followedUser.email,
        `You have a new follower on Lyra`,
        `"@${followerUser.handle}" started following you.\n\nCheck out their profile or journals on Lyra.`
      );
    }

    const Notification = require('../models/Notification');

    // 🔔 Send follow notification
    await Notification.create({
      recipient: targetUserId,
      sender: currentUserId,
      type: 'follow',
    });

    res.json({ followed: true });
  } catch (err) {
    console.error('Follow toggle error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GET USERS I’M FOLLOWING
router.get('/following/:userId', async (req, res) => {
  try {
    const following = await Follow.find({ follower: req.params.userId })
      .populate('following', 'handle avatar username')
      .lean();

    res.json(following.map((f) => f.following));
  } catch (err) {
    console.error('Fetch following error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GET MY FOLLOWERS
router.get('/followers/:userId', async (req, res) => {
  try {
    const followers = await Follow.find({ following: req.params.userId })
      .populate('follower', 'handle avatar username')
      .lean();

    res.json(followers.map((f) => f.follower));
  } catch (err) {
    console.error('Fetch followers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
