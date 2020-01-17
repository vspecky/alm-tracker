const { Schema, model } = require("mongoose");

const postsSchema = Schema({
    content: String,
    poster: String,
    posterID: String,
    replies: [],
    date: String,
    timestamp: Number
}, {
    collection: "DiscussionPosts"
});

module.exports = model("PostsModel", postsSchema);