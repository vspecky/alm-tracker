const router = module.exports = require("express").Router();
const Alumni = require("../Models/alumniModel.js");
const passport = require("passport");
const { join } = require("path");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const { checkAuth, checkNotAuth, checkAdmin } = require("../Utils/authCheckers.js");
const fs = require("fs");
const mailTransport = require("../Utils/mailer.js");

router.get("/listing", checkAuth, (req, res) => {
    Alumni.find({ verified: true, admin: false }, (err, students) => {
        if (err) return console.error(err);

        res.render("users", {
            users: students,
            auth: req.isAuthenticated(),
            admin: req.user && req.user.admin,
            reqUser: req.user
        });
    });
})

// Register GET Route
router.get("/register", checkNotAuth, (req, res) => {
    res.render("register", {
        title: "Registration for Tracking"
    });
});

// Register POST Route
router.post("/register", checkNotAuth, [
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
            else return value;
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
        res.redirect("/users/register");
    }
    else {

        const existingUsr = await Alumni.findOne({ email: req.body.email }); // Promise { <pending> }

        if (existingUsr) {
            req.flash("danger", "That email is already registered");
            res.redirect("/users/register");
            return;
        }

        const hashedPswd = await bcrypt.hash(req.body.pass, 10);

        const newAlm = new Alumni({
            firstName: req.body.first_name,
            middleName: req.body.father_name,
            lastName: req.body.last_name,
            email: req.body.email,
            hash: hashedPswd,
            branch: req.body.branch,
            gradYear: req.body.grad_year,
            highClgName: req.body.high_college || "None",
            highGradYear: req.body.high_grad_year || "None",
            companyName: req.body.company_name || "None",
            joinDate: req.body.company_join_date || "None",
            achievements: req.body.achievements || "None",
            bio: req.body.bio || "None",
            verified: false,
            admin: false
        });

        newAlm.save(async (err, doc) => {
            if (err) return console.log(err);

            await fs.copyFile(join(__dirname, "..", "Images", "Buffer", "Default"), join(__dirname, "..", "Images", "Profile Pics", `${doc._id}`), (err) => {
                if (err) console.log(err);
            });

            mailTransport.sendMail({
                from: "AlmTracker <thelonenerd9913@gmail.com>",
                to: doc.email,
                subject: "Registration for Alumni Portal.",
                text: `Hi ${doc.firstName}! Thanks for registering on the Alumni Portal. Your account shall be verified soon and you will receive an email once it is verified.`
            });

            req.flash("success", "Successfully registered. Your profile has been submitted for verification.");
            res.redirect("/");
        });
    }
});

router.get("/login", checkNotAuth, (req, res) => {
    res.render("login");
});

router.post("/login", checkNotAuth, passport.authenticate("local", {
    failureFlash: "Invalid Credentials",
    failureRedirect: "/users/login"
}), (req, res) => {
    if (!req.user.verified) {
        req.flash("danger", "You aren't verified yet.");
        req.logOut();
        return res.redirect("/");
    }
    req.flash("success", `Glad to see you ${req.user.firstName} ${req.user.lastName}!`);
    res.redirect("/");
});

router.delete("/logout", checkAuth, (req, res) => {
    req.logOut();
    req.flash("success", "Logged out successfully.");
    res.redirect("/");
});

router.get("/verify", checkAdmin, async (req, res) => {
    const pendingVerif = await Alumni.find({ verified: false });
    res.render("verify_user", {
        pending: pendingVerif,
        auth: req.isAuthenticated(),
        admin: req.user && req.user.admin,
        reqUser: req.user
    });
});

router.post("/verify/:id", checkAdmin, async (req, res) => {

    const val = req.body.verify;
    const toVerify = await Alumni.findById(req.params.id);

    if (!toVerify) {
        req.flash("danger", "User does not exist.");
        return res.redirect("/users/verify");
    }

    if (!val) {
        req.flash("danger", "Please choose whether to verify the user or not.");
        return res.redirect(`/users/dashboard/${req.params.id}`);
    }
    else if (val === "no") {
        mailTransport.sendMail({
            from: "AlmTracker <thelonenerd9913@gmail.com>",
            to: toVerify.email,
            subject: "Alumni Portal Verification.",
            text: `${toVerify.firstName}, we're sorry to inform you that your account has been marked unverified. Please contact the College Alumni Co-ordinator.`
        });
        await Alumni.findByIdAndDelete(req.params.id);
        req.flash("warning", "The user was marked unverified.");
        return res.redirect("/users/verify");
    }


    if (toVerify.verified) {
        req.flash("warning", "User is already verified.");
        res.redirect("/users/verify");
    }
    else {
        toVerify.verified = true;
        toVerify.save((err, doc) => {
            if (err) return console.error(err);

            mailTransport.sendMail({
                from: "AlmTracker <thelonenerd9913@gmail.com>",
                to: doc.email,
                subject: "Alumni Portal Verification",
                text: "Congratulations! you are now an official part of your College Alumni Community. You can log into your account on the portal!"
            });

            req.flash("success", `${doc.firstName} ${doc.lastName} was successfully verified.`);
            res.redirect("/users/verify");
        })
    }
})

router.get("/dashboard/:id", checkAuth, async (req, res, next) => {
    const alum = await Alumni.findById(req.params.id);

    if (!alum) {
        req.flash("danger", "User not found.");
        res.redirect("/");
    } else {
        if (!alum.verified) {
            req.alumni = alum;
            return next();
        }
        res.render("dashboard", {
            alm: alum,
            auth: req.isAuthenticated(),
            admin: req.user && req.user.admin,
            reqUser: req.user,
            id: alum._id
        });
    }
}, checkAdmin, (req, res) => {
    res.render("dashboard", {
        alm: req.alumni,
        auth: req.isAuthenticated(),
        admin: req.user && req.user.admin,
        reqUser: req.user
    });
});
