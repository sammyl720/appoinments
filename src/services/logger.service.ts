type Loggable = string | { toString: () => string }

export interface ILogger {
  log: (message: Loggable) => void;
}

export class Logger implements ILogger {
  log(message: Loggable) {
    console.log(this.getTime() + ': ' + message);
  }

  getTime() {
    const easternTimezoneOffset = -300 * 60 * 1000;

    const date = new Date();

    date.setTime(date.getTime() + easternTimezoneOffset);

    return date.toString();
  }
}