const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const ical = require('ical');
const moment = require('moment');
const momentTz = require('moment-timezone');  // Import moment-timezone
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Define allowed origins
const allowedOrigins = [
  'http://localhost:3000',  // Allow local frontend during development
  'https://timefinder-frontend.azurestaticapps.net'  // Allow production frontend
];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

// Set up CORS with specific origins
app.use(cors(corsOptions));

app.use(bodyParser.json());

const upload = multer({ dest: 'uploads/' });

// Example root route
app.get('/', (req, res) => {
  res.send('Welcome to the Timefinder Backend API');
});

// Existing routes
app.post('/api/compare', upload.array('files'), (req, res) => {
  const { startDate, endDate, daysOfWeek, timeslots, duration, maxSuggestions, timezone } = req.body;
  console.log("Form input received - Start Date:", startDate, "End Date:", endDate, "Timeslots:", timeslots, "Timezone:", timezone);

  const parsedDaysOfWeek = JSON.parse(daysOfWeek);
  const timeslotRanges = timeslots.split(',').map(range => range.trim().split('-'));
  const eventDuration = parseInt(duration, 10) * 60 * 1000;  // Convert minutes to milliseconds
  console.log("Event Duration (milliseconds):", eventDuration);

  const start = moment.utc(startDate); // Ensure UTC
  const end = moment.utc(endDate); // Ensure UTC
  
  const maxSuggestionsPerDay = parseInt(maxSuggestions, 10) || Infinity;

  // Parse calendar files
  const events = [];
  const filterEnd = moment.utc(endDate).add(1, 'day') // Add 1 day to end date for filtering
  req.files.forEach(file => {
    console.log("Parsing file:", file.originalname);
    const data = ical.parseFile(file.path);
    for (let k in data) {
      if (data.hasOwnProperty(k)) {
        const event = data[k];
        if (event.type === 'VEVENT' && moment.utc(event.start) >= start && moment.utc(event.end) <= filterEnd) {
          events.push(event);
        }
      }
    }
  });

  // Create a map of busy times
  const busyTimes = {};

  events.forEach(event => {
    const eventStart = moment.utc(event.start); // Ensure UTC
    const eventEnd = moment.utc(event.end); // Ensure UTC
    console.log("Parsed Event - Start:", eventStart.format(), "End:", eventEnd.format());
    const day = eventStart.format('YYYY-MM-DD');

    if (!busyTimes[day]) {
      busyTimes[day] = [];
    }

    busyTimes[day].push({ start: eventStart, end: eventEnd });
  });

  // Check for common available slots
  console.log("Processed Dates - Start Date (UTC):", start.format(), "End Date (UTC):", end.format());

  const availableTimes = {};

  for (let m = moment.utc(start); m.isSameOrBefore(end); m.add(1, 'days')) {
    if (parsedDaysOfWeek[m.format('dddd')]) {
      const day = m.format('YYYY-MM-DD');
      if (!busyTimes[day]) {
        busyTimes[day] = [];
      }

      const dailySuggestions = [];

      timeslotRanges.forEach(range => {
        const [startTime, endTime] = range;
        const localSlotStart = moment.tz(day + 'T' + startTime, timezone); // Local time with timezone
        const localSlotEnd = moment.tz(day + 'T' + endTime, timezone); // Local time with timezone
        console.log("Local Timeslot - Start:", localSlotStart.format(), "End:", localSlotEnd.format());
        
        const slotStart = localSlotStart.utc(); // Convert to UTC
        const slotEnd = localSlotEnd.utc(); // Convert to UTC
        console.log("Converted Timeslot (UTC) - Start:", slotStart.format(), "End:", slotEnd.format());

        for (let slot = slotStart.clone(); slot.isBefore(slotEnd); slot.add(eventDuration, 'milliseconds')) {
          const suggestionEnd = slot.clone().add(eventDuration, 'milliseconds');
          console.log("Evaluating Slot - Start:", slot.format(), "End:", suggestionEnd.format());

          // Ensure slotEnd does not exceed the timeslot end time
          if (suggestionEnd.isAfter(slotEnd)) break;

          let isAvailable = true;
          for (let i = 0; i < busyTimes[day].length; i++) {
            const busyStart = busyTimes[day][i].start;
            const busyEnd = busyTimes[day][i].end;

            if (slot.isBefore(busyEnd) && suggestionEnd.isAfter(busyStart)) {
              isAvailable = false;
              break;
            }
          }

          if (isAvailable) {
            if (dailySuggestions.length < maxSuggestionsPerDay) {
              dailySuggestions.push({ start: slot.format(), end: suggestionEnd.format() });
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

  console.log("Available Times:", availableTimes);
  res.send(availableTimes);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
