
const mongoose = require('mongoose');

const GithubSchema = new mongoose.Schema({
	user_id: {
		type: Number,
		default: null
	},
	username: {
		type: String,
		default: null
	},
	followers: {
		type: Number,
		default: 0
	},
	following: {
		type: Number,
		default: 0
	},
	repo_quantity: {
		type: Number,
		default: 0
	},
	public_gist_quantity: {
		type: Number,
		default: 0
	},
	date: {
		type: Date,
		default: Date.now,
	},
});

module.exports = Github = mongoose.model('github', GithubSchema);