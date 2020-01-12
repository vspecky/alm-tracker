const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const Alumni = require("../Models/alumniModel.js");

const initPassport = (passport) => {

    const authUser = async (email, password, done) => {
        const user = await Alumni.findOne({
            email: email
        });

        if (!user) {
            return done(null, false);
        }

        try {
            if (await bcrypt.compare(password, user.hash)) {
                return done(null, user);
            }
            else return done(null, false);
        } catch (err) {
            return done(err);
        }
    }

    passport.use(new LocalStrategy({ usernameField: "email" }, authUser));

    passport.serializeUser((user, done) => done(null, user.email));
    passport.deserializeUser(async (email, done) => {
        const usr = await Alumni.findOne({ email: email });

        return done(null, usr);
    });
}

module.exports = initPassport;