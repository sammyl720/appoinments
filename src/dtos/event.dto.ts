import ValidatorService from "../services/vailidator.service";
import { dayIsInThePass } from "../utils";
import { ILocation } from "../types/event-details";
import { TIME_SLOT } from "../types/index";

export interface IEventDto {
  title: string;
  host: string;
  description?: string;
  date: Date;
  startingTime: TIME_SLOT;
  endingTime: TIME_SLOT;
  appointmentsPerInterval: number;
  intervalsPerHour: number;
  location: ILocation;
}

const validator = new ValidatorService();

type RequiredFieldValidator = Partial<Record<keyof IEventDto, IValidate>>;

type HasValidator = {
  validate: (value: any) => boolean;
}

type HasDefaulValue = {
  defaultValue: any
}

type IValidate = HasValidator | HasDefaulValue;

const createEventFields: RequiredFieldValidator = {
  title: {
    validate: (value: any) => isValidString(value)
  },
  host: {
    validate: (value: any) => isValidString(value),
  },
  startingTime: {
    validate: (value: any) => isValidTime(value)
  },
  endingTime: {
    validate: (value: any) => isValidTime(value)
  },
  date: {
    validate: (value: any) => isValidDate(value)
  },
  appointmentsPerInterval: {
    defaultValue: 6
  },
  intervalsPerHour: {
    defaultValue: 4
  },
  location: {
    validate: (value: any) => isValidLocation(value)
  }
}

const isValidDate = (value: any) => {
  return isValidString(value) && !dayIsInThePass(new Date(value));
}
const isValidString = (value: any) => {
  return typeof value === 'string' && !!value.length;
}

const isValidTime = (value: any) => {
  return isValidString(value) && validator.isValidTimeSlot(value)
}

const isValidLocation = (value: any) => {
  return typeof value === 'object' && typeof value['address'] === 'string' && typeof value['name'] == 'string'
}

const isValidator = (object: HasDefaulValue | HasValidator): object is HasValidator => {
  return typeof (object as HasValidator).validate === 'function';
}

export function validateCreateEventDto(event: any): event is IEventDto {
  let fields: any[] = [];
  if (typeof event !== 'object') {
    return false;
  }
  const isValid = Object.entries(createEventFields).every(([fieldName, validator]) => {
    if (isValidator(validator)) {
      const isValid: boolean = validator.validate(event[fieldName]);
      fields.push({
        passed: isValid,
        fieldName,
        value: event[fieldName]
      })
      return isValid;
    }
    else {
      event[fieldName] ??= validator.defaultValue;
      fields.push({
        passed: true,
        fieldName,
        value: event[fieldName],
        defaultValue: validator.defaultValue
      })
      return true;
    }
  })
  if (!isValid) {
    console.log(fields);
  }
  return isValid;
}