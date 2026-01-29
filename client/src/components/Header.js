import React, { useState, useEffect } from 'react';
import './Header.css';

function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="header-logo-container">
          <img 
            src="/logo.png" 
            alt="Rectificadora Santofimio Logo" 
            className="header-logo"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
        <div className="user-name">Rectificadora Santofimio</div>
      </div>
      <div className="header-right">
        <div className="date-time">
          <span>{formatDate(currentTime)}</span>
          <span className="time">{formatTime(currentTime)}</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
