export interface CalEvent {
  start: Date;
  end: Date;
  summary: string;
  name: string;
  location: string;
  url?: string;
}


export interface ICalendar {
  getCalendarEventString(calEvent: CalEvent): Promise<string>;
}