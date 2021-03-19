
const mongoose = require('mongoose');

const GithubSchema = new mongoose.Schema({
	username: {
		type: String,
	},
	followers: {
		type: Number,
	},
	repo_quantity: {
		type: Number,
	},
	date: {
		type: Date,
		default: Date.now,
	},
});

module.exports = Github = mongoose.model('github', GithubSchema);