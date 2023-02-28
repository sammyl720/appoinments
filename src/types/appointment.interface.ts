import { CreateAppointmentDTO } from "../dtos/appointment.dto";
import { IAppointment } from "../models/interfaces";
import { AvailableAppointments, TIME_SLOT } from ".";

export interface IAppointmentService {
  CreateUserAppointment: (appointment: CreateAppointmentDTO) => Promise<IAppointment>;
  GetAllAvailableAppointments(): Promise<AvailableAppointments>;
  GetAllFilledAppointments: () => Promise<IAppointment[]>;
  GetAppointmentById: (id: string) => Promise<IAppointment>;
  CancelAppointment: (id: string) => Promise<boolean>;
  UpdateAppointmentTime: (id: string, updatedAppointmentTime: TIME_SLOT) => Promise<IAppointment>;
}