const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) {
        return res.status(401).json({ msg: 'No token,Not authoriz' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_TOKEN);
        req.user = decoded.user;
        next();
    } catch (error) {
        res.status(401).json({ msg: 'Token invalid' });
    }
};
