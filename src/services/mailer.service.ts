import mailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { IMailer, IMessageResult, ITransportConfig, MailMessageInfo } from '../types';

export class MailerService implements IMailer {
  private transport: mailer.Transporter<SMTPTransport.SentMessageInfo>;

  constructor(transportConfig: ITransportConfig) {
    console.log(
      `Mail transport config: host=${transportConfig.host}, port=${transportConfig.port}, secure=${transportConfig.secure}, requireTLS=${transportConfig.requireTLS}`,
    );

    this.transport = mailer.createTransport(transportConfig);
    this.transport.verify().then(() => {
      console.log('Mail Transport online');
    }).catch(reason => {
      console.log(
        reason,
        ` mailer could not start (host=${transportConfig.host}, port=${transportConfig.port}, secure=${transportConfig.secure})`,
      );
    })
  }

  async sendEmail(message: MailMessageInfo): Promise<IMessageResult> {
    const { messageId, response, accepted, rejected, pending } = await this.transport.sendMail(message);

    return {
      accepted: !!accepted?.length,
      messageId: messageId,
      response: response,
      rejected: !!rejected?.length,
      pending: !!pending?.length
    }
  }
}
