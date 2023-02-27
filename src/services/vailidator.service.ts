import { TIME_SLOT, Validator } from "../types";
import { TIME_SLOT_RXG, VALID_EMAIL_RGX, VALID_EVENT_DATE, VALID_PHONE_RGX } from '../config';

export default class ValidatorService implements Validator {

  isValidEmail(email: string) {
    return VALID_EMAIL_RGX.test(email);
  }

  isValidPhoneNumber(phoneNumber: string) {
    return VALID_PHONE_RGX.test(phoneNumber);
  }

  isValidDateString(dateStr: string | undefined) {
    if (!dateStr) return false;
    return VALID_EVENT_DATE.test(dateStr);
  }

  isValidName(name?: string) {
    return (name?.length ?? 0) >= 3;
  }

  isValidTimeSlot(time: string): time is TIME_SLOT {
    return TIME_SLOT_RXG.test(time);
  }
}