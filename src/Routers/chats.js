const router = module.exports = require("express").Router();
const io = require("socket.io")(5000);

io.on("connection", socket => {
    socket.emit("chat-message", "Hello World!");
});

router.get("/", (req, res) => {
    res.render("chat_room");
});