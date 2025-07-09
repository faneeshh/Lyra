const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Comment = require('../models/Comment');
const JournalEntry = require('../models/JournalEntry');
const Notification = require('../models/Notification');

// POST /api/comments/:journalId
// Add a comment or reply to a journal
router.post('/:journalId', protect, async (req, res) => {
  const { content, parent } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ message: 'Comment content is required' });
  }

  try {
    const journal = await JournalEntry.findById(req.params.journalId);
    if (!journal) return res.status(404).json({ message: 'Journal not found' });

    const comment = new Comment({
      journal: journal._id,
      user: req.user._id,
      content,
      parent: parent || null,
    });

    await comment.save();

    // Email the journal owner (if not the commenter themselves)
    const sendEmail = require('../utils/sendEmail');

    const journalOwner = await User.findById(journal.user);
    if (
      journalOwner &&
      journalOwner.email &&
      journalOwner._id.toString() !== req.user._id.toString()
    ) {
      await sendEmail(
        journalOwner.email,
        `New comment on your journal on Lyra`,
        `"${req.user.handle}" commented: "${content}"\n\nVisit Lyra to read and reply.`
      );
    }

    // 🔔 Create notification
    if (!parent) {
      // Notify journal owner on top-level comment
      if (journal.user.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: journal.user,
          sender: req.user._id,
          type: 'comment',
          journal: journal._id,
        });
      }
    } else {
      // Notify parent comment author on reply
      const parentComment = await Comment.findById(parent);
      if (
        parentComment &&
        parentComment.user.toString() !== req.user._id.toString()
      ) {
        await Notification.create({
          recipient: parentComment.user,
          sender: req.user._id,
          type: 'reply',
          journal: journal._id,
          comment: parentComment._id,
        });
      }
    }

    res.status(201).json(comment);
  } catch (err) {
    console.error('Comment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/comments/:journalId
// Fetch all comments (threaded) for a journal
router.get('/:journalId', async (req, res) => {
  try {
    const comments = await Comment.find({ journal: req.params.journalId })
      .populate('user', 'handle avatar')
      .lean();

    const commentMap = {};
    comments.forEach((c) => (commentMap[c._id] = { ...c, replies: [] }));

    const rootComments = [];
    comments.forEach((c) => {
      if (c.parent) {
        commentMap[c.parent]?.replies.push(commentMap[c._id]);
      } else {
        rootComments.push(commentMap[c._id]);
      }
    });

    res.json(rootComments);
  } catch (err) {
    console.error('Fetch comments error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/comments/:commentId/like
// Toggle like on a comment
router.post('/:commentId/like', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const userId = req.user._id.toString();
    const index = comment.likes.findIndex((id) => id.toString() === userId);

    const isNewLike = index === -1;

    if (isNewLike) {
      comment.likes.push(req.user._id);

      // 🔔 Create notification (only on first like)
      if (comment.user.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: comment.user,
          sender: req.user._id,
          type: 'like',
          comment: comment._id,
          journal: comment.journal,
        });
      }
    } else {
      comment.likes.splice(index, 1);
    }

    await comment.save();
    res.json({ liked: isNewLike, likesCount: comment.likes.length });
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
