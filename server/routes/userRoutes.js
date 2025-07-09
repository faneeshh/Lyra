const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Simple adjective/animal lists for random handle gen
const adjectives = ['Silent', 'Velvet', 'Crimson', 'Feral', 'Misty', 'Hidden'];
const nouns = ['Fox', 'Lynx', 'Wolf', 'Owl', 'Crow', 'Wisp'];

function generateHandle() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 100);
  return `${adj}${noun}${number}`;
}

function getRandomAvatar() {
  const avatars = ['fox_1.gif', 'fox_2.gif', 'fox_3.gif', 'fox_4.gif'];
  return avatars[Math.floor(Math.random() * avatars.length)];
}

// @route POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    const { username, pronouns, email, password } = req.body;

    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 6 characters' });
    }

    let handle;
    let exists = true;

    // Ensure unique handle
    while (exists) {
      handle = generateHandle();
      exists = await User.findOne({ handle });
    }

    const avatar = getRandomAvatar();

    const newUser = new User({
      handle,
      username,
      pronouns,
      avatar,
      email,
      password, // Will be hashed via pre-save middleware in User model
    });

    await newUser.save();

    // Return user data (without password)
    const { password: _, ...userData } = newUser.toObject();
    res.status(201).json(userData);
  } catch (err) {
    console.error('User registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

const jwt = require('jsonwebtoken');

// POST /api/users/login
router.post('/login', async (req, res) => {
  const { handle, password } = req.body;

  if (!handle || !password) {
    return res
      .status(400)
      .json({ message: 'Handle and password are required' });
  }

  try {
    const user = await User.findOne({ handle });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    // Return token + user info (excluding password)
    const { password: _, ...userData } = user.toObject();
    res.status(200).json({ token, user: userData });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/users/email
router.patch('/email', protect, async (req, res) => {
  const { email } = req.body;
  if (!email || !/.+@.+\..+/.test(email)) {
    return res.status(400).json({ message: 'Invalid email' });
  }

  try {
    const user = await User.findById(req.user._id);
    user.email = email;
    await user.save();
    res.json({ message: 'Email updated' });
  } catch (err) {
    console.error('Email update error:', err);
    res.status(500).json({ message: 'Failed to update email' });
  }
});

// PATCH /api/users/me
router.patch('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const { username, pronouns, avatar } = req.body;

    // Optionally validate avatar from a fixed set
    const allowedAvatars = ['fox_1.gif', 'fox_2.gif', 'fox_3.gif', 'fox_4.gif'];
    if (avatar && !allowedAvatars.includes(avatar)) {
      return res.status(400).json({ message: 'Invalid avatar selected' });
    }

    if (username) user.username = username;
    if (pronouns) user.pronouns = pronouns;
    if (avatar) user.avatar = avatar;

    await user.save();

    const { password, ...userData } = user.toObject();
    res.json(userData);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
