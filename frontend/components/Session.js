import React, { useEffect, useState } from 'react';
import { getSessions } from '../api';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await getSessions();
        setSessions(response.data);
      } catch (error) {
        alert('Error fetching sessions');
      }
    };

    fetchSessions();
  }, []);

  return (
    <div>
      <h2>Sessions</h2>
      <ul>
        {sessions.map((session) => (
          <li key={session._id}>{session.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default Sessions;
