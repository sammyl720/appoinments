import { ITransportConfig, Validator } from '../types';
import dotenv from 'dotenv';
import ValidatorService from '../services/vailidator.service';

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
  REDIS_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  API_URL,
  EVENT_NAME,
  ADMIN_EMAIL
} = process.env;

export const config = {
  MONGO_URI,
  MONGO_DB_NAME,
  EVENT_DATE,
  EVENT_NAME,
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

export const getAdminEmailList = (validator: Validator = new ValidatorService()) => {
  const adminEmails = ADMIN_EMAIL ?? '';
  return adminEmails.split(',').filter(email => {
    return validator.isValidEmail(email.trim())
  })
}

export const getGoogleCredentails = () => {
  return {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    API_URL
  } as { [key: string]: string }
}