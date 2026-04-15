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

  const normalizeEnvValue = (value?: string) => {
    if (typeof value !== "string") {
      return undefined;
    }

    const normalized = value.trim().replace(/^["']|["']$/g, "");
    return normalized.length ? normalized : undefined;
  };

  const parseNumberEnv = (value: string | undefined, fallback: number) => {
    const normalized = normalizeEnvValue(value);
    const parsedNumber = Number(normalized);
    return Number.isFinite(parsedNumber) ? parsedNumber : fallback;
  };

  const parseBooleanEnv = (value: string | undefined) => {
    const normalizedValue = normalizeEnvValue(value)?.toLowerCase();
    return normalizedValue === "true";
  };

  const smtpPort = parseNumberEnv(EMAIL_PORT, 465);
  const smtpSecure = EMAIL_SECURE
    ? parseBooleanEnv(EMAIL_SECURE)
    : smtpPort === 465;
  const requireTLS = parseBooleanEnv(EMAIL_REQUIRE_TLS);
  const connectionTimeout = parseNumberEnv(EMAIL_CONNECTION_TIMEOUT_MS, 10000);
  const greetingTimeout = parseNumberEnv(EMAIL_GREETING_TIMEOUT_MS, 10000);
  const socketTimeout = parseNumberEnv(EMAIL_SOCKET_TIMEOUT_MS, 20000);

  return {
    host: EMAIL_HOST,
    port: smtpPort,
    secure: smtpSecure,
    requireTLS,
    connectionTimeout,
    greetingTimeout,
    socketTimeout,
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
