import Appointment from "../models/appointment";
import { AvailableAppointments, AvailableTimeSlot, IAppointmentService, TimePoint, TIME_SLOT, Validator } from "../types";
import { CreateAppointmentDTO, UserDTO } from "../dtos/appointment.dto";
import { config } from "../config";
import TimeSlot from "../models/TimeSlot";
import { IAppointment } from "../models/interfaces";
import { TIME_RXG } from "../config/regex";
import { CustomError, ErrorType } from "../types/errors";
import { ICache } from "../types/cache.interface";

const AVAILABLE_APPOINTMENTS_KEY = 'AVAILABLE_APPOINTMENTS_KEY';
const CACHE_EXPIRATION = 3 * 60 * 60;
export default class AppointmentService implements IAppointmentService {
  constructor(
    private validator: Validator,
    private cacheClient: ICache
  ) {
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
    this.cacheClient.set(createdAppointment._id.toString(), JSON.stringify(createdAppointment));
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
    const cachedAppointment = await this.cacheClient.get(id);
    if (!!cachedAppointment) {
      console.log('retrieving appointment from cache ', id);
      return JSON.parse(cachedAppointment) as IAppointment;
    }

    const appointment = await this.findById(id);
    return appointment;
  }

  private async findById(id: string) {
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

      this.clearTimeSlot(userAppointment.timeslot?._id?.toString());
      const newTimeSlot = new TimeSlot({ time: updatedAppointTime, date: this.getDateForEvent() });
      await newTimeSlot.save();

      await Appointment.findByIdAndUpdate(id, { timeslot: newTimeSlot });
      const updatedAppointment = await this.findById(id);
      this.updateAppointmentInCache(id, updatedAppointment);
      return updatedAppointment;
    }
    else {
      throw new CustomError("Please specify a new time for appoinment", ErrorType.AppointmentNotFound, 422);
    }

  }

  private updateAppointmentInCache(id: string, updatedAppointment: IAppointment) {
    this.cacheClient.set(id, JSON.stringify(updatedAppointment));
    this.cacheClient.del(AVAILABLE_APPOINTMENTS_KEY);
  }

  async CancelAppointment(id: string) {
    const appoinment = await this.GetAppointmentById(id);
    const timeslotId = appoinment.timeslot?._id?.toString();
    const wasDeleted = await Appointment.findByIdAndDelete(id);
    if (!wasDeleted) {
      throw new CustomError('Could not delete appointment with id ' + id, ErrorType.AppointmentNotFound, 404)
    }
    this.clearTimeSlot(appoinment.timeslot?._id?.toString());
    this.deleteAppointmentFromCache(id);
    return true;
  }

  private deleteAppointmentFromCache(id: string) {
    this.cacheClient.del(id);
    this.cacheClient.del(AVAILABLE_APPOINTMENTS_KEY);
  }
  async GetAllAvailableAppointments() {
    try {
      const cachedAvaibleAppointments = await this.cacheClient.get(AVAILABLE_APPOINTMENTS_KEY);

      if (!!cachedAvaibleAppointments) {
        return JSON.parse(cachedAvaibleAppointments) as AvailableAppointments;
      }

      const availableAppointments = await this.getAvailableAppointmentsFromDb();
      this.cacheClient.setWithExpiration?.(AVAILABLE_APPOINTMENTS_KEY, JSON.stringify(availableAppointments), CACHE_EXPIRATION);
      return availableAppointments;
    } catch (error) {
      console.error(error);
    } finally {
      const availableAppointments: AvailableAppointments = {
        appointmentsLeft: 0,
        slots: []
      }
      return availableAppointments;
    }
  };

  private async clearTimeSlot(timeSlotId?: string) {
    const wasDeleted = await TimeSlot.findByIdAndDelete(timeSlotId);
    return wasDeleted;
  }

  private async getAvailableAppointmentsFromDb() {
    const avaliableSlots: AvailableTimeSlot[] = [];
    const allSlots = this.GetAllPossibleAppointments();
    let slotsLeft = 0;

    for (let slot of allSlots) {
      const appointmentLeftForSlot = await this.getAppointmentsAvailableForSlot(slot);
      slotsLeft += appointmentLeftForSlot;
      avaliableSlots.push({
        time: slot,
        available: appointmentLeftForSlot
      });
    }

    return {
      appointmentsLeft: slotsLeft,
      slots: avaliableSlots
    };
  }

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