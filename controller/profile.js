const Profile = require('../models/Profile');
const User = require('../models/User');
const normalize = require('normalize-url');
const dotenv=require('dotenv').config()
const axios = require('axios');
const { validationResult } = require('express-validator');

module.exports = {
	getCurrentProfile: async (req, res) => {
		try {
			const profile = await Profile.findOne({
				user: req.user.id,
			}).populate('user', ['name', 'avatar']);

			if (!profile) {
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
			githubusername,
            stackoverflowusername,
			youtube,
			twitter,
			instagram,
			linkedin,
			facebook,
        } = req.body;

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
			githubusername,
            stackoverflowusername,
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

		try {
			let profile = await Profile.findOneAndUpdate(
				{ user: req.user.id },
				{ $set: profileFields },
				{ new: true, upsert: true }
			);
			res.status(200).json(profile);
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
			const profiles = await Profile.find().populate('user', [
				'name',
				'avatar',
			]);
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
			foundProfile.education = foundProfile.education.filter(
				edu => edu._id.toString() !== req.params.edu_id
			);
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