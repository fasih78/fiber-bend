import buildServer from './server';
import { config } from './utils/config';
import createServer from './utils/create_server';
import { logger } from './utils/logger';
import { connectToDb, disconnectFromDb } from './utils/db';

const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const;

async function gracefulShutdown({
  signal,
  server,
}: {
  signal: (typeof signals)[number];
  server: Awaited<ReturnType<typeof createServer>>;
}) {
  logger.info(`Got signal ${signal}. Good bye`);
  await server.close();

  await disconnectFromDb();

  process.exit(0);
}

const startServer = async () => {
  const server = await buildServer();

  server.listen({ port: config.PORT, host: config.HOST });

  await connectToDb();
  server.swagger();

  logger.info(`App is listening`);

  for (let i = 0; i < signals.length; i++) {
    process.on(signals[i], () =>
      gracefulShutdown({
        signal: signals[i],
        server,
      })
    );
  }
};

startServer();
