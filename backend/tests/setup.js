/**
 * @file setup.js
 * @description Global Jest setup/teardown hooks shared by all test suites.
 * Establishes a single MongoDB connection before any test runs and closes it
 * after the full suite completes. A short `serverSelectionTimeoutMS` (2 s)
 * prevents test runs from hanging when the database is unreachable; the suites
 * that require a live DB will then fail with descriptive messages rather than timing out.
 */
const mongoose = require('mongoose');
require('dotenv').config();

// Open a MongoDB connection once before any test file begins executing.
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
