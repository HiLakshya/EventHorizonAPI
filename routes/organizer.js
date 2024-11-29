const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { User, Event } = require('../db/index');
const roles = require('../roles/roles');
const jwt = require('jsonwebtoken');
const z = require('zod');

// Importing Middleware
const authMiddleware = require('../middleware/user');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const blacklistMiddleware = require('../middleware/blacklistMiddleware');

// Define schemas for input validation
const usernameSchema = z.string().min(5).max(30);
const passwordSchema = z.string().min(5).max(100);

// JWT Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

const timeForTokenExpiry = process.env.TOKEN_EXPIRY_TIME_IN_MINUTES + 'm' || '100m';

// Login route
router.post('/signin', async (req, res) => {
    const { username, password } = req.headers;

    // Input validation
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        // Find user in the database
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Compare the provided password with the stored hash
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user._id,
                username: user.username,
                role: user.role,
            },
            JWT_SECRET,
            { expiresIn: timeForTokenExpiry } // Token expires in 30h
        );

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create event route
router.post('/create_event', authMiddleware,blacklistMiddleware, permissionMiddleware('create_event'), async (req, res) => {
    const {
        name,
        description,
        date,
        price,
        capacity
    } = req.body;

    // Define input validation schema
    const eventSchema = z.object({
        name: z.string().min(5, { message: "Name must be at least 5 characters long." }).max(100),
        description: z.string().max(500).optional(),
        date: z.preprocess(
            (input) => (typeof input === 'string' ? new Date(input) : input),
            z.date({ required_error: "Date is required and must be valid." })
        ),
        price: z.preprocess(
            (input) => parseFloat(input),
            z.number().min(0, { message: "Price must be a positive number." })
        ),
        capacity: z.preprocess(
            (input) => parseInt(input, 10),
            z.number().min(1, { message: "Capacity must be at least 1." })
        ),
    });

    // Validate input
    try {
        const validatedData = eventSchema.parse({ name, description, date, price, capacity });

        // Create event in database
        const event = new Event({
            ...validatedData,
            createdBy: req.user.id, // Authenticated user's ID
        });

        await event.save();

        res.status(201).json({ message: 'Event created successfully', event });
    } catch (error) {
        console.error('Validation error:', error);
        return res.status(400).json({ error: error.errors }); // Return validation errors
    }
});

// Browse events route
router.get('/browse_events', authMiddleware,blacklistMiddleware, permissionMiddleware('browse_events'), async (req, res) => {
    try {
        const events = await Event.find();
        res.status(200).json({ events });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete event route
router.delete('/cancel_event/:id',blacklistMiddleware,authMiddleware, permissionMiddleware('cancel_event'), async (req, res) => {
    const { id } = req.params;

    try {
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        await event.remove();
        res.status(200).json({ message: 'Event cancelled successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Assign co-organizer route by organizer for event created by them
router.post('/assign_coorganizer', blacklistMiddleware,authMiddleware, permissionMiddleware('assign_coorganizer'), async (req, res) => {
    const { eventid, coorganizerid } = req.headers; // Extracting from headers

    // Define input validation schema
    const assignCoorganizerSchema = z.object({
        eventid: z.string(),
        coorganizerid: z.string(),
    });

    try {
        // Validate input
        const validatedData = assignCoorganizerSchema.parse({ eventid, coorganizerid });

        // Find the event
        const event = await Event.findById(validatedData.eventid);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Check if the authenticated user is either the creator or an existing co-organizer
        const isAuthorized =
            event.createdBy.toString() === req.user.id ||
            event.coOrganizers.some((coOrganizer) => coOrganizer.toString() === req.user.id);

        if (!isAuthorized) {
            return res.status(403).json({ error: 'You are not authorized to assign co-organizers for this event' });
        }

        // Find the new co-organizer
        const coOrganizer = await User.findById(validatedData.coorganizerid);
        if (!coOrganizer) {
            return res.status(404).json({ error: 'Co-organizer not found' });
        }

        // Check if the user is already a co-organizer
        if (event.coOrganizers.includes(coOrganizer._id)) {
            return res.status(400).json({ error: 'User is already a co-organizer for this event' });
        }

        // Assign the user as a co-organizer
        event.coOrganizers.push(coOrganizer._id);

        // Update the user's role to 'co-organizer'
        coOrganizer.role = 'co-organizer';
        await coOrganizer.save();

        // Save the event with the updated co-organizers
        await event.save();

        res.status(200).json({ message: 'Co-organizer assigned successfully and role updated' });
    } catch (error) {
        console.error('Validation error:', error);
        return res.status(400).json({ error: error.errors }); // Return validation errors
    }
});

// Remove co-organizer route
router.delete('/remove_coorganizer', authMiddleware,blacklistMiddleware, permissionMiddleware('remove_coorganizer'), async (req, res) => {
    const { eventid, coorganizerid } = req.headers;

    // Define input validation schema
    const removeCoorganizerSchema = z.object({
        eventid: z.string(),
        coorganizerid: z.string(),
    });

    try {
        // Validate input
        const validatedData = removeCoorganizerSchema.parse({ eventid, coorganizerid });

        // Find the event
        const event = await Event.findById(validatedData.eventid);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Check if the authenticated user is either the creator or an existing co-organizer
        const isAuthorized =
            event.createdBy.toString() === req.user.id ||
            event.coOrganizers.some((coOrganizer) => coOrganizer.toString() === req.user.id);

        if (!isAuthorized) {
            return res.status(403).json({ error: 'You are not authorized to remove co-organizers for this event' });
        }

        // Find the co-organizer
        const coOrganizer = await User.findById(validatedData.coorganizerid);
        if (!coOrganizer) {
            return res.status(404).json({ error: 'Co-organizer not found' });
        }

        // Check if the user is a co-organizer
        if (!event.coOrganizers.includes(coOrganizer._id)) {
            return res.status(400).json({ error: 'User is not a co-organizer for this event' });
        }

        // Remove the user from the co-organizers
        event.coOrganizers = event.coOrganizers.filter((id) => id.toString() !== coOrganizer._id.toString());

        // Update the user's role to 'organizer'
        coOrganizer.role = 'attendee';
        await coOrganizer.save();

        // Save the event with the updated co-organizers
        await event.save();

        res.status(200).json({ message: 'Co-organizer removed successfully and role updated' });
    } catch (error) {
        console.error('Validation error:', error);
        return res.status(400).json({ error: error.errors }); // Return validation errors
    }
});

// Get Sales route
router.get('/view_sales', authMiddleware,blacklistMiddleware, permissionMiddleware('view_sales'), async (req, res) => {
    try {
        const events = await Event.find({ createdBy: req.user.id });
        const sales = events.map((event) => ({
            event: event.name,
            ticketsSold: event.ticketsSold,
            revenue: event.ticketsSold * event.price,
        }));

        res.status(200).json({ sales });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete Event and Change all the co-organizers to attendees
router.delete('/delete_event/:id', authMiddleware,blacklistMiddleware, permissionMiddleware('delete_event'), async (req, res) => {
    const { id } = req.params;

    try {
        // Find the event to be deleted
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Update the role of all co-organizers to 'attendee'
        const coOrganizers = await User.find({ _id: { $in: event.coOrganizers } });
        
        // Map over the co-organizers and update their roles
        await Promise.all(
            coOrganizers.map(async (coOrganizer) => {
                coOrganizer.role = 'attendee';
                await coOrganizer.save();
            })
        );

        // Use deleteOne instead of remove
        await Event.deleteOne({ _id: id });

        res.status(200).json({ message: 'Event deleted successfully and co-organizers updated to attendee role' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Signout route
router.post('/signout', authMiddleware, async (req, res) => {
    try {
        // Add the token to the blacklist
        const token = req.headers.authorization.split(' ')[1];
        await BlackListTokens.create({ token });

        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

