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

	createOrUpdateProfile: async (req, res) => {
		const profile = await Profile.find({ user: req.user.id}).exec();
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		const {
			company,
			location,
			website,
			bio,
			skills,
			status,
			youtube,
			twitter,
			instagram,
			linkedin,
			facebook
        } = req.body;

		console.log("***************req**************");
		str = JSON.stringify(req.body);
		console.log(str)
        let git = await Github.findOneAndUpdate(
            { username: req.body.github.githubUsername },
            { $set: 
                {
					user_id: req.body.github.userId,
                    username: req.body.github.username, 
                    followers: req.body.github.followers, 
					following: req.body.github.following, 
                    repo_quantity: req.body.github.repo_quantity,
					public_gist_quantity: req.body.github.public_gist_quantity
                } 
            },
            { new: true, upsert: true }
        );

		console.log("***************git**************");
		str = JSON.stringify(git);
		console.log(str)

		if(req.body.stackoverflow != undefined)
		{
        let stack = await Stackoverflow.findOneAndUpdate(
            { username: req.body.stackoverflow.stackoverflowUsername },
            { $set: 
                {  
					username: req.body.stackoverflow.stackoverflowUsername, 
                    stackoverflow_id: req.body.stackoverflow.stackoverflowId, 
                    reputation: req.body.stackoverflow.reputation,
                    gold_badges: req.body.stackoverflow.goldBadges,
                    silver_badges: req.body.stackoverflow.silverBadges,
                    bronze_badges: req.body.stackoverflow.bronzeBadges
                } 
            },
            { new: true, upsert: true }
        );
		}

		const profileFields = {
			user: req.user.id,
			company,
			location,
			website:
				website && website !== ''
					? normalize(website, { forceHttps: true })
					: '',
			bio,
			skills: Array.isArray(skills)
				? skills
				: skills.split(',').map(skill => ' ' + skill.trim()),
			status,
		};

		// Build social object and add to profileFields
		const socialfields = {
			youtube,
			twitter,
			instagram,
			linkedin,
			facebook,
		};

		for (const [key, value] of Object.entries(socialfields)) {
			if (value && value.length > 0)
				socialfields[key] = normalize(value, { forceHttps: true });
		}
		profileFields.social = socialfields;
		if(typeof git !== 'undefined' && git)
        	profileFields.github= git._id;
		if(typeof stack !== 'undefined' && stack)
        	profileFields.stackoverflow = stack._id;
        profileFields.gist_public_codes = req.body.github.public_gist_quantity;
		if(!profile.length) {
			profileFields.created_at = new Date();
			profileFields.views = 0;
		}
		if(profile.length) {
			profileFields.views = profile[0].views;
		}
		profileFields.updated_at = new Date();
		if((typeof git !== 'undefined' && git)  &&(typeof stack !== 'undefined' && stack))
			profileFields.score = generateScore(stack, git);

		try {
				console.log("final profile to update:" +console.log(JSON.stringify(profile, null, 4)));
				await Profile.findOneAndUpdate(
				{ user: req.user.id },
				{ $set: profileFields },
				{ new: true, upsert: true }
			);
			res.status(200).send({});
		} catch (error) {
			console.error(error.message);
			res.status(500).json({
				errors: [{ msg: 'Error Server **createOrUpdateProfile**' }],
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
			}).populate('user', ['name', 'avatar']);

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