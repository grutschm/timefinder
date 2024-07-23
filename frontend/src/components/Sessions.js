import React, { useEffect, useState } from 'react';
import { getSessions, createSession } from '../api';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [sessionName, setSessionName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await getSessions();
        setSessions(response.data);
      } catch (error) {
        setError('Error fetching sessions');
        console.error(error);
      }
    };

    fetchSessions();
  }, []);

  const handleCreateSession = async () => {
    try {
      await createSession(sessionName);
      setSessionName('');
      const response = await getSessions();
      setSessions(response.data);
    } catch (error) {
      setError('Error creating session');
      console.error(error);
    }
  };

  return (
    <div>
      <h2>Sessions</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input
        type="text"
        value={sessionName}
        onChange={(e) => setSessionName(e.target.value)}
        placeholder="New Session Name"
      />
      <button onClick={handleCreateSession}>Create Session</button>
      <ul>
        {sessions.map((session) => (
          <li key={session._id}>{session.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default Sessions;
