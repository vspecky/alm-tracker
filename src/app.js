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
        admin: req.user && req.user.admin
    });
});

const usersRouter = require("./Routers/users.js");
app.use("/users", usersRouter);