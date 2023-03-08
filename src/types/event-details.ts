import { IEventData } from "@models/interfaces";

export interface IEventDetails {
  title: string;
  description?: string;
  date: Date | null;
  startingTime: string;
  endingTime: string;
  affilates: string[];
  location: ILocation;

}

export interface ILocation {
  name: string;
  shortName?: string;
  address: string;
  coordinates?: ICoordinates;
}

export interface ICoordinates {
  longitude: number;
  latitude: number;
}

export interface IEventListener {
  onUpdate: (event: IEventData) => void;
}
export interface IEventService {
  get: () => Promise<IEventData | null>;
  getNextEvent: () => Promise<IEventData | null>;
  updateEvent: (event: Partial<Omit<IEventData, 'date' | 'createdBy' | 'createdOn' | 'location'>>, eventId: string) => Promise<IEventData | null>;

  createEvent: (event: IEventData) => Promise<IEventData | null>;

  addEventListener: (listener: IEventListener) => void;

}