import { ICache } from "../types/cache.interface";
import { config } from "../config/config";
import { IEventDetails, IEventService } from "../types/event-details";
import { IEventData } from "../models/interfaces";
import LocationModel from '../models/location';
import EventModel from '../models/event';
import { CustomError, ErrorType } from "../types/errors";
import { setDateTimezoneNY } from "../utils";
const CACHE_KEY = 'EVENT_DETAILS';
const CACHE_EXPIRATION = 60 * 60 * 12;
export class EventService implements IEventService {

  constructor(private cache: ICache) { }
  // TODO: retrieve events details from db
  async get() {
    return this.getNextEvent();
  }

  async getNextEvent() {
    const cachedEvent = await this.cache.get(CACHE_KEY);
    if (cachedEvent) {
      return JSON.parse(cachedEvent) as IEventData;
    }
    let cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 1);
    const event = await EventModel.findOne({
      date: {
        $gt: cutoffDate
      }
    }).populate('location');

    this.cache.setWithExpiration?.(CACHE_KEY, JSON.stringify(event), CACHE_EXPIRATION)
    return event;
  }

  async createEvent(event: IEventData) {
    const nextEvent = await this.getNextEvent();
    if (!!nextEvent) {
      throw new CustomError('Only one event is allowed at a time', ErrorType.EventAlreadyExists)
    }

    let location = await LocationModel.findOne({ address: event.location.address });

    if (!location?.id) {
      location = new LocationModel(event.location);
      await location.save()
    }

    const date = setDateTimezoneNY(event.date);
    const dbEvent = new EventModel({
      ...event,
      date,
      location
    });

    await dbEvent.save();
    this.cache.setWithExpiration?.(CACHE_KEY, JSON.stringify(dbEvent), CACHE_EXPIRATION);
    return dbEvent;
  }

  async updateEvent(event: Partial<Omit<IEventData, 'date' | 'createdBy' | 'createdOn' | 'location'>>, eventId: string) {
    await EventModel.findByIdAndUpdate(eventId, event);
    return this.getNextEvent();
  }
}

type ValueOrDefaultTuple<T> = [T, T?];

function getValueOrDefault<T>(tuple: ValueOrDefaultTuple<T>): T {
  const [defaultValue, value] = tuple;
  return value ?? defaultValue;
}

function getDateFromString(date?: string) {
  return date ? new Date(date) : null;
}