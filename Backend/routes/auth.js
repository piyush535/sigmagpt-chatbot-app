import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Thread from "../models/Thread.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "sigmagpt_jwt_super_secret_key_2025_safe_token";

const formatUserPayload = (user) => {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username || (user.email ? user.email.split("@")[0] : ""),
        avatar: user.avatar || ""
    };
};

/**
 * Register a new user
 * POST /api/auth/register
 */
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, username } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: "Name is required" });
        }

        if (!email || !email.trim()) {
            return res.status(400).json({ error: "Email is required" });
        }

        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters long" });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(400).json({ error: "An account with this email already exists" });
        }

        const defaultUsername = username && username.trim() 
            ? username.trim().replace(/^@/, "") 
            : email.toLowerCase().trim().split("@")[0];

        const user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            username: defaultUsername
        });

        await user.save();

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: formatUserPayload(user)
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Failed to register user" });
    }
});

/**
 * Log in an existing user
 * POST /api/auth/login
 */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: formatUserPayload(user)
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Failed to log in" });
    }
});

/**
 * Log out user
 * POST /api/auth/logout
 */
router.post("/logout", (req, res) => {
    // JWT is stateless; client removes stored token
    res.status(200).json({ message: "Logged out successfully" });
});

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
router.get("/me", requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({
            user: formatUserPayload(user)
        });
    } catch (error) {
        console.error("Fetch me error:", error);
        res.status(500).json({ error: "Failed to fetch user profile" });
    }
});

/**
 * Update user profile
 * PUT /api/auth/profile
 */
router.put("/profile", requireAuth, async (req, res) => {
    try {
        const { name, username, avatar } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: "Display name is required" });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.name = name.trim();
        if (username !== undefined) {
            user.username = username.trim().replace(/^@/, "");
        }
        if (avatar !== undefined) {
            user.avatar = avatar;
        }
        user.updatedAt = new Date();

        await user.save();

        res.status(200).json({
            message: "Profile updated successfully",
            user: formatUserPayload(user)
        });
    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

/**
 * Delete account and all user data
 * DELETE /api/auth/account
 */
router.delete("/account", requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Cascade delete all threads created by this user
        await Thread.deleteMany({ userId });

        // Delete user account
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error("Delete account error:", error);
        res.status(500).json({ error: "Failed to delete account" });
    }
});

export default router;
