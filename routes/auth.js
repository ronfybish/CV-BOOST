const router = require('express').Router();



const { loadUser, signUp, login } = require('../controller/auth');
router.post('/signup', signUp);
router.post('/login', login);
router.get('/loaduser', loadUser);
module.exports = router;
