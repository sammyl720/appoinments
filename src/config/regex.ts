export const VALID_PHONE_RGX = /^[\+]?[(]?(?<area>[0-9]{3})[)]?[-\s\.]?(?<three>[0-9]{3})[-\s\.]?(?<four>[0-9]{4,6})$/;

export const VALID_EMAIL_RGX = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

export const VALID_EVENT_DATE = /^20[\d]{2},[0-9]{1,2},[0-9]{1,2}$/;

export const TIME_RXG = /^(?<hour>\d):(?<minute>00|15|30|45)/;

export const TIME_SLOT_RXG = /^(?<hour>\d):(?<minute>00|15|30|45)PM$/;