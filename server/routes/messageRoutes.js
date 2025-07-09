const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Message = require('../models/Message');

// GET /api/messages/:userId
// Fetch 1:1 chat history between logged-in user and userId
router.get('/:userId', protect, async (req, res) => {
  const userA = req.user._id;
  const userB = req.params.userId;

  try {
    const messages = await Message.find({
      $or: [
        { sender: userA, receiver: userB },
        { sender: userB, receiver: userA },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    res.json(messages);
  } catch (err) {
    console.error('Chat fetch error:', err);
    res.status(500).json({ message: 'Failed to load messages' });
  }
});

// PATCH /api/messages/:userId/read
// Marks all messages from :userId to the logged-in user as read
router.patch('/:userId/read', protect, async (req, res) => {
  const fromUserId = req.params.userId;
  const toUserId = req.user._id;

  try {
    const result = await Message.updateMany(
      {
        sender: fromUserId,
        receiver: toUserId,
        read: false,
      },
      { $set: { read: true } }
    );

    res.json({ updated: result.modifiedCount });
  } catch (err) {
    console.error('Mark as read error:', err);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
});

module.exports = router;
