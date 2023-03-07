import { CalEvent, ICalendar } from "../types/calendar.interface";
import ical from 'ical-generator';

export class EventCalendar implements ICalendar {
  async getCalendarEventString(calEvent: CalEvent) {
    const cal = ical({ name: calEvent.name });
    cal.createEvent(calEvent);
    const docString = await cal.toString();
    return docString;
  }
}