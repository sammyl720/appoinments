const times = ['5:30PM', '6:00PM', '3:30PM', '7:15PM', '5:15PM', '6:30PM', '8:00PM', '1:15PM', '6:15PM', '8:30PM', '4:15PM', '7:45PM', '6:15PM', '9:00PM', '1:30PM', '2:30PM', '1:00PM', '1:45PM', '1:15PM', '1:45PM', '1:15PM', '1:45PM', '1:30PM', '6:00PM', '1:15PM', '2:00PM', '6:45PM', '4:00PM', '3:45PM', '8:30PM', '5:30PM', '3:15PM', '6:15PM', '8:30PM', '6:45PM', '7:00PM', '2:00PM', '1:30PM', '6:00PM', '4:15PM'];

console.log('unsorted', times);

times.sort((firstTime, secondTime) => {
  const first = getMinuteAndHour(firstTime)
  const second = getMinuteAndHour(secondTime);

  const isFirstGreater = first.hour === second.hour ? first.minute > second.minute : first.hour > second.hour;
  return isFirstGreater ? 1 : -1;
})

console.log('Sorted: ', times);

function getMinuteAndHour(time) {
  const [hour, minute] = removePM(time).split(':').map(val => parseInt(val))
  return { hour, minute }
}

function removePM(time) {
  return time.substring(0, time.indexOf('PM'))
}