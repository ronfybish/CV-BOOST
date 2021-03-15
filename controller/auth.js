const User = require('../models/User');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const gravatar = require('gravatar');

module.exports = {
    loadUser: async (req, res) => {
        try {
            const user = await User.findById(req.user.id).select('-password');
            res.status(200).json(user);
        } catch (error) {
            console.error(error.message);
            res.status(500).json({
                errors: [{ msg: 'Server Error IN **loadUser**' }],
            });
        }
    },
    login: async (req, res) => {
        const { email, password } = req.body;
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            let user = await User.findOne({ email });

            if (!user) {
                return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(404).json({ errors: [{ msg: 'Invalid Credentials' }] });
            }

            const payload = {
                user: {
                    id: user.id,
                },
            };

            jwt.sign(payload, process.env.JWT_TOKEN, (error, token) => {
                if (error) throw error;
                res.status(200).json({ token });
            });
        } catch (error) {
            console.error(error.message);
            res.status(500).json({
                errors: [{ msg: 'Error Server in **Login**' }],
            });
        }
    },
    signUp: async (req, res) => {
        const { name, email, password } = req.body;
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            let user = await User.findOne({ email });

            if (user) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: 'User exists in the system' }] });
            }

            const avatar = gravatar.url(email, {
                s: '200',
                r: 'pg',
                d: 'mm',
            });

            user = new User({
                name,
                email,
                avatar,
                password,
            });

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            await user.save();

            const payload = {
                user: {
                    id: user.id,
                },
            };

            jwt.sign(payload, process.env.JWT_TOKEN, (error, token) => {
                if (error) throw error;
                res.status(200).json({ token });
            });
        } catch (error) {
            console.error(error.message);
            res.status(500).json({
                errors: [{ msg: 'Error Server in **SignUp**' }],
            });
        }
    },
};
