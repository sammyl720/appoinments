export enum ErrorType {
  UserAlreadyHasAppointment = "User Already Has Appointment",
  InvalidAppointmentData = "Invalid Appointment Data",
  AppointmentTimeAlreadyFull = "Appointment Time Already Full"
}

export interface ICustomError {
  message: string,
  reason: ErrorType,
  name: string
}

export class CustomError extends Error {
  /**
   *
   */
  constructor(message: string, public reason: ErrorType) {
    super(message);
  }

  toJson() {
    return {
      message: this.message,
      name: this.name,
      reason: this.reason
    }
  }
}