const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

const userRoutes = require('./modules/user-management/userManagement.route');
const costRoutes = require('./modules/cost-management/costManagement.route');

// Define Routes
app.use('/api/users', userRoutes);
app.use('/api/costs', costRoutes);

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
