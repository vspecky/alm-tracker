const nodemailer = require("nodemailer");

module.exports = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "thelonenerd9913@gmail.com",
        pass: "etqjotrdjfhweffc"
    }
});
