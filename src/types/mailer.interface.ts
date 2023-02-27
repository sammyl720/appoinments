export interface ITransportConfig {
  host: string;
  auth: {
    user: string;
    pass: string;
  }
};

export interface IMessageResult {
  accepted: boolean;
  rejected: boolean;
  pending: boolean;
  response: string;
  messageId: string;
}
export interface MailMessageInfo {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface IMailer {
  sendEmail: (message: MailMessageInfo) => Promise<IMessageResult>
}