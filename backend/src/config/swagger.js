import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'OFPPT Absence Management API',
      version: '1.0.0',
      description: 'Complete API documentation for the OFPPT Absence Management System',
      contact: {
        name: 'API Support',
        email: 'support@ofppt.ma',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.ofppt.ma',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['admin', 'sg'] },
          },
        },
        Teacher: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            matricule: { type: 'string' },
            mustChangePassword: { type: 'boolean' },
            groups: { type: 'array', items: { type: 'string' } },
          },
        },
        Trainee: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            cef: { type: 'string' },
            name: { type: 'string' },
            firstName: { type: 'string' },
            groupe: { type: 'string' },
            phone: { type: 'string' },
          },
        },
        Group: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            filiere: { type: 'string' },
            annee: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
