const roles = require('../roles/roles');

// Middleware: Permission validation
function permissionMiddleware(permission) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const userPermissions = roles[req.user.role]?.permissions || [];
        
        if (userPermissions.includes(permission)) {
            return next();
        } else {
            return res.status(403).json({ error: 'You do not have permission to perform this action' });
        }
    };
}


module.exports = permissionMiddleware;