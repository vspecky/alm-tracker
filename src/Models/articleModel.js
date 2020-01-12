const { Schema, model } = require("mongoose");

const articleSchema = Schema({
    writtenBy: String,
    userID: String,
    title: String,
    content: String,
    comments: {},
    timestamp: Number,
    date: String,
    verified: Boolean,
    snippet: String,
}, {
    collection: "Articles"
});

module.exports = model("ArticleSchema", articleSchema);