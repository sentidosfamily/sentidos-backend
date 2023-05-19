const mongoose = require('mongoose');
const { Schema, model } = mongoose;

mongoose.set('strictQuery', false)

const UserSchema = new Schema({
  username: { type: String, required: true, min: 4, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String },
});

const UserModel = model('User', UserSchema);

module.exports = UserModel;