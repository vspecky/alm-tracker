const { Schema, model } = require("mongoose")

const studSchema = Schema({
    email: String,
    firstName: String,
    lastName: String,
    middleName: String,
    hash: String,
    branch: String,
    gradYear: String,
    highClgName: String,
    highGradYear: String,
    companyName: String,
    joinDate: String,
    achievements: String,
    bio: String
}, {
    collection: "Students"
});

module.exports = model("AlumniSchema", studSchema);