const express = require("express");
const app = module.exports = express();
const { join } = require("path");
const mongoose = require("mongoose");
const Alumni = require("./Models/alumniModel.js");
const bodyParser = require("body-parser");

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

// Set static Public folder
app.use(express.static(join(__dirname, "node_modules")));

// Bootstrap Componens
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
        h1Cont: "Never"
    });
});

// Dashboard Prototype
app.get("/users", (req, res) => {
    Alumni.find({}, (err, students) => {
        if (err) return console.error(err);

        res.render("users", { users: students });
    })
})

// Register GET Route
app.get("/register", (req, res) => {
    res.render("register", {
        title: "Registration for Tracking"
    });
});

// Register POST Route
app.post("/register", (req, res) => {
    const newStud = new Alumni({
        firstName: req.body.first_name,
        lastName: req.body.last_name,
        fatherName: req.body.father_name
    });

    newStud.save(err => {
        if (err) return console.error(err);
        else res.redirect("/");
    });
});

// 