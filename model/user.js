const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

// encript field
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// Enter specific field you want to encript in 'encriptedFields:[.....]'
userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

const User = mongoose.model("User", userSchema);

module.exports = User;