import { IAppointmentService } from '../types/appointment.interface';
import { Router, Request, Response } from 'express';
import { CreateAppointmentDTO } from '@dtos/appointment.dto';
import { getValidatorHandler } from '../middleware/appointment';
import ValidatorService from '../services/vailidator.service';
import { CustomError } from '../types/errors';
import { IMailer, ITemplateService, MailMessageInfo } from '../types';
import { config } from '../config';
import { IAppointment } from '@models/interfaces';

function getAppointmentRouter(
  appointmentService: IAppointmentService,
  validator = new ValidatorService(),
  mailerService: IMailer,
  templateService: ITemplateService
) {
  const appointmentRouter = Router();
  appointmentRouter.get('/', async (req: Request, res: Response) => {
    const availableAppointments = await appointmentService.GetAllAvailableAppointments();
    return res.json(availableAppointments);
  });

  appointmentRouter.post('/', getValidatorHandler(validator), async (req: Request, res: Response) => {
    try {
      const newAppointment = await appointmentService.CreateUserAppointment(req.body as CreateAppointmentDTO);
      sendConfirmationEmail(newAppointment, mailerService, templateService);
      return res.json(newAppointment);
    } catch (error) {
      console.error(error);
      if (error instanceof CustomError) {
        return res.status(401).json(error.toJson());
      }
      return res.status(500).json(error);
    }
  });

  appointmentRouter.get('/booked', async (req: Request, res: Response) => {
    const filledAppointments = await appointmentService.GetAllFilledAppointments();
    return res.json(filledAppointments);
  })
  return appointmentRouter;
}

async function sendConfirmationEmail(appointment: IAppointment, mailer: IMailer, renderer: ITemplateService) {
  const {
    email,
    firstName,
    lastName,
    time,
    date,
    _id
  } = appointment;

  try {
    const website = config.BASE_URL;
    const name = firstName + ' ' + lastName;

    const templateData = {
      website,
      date,
      time,
      email,
      name,
      id: _id,
      location: config.LOCATION,
      formattedDate: date.toDateString()
    }

    const html = await renderer.renderTemplate('confirmation', templateData);
    const text = `
    Thank you ${name},
    Here is your blood donation appointment details.
    When: ${date.toDateString()}
    at ${time}.
    Where: ${process.env.LOCATION || ''}

    To reschedule or cancel the appoinment click the following link
    https://${website}/reschedule/${_id}
    `;

    const mailOptions: MailMessageInfo = {
      from: process.env.EMAIL as string,
      to: email,
      subject: 'Blood Drive Appointment',
      text
    }

    console.table(mailOptions);
    if (html) {
      mailOptions.html = html;
    }
    const mailResult = await mailer.sendEmail(mailOptions)
    console.log(mailResult);
  } catch (error) {
    console.error('Error sending email confirmation: ', error);
  }
}

export default getAppointmentRouter;