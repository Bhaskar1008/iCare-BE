import swaggerJsdoc from 'swagger-jsdoc';
import type { Request, Response } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Salesverse API Documentation',
      version: '1.0.0',
      description: 'API documentation for Salesverse Backend',
      contact: {
        name: 'Salesverse Support',
        email: 'support@salesverse.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.salesverse.com',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Channels',
        description: 'Channel management endpoints',
      },
      {
        name: 'Products',
        description: 'Product management endpoints',
      },
    ],
    externalDocs: {
      description: 'Find out more about Salesverse',
      url: 'https://salesverse.com/docs',
    },
  },
  apis: ['./src/modules/*/*.routes.ts', './src/modules/*/*.controller.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

export const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Salesverse API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    defaultModelsExpandDepth: 3,
    defaultModelExpandDepth: 3,
    displayRequestDuration: true,
    syntaxHighlight: {
      activated: true,
      theme: 'monokai',
    },
    tryItOutEnabled: true,
    requestInterceptor: (req: Request) => {
      req.headers['Content-Type'] = 'application/json';
      return req;
    },
    responseInterceptor: (res: Response) => {
      return res;
    },
  },
};
