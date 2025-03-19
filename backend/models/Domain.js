const mongoose = require('mongoose');

const domainSchema = new mongoose.Schema({
    title: { type: String, required: true },
    imageurl: { type: String, required: true },
    description: { type: String, required: true },
    topics: {
        easy: { type: [String], required: true },
        medium: { type: [String], required: true },
        hard: { type: [String], required: true },
    },
    ideas: [
        {
            topic: { type: String, required: true },
            description: { type: String, required: true },
            content: { type: String, required: true }, 
            submittedAt: { type: Date, default: Date.now },
        }]
});

const domain = mongoose.model("Domain", domainSchema);
module.exports = domain;