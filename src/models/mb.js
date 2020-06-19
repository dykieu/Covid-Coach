// Messages/Postss Data Model
const mongoose = require('mongoose');
const mbSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true
	},
	message: {
		type: String,
		required: true,
		maxlength: 550
	},
	articleTitle: {
		type: String,
		required: true,
		maxlength: 250
	}
},
	{
		timestamps: true,
		autoCreate: true
	});

const Msg = mongoose.model('Msg', mbSchema);
module.exports = Msg;