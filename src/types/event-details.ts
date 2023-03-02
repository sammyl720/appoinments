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

export interface IEventService {
  get: () => Promise<IEventDetails>;
}