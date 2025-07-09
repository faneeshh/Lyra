const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

router.get('/private', protect, (req, res) => {
  res.json({ message: `Welcome, ${req.user.handle}` });
});

const sendEmail = require('../utils/sendEmail');

router.get('/email', async (req, res) => {
  await sendEmail(
    'cyberabx@gmail.com',
    'Test from Lyra',
    'This is a test email!'
  );
  res.send('Email sent');
});

module.exports = router;
