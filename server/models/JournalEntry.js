const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  isPrivate: { type: Boolean, default: false },
  moodTag: { type: String },
  aiReflection: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
