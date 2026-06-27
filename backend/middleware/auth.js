const jwt = require("jsonwebtoken");
require('dotenv').config();


function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader && authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (e) {
        return res.status(403).json({ error: "Forbidden" });
    }
}

function authorizeRole(requiredRoleId) {
    return (req, res, next) => {
        if (!req.user || req.user.role_id !== requiredRoleId) {
            return res.status(403).json({ error: "Forbidden" });
        }
        next();
    }
}

module.exports = {
    authenticateToken,
    authorizeRole
};