import { Validator } from "../types";
import { Handler } from "express";

export interface IValidator<T> {
  validate: (value?: T) => boolean;
};

export const getValidatorHandler = (validatorService: Validator): Handler => (req, res, next) => {
  const validationErrorList: string[] = [];
  const fieldValidators: { [key: string]: IValidator<string> } = {
    firstName: {
      validate: (value?: string) => validatorService.isValidName(value ?? '')
    },
    lastName: {
      validate: (value?: string) => validatorService.isValidName(value ?? '')
    },
    email: {
      validate: (value?: string) => validatorService.isValidEmail(value ?? '')
    },
    phone: {
      validate: (value?: string) => validatorService.isValidPhoneNumber(value ?? '')
    },
    time: {
      validate: (value?: string) => validatorService.isValidTimeSlot(value ?? '')
    },
  }

  Object.entries(fieldValidators).forEach(([field, validator]: [string, IValidator<string>]) => {
    const hasValidValue = validator.validate(req.body?.[field]);
    if (!hasValidValue) {
      validationErrorList.push(field);
    }
  });

  if (!!validationErrorList.length) {
    return res.status(403).json({
      message: 'The following fields are not correctly field',
      fields: validationErrorList
    })
  }

  return next();
}