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

const redisClient = RedisClient.getClient();
const PORT = config.PORT || 3031;
const app = express();
const validator = new ValidatorService();
const appointmentService = new AppointmentService(validator, new CacheService(redisClient));
const templateService = new TemplateService();
const mailerService = new MailerService(getTransportConfig());

app.use(cors({
  origin: config.BASE_URL
}))
app.use(express.json());

app.get('/', async (req, res) => {
  return res.json({ message: 'Appointment API' })
});

app.use('/appointments', getAppointmentRouter(
  appointmentService,
  validator,
  mailerService,
  templateService
));

const ErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (!!err) {
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