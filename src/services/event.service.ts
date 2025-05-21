import { ICache } from "../types/cache.interface";
import { IEventListener, IEventService } from "../types/event-details";
import { IEventData } from "../models/interfaces";
import LocationModel from "../models/location";
import EventModel from "../models/event";
import { CustomError, ErrorType } from "../types/errors";
import { getDateTime } from "../utils";
const CACHE_KEY = "CURRENT_EVENT_DETAILS";
const CACHE_EXPIRATION = 12 * 60 * 60;
export class EventService implements IEventService {
  listeners: IEventListener[] = [];
  constructor(private cache: ICache) {}
  addEventListener(listener: IEventListener) {
    if (!this.listeners.find((l) => l === listener)) {
      this.listeners.push(listener);
    }
  }

  // TODO: retrieve events details from db
  async get() {
    return this.getNextEvent();
  }

  async getNextEvent() {
    const cachedEvent = await this.cache.get(CACHE_KEY);

    let cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 1);

    if (!!cachedEvent) {
      console.table(`Cached event: ${cachedEvent}`);
      const event = JSON.parse(cachedEvent) as IEventData;
      if (new Date(event.date) > cutoffDate) {
        return event;
      }
    }

    const event = await EventModel.findOne({
      date: {
        $gt: cutoffDate,
      },
    }).populate("location");

    this.cache.setWithExpiration?.(
      CACHE_KEY,
      JSON.stringify(event),
      CACHE_EXPIRATION
    );
    return event;
  }

  async createEvent(event: IEventData) {
    console.table(event);
    const nextEvent = await this.getNextEvent();
    if (!!nextEvent) {
      throw new CustomError(
        "Only one event is allowed at a time",
        ErrorType.EventAlreadyExists
      );
    }

    let location = await LocationModel.findOne({
      address: event.location.address,
    });

    if (!location?.id) {
      location = new LocationModel(event.location);
      await location.save();
    }

    console.log(`Retrieving event time: ${event?.date ?? "no date"}`);
    const date = getDateTime(event.date, event.startingTime);
    const dbEvent = new EventModel({
      ...event,
      date,
      location,
    });
    console.log(`retrieved event time: ${date ?? "no"}`);

    await dbEvent.save();

    this.listeners.forEach((listener) => listener.onUpdate(dbEvent));

    this.cache.setWithExpiration?.(
      CACHE_KEY,
      JSON.stringify(dbEvent),
      CACHE_EXPIRATION
    );
    return dbEvent;
  }

  async updateEvent(
    event: Partial<
      Omit<IEventData, "date" | "createdBy" | "createdOn" | "location">
    >,
    eventId: string
  ) {
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
