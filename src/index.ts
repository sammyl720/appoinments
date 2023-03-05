import getAppointmentRouter from './routes/appointments.route';
import AppointmentService from './services/appointment.service';
import ValidatorService from './services/vailidator.service';
import express, { ErrorRequestHandler } from 'express'
import connectToDb, { RedisClient } from './db/database';
import cors from 'cors';
import { config, getTransportConfig } from './config';
import { TemplateService } from './services/template.service';
import { MailerService } from './services/mailer.service';
import { CacheService } from './services/cache.service';
import getAdminRouter from './routes/admin.route';
import { EventService } from './services/event.service';
import { dayIsInThePass } from './utils';
import cookieParser from 'cookie-parser';
import { AuthService } from './services/auth.service';
import { OAuth2Client } from 'google-auth-library';

const redisClient = RedisClient.getClient();
const PORT = config.PORT || 3031;
const app = express();
const validator = new ValidatorService();
const cacheService = new CacheService(redisClient);
const eventDetailsService = new EventService(cacheService);
const appointmentService = new AppointmentService(validator, cacheService, eventDetailsService);
const templateService = new TemplateService();
const mailerService = new MailerService(getTransportConfig());
const authService = new AuthService(new OAuth2Client());

app.use(cors({
  origin: config.BASE_URL
}))
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

app.use('/appointments', getAppointmentRouter(
  appointmentService,
  validator,
  mailerService,
  templateService
));

app.use('/admin', getAdminRouter(appointmentService, authService, eventDetailsService));

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
  try {
    await redisClient.connect();
    console.log('connected to redis');
  } catch (error) {
    redisClient.disconnect();
  }
});