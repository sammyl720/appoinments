import getAppointmentRouter from './routes/appointments.route';
import AppointmentService from './services/appointment.service';
import ValidatorService from './services/vailidator.service';
import express, { ErrorRequestHandler } from 'express';
import connectToDb from './db/database';
import cors from 'cors';
import { config, getMailerConfig } from './config';
import { TemplateService } from './services/template.service';
import { MailerService } from './services/mailer.service';
import getAdminRouter from './routes/admin.route';
import { EventService } from './services/event.service';
import { dayIsInThePass } from './utils';
import cookieParser from 'cookie-parser';
import { AuthService } from './services/auth.service';
import { OAuth2Client } from 'google-auth-library';
import { EmailNotifier } from './services/email-list.service';
import { CustomError } from './types/errors';
import { EventCalendar } from './services/calendar.service';
import { NodeCacheAdapter } from './services/node-cache.service';

const PORT = config.PORT || 3031;
const app = express();
const validator = new ValidatorService();
const cacheService = new NodeCacheAdapter(600);
const eventDetailsService = new EventService(cacheService);
const appointmentService = new AppointmentService(validator, cacheService, eventDetailsService);
eventDetailsService.addEventListener(appointmentService);
appointmentService.clearAvailableAppointmentFromCache();
const templateService = new TemplateService();
const calGenerator = new EventCalendar();
const mailerService = new MailerService(getMailerConfig());
const authService = new AuthService(new OAuth2Client());
const emailNotifier = new EmailNotifier();

app.use(cors({
  origin: config.CLIENT_URL
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.get('/', async (req, res) => {
  const eventDetails = await eventDetailsService.get();

  if (dayIsInThePass(eventDetails?.date ?? null)) {
    return res.status(404).json({ message: 'No Event' });
  }
  return res.json({ event: eventDetails })
});

app.post('/notify', async (req, res) => {
  try {
    const { email } = req.body;
    const emailWasRegistered = await emailNotifier.addEmail(email);

    if (emailWasRegistered) {
      return res.status(200).json({ message: 'Will send a email notification to ' + email + ' when are next event is scheduled. ' });
    }

    return res.status(500).json({ message: 'Something went wrong' });
  } catch (error) {
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({ message: error.message })
    }

    return res.status(500).json({ error })
  }
})

app.use('/appointments', getAppointmentRouter(
  appointmentService,
  validator,
  mailerService,
  templateService,
  calGenerator
));

app.use('/admin', getAdminRouter(appointmentService, authService, eventDetailsService, cacheService));

const ErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (!!err) {
    console.error(err);
    return res.json({ message: 'Something went wrong', error: err });
  }
}

app.use(ErrorHandler);

app.listen(PORT, async () => {
  console.log('server up on port ' + PORT);
  await connectToDb();
});
