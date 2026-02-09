const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Flux Energy Audit API',
      version: '1.0.0',
      description: 'API documentation for Flux Energy Audit Backend',
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/models/*.js'], // Files containing annotations
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs,
};
