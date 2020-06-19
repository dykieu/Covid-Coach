const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const commentSchema = new Schema({
    from: { type: String, required: false },
    to: { type: String, required: false },
    content: { type: String, required: true },
    parentId: { type: String, required: true, default: 0 },
}, { timestamps: true });

module.exports = model('Comment', commentSchema);