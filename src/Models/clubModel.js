const { Schema, model } = require("mongoose");

const clubSchema = Schema({
    name: String,
    field: String,
    vision: String,
    about: String,
    home: String,
    joinReqs: [],
    founder: String,
    founderID: String,
    admins: [],
    members: [],
    applications: [],
    approved: Boolean
}, {
    collection: "Clubs"
});

module.exports = model("ClubModel", clubSchema);
