const router = require('express').Router();
const auth = require('../middleware/auth');
const { check } = require('express-validator');
const { loadUser, signUp, login } = require('../controller/auth');


const signUpValidator = [
	check('name', 'Name is Required').not().isEmpty(),
	check('email', 'Please Setup valid email').isEmail(),
	check(
		'password',
		'password with 6 or more characters'
	).isLength({ min: 6 }),
];
const logInValidator = [
	check('email', 'Put avalid email').isEmail(),
	check('password', 'Password is required').exists(),
];


router.post('/signup',signUpValidator, signUp);
router.post('/login',logInValidator, login);
router.get('/loaduser',auth, loadUser);
module.exports = router;
