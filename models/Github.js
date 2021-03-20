
const mongoose = require('mongoose');

const GithubSchema = new mongoose.Schema({
	user_id: {
		type: Number,
	},
	username: {
		type: String,
	},
	followers: {
		type: Number,
	},
	following: {
		type: Number,
	},
	repo_quantity: {
		type: Number,
	},
	public_gist_quantity: {
		type: Number,
	},
	date: {
		type: Date,
		default: Date.now,
	},
});

module.exports = Github = mongoose.model('github', GithubSchema);