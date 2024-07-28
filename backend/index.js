const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const momentTz = require('moment-timezone');
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
app.use(bodyParser.urlencoded({ extended: true })); // Support form data

// Example root route
app.get('/', (req, res) => {
  res.send('Welcome to the Timefinder Backend API');
});

// Updated compare endpoint to use busyTimes
app.post('/api/compare', (req, res) => {
  const { startDate, endDate, daysOfWeek, timeslots, duration, maxSuggestions, timezone } = req.body;
  let busyTimes;
  try {
    busyTimes = JSON.parse(req.body.busyTimes);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid busyTimes format' });
  }

  // Log received data
  console.log("Received Form Data:");
  console.log("Start Date:", startDate);
  console.log("End Date:", endDate);
  console.log("Days of Week:", daysOfWeek);
  console.log("Timeslots:", timeslots);
  console.log("Duration:", duration);
  console.log("Max Suggestions:", maxSuggestions);
  console.log("Timezone:", timezone);
  console.log("Busy Times:", busyTimes);

  try {
    const parsedDaysOfWeek = JSON.parse(daysOfWeek);
    const timeslotRanges = timeslots.split(',').map(range => range.trim().split('-'));
    const eventDuration = parseInt(duration, 10) * 60 * 1000;  // Convert minutes to milliseconds
    const maxSuggestionsPerDay = parseInt(maxSuggestions, 10) || Infinity;

    console.log("Parsed Days of Week:", parsedDaysOfWeek);
    console.log("Timeslot Ranges:", timeslotRanges);
    console.log("Event Duration (milliseconds):", eventDuration);
    console.log("Max Suggestions Per Day:", maxSuggestionsPerDay);

    // Ensure busyTimes is parsed correctly
    const parsedBusyTimes = typeof busyTimes === 'string' ? JSON.parse(busyTimes) : busyTimes;

    console.log("Parsed Busy Times:", parsedBusyTimes);


  // Check for common available slots
  const start = moment.utc(startDate); // Ensure UTC
  const end = moment.utc(endDate); // Ensure UTC
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

  res.send(availableTimes);
} catch (error) {
  console.error("Error processing form data:", error);
  res.status(400).send({ error: "Invalid request data" });
}
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
