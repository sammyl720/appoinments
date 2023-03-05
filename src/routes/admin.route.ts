import { IAppointmentService } from 'types/appointment.interface';
import { Router, Request, Response } from 'express';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { AuthService } from '@services/auth.service';
import { GoogleLoginCreds } from '@dtos/login.dto';
import cookie from 'cookie';
import { config } from '../config/config';
import { EventService } from '../services/event.service';
import { IEventData } from '@models/interfaces';
import { IEventDto, validateCreateEventDto } from '../dtos/event.dto';
import { CustomError } from '../types/errors';

function getAdminRouter(
  appointmentService: IAppointmentService,
  authService: AuthService,
  eventService: EventService
) {
  const adminRouter = Router();

  adminRouter.get('/booked', getAuthMiddleware(authService), async (req: Request, res: Response) => {
    const filledAppointments = await appointmentService.GetAllFilledAppointments();
    return res.json(filledAppointments);
  });

  adminRouter.post('/event', getAuthMiddleware(authService), async (req, res) => {
    try {
      // @ts-ignore
      const name = req.user?.name ?? '';
      const createEventDto = req.body;
      const isValidCreateEventDTO = validateCreateEventDto(createEventDto);

      if (isValidCreateEventDTO) {
        const event: IEventData = {
          createdBy: name,
          ...createEventDto
        }

        const dbResult = await eventService.createEvent(event);
        return res.status(200).json({ event: dbResult })
      }
      else {
        return res.status(422).json({ message: 'Make sure all fields are correctly filled' })
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error })
    }
  })

  adminRouter.get('/', getAuthMiddleware(authService), async (req, res) => {
    try {
      const bookedEvent = await Promise.all([
        appointmentService.GetAllFilledAppointments(),
        eventService.getNextEvent()
      ]).then(([booked, event]) => ({ booked, event }))
      return res.status(200).json(bookedEvent);
    } catch (error) {
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json(error.toJson());
      }

      return res.status(500).json({ error })
    }
  })

  adminRouter.post('/login', async (req, res, next) => {
    const { credential } = req.body as GoogleLoginCreds;
    if (!credential) {
      return res.status(422);
    }

    const payload = await authService.verifyAdmin(credential);
    if (!payload) {
      return res.status(401).json({ message: 'Invalid Credentails for admin access' });
    }
    return res.json({ token: credential })
  });

  adminRouter.get('/logout', (req, res) => {
    res.header('Set-Cookie', cookie.serialize('_gac', '', { expires: new Date(Date.now()) }))
    return res.status(200).json({ message: 'Please login' });
  })


  return adminRouter;
}

export default getAdminRouter;