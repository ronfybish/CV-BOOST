const router = require('express').Router();
const auth = require('../middleware/auth');
const { check } = require('express-validator');

const profileValidator = [
	check('status', 'Status is required').not().isEmpty(),
	check('skills', 'Skills is required').not().isEmpty(),
];
const experienceValidator = [
	check('title', 'Title is required').not().isEmpty(),
	check('company', 'Company is required').not().isEmpty(),
	check('from', 'From date is required and needs to be from the past')
		.not()
		.isEmpty(),
];
const educationValidator = [
	check('school', 'School is required').not().isEmpty(),
	check('degree', 'Degree is required').not().isEmpty(),
	check('fieldofstudy', 'Field of study is required').not().isEmpty(),
	check('from', 'From date is required and needs to be from the past')
		.not()
		.isEmpty(),
];

const {
	getCurrentProfile,
	createOrUpdateProfile,
	getAllProfiles,
	getProfileByUserId,
	deleteProfile,
	addProfileExperience,
	deleteProfileExperience,
	addProfileEducation,
	deleteProfileEducation,
	getUserRepos,
} = require('../controller/profile');

router.get('/me', auth, getCurrentProfile);
router.get('/', getAllProfiles);
router.get('/user/:user_id', getProfileByUserId);
router.get('/github/:username', getUserRepos);
router.delete('/', auth, deleteProfile);
router.post('/', [auth, profileValidator], createOrUpdateProfile);
router.put('/experience', [auth, experienceValidator], addProfileExperience);
router.put('/education', [auth, educationValidator], addProfileEducation);
router.delete('/experience/:exp_id', auth, deleteProfileExperience);
router.delete('/education/:edu_id', auth, deleteProfileEducation);

module.exports = router;
