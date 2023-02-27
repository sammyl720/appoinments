import mongoose from 'mongoose';
import { config } from '../config';


async function connectToDb() {
  try {
    mongoose.set('strictQuery', false);
    const mongoUriAndDb = getMongoUriFromConfig();
    console.log(mongoUriAndDb);
    await mongoose.connect(mongoUriAndDb);
    console.log('Conected to db');
  } catch (error) {
    console.error('Connection error', error);
    throw error;
  }
}

function getMongoUriFromConfig() {
  const { MONGO_DB_NAME, MONGO_URI } = config;
  return `${MONGO_URI}/${MONGO_DB_NAME}`;
}

export default connectToDb;