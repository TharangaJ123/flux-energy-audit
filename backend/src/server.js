const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const dns = require('dns');

// Set DNS servers to resolve MongoDB SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = require('./config/db');
const { swaggerUi, specs } = require('./config/swagger');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Define Routes
app.get('/', (req, res) => {
  res.send('Flux Energy Audit API is running...');
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
