import { IMailer, IMailerConfig, IMessageResult, MailMessageInfo } from '../types';
import { Resend } from 'resend';

export class MailerService implements IMailer {
  private readonly mailerConfig: IMailerConfig;
  private readonly resendClient: Resend;

  constructor(mailerConfig: IMailerConfig) {
    this.mailerConfig = mailerConfig;
    this.resendClient = new Resend(mailerConfig.apiKey);
    console.log(`Mail provider config: provider=resend, from=${mailerConfig.fromEmail}`);
  }

  async sendEmail(message: MailMessageInfo): Promise<IMessageResult> {
    try {
      const payload = await this.resendClient.emails.send({
        from: message.from || this.mailerConfig.fromEmail,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
        attachments: message.attachments?.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.content,
        })),
      });

      if (payload.error || !payload.data?.id) {
        throw new Error(payload.error?.message || 'Resend API request failed');
      }

      return {
        accepted: true,
        messageId: payload.data.id,
        response: JSON.stringify(payload),
        rejected: false,
        pending: false,
      };
    } catch (error) {
      this.logTransportError('Error sending email confirmation', error);
      throw error;
    }
  }

  private logTransportError(context: string, error: unknown) {
    const err = error as { code?: string; message?: string };
    const code = err?.code ?? 'unknown';
    console.error(`${context} (provider=resend, code=${code})`);
  }
}
