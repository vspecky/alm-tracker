const router = module.exports = require("express").Router();
const io = require("socket.io")(5000);
const authCheckers = require("../Utils/authCheckers.js");
const rooms = ["comp", "mech", "civil", "it", "etx"];

io.on("connection", socket => {
    socket.on("new-user", room => {
        socket.join(room);
    })
    socket.on("send-chat-message", (user, msg, room) => {
        socket.to(room).broadcast.emit("chat-message", user, msg);
    });
});

router.get("/", authCheckers.checkAuth, (req, res) => {
    res.render("chats", {
        auth: req.isAuthenticated(),
        admin: req.user.admin,
        reqUser: req.user
    });
})

router.get("/:room", authCheckers.checkAuth, (req, res) => {

    if (!rooms.includes(req.params.room)) {
        req.flash("danger", "Invalid room.");
        res.redirect("/chats");
    }

    const usrDetails = {
        id: req.user._id,
        name: `${req.user.firstName} ${req.user.lastName}`
    };

    res.render("chat_room", {
        userDetails: JSON.stringify(usrDetails),
        myRoom: `${req.params.room}`,
        auth: req.isAuthenticated(),
        admin: req.user.admin,
        reqUser: req.user
    });
});