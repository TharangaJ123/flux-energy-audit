// Process entrypoint that loads configuration, connects to MongoDB, and starts the HTTP server.
const dotenv = require('dotenv');
const dns = require('dns');

// Set DNS servers to resolve MongoDB SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = require('./config/db');
const createApp = require('./app');

// Load env vars
dotenv.config();

// Connect to database
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

const userRoutes = require('./routes/userManagement.route');
const energyAuditRoutes = require('./routes/energyAuditManagement.route');
const costRoutes = require('./routes/costManagement.route');
const carbonRoutes = require('./routes/carbonFootprintTracker.route');
const applianceRoutes = require('./routes/appliancemanagement.route');
const solarRoutes = require('./routes/solarEstimator.route');

// Define Routes
app.use('/api/users', userRoutes);
app.use('/api/energy-audits', energyAuditRoutes);
app.use('/api/costs', costRoutes);
app.use('/api/appliances', applianceRoutes);
app.use('/api/carbon', carbonRoutes);
app.use('/api/solar', solarRoutes);

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
