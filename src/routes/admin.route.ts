import { IAppointmentService } from '../types/appointment.interface';
import { Router, Request, Response } from 'express';
import { config } from '../config';
import { auth } from 'express-oauth2-jwt-bearer';


function getAdminRouter(
  appointmentService: IAppointmentService,
) {
  const adminRouter = Router();

  if (oAuthCredentialSet()) {
    const jwtCheck = auth({
      audience: config.OAUTH_AUDIENCE,
      issuerBaseURL: config.OAUTH_ISSUER_URL,
      tokenSigningAlg: 'RS256'
    });

    adminRouter.use(jwtCheck);

    adminRouter.get('/booked', async (req: Request, res: Response) => {
      const filledAppointments = await appointmentService.GetAllFilledAppointments();
      return res.json(filledAppointments);
    })
  }

  return adminRouter;
}

function oAuthCredentialSet() {
  const { OAUTH_AUDIENCE, OAUTH_ISSUER_URL } = config;
  return isDefinedString(OAUTH_AUDIENCE) && isDefinedString(OAUTH_ISSUER_URL);
}

function isDefinedString(val: string | undefined) {
  return !!val && val.length > 0;
}

export default getAdminRouter;