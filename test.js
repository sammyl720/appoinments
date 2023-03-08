const LA = "America/Los_Angeles";
const NY = "America/New_York";

const localeDate = new Date();
const laDate = new Date(localeDate.toLocaleString('en-US', { timeZone: LA }))
const nyDate = new Date(localeDate.toLocaleString('en-US', { timeZone: NY }))

console.table({
  ny: nyDate.toUTCString(),
  la: laDate.toUTCString(),
  locale: localeDate.toUTCString(),
})

console.log(localeDate.toString())
console.log(`offset: ${localeDate.getTimezoneOffset()}`)
console.table({
  ny: nyDate.getTime(),
  la: laDate.getTime(),
  locale: localeDate.getTime(),
})