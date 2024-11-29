const jwt = require('jsonwebtoken');
const { BlackListTokens } = require('../db/index');

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware: Blacklist token check
async function blacklistMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization token is missing or invalid' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const tokenExists = await BlackListTokens.findOne({ token });
        if (tokenExists) {
            return res.status(401).json({ error: 'Token is blacklisted. Please sign-in again.' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token expired or invalid' });
    }
}

module.exports = blacklistMiddleware;