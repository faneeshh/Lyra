const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  journal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JournalEntry',
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

bookmarkSchema.index({ user: 1, journal: 1 }, { unique: true }); // prevent duplicates

module.exports = mongoose.model('Bookmark', bookmarkSchema);
