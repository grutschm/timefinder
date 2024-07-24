import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './CalendarComparison.css';

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
  const [duration, setDuration] = useState('1');
  const [maxSuggestions, setMaxSuggestions] = useState('1');
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
                    <label className="form-label">Event Duration (hours):</label>
                    <select value={duration} onChange={(e) => setDuration(e.target.value)} className="form-control">
                      {[...Array(23).keys()].map(n => (
                        <option key={n + 1} value={n + 1}>{n + 1}</option>
                      ))}
                    </select>
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
                <button type="submit" className="btn btn-primary w-100">Compare Calendars</button>
              </form>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          {result && (
            <div className="card result-card">
              <div className="card-body">
                <h3>Common Available Times</h3>
                <ul className="list-group">
                  {Object.entries(result).map(([date, times]) => (
                    <li key={date} className="list-group-item">
                      <strong>{date}</strong>
                      <ul>
                        {times.map((time, index) => (
                          <li key={index}>{time.start} - {time.end}</li>
                        ))}
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
