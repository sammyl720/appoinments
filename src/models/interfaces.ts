import { TIME_SLOT } from "../types";
import { Document } from "mongodb";
import { Types } from "mongoose";
import { ILocation } from "../types/event-details";

export interface IAppointment extends Document {
  firstName: string,
  lastName: string;
  email: string;
  phone: string;
  date: Date;
  timeslot: ITimeSlot;
  _id?: Types.ObjectId;
}

export interface ITimeSlot {
  date: Date,
  time: TIME_SLOT;
  _id?: Types.ObjectId;
}

export interface IEventData {
  title: string;
  host: string;
  description?: string;
  date: Date;
  startingTime: TIME_SLOT;
  endingTime: TIME_SLOT;
  appointmentsPerInterval: number;
  intervalsPerHour: number;
  location: ILocation;
  createdOn?: Date;
  createdBy: string;
  _id?: string;
}