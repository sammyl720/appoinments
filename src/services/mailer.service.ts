import mailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { IMailer, IMessageResult, ITransportConfig, MailMessageInfo } from '../types';

export class MailerService implements IMailer {
  private transport: mailer.Transporter<SMTPTransport.SentMessageInfo>;
  private readonly transportConfig: ITransportConfig;

  constructor(transportConfig: ITransportConfig) {
    this.transportConfig = transportConfig;
    console.log(
      `Mail transport config: host=${transportConfig.host}, port=${transportConfig.port}, secure=${transportConfig.secure}, requireTLS=${transportConfig.requireTLS}`,
    );

    this.transport = mailer.createTransport(transportConfig);
    const shouldVerifyOnStartup =
      (process.env.EMAIL_VERIFY_ON_STARTUP ?? "false").toLowerCase() === "true";

    if (shouldVerifyOnStartup) {
      this.transport.verify().then(() => {
        console.log('Mail Transport online');
      }).catch(reason => {
        this.logTransportError('mailer could not start', reason, transportConfig);
      });
    }
  }

  async sendEmail(message: MailMessageInfo): Promise<IMessageResult> {
    try {
      const { messageId, response, accepted, rejected, pending } = await this.transport.sendMail(message);

      return {
        accepted: !!accepted?.length,
        messageId: messageId,
        response: response,
        rejected: !!rejected?.length,
        pending: !!pending?.length
      }
    } catch (error) {
      this.logTransportError('Error sending email confirmation', error, this.transportConfig);
      throw error;
    }
  }

  private logTransportError(context: string, error: unknown, transportConfig: ITransportConfig) {
    const err = error as { code?: string; message?: string };
    const code = err?.code ?? 'unknown';
    console.error(
      `${context} (host=${transportConfig.host}, port=${transportConfig.port}, secure=${transportConfig.secure}, requireTLS=${transportConfig.requireTLS}, code=${code})`,
    );

    if (code === 'ETIMEDOUT') {
      console.error(
        'SMTP connection timed out before reaching the server. This usually means egress SMTP ports are blocked by the hosting provider or firewall rules.',
      );
    }
  }
}
