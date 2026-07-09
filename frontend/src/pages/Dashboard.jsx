import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

const Dashboard = ({ triggerAICall, setPage }) => {
  const { user, updateStatus, updateLocation, uploadEvidence } = useContext(AuthContext);
  const [sosCountdown, setSosCountdown] = useState(null);
  const [gpsSimulated, setGpsSimulated] = useState({ lat: 12.9716, lng: 77.5946 });
  const [twilioAlertLog, setTwilioAlertLog] = useState([]);
  
  // Advanced Features State
  const [evidenceSyncedLogs, setEvidenceSyncedLogs] = useState([]);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Request browser location permission on load if logged in
  useEffect(() => {
    if (user && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setGpsSimulated({ lat, lng });
          updateLocation(lat, lng);
          logTwilioAlert(`📍 REAL GPS POSITION ACQUIRED: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        },
        (error) => {
          console.warn("Location permission denied, using simulated coordinates:", error.message);
          logTwilioAlert("⚠️ GPS Permission denied. Running on simulated coordinates.");
        }
      );
    }
  }, [user]);

  useEffect(() => {
    // Continuous GPS updates simulation
    const interval = setInterval(() => {
      if (user && user.status === 'Safe') {
        setGpsSimulated(prev => {
          const nextCoords = {
            lat: prev.lat + (Math.random() - 0.5) * 0.0002,
            lng: prev.lng + (Math.random() - 0.5) * 0.0002
          };
          updateLocation(nextCoords.lat, nextCoords.lng);
          return nextCoords;
        });
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [user]);

  // Audio Recording duration tracker in active SOS
  useEffect(() => {
    let interval;
    let timer;
    if (user.status === 'SOS Active') {
      setRecordingSeconds(0);
      timer = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      let counter = 0;
      interval = setInterval(async () => {
        counter += 5;
        const transcriptions = [
          "Ambient heavy footfalls. Rapid scuffling sounds in background.",
          "High frequency vocal screams. Alert triggered.",
          "Loud arguing noise. Distant vehicle engines."
        ];
        const selectedTranscription = transcriptions[Math.floor(Math.random() * transcriptions.length)];
        
        const res = await uploadEvidence(selectedTranscription, `0:${counter.toString().padStart(2, '0')}`);
        
        if (res.success) {
          setEvidenceSyncedLogs(prev => [
            `🔒 Block #${Math.random().toString(36).substring(3, 8).toUpperCase()} synced (AES-256 hash: ${res.evidence.encryptedHash.substring(0, 15)}...)`,
            ...prev
          ]);
        }
      }, 5000);
    } else {
      setEvidenceSyncedLogs([]);
      setRecordingSeconds(0);
    }

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [user.status]);

  const triggerSOS = async () => {
    setSosCountdown(null);
    await updateStatus('SOS Active');
    
    // Twilio Mock Warning Dispatch containing real emergency contacts!
    const contactsText = user.emergencyContacts && user.emergencyContacts.length > 0
      ? user.emergencyContacts.map(c => `${c.name} (${c.phone})`).join(', ')
      : "Emergency Contacts List";
      
    logTwilioAlert(`🔴 TWILIO EMERGENCY DISPATCH: Sent live location SMS & audio call to your circle: ${contactsText}`);
    triggerAICall();
  };

  const startSOSCountdown = () => {
    if (user.status === 'SOS Active') {
      cancelSOS();
      return;
    }
    
    let count = 3;
    setSosCountdown(count);
    
    const interval = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(interval);
        triggerSOS();
      } else {
        setSosCountdown(count);
      }
    }, 1000);
    
    window.currentSosInterval = interval;
  };

  const cancelSOS = async () => {
    if (window.currentSosInterval) {
      clearInterval(window.currentSosInterval);
    }
    setSosCountdown(null);
    await updateStatus('Safe');
    logTwilioAlert('🟢 STATUS RESOLVED: Alarm canceled. emergency contacts notified of safety.');
  };

  const logTwilioAlert = (msg) => {
    setTwilioAlertLog(prev => [
      { id: Date.now(), time: new Date().toLocaleTimeString(), text: msg },
      ...prev.slice(0, 4)
    ]);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Safety Cockpit</h1>
          <p style={{ color: 'var(--text-muted)' }}>Proactive monitoring console & active triggers</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>MAPPED COORDINATES</div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: 'var(--secondary)', fontWeight: '600' }}>
            {gpsSimulated.lat.toFixed(6)}, {gpsSimulated.lng.toFixed(6)}
          </div>
        </div>
      </div>

      {/* Safety Status Banner */}
      <div
        id="dashboard-status-banner"
        className={`safety-banner ${
          user.status === 'Safe' ? 'safe' : user.status === 'Anomaly Detected' ? 'warning' : 'danger'
        }`}
      >
        <div style={{ fontSize: '1.8rem' }}>
          {user.status === 'Safe' ? (
            <i className="fa-solid fa-circle-check"></i>
          ) : user.status === 'Anomaly Detected' ? (
            <i className="fa-solid fa-triangle-exclamation"></i>
          ) : (
            <i className="fa-solid fa-radiation fa-spin"></i>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.2rem', textTransform: 'uppercase' }}>
            {user.status === 'Safe' ? 'Active Guardian: SECURE' : `${user.status}: ALERT ACTIVE`}
          </h3>
          <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            {user.status === 'Safe'
              ? 'SafeCompanion is running silently. Your HR safety desk and emergency circle are connected.'
              : user.status === 'Anomaly Detected'
              ? 'LSTM detector noticed route deviation. Click "Cancel SOS" if you are safe, or app will auto-escalate.'
              : 'CRITICAL distress triggered! AI deterrent call active. AES-256 secure recording is uploading to cloud.'}
          </p>
        </div>
        {user.status !== 'Safe' && (
          <button className="btn-glass" onClick={cancelSOS} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)' }}>
            I am Safe / Cancel
          </button>
        )}
      </div>

      <div className="cockpit-grid" style={{ gridTemplateColumns: user.status === 'SOS Active' ? '1.2fr 1fr' : undefined }}>
        
        {/* Card 1: Core SOS Button */}
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '180px', margin: '0 auto 16px' }}>
            <div className="sos-outer-ring" style={{ width: '150px', height: '150px' }}>
              <div className="sos-middle-ring" style={{ width: '125px', height: '125px' }}>
                <button
                  className="sos-btn"
                  onClick={startSOSCountdown}
                  style={{
                    width: '100px',
                    height: '100px',
                    fontSize: '1.25rem',
                    background: sosCountdown !== null ? 'var(--secondary)' : undefined,
                    boxShadow: sosCountdown !== null ? '0 8px 30px var(--secondary-glow)' : undefined
                  }}
                >
                  {sosCountdown !== null ? (
                    <span style={{ fontSize: '2rem', fontWeight: '900' }}>{sosCountdown}</span>
                  ) : user.status === 'SOS Active' ? (
                    <span style={{ fontSize: '0.85rem' }}><i className="fa-solid fa-shield-halved fa-beat"></i> ON CALL</span>
                  ) : (
                    <span>SOS</span>
                  )}
                </button>
              </div>
            </div>
          </div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>
            {sosCountdown !== null ? 'HOLD TO CANCEL - SENDING IN...' : user.status === 'SOS Active' ? 'SOS BROADCAST ACTIVE' : 'TAP TO BROADCAST'}
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto', fontSize: '0.85rem', marginBottom: '12px' }}>
            {user.status === 'SOS Active'
              ? 'Your emergency contacts are receiving live location links. Incident sound records are locked.'
              : 'Press once to trigger a 3-second countdown. Shouting distress keywords triggers instantly.'}
          </p>

          {/* Real-time Clickable Call Buttons for Emergency Circle */}
          {user.status === 'SOS Active' && user.emergencyContacts && user.emergencyContacts.length > 0 && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                📞 Call Guardian Instantly:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {user.emergencyContacts.map((contact, idx) => (
                  <a
                    key={idx}
                    href={`tel:${contact.phone}`}
                    className="btn-secondary"
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.78rem',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <i className="fa-solid fa-phone"></i> Call {contact.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Real-time Evidence Vault (Active SOS) OR Anonymous Call Card (Safe) */}
        {user.status === 'SOS Active' ? (
          <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--danger)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                <i className="fa-solid fa-lock fa-bounce"></i> AI Evidence Vault
              </h3>
              <div style={{ background: 'rgba(184,58,37,0.15)', color: 'var(--danger)', fontSize: '0.72rem', fontWeight: '800', padding: '4px 8px', borderRadius: '4px' }}>
                🔴 SECURE STREAMING
              </div>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Smartphone microphones are active. Audio streams are divided into 3-second packages, encrypted with **AES-256**, and dynamically synced to MERN nodes.
            </p>

            <div style={{ background: '#171311', borderRadius: '10px', padding: '16px', flex: 1, overflowY: 'auto', maxHeight: '160px', border: '1px solid var(--border-glass)' }}>
              {evidenceSyncedLogs.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '16px' }}>
                  <i className="fa-solid fa-spinner fa-spin"></i> Initializing encrypted connection block...
                </div>
              ) : (
                evidenceSyncedLogs.map((log, index) => (
                  <div key={index} style={{ fontSize: '0.8rem', color: 'var(--primary)', fontFamily: 'monospace', marginBottom: '8px', borderBottom: '1px dashed rgba(221,192,169,0.1)', paddingBottom: '6px' }}>
                    {log}
                  </div>
                ))
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>Recording: {recordingSeconds} seconds</span>
              <span style={{ color: 'var(--secondary)' }}>Cloud Vault: Synced ({evidenceSyncedLogs.length} blocks)</span>
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div className="avatar" style={{ background: 'var(--secondary)' }}>
                <i className="fa-solid fa-phone-volume"></i>
              </div>
              <div style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '700', padding: '4px 8px' }}>
                STAR FEATURE
              </div>
            </div>
            <h3 style={{ marginBottom: '6px', fontSize: '1.25rem' }}>Anonymous AI Call</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '16px' }}>
              Generates a realistic family guardian or police checkpost call playing loudly on speaker to scare away strangers. Customize caller profile in Settings.
            </p>
            <button className="btn-secondary" onClick={triggerAICall} style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}>
              <span><i className="fa-solid fa-phone"></i> Play Deterrent Call</span>
            </button>
          </div>
        )}

        {/* Card 3: Quick-Dial Emergency Circle (Only visible when status is Safe) */}
        {user.status !== 'SOS Active' && (
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div className="avatar" style={{ background: 'var(--primary)' }}>
                <i className="fa-solid fa-phone"></i>
              </div>
              <div style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '700', padding: '4px 8px' }}>
                QUICK CONTACT
              </div>
            </div>
            <h3 style={{ marginBottom: '6px', fontSize: '1.25rem' }}>Emergency Circle</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '16px' }}>
              One-click dial to call your trusted emergency contacts directly from your device.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {user.emergencyContacts && user.emergencyContacts.length > 0 ? (
                user.emergencyContacts.map((contact, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: '700' }}>{contact.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{contact.phone}</div>
                    </div>
                    <a
                      href={`tel:${contact.phone}`}
                      className="btn-glass"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.78rem',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <i className="fa-solid fa-phone" style={{ fontSize: '0.75rem' }}></i> Call
                    </a>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
                  No contacts found. Configure them under the <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }} onClick={() => document.getElementById('settings')?.scrollIntoView({ behavior: 'smooth' })}>Settings</span> tab.
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Real-time Twilio & Security Event Logs */}
      {twilioAlertLog.length > 0 && (
        <div className="glass-panel" style={{ padding: '24px', marginTop: '32px' }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-terminal" style={{ color: 'var(--primary)' }}></i> Mock Twilio & Event Logs
          </h3>
          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '16px', border: '1px solid var(--border-glass)' }}>
            {twilioAlertLog.map(log => (
              <div key={log.id} style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', marginBottom: '10px', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>[{log.time}]</span>
                <span style={{ color: log.text.includes('🔴') ? 'var(--secondary)' : log.text.includes('⚠️') ? 'var(--secondary)' : 'var(--primary)', fontWeight: '600' }}>
                  {log.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
