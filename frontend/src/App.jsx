import React, { useState, useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import SafetyZones from './pages/SafetyZones';
import AIChat from './pages/AIChat';
import HRDashboard from './pages/HRDashboard';
import Settings from './pages/Settings';
import AnonymousCall from './components/AnonymousCall';
import StealthDisguise from './components/StealthDisguise';

const SafeCompanionApp = () => {
  const { user, loading, logout } = useContext(AuthContext);
  const [page, setPage] = useState('login');
  const [showAICall, setShowAICall] = useState(false);

  // Loading Screen
  if (loading) {
    return (
      <div style={{
        height: '100vh',
        background: 'var(--bg-darker)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white'
      }}>
        <i className="fa-solid fa-shield-halved fa-spin" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '16px' }}></i>
        <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>SafeCompanion Securing System...</div>
      </div>
    );
  }

  // Handle disguise unlock callback
  const handleUnlockDisguise = () => {
    setPage('dashboard');
  };

  // If user is disguised as calculator
  if (user && page === 'disguise') {
    return <StealthDisguise onUnlock={handleUnlockDisguise} />;
  }

  // Auth pages routing
  if (!user) {
    if (page === 'signup') {
      return <Signup setPage={setPage} />;
    }
    return <Login setPage={setPage} />;
  }

  // If user is authenticated, render Main Dashboard Navigation Structure
  return (
    <div className="app-container">
      
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '20px', borderBottom: '1px solid var(--border-glass)' }}>
          <span style={{ fontSize: '2rem' }}>🛡️</span>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', lineHeight: 1.1 }} className="text-gradient">SafeCompanion</h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Buildathon 2026</span>
          </div>
        </div>

        <ul className="nav-list">
          <li>
            <div
              className={`nav-item ${page === 'dashboard' ? 'active' : ''}`}
              onClick={() => setPage('dashboard')}
            >
              <i className="fa-solid fa-circle-nodes"></i>
              <span>Safety Cockpit</span>
            </div>
          </li>
          <li>
            <div
              className={`nav-item ${page === 'zones' ? 'active' : ''}`}
              onClick={() => setPage('zones')}
            >
              <i className="fa-solid fa-map-location-dot"></i>
              <span>Safety Zones</span>
            </div>
          </li>
          <li>
            <div
              className={`nav-item ${page === 'chat' ? 'active' : ''}`}
              onClick={() => setPage('chat')}
            >
              <i className="fa-solid fa-user-shield"></i>
              <span>AI Guardian Chat</span>
            </div>
          </li>
          
          {/* MERN corporate HR role routing restriction */}
          {user.role === 'hr' && (
            <li>
              <div
                className={`nav-item ${page === 'hr' ? 'active' : ''}`}
                onClick={() => setPage('hr')}
              >
                <i className="fa-solid fa-laptop-code"></i>
                <span>Corporate HR Console</span>
              </div>
            </li>
          )}

          <li>
            <div
              className={`nav-item ${page === 'settings' ? 'active' : ''}`}
              onClick={() => setPage('settings')}
            >
              <i className="fa-solid fa-sliders"></i>
              <span>Guard Settings</span>
            </div>
          </li>
        </ul>

        {/* Sidebar Footer User Badge */}
        <div className="sidebar-footer">
          <div className="user-badge">
            <div className="avatar">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="user-info" style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.username}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--secondary)', fontWeight: '700', textTransform: 'uppercase' }}>
                Role: {user.role}
              </div>
            </div>
          </div>
          
          <button
            onClick={() => {
              logout();
              setPage('login');
            }}
            className="btn-glass"
            style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
          >
            <i className="fa-solid fa-power-off"></i> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {page === 'dashboard' && <Dashboard triggerAICall={() => setShowAICall(true)} setPage={setPage} />}
        {page === 'zones' && <SafetyZones />}
        {page === 'chat' && <AIChat triggerAICall={() => setShowAICall(true)} />}
        {page === 'hr' && <HRDashboard />}
        {page === 'settings' && <Settings />}
      </main>

      {/* Star Feature: Anonymous Deterrent phone call screen overlay */}
      <AnonymousCall active={showAICall} onClose={() => setShowAICall(false)} />
    </div>
  );
};

// Top wrapper providing global Auth Context
const App = () => {
  return (
    <AuthProvider>
      <SafeCompanionApp />
    </AuthProvider>
  );
};

export default App;
