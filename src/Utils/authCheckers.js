module.exports = {
    checkAuth(req, res, next) {
        if (req.isAuthenticated()) return next();
        else {
            req.flash("danger", "Sorry, you need to be registered and logged in as an Alumni for that action!");
            res.redirect("/");
        }
    },

    checkNotAuth(req, res, next) {
        if (!req.isAuthenticated()) return next();
        else {
            req.flash("warning", "You're already registered and logged in.");
            res.redirect("/");
        }
    },
    
    checkAdmin(req, res, next) {
        if (req.isAuthenticated()) {
            if (req.user.hash === "$2b$10$5r23Tj5.5HevdfuTMmsj1efhiQjRh8qY1KClP7WPhC5h3DhBGzpka") {
                return next();
            }
        }
        else return res.redirect("/");
    },

    isAdmin(hash) {
        return hash === "$2b$10$5r23Tj5.5HevdfuTMmsj1efhiQjRh8qY1KClP7WPhC5h3DhBGzpka";
    }
}