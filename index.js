// Express server setup
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Route imports
const guestRouter = require("./routes/guest");
const attendeeRouter = require("./routes/attendee");
const organizerRouter = require("./routes/organizer");
const coorganizerRouter = require("./routes/coorganizer");

const dotenv = require('dotenv');
const { set } = require('mongoose');
require('dotenv').config();

const PORT = 3000 || process.env.PORT;
const blacklistWipeIntervalMinutes = process.env.BLACKLIST_WIPE_INTERVAL_MINUTES || 60;

// Middleware: Parse request bodies as JSON
app.use(bodyParser.json());

// Route registration
app.use("/guest", guestRouter);
app.use("/attendee", attendeeRouter);
app.use("/organizer", organizerRouter);
app.use("/coorganizer", coorganizerRouter);

//serve ReadMe.md
app.get('/', (req
    , res) => {
    res.sendFile(__dirname + '/ReadMe.md');
});

// Scheduled task: Clear expired blacklisted tokens
setInterval(async () => {
    const { BlackListTokens } = require('./db/index');
    const cutoffTime = new Date(Date.now() - blacklistWipeIntervalMinutes * 60 * 1000);

    await BlackListTokens.deleteMany({ createdAt: { $lt: cutoffTime } });

    console.log(`Blacklisted tokens older than ${blacklistWipeIntervalMinutes} minute(s) have been deleted.`);
}, blacklistWipeIntervalMinutes * 60 * 1000);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
