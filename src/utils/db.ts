import mongoose from 'mongoose';
import { config } from './config';
import { logger } from './logger';
//mongoose.connect("your connection string", { strictPopulate: false });
export async function connectToDb() {
  try {
    mongoose.set('strictQuery', false);
    mongoose.set('strictPopulate', false);
    await mongoose.connect(config.DATABASE_URL);
    logger.info('Connected to database');
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }
}

export function disconnectFromDb() {
  return mongoose.connection.close();
}
