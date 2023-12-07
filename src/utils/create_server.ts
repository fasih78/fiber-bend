import fastify from 'fastify';
import cors from '@fastify/cors';
import { version } from '../../package.json';
import swagger from '@fastify/swagger';

const createServer = async () => {
  const app = fastify();

  app.register(cors);

  app.register(swagger, {
    routePrefix: '/docs',
    swagger: {
      info: {
        title: 'Fiber Management System APIs',
        description: 'Fiber Management System APIs',
        version,
      },
      securityDefinitions: {
        bearerToken: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
        },
      },
    },

    staticCSP: true,
    exposeRoute: true,
  });

  return app;
};

export default createServer;
