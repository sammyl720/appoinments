import { ICache } from "../types/cache.interface";
import { config } from "../config/config";
import { IEventDetails, IEventService } from "../types/event-details";

const CACHE_KEY = 'EVENT_DETAILS';
const CACHE_EXPIRATION = 60 * 60 * 12;
export class EventService implements IEventService {

  constructor(private cache: ICache) { }
  // TODO: retrieve events details from db
  async get() {
    const cachedValue = await this.cache.get(CACHE_KEY);
    if (!!cachedValue) {
      return JSON.parse(cachedValue);
    }

    const {
      LOCATION_LONG_NAME,
      LOCATION_NAME,
      STARTING_TIME,
      ENDING_TIME,
      EVENT_NAME,
      EVENT_DATE,
      LOCATION
    } = config;

    const eventDetails: IEventDetails = {
      title: getValueOrDefault<string>(['Blood Drive', EVENT_NAME]),
      startingTime: getValueOrDefault<string>(['2:30', STARTING_TIME]),
      endingTime: getValueOrDefault<string>(['2:30', ENDING_TIME]),
      date: getDateFromString(EVENT_DATE),
      affilates: [],
      location: {
        name: getValueOrDefault(['', LOCATION_LONG_NAME]),
        shortName: getValueOrDefault(['', LOCATION_NAME]),
        address: getValueOrDefault(['', LOCATION])
      }
    }

    this.cache.setWithExpiration?.(CACHE_KEY, JSON.stringify(eventDetails), CACHE_EXPIRATION);

    return eventDetails;
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