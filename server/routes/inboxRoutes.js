const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Message = require('../models/Message');

router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get latest messages between the user and anyone they've chatted with
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ createdAt: -1 })
      .populate('sender receiver', 'username handle avatar')
      .lean();

    const map = new Map();

    for (const msg of messages) {
      const other =
        msg.sender._id.toString() === userId.toString()
          ? msg.receiver
          : msg.sender;

      const key = other._id.toString();

      if (!map.has(key)) {
        map.set(key, {
          user: other,
          lastMessage: {
            content: msg.content,
            createdAt: msg.createdAt,
          },
          unreadCount: 0,
        });
      }

      // Count unread only if the message is from them to me
      if (
        msg.receiver.toString() === userId.toString() &&
        msg.sender._id.toString() === key &&
        msg.read === false
      ) {
        map.get(key).unreadCount += 1;
      }
    }

    res.json(Array.from(map.values()));
  } catch (err) {
    console.error('Inbox fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
