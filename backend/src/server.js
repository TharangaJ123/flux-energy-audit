// Process entrypoint that loads configuration, connects to MongoDB, and starts the HTTP server.
const dotenv = require('dotenv');
const dns = require('dns');

// Set DNS servers to resolve MongoDB SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = require('./config/db');
const createApp = require('./app');

// Load env vars
dotenv.config();

const app = createApp();

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    // Only connect and listen during normal startup; test suites import the app directly.
    connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
