const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { User, Event, BlackListTokens } = require('../db/index');
const roles = require('../roles/roles');
const jwt = require('jsonwebtoken');
const z = require('zod');

// Middleware imports
const authMiddleware = require('../middleware/user');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const blacklistMiddleware = require('../middleware/blacklistMiddleware');

// Input validation schemas
const usernameSchema = z.string().min(5).max(30);
const passwordSchema = z.string().min(5).max(100);

const JWT_SECRET = process.env.JWT_SECRET;

const timeForTokenExpiry = process.env.TOKEN_EXPIRY_TIME_IN_MINUTES + 'm' || '100m';

// Route: User login
router.post('/signin', async (req, res) => {
    const { username, password } = req.headers;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: timeForTokenExpiry } // Token validity
        );

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route: Browse events
router.get('/browse_events',blacklistMiddleware, authMiddleware, permissionMiddleware('browse_events'), async (req, res) => {
    try {
        const events = await Event.find({}, { name: 1, description: 1, date: 1, price: 1 });
        res.status(200).json({ events });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route: Update event
router.put('/update_event/:eventId',blacklistMiddleware, authMiddleware, permissionMiddleware('update_event'), async (req, res) => {
    const { eventId } = req.params;
    const { name, description, date, price, capacity } = req.body;

    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Update fields if they are provided in the request body
        if (name) event.name = name;
        if (description) event.description = description;
        if (date) event.date = date;
        if (price) event.price = price;
        if (capacity) event.capacity = capacity;

        await event.save();
        res.status(200).json({ message: 'Event updated successfully', event });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route: User logout
router.post('/signout', authMiddleware, async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(400).json({ error: 'Token is required for logout' });
        }

        await BlackListTokens.create({ token });
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
