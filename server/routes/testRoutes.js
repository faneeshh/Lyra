const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

router.get('/private', protect, (req, res) => {
  res.json({ message: `Welcome, ${req.user.handle}` });
});

module.exports = router;
