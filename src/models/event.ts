import ValidatorService from '../services/vailidator.service';
import { model, Schema } from 'mongoose'
import { dayIsInThePass } from '../utils';
import { IEventData } from './interfaces'

const validator = new ValidatorService();
const eventSchema = new Schema<IEventData>({
  title: {
    type: Schema.Types.String,
    required: true,
  },
  host: {
    type: Schema.Types.String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    validate: {
      validator: function (value: Date) {
        return !dayIsInThePass(value);
      }
    }
  },
  startingTime: {
    required: true,
    type: String,
    validate: {
      validator: validator.isValidTimeSlot
    }
  },
  endingTime: {
    type: String,
    required: true,
    validate: {
      validator: validator.isValidTimeSlot
    }
  },
  appointmentsPerInterval: {
    required: true,
    type: Number
  },
  intervalsPerHour: {
    type: Number,
    default: 4
  },
  location: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Location'
  },
  createdOn: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    required: true
  }
});

const EventModel = model<IEventData>('Event', eventSchema);

export default EventModel;
