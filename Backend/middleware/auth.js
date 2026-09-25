import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "sigmagpt_jwt_super_secret_key_2025_safe_token";

/**
 * Strict authentication middleware.
 * Halts request with 401 if valid Bearer token is not present.
 */
export const requireAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized: Access token required" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = {
            userId: decoded.userId,
            email: decoded.email
        };

        next();
    } catch (error) {
        console.error("Auth middleware error:", error.message);
        return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }
};

/**
 * Optional authentication middleware.
 * Allows guest access (req.user = null) while attaching verified user identity if token is present.
 */
export const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = {
                userId: decoded.userId,
                email: decoded.email
            };
        } else {
            req.user = null;
        }
    } catch {
        // If token is invalid or expired in optionalAuth, treat as guest
        req.user = null;
    }
    next();
};
