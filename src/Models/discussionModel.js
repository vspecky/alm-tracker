const { Schema, model } = require("mongoose");

const discussionSchema = Schema({
    title: String,
    poster: String,
    posterID: String,
    posts: [],
    date: String,
    timestamp: Number
}, {
    collection: "Discussions"
});

module.exports = model("DiscussionModel", discussionSchema);