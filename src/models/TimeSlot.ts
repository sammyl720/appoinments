import { Schema, model } from 'mongoose';
import { ITimeSlot } from './interfaces';

const TimeslotSchema = new Schema<ITimeSlot>({
  time: {
    type: Schema.Types.String,
    required: true
  },
  date: {
    type: Date,
    default: new Date(process.env.EVENT_DATE || '')
  }
});

const TimeSlot = model<ITimeSlot>('Timeslot', TimeslotSchema);

export default TimeSlot;