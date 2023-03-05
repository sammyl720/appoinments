import { ILocation } from "../types/event-details";
import { model, Schema } from "mongoose";

const locationSchema = new Schema<ILocation>({
  name: {
    type: String,
    required: true,
  },
  shortName: String,
  address: {
    type: String,
    required: true
  }
});

const LocationModel = model<ILocation>('Location', locationSchema);

export default LocationModel;