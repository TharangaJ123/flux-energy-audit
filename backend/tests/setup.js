const mongoose = require('mongoose');
require('dotenv').config();

// Start connection to existing database before tests
beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        if (process.env.MONGO_URI) {
            await mongoose.connect(process.env.MONGO_URI);
        } else {
            console.error("MONGO_URI is not defined in .env");
        }
    }
});

// Close connection after tests
afterAll(async () => {
    await mongoose.connection.close();
});
