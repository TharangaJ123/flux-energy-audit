const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const userRoutes = require('./routes/userManagement.route');
const energyAuditRoutes = require('./routes/energyAuditManagement.route');
const costRoutes = require('./routes/costManagement.route');
const carbonRoutes = require('./routes/carbonFootprintTracker.route');
const applianceRoutes = require('./routes/appliancemanagement.route');
const swaggerSpec = require('./config/swagger');

const createApp = () => {
    const app = express();

    app.use(express.json());
    app.use(cors());

    app.use('/api/users', userRoutes);
    app.use('/api/energy-audits', energyAuditRoutes);
    app.use('/api/costs', costRoutes);
    app.use('/api/appliances', applianceRoutes);
    app.use('/api/carbon', carbonRoutes);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    return app;
};

module.exports = createApp;
