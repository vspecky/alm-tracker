const express = require("express");
const app = module.exports = express();
const { join } = require("path");
const mongoose = require("mongoose");
const Alumni = require("./Models/alumniModel.js");
const bodyParser = require("body-parser");
const flash = require("connect-flash");
const session = require("express-session");
const expressMessages = require("express-messages");
const passport = require("passport");
const methodOverride = require("method-override");

require("./Utils/passport-config.js")(
    passport,
);

// Connect Database
mongoose.connect("mongodb://localhost/AlmTracker", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

// Log Database Connection
db.once("open", () => console.log("Connected to the MongoDB Database"));

// Error Checking
db.on("error", console.error);

// App Middleware
// Body Parsing
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Method Overriding
app.use(methodOverride("_method"));

// Set static Public folder
app.use(express.static(join(__dirname, "node_modules")));
app.use("/public", express.static(join(__dirname, "Public")));
app.use("/images", express.static(join(__dirname, "Images", "Profile Pics")));

// Express Session
app.use(session({
    secret: "almTrack998@",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Express Messages
app.use(flash());
app.use((req, res, next) => {
    res.locals.messages = expressMessages(req, res);
    next();
});

// Bootstrap Components
app.use("/js", express.static(join(__dirname, "..", "node_modules", "bootstrap", "dist", "js")));
app.use("/js", express.static(join(__dirname, "..", "node_modules", "jquery", "dist")));
app.use("/css", express.static(join(__dirname, "..", "node_modules", "bootstrap", "dist", "css")));

// Load the Views Engine
app.set("views", join(__dirname, "Views"));
app.set("view engine", "pug");

// Home Route
app.get("/", (req, res) => {
    res.render("index", {
        title: "Alumni Tracker",
        h1Cont: "Welcome to the Alumni Portal.",
        auth: req.isAuthenticated(),
        admin: req.user && req.user.admin,
        reqUser: req.user
    });
});

app.get("/test", (req, res) => {
    console.log(req.headers);
    res.render("test");
});

const usersRouter = require("./Routers/users.js");
app.use("/users", usersRouter);

const articlesRouter = require("./Routers/articles.js");
app.use("/articles", articlesRouter);

const forumRouter = require("./Routers/forum.js");
app.use("/forum", forumRouter);

const chatsRouter = require("./Routers/chats.js");
app.use("/chats", chatsRouter);

const dashboardRouter = require("./Routers/dashboard.js");
app.use("/dashboard", dashboardRouter);

const clubsRouter = require("./Routers/clubs.js");
app.use("/clubs", clubsRouter);
