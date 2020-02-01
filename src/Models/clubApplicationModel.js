const { Schema, model } = require("mongoose");

const appSchema = Schema({
    name: String,
    userID: String,
    branch: String,
    gradYear: String,
    sop: String
});

module.exports = model("ClubApplicationsModel", appSchema);