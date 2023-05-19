const mongoose = require('mongoose');
const { Schema, model } = mongoose;
mongoose.set('strictQuery', false)

const SuscriptorSchema = new Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  name: String,
  email: {
    type: String,
    index: {
      unique: true,
      partialFilterExpression: { email: { $exists: true } }
    }
  }
});

const SuscriptorModel = model('Suscriptor', SuscriptorSchema);

module.exports = SuscriptorModel;
