import { IAppointmentService } from '../types/appointment.interface';
import { Router, Request, Response } from 'express';
import { CreateAppointmentDTO, UpdateAppointmentDTO } from '@dtos/appointment.dto';
import { getFullValidatorHandler, getTimeValidatorHandler } from '../middleware/appointment';
import ValidatorService from '../services/vailidator.service';
import { CustomError } from '../types/errors';
import { IMailer, ITemplateService, MailMessageInfo } from '../types';
import { config } from '../config';
import { IAppointment } from '../models/interfaces';
import { ILocation } from '../types/event-details';
import { ICalendar } from '../types/calendar.interface';
import { generateICalConfigFromAppointment } from '../utils';

function getAppointmentRouter(
  appointmentService: IAppointmentService,
  validator = new ValidatorService(),
  mailerService: IMailer,
  templateService: ITemplateService,
  calGenerator: ICalendar
) {
  const appointmentRouter = Router();
  appointmentRouter.get('/', async (req: Request, res: Response) => {
    const availableAppointments = await appointmentService.GetAllAvailableAppointments();
    return res.json(availableAppointments);
  });

  appointmentRouter.post('/', getFullValidatorHandler(validator), async (req: Request, res: Response) => {
    try {
      const newAppointment = await appointmentService.CreateUserAppointment(req.body as CreateAppointmentDTO);
      sendConfirmationEmail(newAppointment, mailerService, templateService, appointmentService.getEventInfo().location, calGenerator);

      return res.json(newAppointment);
    } catch (error) {
      return handleError(res, error);
    }
  });

  appointmentRouter.get("/:appointmentId", async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const appoinment = await appointmentService.GetAppointmentById(appointmentId);

      return res.json(appoinment);
    } catch (error) {
      return handleError(res, error);
    }
  });

  appointmentRouter.patch("/:appointmentId", getTimeValidatorHandler(validator), async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const { time } = req.body as UpdateAppointmentDTO;
      const appoinment = await appointmentService.UpdateAppointmentTime(appointmentId, time)
      return res.json(appoinment);
    } catch (error) {
      return handleError(res, error);
    }
  });

  appointmentRouter.delete("/:appointmentId", async (req, res) => {
    try {
      const { appointmentId } = req.params;
      await appointmentService.CancelAppointment(appointmentId);
      return res.json({ message: 'Appointment Deleted' });
    } catch (error) {
      return handleError(res, error);
    }
  });

  return appointmentRouter;
}

async function sendConfirmationEmail(appointment: IAppointment, mailer: IMailer, renderer: ITemplateService, location: ILocation, calGenerator: ICalendar) {
  const {
    email,
    firstName,
    lastName,
    timeslot: { time },
    date,
    _id
  } = appointment;

  try {
    const website = config.CLIENT_URL;
    const name = firstName + ' ' + lastName;

    const templateData = {
      website,
      date,
      time,
      email,
      name,
      id: _id,
      location: location.address,
      formattedDate: date.toDateString()
    }

    const html = await renderer.renderTemplate('confirmation', templateData);
    const text = `
    Thank you ${name},
    Here is your blood donation appointment details.
    When: ${date.toDateString()}
    at ${time}.
    Where: ${location.address}

    To reschedule or cancel the appoinment click the following link
    https://${website}/${_id}
    `;

    const mailOptions: MailMessageInfo = {
      from: process.env.EMAIL as string,
      to: email,
      subject: 'Blood Drive Appointment',
      text
    }

    console.log(mailOptions);
    if (html) {
      mailOptions.html = html;
    }

    const calDocEvent = generateICalConfigFromAppointment(appointment, location);
    const calDocString = await calGenerator.getCalendarEventString(calDocEvent);

    if (calDocString) {
      mailOptions.attachments ??= [];
      mailOptions.attachments.push({
        filename: 'appointment.ics',
        content: calDocString
      })
    }

    const mailResult = await mailer.sendEmail(mailOptions)
    console.log(mailResult);
  } catch (error) {
    console.error('Error sending email confirmation: ', error);
  }
}

const handleError = (res: Response, error: unknown) => {
  console.error(error);
  if (error instanceof CustomError) {
    return res.status(error.statusCode).json(error.toJson());
  }
  return res.status(500).json(error);
}

export default getAppointmentRouter;