const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

// ✅ GET ALL NOTIFICATIONS FOR USER
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate('from', 'handle avatar')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json(notifications);
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ MARK AS READ
router.patch('/:id/read', protect, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true }
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error('Read notification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ MARK ALL AS READ
router.patch('/read/all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id }, { read: true });
    res.json({ message: 'All marked as read' });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
