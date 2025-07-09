const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  handle: { type: String, required: true, unique: true },
  username: { type: String },
  pronouns: { type: String },
  avatar: { type: String },
  spotifyLink: { type: String },
  discordLink: { type: String },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  blocked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  email: {
    type: String,
    required: false, // optional for now
    lowercase: true,
    trim: true,
    match: [/.+@.+\..+/, 'Invalid email format'],
  },
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Add matchPassword method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
