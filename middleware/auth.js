const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.header('auth-token');
    console.log("token is : "+token);
    if (!token) {
        console.log("no token...401");
        return res.status(401).json({ msg: 'No token,Not authoriz' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_TOKEN);
        req.user = decoded;
        console.log("request user is  : "+JSON.stringify(req.user));

        next();
    } catch (error) {
        console.log("token invalid");
        res.status(401).json({ msg: 'Token invalid' });
    }
};
