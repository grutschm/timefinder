const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const ical = require('ical');
const moment = require('moment');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());

const upload = multer({ dest: 'uploads/' });

app.post('/api/compare', upload.array('files'), (req, res) => {
  const { startDate, endDate, daysOfWeek, timeslots, duration, maxSuggestions } = req.body;
  const parsedDaysOfWeek = JSON.parse(daysOfWeek);
  const timeslotRanges = timeslots.split(',').map(range => range.trim().split('-'));
  const eventDuration = parseInt(duration, 10);
  const maxSuggestionsPerDay = parseInt(maxSuggestions, 10) || Infinity;

  // Parse calendar files
  const events = [];
  req.files.forEach(file => {
    const data = ical.parseFile(file.path);
    for (let k in data) {
      if (data.hasOwnProperty(k)) {
        const event = data[k];
        if (event.type === 'VEVENT') {
          events.push(event);
        }
      }
    }
  });

  // Create a map of busy times
  const busyTimes = {};

  events.forEach(event => {
    const eventStart = moment(event.start);
    const eventEnd = moment(event.end);
    const day = eventStart.format('YYYY-MM-DD');

    if (!busyTimes[day]) {
      busyTimes[day] = [];
    }

    busyTimes[day].push({ start: eventStart, end: eventEnd });
  });

  // Check for common available slots
  const start = moment(startDate);
  const end = moment(endDate);
  const availableTimes = {};

  for (let m = moment(start); m.isSameOrBefore(end); m.add(1, 'days')) {
    if (parsedDaysOfWeek[m.format('dddd')]) {
      const day = m.format('YYYY-MM-DD');
      if (!busyTimes[day]) {
        busyTimes[day] = [];
      }

      const dailySuggestions = [];

      timeslotRanges.forEach(range => {
        const [startTime, endTime] = range;
        const slotStart = moment(day + 'T' + startTime);
        const slotEnd = moment(day + 'T' + endTime);
        const durationInMs = eventDuration * 60 * 1000;

        for (let slot = slotStart.clone(); slot.isBefore(slotEnd); slot.add(eventDuration, 'minutes')) {
          const slotEnd = slot.clone().add(eventDuration, 'minutes');

          // Ensure slotEnd does not exceed the timeslot end time
          if (slotEnd.isAfter(moment(day + 'T' + endTime))) break;

          let isAvailable = true;
          for (let i = 0; i < busyTimes[day].length; i++) {
            const busyStart = busyTimes[day][i].start;
            const busyEnd = busyTimes[day][i].end;

            if (slot.isBefore(busyEnd) && slotEnd.isAfter(busyStart)) {
              isAvailable = false;
              break;
            }
          }

          if (isAvailable) {
            if (dailySuggestions.length < maxSuggestionsPerDay) {
              dailySuggestions.push({ start: slot.format(), end: slotEnd.format() });
            } else {
              break;
            }
          }
        }
      });

      if (dailySuggestions.length > 0) {
        availableTimes[day] = dailySuggestions;
      }
    }
  }

  res.send(availableTimes);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
