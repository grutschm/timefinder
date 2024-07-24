import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const CalendarComparison = () => {
  const [files, setFiles] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState({
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
    Sunday: false
  });
  const [timeslots, setTimeslots] = useState('');
  const [duration, setDuration] = useState('');
  const [maxSuggestions, setMaxSuggestions] = useState('');
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleDayChange = (e) => {
    const { name, checked } = e.target;
    setDaysOfWeek({ ...daysOfWeek, [name]: checked });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });
    formData.append('startDate', startDate);
    formData.append('endDate', endDate);
    formData.append('daysOfWeek', JSON.stringify(daysOfWeek));
    formData.append('timeslots', timeslots);
    formData.append('duration', duration);
    formData.append('maxSuggestions', maxSuggestions);

    try {
      const response = await axios.post('https://timefinder-backend.azurewebsites.net/api/compare', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResult(response.data);
    } catch (error) {
      console.error('Error comparing calendars', error);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Calendar Comparison</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Upload Calendar Files:</label>
          <input type="file" multiple onChange={handleFileChange} className="form-control" />
        </div>
        <div className="mb-3">
          <label className="form-label">Start Date:</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="form-control" />
        </div>
        <div className="mb-3">
          <label className="form-label">End Date:</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="form-control" />
        </div>
        <div className="mb-3">
          <label className="form-label">Select Days of the Week:</label>
          {Object.keys(daysOfWeek).map((day) => (
            <div key={day} className="form-check">
              <label className="form-check-label">
                <input
                  type="checkbox"
                  name={day}
                  checked={daysOfWeek[day]}
                  onChange={handleDayChange}
                  className="form-check-input"
                />
                {day}
              </label>
            </div>
          ))}
        </div>
        <div className="mb-3">
          <label className="form-label">Timeslots (e.g., 09:00-11:00, 13:00-15:00):</label>
          <input type="text" value={timeslots} onChange={(e) => setTimeslots(e.target.value)} className="form-control" />
        </div>
        <div className="mb-3">
          <label className="form-label">Event Duration (minutes):</label>
          <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="form-control" />
        </div>
        <div className="mb-3">
          <label className="form-label">Max Suggestions Per Day:</label>
          <input type="number" value={maxSuggestions} onChange={(e) => setMaxSuggestions(e.target.value)} className="form-control" />
        </div>
        <button type="submit" className="btn btn-primary">Compare Calendars</button>
      </form>
      {result && (
        <div className="mt-4">
          <h3>Common Available Times</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default CalendarComparison;
