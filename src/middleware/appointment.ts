import { InvalidField, Validator } from "../types";
import { Handler } from "express";

export interface IValidator<T> {
  validate: (value?: T) => boolean;
  reason: string;
};

export const getTimeValidatorHandler = (validatorService: Validator): Handler => (req, res, next) => {
  if (!validatorService.isValidTimeSlot(req.body?.time)) {
    return res.status(422).json({
      reason: "'time' field should be formatted as 'h:mmPM' or 'hh:mmPM'"
    })
  }
  return next();
}

export const getFullValidatorHandler = (validatorService: Validator): Handler => (req, res, next) => {
  const validationErrorList: InvalidField[] = [];
  const fieldValidators: { [key: string]: IValidator<string> } = {
    firstName: {
      validate: (value?: string) => validatorService.isValidName(value ?? ''),
      reason: "'firstName' field should be greater than 3 characters",
    },
    lastName: {
      validate: (value?: string) => validatorService.isValidName(value ?? ''),
      reason: "'lastName' field should be greater than 3 characters",
    },
    email: {
      validate: (value?: string) => validatorService.isValidEmail(value ?? ''),
      reason: "'email' field should be a valid email"
    },
    phone: {
      validate: (value?: string) => validatorService.isValidPhoneNumber(value ?? ''),
      reason: "'phone' field should be a valid phone number"
    },
    time: {
      validate: (value?: string) => validatorService.isValidTimeSlot(value ?? ''),
      reason: "'time' field should be formatted as 'h:mmPM' or 'hh:mmPM'"
    },
  }

  Object.entries(fieldValidators).forEach(([field, validator]: [string, IValidator<string>]) => {
    const hasValidValue = validator.validate(req.body?.[field]);
    if (!hasValidValue) {
      validationErrorList.push({ field, reason: validator.reason });
    }
  });

  if (!!validationErrorList.length) {
    return res.status(422).json({
      message: 'The following fields are not correctly set',
      fields: validationErrorList
    })
  }

  return next();
}