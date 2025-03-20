const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
    try {
        // Check if it's an API request or web UI request
        const isApiRequest = req.originalUrl.startsWith('/api/');

        // Get token from header, cookie, or query param
        let token;
        const authHeader = req.header('Authorization');
        const authCookie = getCookieValue(req.headers.cookie, 'token');

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.replace('Bearer ', '');
        } else if (authCookie) {
            token = authCookie;
        }

        if (!token) {
            console.log('No authentication token found');

            // For web UI requests, redirect to login page
            if (!isApiRequest) {
                return res.redirect('/login');
            }

            // For API requests, return 401 JSON
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided'
            });
        }

        // Verify token
        jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key', (err, decodedUser) => {
            if (err) {
                console.log('Invalid token:', err.message);

                // For web UI requests, redirect to login page
                if (!isApiRequest) {
                    return res.redirect('/login');
                }

                // For API requests, return 401 JSON
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token: ' + err.message
                });
            }

            req.user = decodedUser;
            next();
        });
    } catch (err) {
        console.error('Auth middleware error:', err);

        // For web UI requests, redirect to login page
        if (!req.originalUrl.startsWith('/api/')) {
            return res.redirect('/login');
        }

        // For API requests, return 500 JSON
        return res.status(500).json({
            success: false,
            message: 'Server error in authentication'
        });
    }
};

// Helper function to extract cookie value
function getCookieValue(cookieString, cookieName) {
    if (!cookieString) return null;

    const match = cookieString.match(new RegExp(`${cookieName}=([^;]+)`));
    return match ? match[1] : null;
}

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        if (!roles.includes(req.user.role)) {
            console.log(`Authorization failed: User role is ${req.user.role}, required roles are ${roles.join(', ')}`);
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this resource'
            });
        }
        next();
    };
};
