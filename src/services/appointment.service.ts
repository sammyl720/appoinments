import Appointment from "../models/appointment";
import { AvailableAppointments, AvailableTimeSlot, IAppointmentService, TimePoint, TIME_SLOT, Validator } from "../types";
import { CreateAppointmentDTO, UserDTO } from "../dtos/appointment.dto";
import { config } from "../config";
import TimeSlot from "../models/TimeSlot";
import { IAppointment } from "../models/interfaces";
import { TIME_RXG } from "../config/regex";
import { CustomError, ErrorType } from "../types/errors";

export default class AppointmentService implements IAppointmentService {
  constructor(private validator: Validator) {
  }

  async CreateUserAppointment(appointment: CreateAppointmentDTO): Promise<IAppointment> {
    const userCanCreateAppointment = await this.canCreateAppointment(appointment);
    const slotOpen = await this.isTimeslotAvailable(appointment.time);

    if (!userCanCreateAppointment || !slotOpen) {
      const errorReason = !userCanCreateAppointment ? ErrorType.UserAlreadyHasAppointment : ErrorType.AppointmentTimeAlreadyFull;
      throw new CustomError("Could not create appointment for", errorReason);
    }
    const date = this.getDateForEvent();

    const {
      firstName,
      lastName,
      email,
      phone,
      time
    } = appointment;
    const timeslot = new TimeSlot({
      time: time,
      date: this.getDateForEvent()
    });

    await timeslot.save();

    const createdAppointment = new Appointment({
      firstName,
      lastName,
      email,
      phone,
      date,
      timeslot
    });

    await createdAppointment.save();
    return createdAppointment;
  }

  async GetAllFilledAppointments() {
    try {
      const date = this.getDateForEvent();
      const allAppointments = await Appointment.find({ date }).populate('timeslot');

      return allAppointments as IAppointment[];
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async GetAppointmentById(id: string) {
    const appointment: IAppointment | null = await Appointment.findById(id).populate('timeslot');
    if (!appointment) {
      throw new CustomError(`Appointment with id ${id}`, ErrorType.AppointmentNotFound, 404);
    }
    return appointment;
  }

  async UpdateAppointmentTime(id: string, updatedAppointTime: TIME_SLOT) {
    const userAppointment = await this.GetAppointmentById(id);
    if (!userAppointment) {
      throw new CustomError('Could not find appointment with id: ' + id, ErrorType.AppointmentNotFound, 404);
    }
    if (updatedAppointTime != userAppointment.timeslot?.time) {
      const timeSlotIsAvaliable = await this.isTimeslotAvailable(updatedAppointTime);
      if (!timeSlotIsAvaliable) {
        throw new Error('There are no appointments available for ' + updatedAppointTime);
      }

      await TimeSlot.findByIdAndDelete(userAppointment.timeslot?._id);
      const newTimeSlot = new TimeSlot({ time: updatedAppointTime, date: this.getDateForEvent() });
      await newTimeSlot.save();

      await Appointment.findByIdAndUpdate(id, { timeslot: newTimeSlot });

      return this.GetAppointmentById(id);
    }
    else {
      throw new CustomError("Please specify a new time for appoinment", ErrorType.AppointmentNotFound, 422);
    }

  }

  private async updateAppointmentTime(appointmentId: string, newAppointTime: TIME_SLOT) {
    const timeSlotIsAvaliable = await this.isTimeslotAvailable(newAppointTime);
    if (!timeSlotIsAvaliable) {
      throw new Error('There are no appointments available for ' + newAppointTime);
    }
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new Error('Could not find appointment with id ' + appointmentId)
    }

  }

  async CancelAppointment(id: string) {
    const appointment = await Appointment.findByIdAndDelete(id);
    return !!appointment;
  }

  async GetAllAvailableAppointments() {
    const avaliableSlots: AvailableTimeSlot[] = [];
    const slotsPerPeriod = this.getAppointmentPerTimeSlot();
    const allSlots = this.GetAllPossibleAppointments();
    let slotsLeft = 0;

    try {
      for (let slot of allSlots) {
        const appointmentLeftForSlot = await this.getAppointmentsAvailableForSlot(slot);
        slotsLeft += appointmentLeftForSlot;
        avaliableSlots.push({
          time: slot,
          available: appointmentLeftForSlot
        })
      }
    } catch (error) {
      console.error(error);
    }
    finally {
      const availableAppointments: AvailableAppointments = {
        appointmentsLeft: slotsLeft,
        slots: avaliableSlots
      }
      return availableAppointments;
    }
  };

  private async GetUserAppoinment(user: UserDTO): Promise<IAppointment | null> {
    try {
      const dbUser = await Appointment.findOne({ email: user.email });
      console.log(dbUser);
      return dbUser;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  private async getAppointmentsAvailableForSlot(time: TIME_SLOT) {
    try {
      const appointmentsReservedForSlot = await this.getCountOfAppointmentFilledForSlot(time);
      return Math.max(0, this.getAppointmentPerTimeSlot() - appointmentsReservedForSlot);
    } catch (error) {
      console.error(error);
      return 0;
    }
  }

  private async isTimeslotAvailable(time: TIME_SLOT) {
    try {
      const appointmentsFilled = await this.getCountOfAppointmentFilledForSlot(time);
      return this.getAppointmentPerTimeSlot() > appointmentsFilled;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  private async getCountOfAppointmentFilledForSlot(time: TIME_SLOT) {
    const date = this.getDateForEvent();
    const appointmentsReservedForSlot = await TimeSlot.countDocuments({ time, date });
    return appointmentsReservedForSlot;
  }

  private getStartTimePoint() {
    return this.getTimePoint(config.STARTING_TIME ?? '2:30');
  }

  private getEndTimePoint() {
    return this.getTimePoint(config.ENDING_TIME ?? '9:30');
  }

  private getTimePoint(time: string) {
    const timeRgx = time?.match(TIME_RXG);
    if (!timeRgx) {
      throw new Error('Invalid start time');
    }
    return (timeRgx.groups as unknown) as TimePoint;
  }

  private GetAllPossibleAppointments() {
    const { hour: hourStart, minute: minuteStart } = this.getStartTimePoint();
    const { hour: hourEnd, minute: minuteEnd } = this.getEndTimePoint();
    const quarters = ['00', '15', '30', '45'];
    const slots: TIME_SLOT[] = [];

    for (let currentHour = parseInt(hourStart); currentHour <= parseInt(hourEnd); currentHour++) {
      const startIntervalIndex = currentHour == parseInt(hourStart) ? quarters.indexOf(minuteStart) : 0;
      const endIntervalIndex = currentHour == parseInt(hourEnd) ? quarters.indexOf(minuteEnd) : 3;
      for (let currentInterval = startIntervalIndex; currentInterval <= endIntervalIndex; currentInterval++) {
        const timeSlot: TIME_SLOT = `${currentHour}:${quarters[currentInterval]}PM` as TIME_SLOT;
        slots.push(timeSlot);
      }
    }

    return slots;
  }

  private async canCreateAppointment(user: UserDTO) {
    const userAppointment = await this.GetUserAppoinment(user);

    if (!!userAppointment) {
      return false;
    }

    return this.hasValidEmail(user) && this.hasValidPhoneNumber(user);
  }

  private hasValidEmail(user: UserDTO) {
    return this.validator.isValidEmail(user.email);
  }

  private hasValidPhoneNumber(user: UserDTO) {
    return this.validator.isValidPhoneNumber(user.phone);
  }

  private getAppointmentPerTimeSlot() {
    return Math.floor(this.getAppointPerHour() / this.getAppointmentPeriodsPerHour());
  }

  private getAppointPerHour() {
    return Number(config.SLOTS_PER_HOUR ?? 24);
  }

  private getAppointmentPeriodsPerHour() {
    return config.APPOINTMENT_PERIODS_PER_HOUR;
  }

  private getDateForEvent() {
    const eventDate = config.EVENT_DATE;

    if (!this.validator.isValidDateString(eventDate)) {
      throw new Error('Invalid config date set: ' + eventDate);
    }

    const date = new Date(eventDate as string);
    if (new Date().getTime() > date.getTime()) {
      throw new Error('Event date most be in the future');
    }

    return date;
  }
}