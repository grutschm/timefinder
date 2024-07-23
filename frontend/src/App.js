import React from 'react';
import './App.css';
import Register from './components/Register';
import Login from './components/Login';
import Sessions from './components/Sessions';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Timefinder</h1>
        <Register />
        <Login />
        <Sessions />
      </header>
    </div>
  );
}

export default App;
