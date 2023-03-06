import { VALID_EMAIL_RGX } from "../config/regex";
import { model, Schema } from "mongoose";

export interface IEmailSubscription {
  email: string;
}

const emailSchema = new Schema<IEmailSubscription>({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (value: string) {
        return VALID_EMAIL_RGX.test(value)
      },
      message: (props: any) => `${props.value} is not a valid phone number`
    }
  }
})

const EmailModel = model<IEmailSubscription>('EmailList', emailSchema);

export default EmailModel;