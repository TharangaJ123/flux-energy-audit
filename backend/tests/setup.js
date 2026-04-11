const mongoose = require('mongoose');
require('dotenv').config();

// Start connection to existing database before tests
beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        if (process.env.MONGO_URI) {
            try {
                // Set a short timeout for tests so we don't hang if DB is unreachable
                await mongoose.connect(process.env.MONGO_URI, {
                    serverSelectionTimeoutMS: 2000 
                });
            } catch (error) {
                console.warn("Could not connect to MongoDB. Some integration tests may fail.");
            }
        } else {
            console.error("MONGO_URI is not defined in .env");
        }
    }
});

// Close connection after tests
afterAll(async () => {
    await mongoose.connection.close();
});
