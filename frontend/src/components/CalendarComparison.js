import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './CalendarComparison.css';
import moment from 'moment';
import momentTz from 'moment-timezone';
import ICAL from 'ical.js';

const CalendarComparison = () => {
  const [files, setFiles] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState({
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: true,
    Sunday: true
  });
  const [timeslots, setTimeslots] = useState('');
  const [duration, setDuration] = useState('180'); // Default to 3 hours (180 minutes)
  const [maxSuggestions, setMaxSuggestions] = useState('1');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false); // Add loading state

  const timezone = moment.tz.guess(); // Detect user's local timezone

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleDayChange = (e) => {
    setDaysOfWeek({
      ...daysOfWeek,
      [e.target.name]: e.target.checked,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading state to true
  
    const busyTimes = await parseCalendarFiles(files, startDate, endDate);
  
    const formData = {
      startDate,
      endDate,
      daysOfWeek: JSON.stringify(daysOfWeek),
      timeslots,
      duration,
      maxSuggestions,
      timezone,
      busyTimes: JSON.stringify(busyTimes)  // Convert busyTimes to JSON string
    };
  
    console.log("Form Data:", formData);
  
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/compare`, formData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log("Received response:", response.data);
      setResult(response.data);
    } catch (error) {
      console.error('Error comparing calendars', error);
    } finally {
      setLoading(false); // Reset loading state
    }
  };
  
  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title mb-4">Calendar Comparison</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Upload Calendar Files:</label>
                  <input type="file" multiple onChange={handleFileChange} className="form-control" />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Start Date:</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="form-control" />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">End Date:</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="form-control" />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Select Days of the Week:</label>
                  <div className="row">
                    {Object.keys(daysOfWeek).map((day) => (
                      <div key={day} className="col-md-3 mb-3">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            name={day}
                            checked={daysOfWeek[day]}
                            onChange={handleDayChange}
                            className="form-check-input"
                            id={day}
                          />
                          <label className="form-check-label" htmlFor={day}>
                            {day}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Timeslots:</label>
                  <input type="text" value={timeslots} onChange={(e) => setTimeslots(e.target.value)} className="form-control" placeholder="e.g., 09:00-11:00, 13:00-15:00" />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Event Duration (minutes):</label>
                    <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="form-control" placeholder="e.g., 180" />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Max Suggestions Per Day:</label>
                    <select value={maxSuggestions} onChange={(e) => setMaxSuggestions(e.target.value)} className="form-control">
                      {[1, 2, 3].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? (
                    <>
                      <span>Loading...</span>
                      <div className="spinner-border spinner-border-sm ms-2" role="status">
                        <span className="sr-only">Loading...</span>
                      </div>
                    </>
                  ) : (
                    'Compare Calendars'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          {result && (
            <div className="card result-card">
              <div className="card-body">
                <h3>Common Available Times</h3>
                <ul className="list-group text-left"> {/* Align text to the left */}
                  {Object.entries(result).map(([date, times]) => (
                    <li key={date} className="list-group-item">
                      <strong>{moment.utc(date).local().format('dddd, DD. MMMM')}</strong>
                      <ul>
                        {times.map((time, index) => {
                          const localStart = moment.utc(time.start).local();
                          console.log("Displaying time (UTC to Local) - Start:", time.start, "Local Start:", localStart.format('dddd, DD. MMMM HH:mm'));
                          return (
                            <li key={index}>{localStart.format('dddd, DD. MMMM HH:mm')}</li> // Convert UTC to local time
                          );
                        })}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarComparison;


// parse calendar function
const parseCalendarFiles = async (files, startDate, endDate) => {
  const busyTimes = {};

  const startMoment = moment(startDate);
  const endMoment = moment(endDate).add(1, 'days'); // Add 1 day to include the end date

  for (const file of files) {
    const data = await file.text();
    const jcalData = ICAL.parse(data);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    vevents.forEach(event => {
      const dtstart = event.getFirstPropertyValue('dtstart');
      const dtend = event.getFirstPropertyValue('dtend');

      if (dtstart && dtend) {
        const eventStart = moment(dtstart.toJSDate());
        const eventEnd = moment(dtend.toJSDate());

        // Filter events within the specified date range
        if (eventStart.isBetween(startMoment, endMoment, 'day', '[]') || eventEnd.isBetween(startMoment, endMoment, 'day', '[]')) {
          const day = eventStart.format('YYYY-MM-DD');
          if (!busyTimes[day]) {
            busyTimes[day] = [];
          }
          busyTimes[day].push({ start: eventStart.toISOString(), end: eventEnd.toISOString() });
        }
      }
    });
  }

  return busyTimes;
};
