export { Validator } from './validator.interface';
export { IAppointmentService } from './appointment.interface';
export { ITemplateService } from './template.interface';
export { ITransportConfig, MailMessageInfo, IMessageResult, IMailer } from './mailer.interface';
export { InvalidField } from './response';
export type slot_number = 1 | 2 | 3 | 4 | 5 | 6;
export type slot_interval = '00' | '15' | '30' | '45';
export type slot_hour = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type TIME_SLOT = `${slot_hour}:${slot_interval}PM`;

export interface AvailableTimeSlot {
  time: TIME_SLOT;
  available: number;
}

export interface AvailableAppointments {
  appointmentsLeft: number;
  slots: AvailableTimeSlot[];
}
export interface TimePoint {
  minute: slot_interval,
  hour: string;
}