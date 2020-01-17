const router = module.exports = require("express").Router();
const authCheckers = require("../Utils/authCheckers.js");
const { check, validationResult } = require("express-validator");
const Alumni = require("../Models/alumniModel.js");
const bcrypt = require("bcrypt");
const multer = require("multer");
const { join, extname } = require("path");
const Jimp = require("jimp");
const filetypes = /jpeg|jpg|png/;

const multerFileFilter = (req, file, cb) => {
    const extCheck = filetypes.test(extname(file.originalname).toLowerCase());

    const mimetypeCheck = filetypes.test(file.mimetype);

    if (extCheck && mimetypeCheck) return cb(null, true);
    else return cb("Please upload an Image.", false);
}

const multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, join(__dirname, "..", "Images", "Profile Pics"));
    },

    filename: function (req, file, cb) {
        cb(null, `${req.user._id}`);
    }
});

const upload = multer({
    storage: multerStorage,

    fileFilter: multerFileFilter,

    limits: {
        fileSize: 1000000,
        files: 1
    }
}).single("pfp");

router.get("/", authCheckers.checkAuth, (req, res) => {
    res.render("dashboard", {
        alm: req.user,
        auth: req.isAuthenticated(),
        admin: req.user.admin,
        myDash: true,
        id: req.user._id,
        reqUser: req.user
    });
});

router.get("/edit", authCheckers.checkAuth, (req, res) => {
    res.render("edit_dashboard", {
        usr: req.user,
        auth: req.isAuthenticated(),
        admin: req.user.admin,
        reqUser: req.user
    });
});

router.post("/edit", authCheckers.checkAuth, [
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
    
    // Branch Validation
    check("branch")
        .custom((value, { req, location, path }) => {
            if (value === "-- Select your branch --") throw new Error("Please select your branch.");
            else return value;
        }),

    // College Graduation Year Validation
    check("grad_year")
        .custom((value, { req, location, path }) => {
            const str = "Graduation Year should be a valid year."
            if (!/\d{4}/.test(value) && value !== "None")
                throw new Error(str);
            else return value;
        }),


    // Achievements/Internships/etc & Bio validation
    check("achievements", "The 'Achievements/Internships/etc' field can only be 2000 characters long")
        .isLength({ max: 2000 }),
    
    check("bio", "The 'Bio' field can only be 2000 characters long")
        .isLength({ max: 2000 })
        
], async (req, res) => {
    const validationErrors = validationResult(req);
    
    if (!validationErrors.isEmpty()) {
        for (const err of validationErrors.errors) req.flash("danger", err.msg);
        res.redirect("/dashboard/edit");
    }
    else {

        const usr = await Alumni.findById(req.user._id);

        usr.firstName = req.body.first_name;
        usr.middleName = req.body.father_name;
        usr.lastName = req.body.last_name;
        usr.email = req.body.email;
        usr.branch = req.body.branch;
        usr.gradYear = req.body.grad_year;
        usr.highClgName = req.body.high_college || "None";
        usr.highGradYear = req.body.high_grad_year || "None";
        usr.companyName = req.body.company_name || "None";
        usr.joinDate = req.body.company_join_date || "None";
        usr.achievements = req.body.achievements || "None";
        usr.bio = req.body.bio || "None";

        usr.save((err, doc) => {
            if (err) return console.log(err);
            
            req.flash("success", "Profile successfully edited.");
            res.redirect("/dashboard");
        });
    }
});

router.post("/passwordchange", authCheckers.checkAuth, [

    check("orig_pass")
        .custom(async (value, { req, location, path }) => {
            const correct = await bcrypt.compare(value, req.user.hash);

            if (!correct)
                throw new Error("Incorrect original password.");
            else if (req.body.new_pass != req.body.conf_pass)
                throw new Error("Passwords do not match.");
            else return value;
        })

], async (req, res) => {

    const validationErrors = validationResult(req);
    
    if (!validationErrors.isEmpty()) {
        for (const err of validationErrors.errors) req.flash("danger", err.msg);
        return res.redirect("/dashboard");
    }

    const hashedPwd = await bcrypt.hash(req.body.new_pass, 10);

    const usr = await Alumni.findById(req.user._id);

    usr.hash = hashedPwd;

    usr.save((err, _) => {
        if (err) return console.error(err);

        req.logOut();
        req.flash("success", "Password updated successfully, please relogin.");
        return res.redirect("/users/login");
    });
});

router.post("/pfp", authCheckers.checkAuth, (req, res, next) => {
    let flag = true
    upload(req, res, (err) => {
        if (err) return console.log(err);
    });

    if (flag) return next();
}, async (req, res) => {
    const pfp = await Jimp.read(join(__dirname, "..", "Images", "Profile Pics", `${req.user._id}`));

    const height = pfp.bitmap.height;
    const width = pfp.bitmap.width;

    if (height >= width) {
        await pfp.crop(0, (height / 2) - (width / 2), width, width);
    }
    else {
        await pfp.crop((width / 2) - (height / 2), 0, height, height);
    }

    await pfp.write(join(__dirname, "..", "Images", "Profile Pics", `${req.user._id}`));

    req.flash("success", "Profile picture updated successfully.");
    return res.redirect("/dashboard");
})