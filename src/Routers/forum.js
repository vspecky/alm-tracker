const router = module.exports = require("express").Router();
const authCheckers = require("../Utils/authCheckers.js");
const Discussion = require("../Models/discussionModel.js");
const DPost = require("../Models/postsModel.js");
const { check, validationResult } = require("express-validator");

router.get("/", authCheckers.checkAuth, async (req, res) => {

    let disqs = await Discussion.find();
    disqs = disqs.sort((a, b) => b.timestamp - a.timestamp);

    res.render("forum", {
        auth: req.isAuthenticated(),
        admin: req.user.admin,
        topics: disqs,
        reqUser: req.user
    });
});

router.get("/new", authCheckers.checkAuth, (req, res) => {
    res.render("new_discussion", {
        auth: req.isAuthenticated(),
        admin: req.user.admin,
        reqUser: req.user
    });
});

router.post("/new", authCheckers.checkAuth, [
    // Check Title
    check("title", "Please specify a title.")
        .notEmpty(),

    // Check Content
    check("context", "The content cannot be empty or have more than 7000 characters.")
        .notEmpty()
        .isLength({ max: 7000 })

], async (req, res) => {

    const validErrors = validationResult(req);

    if (!validErrors.isEmpty()) {
        for (const err of validErrors.errors) req.flash("danger", err.msg);
        return res.redirect("/forum/new");
    }

    const madePost = new DPost({
        content: req.body.context,
        poster: `${req.user.firstName} ${req.user.lastName}`,
        posterID: req.user._id,
        timestamp: Date.now(),
        date: new Date().toDateString(),
        replies: []
    });

    return madePost.save((err, doc) => {
        if (err) return console.error(err);

        const disq = new Discussion({
            title: req.body.title,
            poster: `${req.user.firstName} ${req.user.lastName}`,
            posterID: req.user._id,
            posts: [doc._id],
            timestamp: Date.now(),
            date: new Date().toDateString()
        });

        return disq.save((err, dis) => {
            if (err) return console.error(err);

            return res.redirect(`/forum/${dis._id}`);
        });
    })
});

router.get("/:id", authCheckers.checkAuth, async (req, res) => {
    const disq = await Discussion.findById(req.params.id);

    const posts = [];

    for (const postID of disq.posts) {
        const post = await DPost.findById(postID);
        posts.push(post);
    }

    res.render("discussion", {
        disq: disq,
        posts: posts,
        auth: req.isAuthenticated(),
        admin: req.user.admin,
        id: disq._id,
        reqUser: req.user
    });
});

router.post("/:id", authCheckers.checkAuth, [
    check("reply", "Please submit a valid reply.")
        .notEmpty()
        .isLength({ max: 2000 })

], async (req, res) => {
    const validErrors = validationResult(req);

    if (!validErrors.isEmpty()) {
        for (const err of validErrors.errors) req.flash("danger", err.msg);
        return res.redirect(`/forum/${req.params.id}`);
    }

    const madePost = new DPost({
        content: req.body.reply,
        poster: `${req.user.firstName} ${req.user.lastName}`,
        posterID: req.user._id,
        timestamp: Date.now(),
        date: new Date().toDateString(),
        replies: []
    });

    return madePost.save(async (err, doc) => {
        if (err) return console.error(err);

        const disq = await Discussion.findById(req.params.id);

        disq.posts.push(doc._id);

        return disq.save((err, dis) => {
            if (err) return console.error(err);

            return res.redirect(`/forum/${dis._id}`);
        });
    })
})