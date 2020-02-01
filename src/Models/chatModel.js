const { Schema, model } = require("mongoose");

const chatSchema = Schema({
    name: String,
    roomID: String,
    club: String
}, {
    collection: "Chats"
});

module.exports = model("ChatModel", chatSchema);
