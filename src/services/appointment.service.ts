import Appointment from "../models/appointment";
import { AvailableAppointments, AvailableTimeSlot, IAppointmentService, TimePoint, TIME_SLOT, Validator } from "../types";
import { CreateAppointmentDTO, UserDTO } from "../dtos/appointment.dto";
import { config } from "../config";
import TimeSlot from "../models/TimeSlot";
import { IAppointment, IEventData } from "../models/interfaces";
import { TIME_RXG } from "../config/regex";
import { CustomError, ErrorType } from "../types/errors";
import { ICache } from "../types/cache.interface";
import { EventService } from "./event.service";
import { IEventListener, IEventService } from "../types/event-details";
import { ILogger, Logger } from "./logger.service";
import { getDateTime } from "../utils";

export enum AppointmentStatus {
  Created = 'created',
  Updated = 'updated',
  Canceled = 'canceled'
}

const AVAILABLE_APPOINTMENTS_KEY = 'OPEN_APPOINTMENTS_KEY';
const CACHE_EXPIRATION = 10 * 60;
export default class AppointmentService implements IAppointmentService, IEventListener {
  private nextEvent: IEventData | null = null;
  constructor(
    private validator: Validator,
    private cacheClient: ICache,
    private eventService: IEventService,
    private logger: ILogger = new Logger()
  ) {
    eventService.getNextEvent().then(event => {
      this.nextEvent = event;
    }).catch(console.error);
  }

  onUpdate(event: IEventData) {
    this.nextEvent = event;
  }

  async CreateUserAppointment(appointment: CreateAppointmentDTO): Promise<IAppointment> {
    const userCanCreateAppointment = await this.canCreateAppointment(appointment);
    const slotOpen = await this.isTimeslotAvailable(appointment.time);
    if (!userCanCreateAppointment || !slotOpen) {
      const errorReason = !userCanCreateAppointment ? ErrorType.UserAlreadyHasAppointment : ErrorType.AppointmentTimeAlreadyFull;
      throw new CustomError(`Could not create appointment for`, errorReason, 400);
    }
    const date = getDateTime(this.getDateForEvent(), appointment.time);
    console.log(`Date for appointment (${appointment.time}): ${date}`);
    const {
      firstName,
      lastName,
      email,
      phone,
      time
    } = appointment;
    const timeslot = new TimeSlot({
      time: time,
      date
    });

    await timeslot.save();

    const createdAppointment = new Appointment({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      date,
      timeslot,
      event: this.event._id
    });

    await (await createdAppointment.save()).populate('event timeslot');
    this.logAppointmentStatus(createdAppointment, AppointmentStatus.Created);
    this.cacheClient.set(createdAppointment._id.toString(), JSON.stringify(createdAppointment));
    this.clearAvailableAppointmentFromCache();
    return createdAppointment;
  }

  async clearAvailableAppointmentFromCache() {
    await this.cacheClient.del(AVAILABLE_APPOINTMENTS_KEY)
  }
  async GetAllFilledAppointments() {
    try {
      const allAppointments = await Appointment.find({ event: this.event._id }).populate('timeslot');

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
    const appointment: IAppointment | null = await Appointment.findById(id).populate('timeslot event');
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
      const date = getDateTime(this.getDateForEvent(), updatedAppointTime);
      const newTimeSlot = new TimeSlot({ time: updatedAppointTime, date });
      await newTimeSlot.save();

      await Appointment.findByIdAndUpdate(id, { timeslot: newTimeSlot, date });
      const updatedAppointment = await this.findById(id);
      this.logAppointmentStatus(updatedAppointment, AppointmentStatus.Updated);
      this.updateAppointmentInCache(id, updatedAppointment);
      this.clearAvailableAppointmentFromCache();
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
    const { firstName, lastName, timeslot } = appoinment;
    const wasDeleted = await Appointment.findByIdAndDelete(id);
    if (!wasDeleted) {
      throw new CustomError('Could not delete appointment with id ' + id, ErrorType.AppointmentNotFound, 404)
    }
    this.clearTimeSlot(appoinment.timeslot?._id?.toString());
    this.deleteAppointmentFromCache(id);
    this.clearAvailableAppointmentFromCache();
    this.logAppointmentStatus(appoinment, AppointmentStatus.Canceled);
    return true;
  }

  private deleteAppointmentFromCache(id: string) {
    this.cacheClient.del(id);
    this.cacheClient.del(AVAILABLE_APPOINTMENTS_KEY);
  }
  async GetAllAvailableAppointments() {
    try {
      // const cachedAvaibleAppointments = await this.cacheClient.get(AVAILABLE_APPOINTMENTS_KEY);

      // if (!!cachedAvaibleAppointments) {
      //   return JSON.parse(cachedAvaibleAppointments) as AvailableAppointments;
      // }

      const availableAppointments = await this.getAvailableAppointmentsFromDb();
      this.cacheClient.setWithExpiration?.(AVAILABLE_APPOINTMENTS_KEY, JSON.stringify(availableAppointments), CACHE_EXPIRATION);
      return availableAppointments;
    } catch (error) {
      console.error(error);
    }

    const availableAppointments: AvailableAppointments = {
      appointmentsLeft: 0,
      slots: []
    }
    return availableAppointments;

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
      if (!!appointmentLeftForSlot) {
        avaliableSlots.push({
          time: slot,
          available: appointmentLeftForSlot
        });
      }
    }

    return {
      appointmentsLeft: slotsLeft,
      slots: avaliableSlots
    };
  }

  private async GetUserAppoinment(user: UserDTO): Promise<IAppointment | null> {
    try {
      const date = await this.getDateForEvent();
      const dbUser = await Appointment.findOne({ email: user.email.toLowerCase(), date });
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
    const date = getDateTime(this.getDateForEvent(), time)
    const appointmentsReservedForSlot = await TimeSlot.countDocuments({ time, date });
    return appointmentsReservedForSlot;
  }

  private getStartTimePoint() {
    return this.getTimePoint(this.event.startingTime ?? '2:30');
  }

  private getEndTimePoint() {
    return this.getTimePoint(this.event.endingTime ?? '9:30');
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
    return this.event.appointmentsPerInterval;
  }

  private getAppointPerHour() {
    return this.getAppointmentPeriodsPerHour() * this.getAppointmentPerTimeSlot();
  }

  private getAppointmentPeriodsPerHour() {
    return this.event.intervalsPerHour;
  }

  private getDateForEvent() {
    return this.event.date;
  }

  private async logAppointmentStatus(appointment: IAppointment, status: AppointmentStatus) {
    const { firstName, lastName, timeslot } = appointment;
    console.log('Has valid date:', timeslot.date);
    this.logger.log(`Appointment ${status} for ${firstName + ' ' + lastName} at ${timeslot.time} on ${timeslot.date?.toString?.() ?? timeslot.date}`);
  }

  public getEventInfo() {
    return this.event;
  }

  get event() {
    if (!this.nextEvent) {
      throw new CustomError('Event not set', ErrorType.EventNotSet, 500);
    }

    return this.nextEvent;
  }
}