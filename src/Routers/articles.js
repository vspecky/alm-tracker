const router = module.exports = require("express").Router();
const authCheckers = require("../Utils/authCheckers.js");
const Article = require("../Models/articleModel.js");
const { check, validationResult } = require("express-validator");

router.get("/listing", authCheckers.checkAuth, async (req, res) => {

    let articles = await Article.find({ verified: true });

    articles = [...articles].sort((a, b) => b.timestamp - a.timestamp);

    articles = articles.map((art, ind) => [art, articles[ind+1]]);

    articles = articles.filter((art, ind) => ind % 2 === 0);

    if (articles[articles.length - 1][1] === undefined) articles[articles.length - 1].pop();

    res.render("articles_list", {
        articles: articles,
        auth: req.isAuthenticated(),
        admin: req.user && req.user.admin
    });
});

router.get("/verify", authCheckers.checkAdmin, async (req, res) => {
    const articles = await Article.find({ verified: false });

    res.render("verify_article", {
        pending: articles,
        auth: req.isAuthenticated(),
        admin: true
    });
});

router.post("/verify/:id", authCheckers.checkAdmin, async (req, res) => {

    const val = req.body.verify;

    if (!val) {
        req.flash("danger", "Please choose whether to verify the article or not.");
        return res.redirect(`/articles/view/${req.params.id}`);
    }
    else if (val === "no") {
        await Article.findByIdAndDelete(req.params.id);
        req.flash("warning", "The article was marked unverified.");
        return res.redirect("/articles/verify");
    }

    const toVerify = await Article.findById(req.params.id);

    if (!toVerify) {
        req.flash("danger", "Article does not exist.");
        return res.redirect("/articles/verify");
    }
    else if (toVerify.verified) {
        req.flash("warning", "Article is already verified.");
        return res.redirect("/articles/verify");
    }
    else {
        toVerify.verified = true;
        toVerify.save((err, doc) => {
            if (err) return console.error(err);

            req.flash("success", `The article was successfully verified.`);
            return res.redirect("/articles/verify");
        })
    }
})

router.get("/write", authCheckers.checkAuth, (req, res) => {
    res.render("write_article", {
        auth: req.isAuthenticated(),
        admin: req.user && req.user.admin
    });
});

router.post("/write", authCheckers.checkAuth, [
    // Check Title
    check("title", "Please specify a title.")
        .notEmpty(),

    // Check Content
    check("content", "The content cannot be empty or have more than 7000 characters.")
        .notEmpty()
        .isLength({ max: 7000 })

], (req, res) => {

    const validErrors = validationResult(req);

    if (!validErrors.isEmpty()) {
        for (const err of validErrors.errors) req.flash("danger", err.msg);
        return res.redirect("/articles/write");
    }

    const article = new Article({
        writtenBy: `${req.user.firstName} ${req.user.lastName}`,
        userID: req.user._id,
        title: req.body.title,
        content: req.body.content,
        snippet: req.body.content.slice(0, 198),
        comments: {},
        timestamp: Date.now(),
        date: new Date().toDateString(),
        verified: false
    });

    article.save((err, doc) => {
        if (err) return console.log(err);

        req.flash("success", "Your article has been submitted for verification.");
        res.redirect("/articles/listing");
    })
});

router.get("/view/:id", authCheckers.checkAuth, async (req, res, next) => {
    const art = await Article.findById(req.params.id);

    if (!art) {
        req.flash("danger", "Article not found.");
        res.redirect("/");
    } else {
        const content = art.content.split("\n");

        if (!art.verified) {
            req.article = art;
            req.cont = content;
            return next();
        }
        res.render("article", {
            article: art,
            auth: req.isAuthenticated(),
            admin: req.user && req.user.admin,
            content: content,
            myArticle: art.userID == req.user._id
        });
    }
}, authCheckers.checkAdmin, (req, res) => {
    res.render("article", {
        article: req.article,
        auth: req.isAuthenticated(),
        admin: req.user && req.user.admin,
        content: req.cont
    });
});

router.get("/edit/:id", authCheckers.checkAuth, async (req, res) => {
    const article = await Article.findById(req.params.id);

    if (!article || article.userID != req.user._id) return res.redirect("/");

    res.render("edit_article", {
        article: article,
        auth: req.isAuthenticated(),
        admin: req.user.admin
    });
});

router.post("/edit/:id", authCheckers.checkAuth, async (req, res, next) => {
    const article = await Article.findById(req.params.id);
    req.article = article;
    if (article.userID != req.user._id) return res.redirect("/");
    else return next();
}, [
    // Check Title
    check("title", "Please specify a title.")
        .notEmpty(),

    // Check Content
    check("content", "The content cannot be empty or have more than 7000 characters.")
        .notEmpty()
        .isLength({ max: 7000 })

], (req, res) => {
    const article = req.article;

    article.title = req.body.title;
    article.content = req.body.content;
    article.verified = false;
    article.timestamp = Date.now();
    article.date = new Date().toDateString();

    article.save((err, doc) => {
        if (err) return console.error(err);

        req.flash("success", "Article successfully edited and submitted for reverification.");
        res.redirect("/articles/listing");
    });
});

router.get("/delete/:id", authCheckers.checkAuth, async (req, res) => {
    const article = await Article.findById(req.params.id);
    if (!article || article.userID != req.user.id) {
        req.flash("danger", "You can only delete articles that exist and are your own.");
        return res.redirect("/articles/listing");
    }

    await Article.findByIdAndDelete(req.params.id);

    req.flash("success", "Your article was deleted successfully.");
    res.redirect("/articles/listing");
})