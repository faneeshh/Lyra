const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Report = require('../models/Report');

// POST /api/report/:userId
router.post('/:userId', protect, async (req, res) => {
  const reporter = req.user._id;
  const reported = req.params.userId;
  const { reason, message } = req.body;

  if (reporter.toString() === reported) {
    return res.status(400).json({ message: "You can't report yourself." });
  }

  try {
    const report = new Report({
      reporter,
      reported,
      reason,
      message: message || '',
    });

    await report.save();
    res.status(201).json({ message: 'Report submitted successfully.' });
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ message: 'Failed to submit report.' });
  }
});

module.exports = router;
