const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema({
  authorName: { type: String, required: true },
  authorEmail: { type: String, required: true, unique: true },
  topic: { type: String, required: true },            // ✅ Added topic field
  bio: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Author = mongoose.model('Author', authorSchema);

module.exports = Author;
