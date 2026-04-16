import { IMailerConfig, Validator } from "../types";
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

export const getMailerConfig = (): IMailerConfig => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM ?? process.env.EMAIL;

  if (!apiKey || !fromEmail) {
    throw new Error(
      "Email can not be sent!\nPlease make sure RESEND_API_KEY and EMAIL_FROM (or EMAIL) are set",
    );
  }

  return {
    apiKey,
    fromEmail,
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
