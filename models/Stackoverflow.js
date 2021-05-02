
const mongoose = require('mongoose');

const StackoverflowSchema = new mongoose.Schema({
	username: {
		type: String,
		default: null
	},
	stackoverflow_id: {
		type: String,
		default: null
	},
	reputation: {
		type: Number,
		default: 0
	},
    gold_badges: {
		type: Number,
		default: 0
	},
    silver_badges: {
		type: Number,
		default: 0
	},
    bronze_badges: {
		type: Number,
		default: 0
	},
	date: {
		type: Date,
		default: Date.now,
	},
});

module.exports = Stackoverflow = mongoose.model('stackoverflow', StackoverflowSchema);