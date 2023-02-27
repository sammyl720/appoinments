import { Schema, model } from 'mongoose';
import { IAppointment } from './interfaces';
import TimeSlot from './TimeSlot';

const AppointmentSchema = new Schema<IAppointment>({
  firstName: {
    type: Schema.Types.String,
    required: true
  },
  lastName: {
    type: Schema.Types.String,
    required: true
  },
  email: {
    type: Schema.Types.String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeslot: {
    required: true,
    type: Schema.Types.ObjectId,
    ref: 'Timeslot'
  },
  phone: {
    type: String,
    required: true,
    validate: {
      validator: function (value: string) {
        return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im.test(value)
      },
      message: (props: any) => `${props.value} is not a valid phone number`
    }
  },
})

AppointmentSchema.post('deleteOne', async function (doc, next) {
  await TimeSlot.findByIdAndDelete(doc.timeslot)
  next()
})

const AppointmentModel = model<IAppointment>('Appointment', AppointmentSchema);

export default AppointmentModel;