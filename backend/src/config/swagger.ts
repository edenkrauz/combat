import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Combat Events API',
      version: '1.0.0',
      description: 'API for retrieving events and updating event status.',
    },
    servers: [{ url: 'http://localhost:8000' }],
  },
  apis: ['./src/routers/**/*.ts'],
});
