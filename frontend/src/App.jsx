import React, { useState, useContext, useEffect, useRef } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Sentinel from './pages/Sentinel';
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
  const [activeSection, setActiveSection] = useState('cockpit');
  const isScrollingRef = useRef(false);

  // Handle calculator disguise unlock callback
  const handleUnlockDisguise = () => {
    setPage('dashboard');
  };

  // Helper to compute absolute offset from the top of the document
  const getAbsoluteOffsetTop = (el) => {
    let offsetTop = 0;
    let current = el;
    while (current) {
      offsetTop += current.offsetTop;
      current = current.offsetParent;
    }
    return offsetTop;
  };

  // ScrollSpy Listener: Detects which section is active on scroll and updates the active navbar tab!
  useEffect(() => {
    if (!user || page !== 'dashboard') return;

    const sections = ['cockpit', 'voice-sentinel', 'map-zones', 'ai-chat', 'settings'];
    if (user.role === 'hr') sections.push('hr-console');

    const handleScroll = () => {
      // If we are actively animating a smooth scroll via clicking, skip updating state to prevent stutters
      if (isScrollingRef.current) return;

      const scrollPosition = window.scrollY + 140; // Offset for the top sticky bar

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = getAbsoluteOffsetTop(el);
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    // Run once on load to highlight the current section
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [user, page]);

  // Smooth scroll handler
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      isScrollingRef.current = true;
      setActiveSection(id);

      const targetTop = getAbsoluteOffsetTop(el) - 80; // Offset for sticky navbar

      window.scrollTo({
        top: targetTop,
        behavior: 'smooth'
      });

      // Release lock after smooth scroll animation completes (800ms)
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
    }
  };

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

  // If user is authenticated, render the single-page dashboard layout with sticky horizontal navbar
  return (
    <div className="app-container">
      
      <main className="main-content">
        
        {/* Sticky Top Horizontal Navigation Header */}
        <nav className="top-navbar-sticky">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>🛡️</span>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', lineHeight: 1 }} className="text-gradient">SafeCompanion</h2>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Safety Guardian Portal</span>
            </div>
          </div>

          {/* Nav Tabs */}
          <ul className="navbar-tabs">
            <li className={`navbar-tab-item ${activeSection === 'cockpit' ? 'active' : ''}`} onClick={() => scrollToSection('cockpit')}>
              Cockpit
            </li>
            <li className={`navbar-tab-item ${activeSection === 'voice-sentinel' ? 'active' : ''}`} onClick={() => scrollToSection('voice-sentinel')}>
              Sentinel
            </li>
            <li className={`navbar-tab-item ${activeSection === 'map-zones' ? 'active' : ''}`} onClick={() => scrollToSection('map-zones')}>
              Safety Map
            </li>
            <li className={`navbar-tab-item ${activeSection === 'ai-chat' ? 'active' : ''}`} onClick={() => scrollToSection('ai-chat')}>
              AI Chat
            </li>
            {user.role === 'hr' && (
              <li className={`navbar-tab-item ${activeSection === 'hr-console' ? 'active' : ''}`} onClick={() => scrollToSection('hr-console')}>
                HR Dashboard
              </li>
            )}
            <li className={`navbar-tab-item ${activeSection === 'settings' ? 'active' : ''}`} onClick={() => scrollToSection('settings')}>
              Settings
            </li>
          </ul>

          {/* User profile and Disguise button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="btn-glass" onClick={() => setPage('disguise')} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              <i className="fa-solid fa-calculator"></i> Mask App
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '700' }} className="user-info">{user.username}</span>
            </div>
            <button
              onClick={() => {
                logout();
                setPage('login');
              }}
              style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', fontSize: '1rem' }}
              title="Sign Out"
            >
              <i className="fa-solid fa-power-off"></i>
            </button>
          </div>
        </nav>

        {/* Stacked Single-Page Sections */}
        <div id="cockpit" className="dashboard-section">
          <Dashboard triggerAICall={() => setShowAICall(true)} setPage={setPage} />
        </div>

        <div id="voice-sentinel" className="dashboard-section">
          <h2>🛡️ Voice & Audio Sentinel</h2>
          <Sentinel triggerAICall={() => setShowAICall(true)} />
        </div>

        <div id="map-zones" className="dashboard-section">
          <h2>🗺️ AI Safest Route Map</h2>
          <SafetyZones />
        </div>

        <div id="ai-chat" className="dashboard-section">
          <h2>💬 AI Safety Guardian</h2>
          <AIChat triggerAICall={() => setShowAICall(true)} />
        </div>
        
        {user.role === 'hr' && (
          <div id="hr-console" className="dashboard-section">
            <h2>💼 B2B Employee Safety console</h2>
            <HRDashboard />
          </div>
        )}

        <div id="settings" className="dashboard-section">
          <h2>⚙️ Guard Settings</h2>
          <Settings />
        </div>

      </main>

      {/* Star Feature: Anonymous speech dialer call screen overlay */}
      <AnonymousCall active={showAICall} onClose={() => setShowAICall(false)} />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <SafeCompanionApp />
    </AuthProvider>
  );
};

export default App;
