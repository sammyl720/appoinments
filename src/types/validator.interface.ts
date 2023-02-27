export interface Validator {
  isValidEmail: (email: string) => boolean;
  isValidPhoneNumber: (phoneNumber: string) => boolean;
  isValidDateString: (dateStr: string | undefined) => boolean;
  isValidName: (name: string) => boolean;
  isValidTimeSlot: (time: string) => boolean;
}