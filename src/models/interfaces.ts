import { TIME_SLOT } from "../types";
import { Document } from "mongodb";
import { Types } from "mongoose";

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