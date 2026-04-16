import { IMailer, IMailerConfig, IMessageResult, MailMessageInfo } from '../types';

export class MailerService implements IMailer {
  private readonly mailerConfig: IMailerConfig;

  constructor(mailerConfig: IMailerConfig) {
    this.mailerConfig = mailerConfig;
    console.log(`Mail provider config: provider=resend, from=${mailerConfig.fromEmail}`);
  }

  async sendEmail(message: MailMessageInfo): Promise<IMessageResult> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.mailerConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: message.from || this.mailerConfig.fromEmail,
          to: [message.to],
          subject: message.subject,
          text: message.text,
          html: message.html,
          attachments: message.attachments?.map((attachment) => ({
            filename: attachment.filename,
            content: Buffer.from(attachment.content).toString('base64'),
          })),
        }),
      });

      const payload = await response.json() as { id?: string; message?: string; name?: string };

      if (!response.ok || !payload?.id) {
        throw new Error(payload?.message || payload?.name || `Resend API request failed with status ${response.status}`);
      }

      return {
        accepted: true,
        messageId: payload.id,
        response: JSON.stringify(payload),
        rejected: false,
        pending: false,
      }
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
