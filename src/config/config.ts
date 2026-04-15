import { ITransportConfig, Validator } from "../types";
import dotenv from "dotenv";
import ValidatorService from "../services/vailidator.service";

if (process.env.NODE_ENV != "production") {
  dotenv.config();
}

const {
  MONGO_URI,
  MONGO_DB_NAME,
  PORT,
  CLIENT_URL,
  NODE_ENV,
  EMAIL_HOST,
  EMAIL,
  PASSWORD,
  // KEY,
  REDIS_URL,
  API_URL,
  ADMIN_EMAIL,
} = process.env;

export const config = {
  MONGO_URI,
  MONGO_DB_NAME,
  PORT,
  NODE_ENV,
  REDIS_URL,
  CLIENT_URL,
};

export const getTransportConfig = (): ITransportConfig => {
  if (!EMAIL_HOST || !EMAIL || !PASSWORD) {
    throw new Error(
      "Email can not be sent!\nPlease make sure the relevant enviroment variable are set",
    );
  }
  return {
    host: EMAIL_HOST,
    port: 465,
    secure: true,
    auth: {
      user: EMAIL,
      pass: PASSWORD,
    },
  };
};

export const getAdminEmailList = (
  validator: Validator = new ValidatorService(),
) => {
  const adminEmails = ADMIN_EMAIL ?? "";
  return adminEmails.split(",").filter((email) => {
    return validator.isValidEmail(email.trim());
  });
};
