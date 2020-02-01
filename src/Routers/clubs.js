const router = module.exports = require("express").Router();
const authCheckers = require("../Utils/authCheckers.js");
const Club = require("../Models/clubModel.js");
const Chat = require("../Models/chatModel.js");
const mailTransport = require("../Utils/mailer.js");
const { check, validationResult } = require("express-validator");
const Application = require("../Models/clubApplicationModel.js");
const Alumni = require("../Models/alumniModel.js");

router.use(authCheckers.checkAuth);

router.get("/", async (req, res) => {

    const clubs = await Club.find({ approved: true });

    res.render("clubs", {
        auth: req.isAuthenticated(),
        admin: req.user.admin,
        clubs: clubs,
        reqUser: req.user
    });
});

router.get("/proposal", (req, res) => {
    res.render("club_proposal", {
        auth: true,
        admin: req.user.admin,
        reqUser: req.user
    });
});

router.post("/proposal", [

    // Validate name field
    check("clubName", "Please specify a name for your club.")
        .notEmpty(),

    // Validate Field
    check("clubField", "Please specify a field for your club.")
        .notEmpty(),

    // Validate Home City
    check("clubHome", "Please specify a home city.")
        .notEmpty(),

    // Validate Club Vision
    check("clubVision", "Please specify a vision for your club.")
        .notEmpty(),

    // Validate Club About
    check("clubAbout", "Please specify the About field.")
        .notEmpty(),

    // Validate Requirements
    check("clubReqs", "Please specify club requirements.")
        .notEmpty()

], async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        for (const err of errors.errors) req.flash("danger", err.msg);
        return res.redirect("/clubs/proposal");
    }

    const sameExists = await Club.findOne({ name: req.body.clubName });

    if (sameExists) {
        req.flash("warning", "A club with that name already exists.")
        return res.redirect("/clubs/proposal");
    }

    const newClub = new Club({
        name: req.body.clubName.split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" "),
        field: req.body.clubField,
        vision: req.body.clubVision,
        about: req.body.clubAbout,
        home: req.body.clubHome,
        joinReqs: req.body.clubReqs.split("\n"),
        founder: `${req.user.firstName} ${req.user.lastName}`,
        founderID: req.user._id,
        admins: [req.user._id],
        members: [req.user._id],
        approved: false
    });

    newClub.save((err, doc) => {
        if (err) return console.error(err);

        mailTransport.sendMail({
            from: "AlmTracker <thelonenerd9913@gmail.com>",
            to: req.user.email,
            subject: "Active Club Proposal",
            text: `Hi ${doc.founder}! your club application has been submitted. It will be reviewed and you shall get the results soon.`
        });

        return res.redirect("/clubs");
    });

});

router.get("/verify", authCheckers.checkAdmin, async (req, res) => {
    const unapproved = await Club.find({ approved: false });

    res.render("clubs", {
        clubs: unapproved,
        auth: true,
        admin: true,
        reqUser: req.user,
        verify: true
    });
});

router.post("/verify/:id", authCheckers.checkAdmin, async (req, res) => {
    const club = await Club.findById(req.params.id);

    if (club.approved) {
        req.flash("warning", "Club already approved.");
        return res.redirect("/clubs/verify");
    }

    const val = req.body.verify;

    if (!val) {
        req.flash("warning", "Please choose a verify option.");
        return res.redirect(`/clubs/${req.params.id}`);
    }

    if (val === "yes") {
        club.approved = true;
        return club.save(async (err, doc) => {
            if (err) return console.error(err);

            req.flash("success", "Club successfully verified");

            const founder = await Alumni.findById(doc.founderID);

            mailTransport.sendMail({
                from: "AlmTracker <thelonenerd9913@gmail.com>",
                to: founder.email,
                subject: `Club Verification: ${doc.name}`,
                text: `The Club you proposed, "${doc.name}" has been verified. You're appointed as the founder of the club and have been given full privileges. We hope you have a great experience!`
            });

            return res.redirect("/clubs/verify");
        });
    }

    if (val === "no") {
        return Club.findByIdAndDelete(club._id, async (err, doc) => {
            if (err) return console.error(err);

            req.flash("success", "Club unverified");

            const founder = await Alumni.findById(doc.founderID);

            mailTransport.sendMail({
                from: "AlmTracker <thelonenerd9913@gmail.com>",
                to: founder.email,
                subject: `Club Verification: ${doc.name}`,
                text: `The Club you proposed, "${doc.name}" has been rejected. We're sorry.`
            });

            return res.redirect("/clubs/verify");
        })
    }
})

router.get("/:id", async (req, res, next) => {
    const club = await Club.findById(req.params.id);

    if (!club.approved) {
        req.alm_club = club;
        return next();
    }
    
    res.render("club_page", {
        reqUser: req.user,
        auth: true,
        admin: req.user.admin,
        club: club,
        isMember: club.members.includes(req.user._id),
        isAdmin: club.admins.includes(req.user._id)
    });

}, authCheckers.checkAdmin, async (req, res) => {
    const club = req.alm_club;

    if (club.approved) {
        req.flash("warning", "That club is already verified and approved.");
        return res.redirect("/clubs");
    }

    res.render("club_page", {
        reqUser: req.user,
        auth: true,
        admin: true,
        club: club
    });
});

router.get("/apply/:id", async (req, res) => {
    const club = await Club.findById(req.params.id);

    if (!club || club.members.includes(req.user._id)) {
        req.flash("danger", "That club doesn't exist or you're already a member.");
        return res.redirect("/clubs");
    }

    res.render("club_apply", {
        reqUser: req.user,
        auth: true,
        admin: req.user.admin,
        club: club
    });
});

router.post("/apply/:id", async (req, res) => {
    const club = await Club.findById(req.params.id);

    if (club.members.includes(req.user._id)) {
        req.flash("danger", "You're already a member of this club.");
        return res.redirect("/clubs");
    }

    const application = new Application({
        name: `${req.user.firstName} ${req.user.lastName}`,
        userID: req.user._id,
        branch: req.user.branch,
        gradYear: req.user.gradYear,
        sop: req.body.purpose
    });

    application.save((err, doc) => {
        if (err) return console.error(err);

        req.flash("success", "Application submitted.");
        return res.redirect("/clubs");
    });
});
