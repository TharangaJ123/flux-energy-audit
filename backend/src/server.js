const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const dns = require('dns');

// Set DNS servers to resolve MongoDB SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = require('./config/db');
// const { swaggerUi, specs } = require('./config/swagger');


// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

const userRoutes = require('./modules/user-management/userManagement.route');
const energyAuditRoutes = require('./modules/energy-audit-management/energyAuditManagement.route');
const carbonRoutes = require('./modules/carbon-footprint-tracker/carbonFootprintTracker.route');

// Define Routes
app.use('/api/users', userRoutes);
app.use('/api/energy-audits', energyAuditRoutes);
app.use('/api/carbon', carbonRoutes);

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');



// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
