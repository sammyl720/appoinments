import { CreateAppointmentDTO } from "../dtos/appointment.dto";
import { IAppointment } from "../models/interfaces";
import { AvailableAppointments, TIME_SLOT } from ".";
import { Validator } from "./validator.interface";

export interface IAppointmentService {
  CreateUserAppointment: (appointment: CreateAppointmentDTO) => Promise<IAppointment>;
  GetAllAvailableAppointments(): Promise<AvailableAppointments>;
  GetAllFilledAppointments: () => Promise<IAppointment[]>;
  GetAppointmentById: (id: string) => Promise<IAppointment | null>;
  CancelAppointment: (id: string) => Promise<boolean>;
  UpdateAppointmentTime: (id: string, updatedAppointmentTime: TIME_SLOT) => Promise<IAppointment | null>;
}