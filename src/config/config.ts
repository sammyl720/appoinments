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
  EMAIL_PORT,
  EMAIL_SECURE,
  EMAIL_REQUIRE_TLS,
  EMAIL_CONNECTION_TIMEOUT_MS,
  EMAIL_GREETING_TIMEOUT_MS,
  EMAIL_SOCKET_TIMEOUT_MS,
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

  const smtpPort = Number(EMAIL_PORT ?? 465);
  const smtpSecure = EMAIL_SECURE ? EMAIL_SECURE === "true" : smtpPort === 465;
  const requireTLS = EMAIL_REQUIRE_TLS === "true";
  const connectionTimeout = Number(EMAIL_CONNECTION_TIMEOUT_MS ?? 10000);
  const greetingTimeout = Number(EMAIL_GREETING_TIMEOUT_MS ?? 10000);
  const socketTimeout = Number(EMAIL_SOCKET_TIMEOUT_MS ?? 20000);

  return {
    host: EMAIL_HOST,
    port: Number.isFinite(smtpPort) ? smtpPort : 465,
    secure: smtpSecure,
    requireTLS,
    connectionTimeout: Number.isFinite(connectionTimeout)
      ? connectionTimeout
      : 10000,
    greetingTimeout: Number.isFinite(greetingTimeout) ? greetingTimeout : 10000,
    socketTimeout: Number.isFinite(socketTimeout) ? socketTimeout : 20000,
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
