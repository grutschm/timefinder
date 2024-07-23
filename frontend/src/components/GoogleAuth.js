import React, { useState, useEffect } from 'react';
import { getGoogleAuthUrl, getCalendarEvents } from '../api';

const GoogleAuth = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await getCalendarEvents();
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching events', error);
      }
    };
    fetchEvents();
  }, []);

  const handleAuth = async () => {
    const url = await getGoogleAuthUrl();
    window.location.href = url;
  };

  return (
    <div>
      <h2>Google Calendar Events</h2>
      <button onClick={handleAuth}>Connect to Google Calendar</button>
      <ul>
        {events.map(event => (
          <li key={event.id}>{event.summary} - {new Date(event.start.dateTime).toLocaleString()}</li>
        ))}
      </ul>
    </div>
  );
};

export default GoogleAuth;
