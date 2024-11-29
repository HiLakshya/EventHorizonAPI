const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { User, Event, EventParticipant, BlackListTokens } = require('../db/index');
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
            { expiresIn: TOKEN_EXPIRY_TIME_IN_MINUTES }
        );

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route: Browse events
router.get('/browse_events', authMiddleware,blacklistMiddleware, permissionMiddleware('browse_events'), async (req, res) => {
    try {
        const events = await Event.find({}, { name: 1, price: 1, date: 1 });
        res.status(200).json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route: Purchase tickets for an event
router.post('/purchase_tickets', authMiddleware,blacklistMiddleware, permissionMiddleware('purchase_tickets'), async (req, res) => {
    const eventId = req.headers.eventid;

    if (!eventId) {
        return res.status(400).json({ error: 'Event ID is required' });
    }

    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (event.ticketsSold >= event.capacity) {
            return res.status(400).json({ error: 'Event is sold out' });
        }

        const existingParticipant = await EventParticipant.findOne({
            eventId,
            userId: req.user.id,
            status: 'Confirmed',
        });

        if (existingParticipant) {
            return res.status(400).json({ error: 'You are already registered for this event' });
        }

        const participant = new EventParticipant({
            eventId,
            userId: req.user.id,
            role: 'Attendee',
            confirmedAt: new Date(),
        });
        await participant.save();

        event.ticketsSold += 1;
        await event.save();

        res.status(200).json({ message: 'Ticket purchased successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route: Cancel ticket for an event
router.post('/cancel_ticket', authMiddleware,blacklistMiddleware, permissionMiddleware('cancel_ticket'), async (req, res) => {
    const eventId = req.headers.eventid;

    if (!eventId) {
        return res.status(400).json({ error: 'Event ID is required' });
    }

    try {
        const participant = await EventParticipant.findOne({
            eventId,
            userId: req.user.id,
        });

        if (!participant || participant.status === 'Cancelled') {
            return res.status(400).json({ error: 'You have not registered or already cancelled your ticket' });
        }

        participant.status = 'Cancelled';
        participant.cancelledAt = new Date();
        await participant.save();

        const event = await Event.findById(eventId);
        event.ticketsSold -= 1;
        await event.save();

        res.status(200).json({ message: 'Ticket cancelled successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route: View my tickets
router.get('/view_my_tickets', blacklistMiddleware, authMiddleware, permissionMiddleware('view_my_tickets'), async (req, res) => {
    try {
        const events = await EventParticipant.find({ userId: req.user.id, status: 'Confirmed' })
            .populate('eventId', 'name date price')
            .select('-_id eventId');

        res.status(200).json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route: User logout
router.post('/signout', authMiddleware, async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        await BlackListTokens.create({ token });

        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
