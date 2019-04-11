const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderSchema = new Schema({
  name: String,
  image: String,
  dateOrdered: Date,
  isDelivered: Boolean,
  deliveryDate: Date,
  _user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

mongoose.model('order', orderSchema);
