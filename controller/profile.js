const Profile = require('../models/Profile');
const Stackoverflow = require('../models/Stackoverflow');
const Github = require('../models/Github');
const User = require('../models/User');
const normalize = require('normalize-url');
const dotenv=require('dotenv').config()
const axios = require('axios');
const { validationResult } = require('express-validator');

const generateScore = (stack, git) => {
let score = 0;

if(stack.bronze_badges > 10) score +=2;
else score ++;

if(stack.silver_badges > 10) score +=3;
else score +=2;

if(stack.gold_badges > 10) score +=4;
else score +=3;

if(stack.reputation > 10 && stack.reputation < 20) score +=2;
else if(stack.reputation > 20 && stack.reputation < 30) score +=3;
else score +=5;

if(git.followers > 10 && git.followers < 20) score +=2;
else if(git.followers > 20 && git.followers < 30) score +=3;
else score +=5;

if(git.following > 10 && git.following < 20) score +=2;
else if(git.following > 20 && git.following < 30) score +=3;
else score +=5;

if(git.public_gist_quantity > 10 && git.public_gist_quantity < 20) score +=2;
else if(git.public_gist_quantity > 20 && git.public_gist_quantity < 30) score +=3;
else score +=5;

if(git.repo_quantity > 10 && git.repo_quantity < 20) score +=2;
else if(git.repo_quantity > 20 && git.repo_quantity < 30) score +=3;
else score +=5;

return score;

}

module.exports = {
	getCurrentProfile: async (req, res) => {
		try {
			console.log("user from request:"+req.user.id);

			const profile = await Profile.findOne({
				user: req.user.id,
			}).populate('user', ['name', 'avatar'])
			.populate('github')
			.populate('stackoverflow');

			console.log("profile:"+profile);

			if (!profile) {
				console.log("no profile");

				return res
					.status(400)
					.json({ msg: 'There is no profile for this user' });
			}
			
			res.json(profile);
		} catch (error) {
			console.error(error.message);
			res.status(500).json({
				errors: [{ msg: 'Error Server **getUserProfile**' }],
			});
		}
	},

	createProfile: async (req, res) => {
		const profileFields = {};
		const socialfields = {
			youtube: null,
			twitter: null,
			instagram: null,
			linkedin: null,
			facebook: null
		};
		const stackoverflow = {
			username: null,
			stackoverflow_id: null,
			reputation: 0,
			gold_badges: 0,
			silver_badges: 0,
			bronze_badges: 0,
		};
		const github = {
			username: null,
			user_id: null,
			followers: 0,
			following: 0,
			repo_quantity: 0,
			public_gist_quantity: 0,
		};
		const {
			company,
			location,
			website,
			bio,
			skills,
			status,
        } = req.body;

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		profileFields.company = company || null;
		profileFields.location = location || null;
		profileFields.website = website && website !== '' ? normalize(website, { forceHttps: true }) : ''
		profileFields.bio = bio || null;
		profileFields.skills = Array.isArray(skills) ? skills : skills.split(',').map(skill => ' ' + skill.trim())
		profileFields.status = status || null;
		profileFields.gist_public_codes = req.body.github.public_gist_quantity || null;

		if(req.body.social){
			socialfields.youtube = req.body.social.youtube || null;
			socialfields.twitter = req.body.social.twitter || null;
			socialfields.instagram = req.body.social.instagram || null;
			socialfields.linkedin = req.body.social.linkedin || null;
			socialfields.facebook = req.body.social.facebook || null;
		}
		profileFields.social = socialfields;

		if(req.body.github && req.body.github.username){
			github.username = req.body.github.username;
			github.user_id = req.body.github.userId || null;
			github.followers = req.body.github.followers || 0;
			github.following = req.body.github.following || 0;
			github.repo_quantity = req.body.github.repo_quantity || 0;
			github.public_gist_quantity = req.body.github.public_gist_quantity || 0;
		}

		if(req.body.stackoverflow && req.body.stackoverflow.username){
			stackoverflow.username = req.body.stackoverflow.username;
			stackoverflow.stackoverflow_id = req.body.stackoverflow.stackoverflow_id || null;
			stackoverflow.reputation = req.body.stackoverflow.reputation || 0;
			stackoverflow.gold_badges = req.body.stackoverflow.gold_badges || 0;
			stackoverflow.silver_badges = req.body.stackoverflow.silver_badges || 0;
			stackoverflow.bronze_badges = req.body.stackoverflow.bronze_badges || 0;
		}

		profileFields.experience = [];
		let exp = req.body.experience;
		if(exp && exp.length){
			for(let i = 0; i< exp.length; i++){
				profileFields.experience.push({
					title: exp[i].title,
					company: exp[i].company,
					location: exp[i].location,
					from: exp[i].from,
					to: exp[i].to,
					current: exp[i].current,
					description: exp[i].description
				})
			}
		}

		profileFields.education = [];
		let edu = req.body.education;
		if(edu && edu.length){
			for(let i = 0; i< edu.length; i++){
				profileFields.education.push({
					school: edu[i].school,
					degree: edu[i].degree,
					fieldofstudy: edu[i].fieldofstudy,
					from: edu[i].from,
					to: edu[i].to,
					current: edu[i].current,
					description: edu[i].description,
				})
			}
		}

		profileFields.updated_at = new Date();
		profileFields.created_at = new Date();
		profileFields.views = 0;
		profileFields.score = 0;

		let git;
		if(github.username){
			git = await Github.findOneAndUpdate(
			   { username: req.body.github.username },
			   { $set: github},
			   { new: true, upsert: true }
		   );
		   profileFields.github= git._id;
		}
		else{
			git = new Github(github);
			git.save();
			profileFields.github = git._id;
		}

		let stack;
		if(stackoverflow.username){
			stack = await Stackoverflow.findOneAndUpdate(
				{ username: req.body.stackoverflow.username },
				{ $set: stackoverflow},
				{ new: true, upsert: true }
			);
			profileFields.stackoverflow = stack._id;
		}
		else{
			stack = new Stackoverflow(stackoverflow);
			stack.save();
			profileFields.stackoverflow = stack._id;
		}

		if(git && stack) profileFields.score = generateScore(stack, git);

		for (const [key, value] of Object.entries(socialfields)) {
			if (value && value.length > 0)
				socialfields[key] = normalize(value, { forceHttps: true });
		}

		try {
				await Profile.findOneAndUpdate(
				{ user: req.user.id},
				{ $set: profileFields },
				{ new: true, upsert: true }
			);
			res.status(200).send({});
		} catch (error) {
			console.error(error.message);
			res.status(500).json({
				errors: [{ msg: 'Error Server **createProfile**' }],
			});
		}
	},

	updateProfile: async (req, res) => {
		const profile = await Profile.find({ user: req.user.id}).exec();
		const social = {social: profile[0].social};
		const stackId = profile[0].stackoverflow;
		const gitId = profile[0].github;
		const stackoverflow = await Stackoverflow.find({ _id: stackId}).exec();
		const github = await Github.find({ _id: gitId}).exec();
		let data = req.body;

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		if(stackoverflow && data.stackoverflow){
			Object.assign(stackoverflow[0], data.stackoverflow);
			await Stackoverflow.findOneAndUpdate({ _id: stackId }, {$set: stackoverflow[0]}, { new: true, upsert: true });
			delete data.stackoverflow;
		}
		if(github && data.github){
			Object.assign(github[0], data.github);
			await Github.findOneAndUpdate({ _id: gitId }, {$set: github[0]}, { new: true, upsert: true });
			delete data.github;
		}
		if(data.social){
			Object.assign(social.social, data.social);
			await Profile.findOneAndUpdate({ user: req.user.id }, {$set: social}, { new: true, upsert: true });
			delete data.social;
		}

		try {
			if(data){
				const profile = await Profile.findOneAndUpdate({ user: req.user.id }, {$set: data}, { new: true, upsert: true });
				res.status(200).json(profile);
			}
		} catch (error) {
			console.error(error.message);
			return res.status(500).json({
				errors: [{ msg: 'Error Server **updateProfile**' }],
			});
		}
	},

	deleteProfile: async (req, res) => {
		try {
			// Remove profile
			await Profile.findOneAndRemove({ user: req.user.id });
			// Remove user
			await User.findOneAndRemove({ _id: req.user.id });

			res.status(200).json({ msg: 'User deleted' });
		} catch (error) {
			console.error(error.message);
			res.status(500).json({
				errors: [{ msg: 'Error Server **deleteProfile**' }],
			});
		}
	},

	getAllProfiles: async (req, res) => {
		try {
			const profiles = await Profile.find()
			.populate('user', [
				'name',
				'avatar',
			])
			.populate('github')
			.populate('stackoverflow');
			res.status(200).json(profiles);
		} catch (err) {
			console.error(error.message);
			res.status(500).json({
				errors: [{ msg: 'Error Server **getAllProfile**' }],
			});
		}
	},

	getProfileByUserId: async (req, res) => {
		const user_id = req.params.user_id;
		try {
			const profile = await Profile.findOne({
				user: user_id,
			}).populate('user', ['name', 'avatar'])
				.populate('github')
				.populate('stackoverflow');

			if (!profile)
				return res.status(400).json({ msg: 'Profile not found' });
			else{
				profile.views++;
				profile.updated_at = new Date();
				await Profile.findOneAndUpdate(
					{ user: user_id },
					{ $set: profile },
					{ new: true, upsert: true })
			}
			return res.status(200).json(profile);
		} catch (error) {
			console.error(error.message);
			if (error.kind == 'ObjectId') {
				return res.status(400).json({ msg: 'Profile not found' });
			}
			res.status(500).json({
				errors: [{ msg: 'Error Server **getProfileByUserId**' }],
			});
		}
	},

	addProfileExperience: async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const {
			title,
			company,
			location,
			from,
			to,
			current,
			description,
		} = req.body;

		const newExp = {
			title,
			company,
			location,
			from,
			to,
			current,
			description,
		};

		try {
			const profile = await Profile.findOne({ user: req.user.id });

			profile.experience.unshift(newExp);

			await profile.save();

			res.status(200).json(profile);
		} catch (error) {
			console.error(error.message);
			return res.status(500).json({
				errors: [{ msg: 'Error Server **addProfileExperience**' }],
			});
		}
	},

	deleteProfileExperience: async (req, res) => {
		try {
			const foundProfile = await Profile.findOne({ user: req.user.id });

			foundProfile.experience = foundProfile.experience.filter(
				exp => exp._id.toString() !== req.params.exp_id
			);

			await foundProfile.save();
			return res.status(200).json(foundProfile);
		} catch (error) {
			console.error(error.message);
			return res.status(500).json({
				errors: [{ msg: 'Error Server **deleteProfileExperience**' }],
			});
		}
	},

	addProfileEducation: async (req, res) => {
		console.log("*********add education req.body:"+JSON.stringify( req.body));
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}


		const {
			school,
			degree,
			fieldofstudy,
			from,
			to,
			current,
			description,
		} = req.body;

		const newEdu = {
			school,
			degree,
			fieldofstudy,
			from,
			to,
			current,
			description,
		};

		try {

			const profile = await Profile.findOne({ user: req.user.id });
			console.log("*********newEdu:"+JSON.stringify( newEdu));
			
			profile.education.unshift(newEdu);

			await profile.save();

			res.json(profile);
		} catch (error) {
			console.error(error.message);
			res.status(500).json({
				errors: [{ msg: 'Error Server **addProfileEducation**' }],
			});
		}
	},

	deleteProfileEducation: async (req, res) => {
		try {
			const foundProfile = await Profile.findOne({ user: req.user.id });
			console.log(req.params.edu_id);
			/*
			foundProfile.education = foundProfile.education.filter(
				edu => edu._id.toString() !== req.params.edu_id
			);*/
			foundProfile.education.splice(req.params.edu_id,1);
			await foundProfile.save();
			return res.status(200).json(foundProfile);
		} catch (error) {
			console.error(error);
			return res.status(500).json({
				errors: [{ msg: 'Error Server **deleteProfileEducation**' }],
			});
		}
	},

	getUserRepos: async (req, res) => {
		try {
			const gitHubResponse = await axios.get(
				`https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${process.env.GITHUB_CLIENT_ID}&client_secret=${process.env.GITHUB_CLIENT_SECRET}`
			);

			return res.status(200).json(gitHubResponse.data);
		} catch (err) {
			console.error(err.message);
			return res.status(404).json({ msg: 'No Github profile found' });
		}
	},
};