export interface ITransportConfig {
  host: string;
  port?: number;
  secure?: boolean;
  requireTLS?: boolean;
  connectionTimeout?: number;
  greetingTimeout?: number;
  socketTimeout?: number;
  auth: {
    user: string;
    pass: string;
  };
}

export interface IMessageResult {
  accepted: boolean;
  rejected: boolean;
  pending: boolean;
  response: string;
  messageId: string;
}

export interface IMailAttachment {
  filename: string;
  content: string;
}
export interface MailMessageInfo {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: IMailAttachment[];
}

export interface IMailer {
  sendEmail: (message: MailMessageInfo) => Promise<IMessageResult>;
}
