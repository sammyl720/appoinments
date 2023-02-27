import { TIME_SLOT } from "../types";

export interface CreateAppointmentDTO extends UserDTO {
  time: TIME_SLOT;
}

export interface UpdateAppointmentDTO {
  time: string;
  appointmentId: string;
}

export interface UserDTO {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}
