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
  const emailHost = process.env.EMAIL_HOST ?? process.env.SMTP_HOST;
  const emailUser = process.env.EMAIL ?? process.env.SMTP_USER;
  const emailPassword = process.env.PASSWORD ?? process.env.SMTP_PASS;
  const emailPort = process.env.EMAIL_PORT ?? process.env.SMTP_PORT;
  const emailSecure = process.env.EMAIL_SECURE ?? process.env.SMTP_SECURE;
  const emailRequireTLS = process.env.EMAIL_REQUIRE_TLS ?? process.env.SMTP_REQUIRE_TLS;
  const emailConnectionTimeout = process.env.EMAIL_CONNECTION_TIMEOUT_MS;
  const emailGreetingTimeout = process.env.EMAIL_GREETING_TIMEOUT_MS;
  const emailSocketTimeout = process.env.EMAIL_SOCKET_TIMEOUT_MS;

  if (!emailHost || !emailUser || !emailPassword) {
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

  const parseOptionalNumberEnv = (value: string | undefined) => {
    const normalized = normalizeEnvValue(value);

    if (!normalized) {
      return undefined;
    }

    const parsedNumber = Number(normalized);
    return Number.isFinite(parsedNumber) ? parsedNumber : undefined;
  };

  const parseBooleanEnv = (value: string | undefined) => {
    const normalizedValue = normalizeEnvValue(value)?.toLowerCase();
    return normalizedValue === "true";
  };

  const smtpPort = parseNumberEnv(emailPort, 465);
  const smtpSecure = emailSecure
    ? parseBooleanEnv(emailSecure)
    : smtpPort === 465;
  const requireTLS = parseBooleanEnv(emailRequireTLS);
  const connectionTimeout = parseOptionalNumberEnv(emailConnectionTimeout);
  const greetingTimeout = parseOptionalNumberEnv(emailGreetingTimeout);
  const socketTimeout = parseOptionalNumberEnv(emailSocketTimeout);

  if (!emailPort) {
    console.warn("EMAIL_PORT/SMTP_PORT is not set. Falling back to default SMTP port 465.");
  }

  if (!emailSecure) {
    console.warn(
      "EMAIL_SECURE/SMTP_SECURE is not set. Deriving secure mode from selected port.",
    );
  }

  if (emailConnectionTimeout && connectionTimeout === undefined) {
    console.warn("EMAIL_CONNECTION_TIMEOUT_MS is invalid and will be ignored.");
  }

  if (emailGreetingTimeout && greetingTimeout === undefined) {
    console.warn("EMAIL_GREETING_TIMEOUT_MS is invalid and will be ignored.");
  }

  if (emailSocketTimeout && socketTimeout === undefined) {
    console.warn("EMAIL_SOCKET_TIMEOUT_MS is invalid and will be ignored.");
  }

  return {
    host: emailHost,
    port: smtpPort,
    secure: smtpSecure,
    requireTLS,
    connectionTimeout,
    greetingTimeout,
    socketTimeout,
    auth: {
      user: emailUser,
      pass: emailPassword,
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
