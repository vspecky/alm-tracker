const express = require("express");
const app = module.exports = express();
const { join } = require("path");
const mongoose = require("mongoose");
const Alumni = require("./Models/alumniModel.js");
const bodyParser = require("body-parser");
const { check, validationResult } = require("express-validator");
const flash = require("connect-flash");
const session = require("express-session");
const expressMessages = require("express-messages");

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

// Express Session
app.use(session({
    secret: "almTrack998@",
    resave: true,
    saveUninitialized: true
}));

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
        h1Cont: "Never"
    });
});

// Users Prototype
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
app.post("/register", [
    // Check for valid email
    check("email", "Please enter a valid email.")
        .isEmail(),

    // Check for valid name fields
    check("first_name", "Please enter your first name.")
        .notEmpty(),
    check("father_name", "Please enter your middle name.")
        .notEmpty(),
    check("last_name", "Please enter your last name.")
        .notEmpty(),

    // Password validation
    check("pass")
        .custom((value, { req, location, path }) => {
            if (!value)
                throw new Error("Please enter a password.");
            else if (!(value.length >= 8 && value.length <= 20))
                throw new Error("Password must be 8-20 characters long.")
            else if (value !== req.body.conf_pass) 
                throw new Error("Passwords don't match.");
            else return value;
        }),
    
    // Branch Validation
    check("branch")
        .custom((value, { req, location, path }) => {
            if (value === "-- Select your branch --") throw new Error("Please select your branch.");
            else return value;
        }),

    // College Graduation Year Validation
    check("grad_year")
        .isNumeric()
        .withMessage("Graduation year must be a number.")
        .isLength({ min: 4, max: 4 })
        .withMessage("Graduation year must be in yyyy format."),

    // Higher Education details validation
    check("high_edu")
        .custom((value, { req, location, path }) => {
            const str = "Please enter your correct higher education details."
            if (!value)
                throw new Error(str);
            else if (value === "yes" && (!req.body.high_college || !req.body.high_grad_year))
                throw new Error(str);
            else if (value === "no" && (req.body.high_college || req.body.high_grad_year))
                throw new Error(str);
        }),

    // Employment validation
    check("placed")
        .custom((value, { req, location, path }) => {
            const str = "Please enter your correct employment details."
            if (!value)
                throw new Error(str);
            else if (value === "yes" && (!req.body.company_name || !req.body.company_join_date))
                throw new Error(str);
            else if (value === "no" && (req.body.company_name || req.body.company_join_date))
                throw new Error(str);
        }),

    // Achievements/Internships/etc & Bio validation
    check("achievements", "The 'Achievements/Internships/etc' field can only be 2000 characters long")
        .isLength({ max: 2000 }),
    
    check("bio", "The 'Bio' field can only be 2000 characters long")
        .isLength({ max: 2000 })
], (req, res) => {

    const validationErrors = validationResult(req);
    
    if (!validationErrors.isEmpty()) {
        for (const err of validationErrors.errors) req.flash("danger", err.msg);
        res.redirect("/register");
    }
    else {
        const newAlm = new Alumni({
            firstName: req.body.first_name,
            middleName: req.body.father_name,
            lastName: req.body.last_name,
            email: req.body.email,
            
        })


        req.flash("success", "Registered");
        res.redirect("/");
    }

    

    /*
    const newStud = new Alumni({
        firstName: req.body.first_name,
        lastName: req.body.last_name,
        fatherName: req.body.father_name
    });

    newStud.save(err => {
        if (err) return console.error(err);
        else res.redirect("/");
    });*/
});

// 