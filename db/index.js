const mongoose = require('mongoose');
const dotenv = require('dotenv');
require('dotenv').config();

// Database connection
mongoose.connect(process.env.MONGO_URL);

// User schema and model
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
    bcryptCost: { type: Number, required: true, default: 10 },
    role: { type: String, default: 'Attendee' }
});

// Event schema and model
const EventSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    price: { type: Number, required: true },
    capacity: { type: Number, required: true },
    ticketsSold: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coOrganizers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

// Event participant schema and model
const EventParticipantSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, required: true, enum: ['Attendee', 'attendee'] },
    status: { type: String, required: true, enum: ['Confirmed', 'Cancelled'], default: 'Confirmed' },
    confirmedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null }
});

// Blacklist tokens schema and model
const BlackListTokensSchema = new mongoose.Schema({
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Model exports
const EventParticipant = mongoose.model('EventParticipant', EventParticipantSchema);
const Event = mongoose.model('Event', EventSchema);
const User = mongoose.model('User', UserSchema);
const BlackListTokens = mongoose.model('BlackListTokens', BlackListTokensSchema);

module.exports = {
    User,
    Event,
    EventParticipant,
    BlackListTokens
};
