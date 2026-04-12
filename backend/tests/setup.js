/**
 * @file setup.js
 * @description Global Jest setup/teardown hooks shared by all test suites.
 * Establishes a single MongoDB connection before any test runs and closes it
 * after the full suite completes. 
 */
const mongoose = require('mongoose');
require('dotenv').config();

// Increase global Jest timeout for long-running hooks/tests (e.g. Atlas connections)
jest.setTimeout(30000);

// Open a MongoDB connection once before any test file begins executing.
beforeAll(async () => {
    // Check if we are already connected or connecting
    if (mongoose.connection.readyState === 0) {
        if (process.env.MONGO_URI) {
            try {
                // console.log("Connecting to MongoDB for tests...");
                await mongoose.connect(process.env.MONGO_URI, {
                    serverSelectionTimeoutMS: 5000 // Give it 5s for server selection
                });
                // console.log("Connected to MongoDB.");
            } catch (error) {
                console.warn("Could not connect to MongoDB. Some integration tests may fail.", error.message);
            }
        } else {
            console.error("MONGO_URI is not defined in .env");
        }
    }
});

// Close connection after tests
afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        // console.log("Closed MongoDB connection.");
    }
});

