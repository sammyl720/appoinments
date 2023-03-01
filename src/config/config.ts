import { ITransportConfig } from '../types';
import dotenv from 'dotenv';

if (process.env.NODE_ENV != 'production') {
  dotenv.config();
}

const {
  MONGO_URI,
  MONGO_DB_NAME,
  EVENT_DATE,
  PORT,
  BASE_URL,
  LOCATION_NAME,
  LOCATION_LONG_NAME,
  STARTING_TIME,
  ENDING_TIME,
  SLOTS_PER_HOUR,
  NODE_ENV,
  COOKIE_SECRET,
  LOCATION,
  EMAIL_HOST,
  EMAIL,
  PASSWORD,
  KEY,
  REDIS_URL
} = process.env;

export const config = {
  MONGO_URI,
  MONGO_DB_NAME,
  EVENT_DATE,
  PORT,
  LOCATION_NAME,
  LOCATION_LONG_NAME,
  STARTING_TIME,
  ENDING_TIME,
  SLOTS_PER_HOUR,
  NODE_ENV,
  COOKIE_SECRET,
  LOCATION,
  REDIS_URL,
  KEY,
  BASE_URL,
  APPOINTMENT_PERIODS_PER_HOUR: 4
}

export const getTransportConfig = (): ITransportConfig => {
  if (!EMAIL_HOST || !EMAIL || !PASSWORD) {
    throw new Error("Email can not be sent!\nPlease make sure the relevant enviroment variable are set");
  }
  return {
    host: EMAIL_HOST,
    auth: {
      user: EMAIL,
      pass: PASSWORD
    }
  }
}