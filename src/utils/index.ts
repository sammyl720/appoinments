import { TIME_SLOT } from "../types";
import { existsSync, statSync } from "fs";
import { dirname, join } from "path";
import { IAppointment } from "@models/interfaces";
import { ICalEvent } from "ical-generator";
import { CalEvent } from "../types/calendar.interface";
import { config } from '../config/config';
import { ILocation } from "../types/event-details";

export function getPathToDirectory(directoryName: string) {
  let currentDirectory = process.cwd();

  while (true) {
    const directoryPath = join(currentDirectory, directoryName);

    if (existsSync(directoryPath) && statSync(directoryPath).isDirectory()) {
      return directoryPath;
    }

    if (dirname(currentDirectory) === currentDirectory) {
      return null;
    }
    currentDirectory = dirname(currentDirectory);
  }
}

export function dayIsInThePass(date: Date | null | string) {
  if (!date) {
    return true;
  }

  date = new Date(date.toString());
  const today = new Date();
  today.setHours(12);

  return !!date ? today.getTime() > date.getTime?.() : true;
}

export function getDateTime(date: Date, time: TIME_SLOT) {
  const { hour, minute } = getTime(time);
  console.log('Before tz change', date.toString())
  date = setDateTimezoneNY(date);
  console.log('After tz change', date.toString())
  date.setHours(hour, minute);
  console.log('After time adjustment', date.toString())
  return date;
}

export function setDateTimezoneNY(date: Date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }

  const nyOffsetMinutes = -240;
  const minuteInMs = 60 * 1000;
  const dayOfMonth = date.getDate();

  date = new Date(date.getTime() + nyOffsetMinutes * minuteInMs);
  date.setDate(dayOfMonth);
  return date;
}

export function getTime(time: TIME_SLOT) {
  const indexOfAmPm = time.length - 2;
  const isAfterNoon = time.substring(indexOfAmPm).toLowerCase() === 'pm';
  let [hour, minute] = time.substring(0, indexOfAmPm).split(':').map(t => parseInt(t));

  hour = isAfterNoon ? hour + 12 : hour;
  return {
    hour,
    minute
  }
}

export function generateICalConfigFromAppointment(appointment: IAppointment, location: ILocation): CalEvent {
  let { timeslot, date, event: { title, host }, _id } = appointment;
  const newLineChar = '\n';

  console.table({
    slotDate: timeslot.date,
    date
  })
  const startDate = date instanceof Date ? date : new Date(date);
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 1);
  console.table({
    startDate: startDate.toLocaleString(),
    endDate: endDate.toLocaleString()
  })

  const calEvent: CalEvent = {
    start: startDate,
    end: endDate,
    summary: `${host ?? 'Event'}: Blood drive appointment`,
    name: title ?? "Blood drive appointment",
    location: location.name + newLineChar + location.address,
  }

  return calEvent;
}