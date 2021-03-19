
const mongoose = require('mongoose');

const StackoverflowSchema = new mongoose.Schema({
	username: {
		type: String,
	},
	stackoverflow_id: {
		type: String,
	},
	reputation: {
		type: Number,
	},
    gold_badges: {
		type: Number,
	},
    silver_badges: {
		type: Number,
	},
    bronze_badges: {
		type: Number,
	},
	date: {
		type: Date,
		default: Date.now,
	},
});

module.exports = Stackoverflow = mongoose.model('stackoverflow', StackoverflowSchema);