let mongoose = require("mongoose");
let passportLocalMongoose = require("passport-local-mongoose");


let UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    isAdmin: {type: Boolean, default: false},
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);