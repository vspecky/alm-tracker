const { Schema, model } = require("mongoose")

const studSchema = Schema({
    firstName: String,
    lastName: String,
    fatherName: String
}, {
    collection: "Students"
});

module.exports = model("StudentSchema", studSchema);