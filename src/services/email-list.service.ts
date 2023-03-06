import { VALID_EMAIL_RGX } from "../config/regex";
import EmailModel from "../models/email-list";
import { CustomError, ErrorType } from "../types/errors";

export interface IEmailNotifier {
  notify: () => Promise<any>;
  addEmail: (email: string) => Promise<boolean>
}

export class EmailNotifier implements IEmailNotifier {
  constructor() {

  }

  async notify() {
    throw new Error('NOT IMPLEMENTED');
  }

  async addEmail(email: string) {
    const isValidEmail = VALID_EMAIL_RGX.test(email);

    if (!isValidEmail) {
      throw new CustomError('Invalid Email', ErrorType.InvalidEmail, 422);
    }
    const emailExists = await EmailModel.findOne({ email })

    if (emailExists) {
      throw new CustomError('Email already exists', ErrorType.EMailAlreadyRegistered, 400);
    }
    const registeredEmail = new EmailModel({
      email
    });

    await registeredEmail.save();
    return true;
  }
}