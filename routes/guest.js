const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { User, Event } = require('../db/index');
const z = require('zod');

// Define input validation schemas
const usernameSchema = z.string().min(5).max(30);
const passwordSchema = z.string().min(5).max(100);

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const BCRYPT_COST = parseInt(process.env.BCRYPT_COST) || 10;

// Route: User signup
router.post('/signup', async (req, res) => {
    const { username, password } = req.headers;

    // Validate input
    if (!usernameSchema.safeParse(username).success || !passwordSchema.safeParse(password).success) {
        return res.status(400).json({ error: 'Invalid username or password format' });
    }

    try {
        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Generate password hash
        const salt = await bcrypt.genSalt(BCRYPT_COST);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create new user with default role
        const newUser = new User({
            username,
            passwordHash,
            salt,
            bcryptCost: BCRYPT_COST,
            role: 'Attendee', // Default role
        });
        await newUser.save();

        res.status(201).json({ message: 'User created successfully with role "Attendee"' });
    } catch (error) {
        console.error('Error during user signup:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Route: Browse events
router.get('/browse_events', async (req, res) => {
    try {
        // Retrieve event details (name, price, date only)
        const events = await Event.find({}, { name: 1, price: 1, date: 1 });
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
