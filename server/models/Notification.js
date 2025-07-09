const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }, // Who gets notified
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who triggered the action
  type: {
    type: String,
    enum: ['comment', 'reply', 'like', 'follow'],
    required: true,
  },
  journal: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' }, // Optional: link to journal
  comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }, // Optional: for replies/likes
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', notificationSchema);
