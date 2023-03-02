export interface IEventDetails {
  title: string;
  description?: string;
  date: Date;
  startingTime: string;
  endingTime: string;
  host: string;
  affilates: string[];
  location: ILocation;
}

export interface ILocation {
  name: string;
  streetAddress: string;
  zipcode: string;
  image_url?: string;
  city: string;
  state: string;
  coordinates?: ICoordinates;
}

export interface ICoordinates {
  longitude: number;
  latitude: number;
}

export interface IEventService {
  get: () => Promise<IEventDetails>;
}