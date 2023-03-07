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
  date.setHours(hour, minute);
  return date;
}

export function getTime(time: TIME_SLOT) {
  const indexOfAmPm = time.length - 2
  const isAfterNoon = time.substring(indexOfAmPm).toLowerCase() === 'pm';
  let [hour, minute] = time.substring(0, indexOfAmPm).split(':').map(t => parseInt(t));

  hour = isAfterNoon ? hour + 12 : hour;
  return {
    hour,
    minute
  }
}

export function generateICalConfigFromAppointment(appoinment: IAppointment, location: ILocation): CalEvent {
  const { timeslot, date, event: { title, host }, _id } = appoinment;
  const newLineChar = '\n';
  const startDate = getDateTime(date, timeslot.time);
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 1)

  const calEvent: CalEvent = {
    start: startDate,
    end: endDate,
    summary: `${host}: Blood drive appointment`,
    name: title,
    location: location.name + newLineChar + location.address,
  }

  return calEvent;
}