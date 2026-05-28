import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const HRDashboard = () => {
  const { user } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [patrolStatus, setPatrolStatus] = useState(null);
  
  // Advanced Features State
  const [evidenceLogs, setEvidenceLogs] = useState([]);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' or 'evidence'
  const [ambientAudioLevel, setAmbientAudioLevel] = useState(15);
  const [liveTranscript, setLiveTranscript] = useState('Listening to bridge...');

  // B2B Cab Ride Simulator State
  const [cabRideActive, setCabRideActive] = useState(false);
  const [cabPosition, setCabPosition] = useState({ x: 20, y: 110 }); // Canvas pixels
  const [cabStatusText, setCabStatusText] = useState('Cab standing at Tech-Park pick-up point.');
  const [cabAnomalyTriggered, setCabAnomalyTriggered] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://safecompanion-rxve.onrender.com/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setEmployees(data.users);
      }
    } catch (err) {
      console.error("Error fetching employees for HR desk:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvidenceLogs = async () => {
    setLoadingEvidence(true);
    try {
      const res = await fetch('https://safecompanion-rxve.onrender.com/api/auth/evidence', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setEvidenceLogs(data.evidence);
      }
    } catch (err) {
      console.error("Error fetching evidence vault logs:", err);
    } finally {
      setLoadingEvidence(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    
    const interval = setInterval(() => {
      fetchEmployees();
      if (activeTab === 'evidence') {
        fetchEvidenceLogs();
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [activeTab]);

  // Audio waveform slider and transcript simulation when selected employee is in SOS
  useEffect(() => {
    let audioInterval;
    let transcriptInterval;
    
    if (selectedEmp && selectedEmp.status === 'SOS Active') {
      const transcripts = [
        "🔊 Ambient scuffling noises. Heavy running footfalls detected.",
        "🔊 Female vocal spike captured: 'STOP IT! Go away!'",
        "🔊 Distant automobile engines. Constant heavy breathing.",
        "🔊 Shouting heard: 'I have shared my live location, stay back!'"
      ];

      audioInterval = setInterval(() => {
        setAmbientAudioLevel(Math.floor(Math.random() * 45) + 35);
      }, 500);

      transcriptInterval = setInterval(() => {
        setLiveTranscript(transcripts[Math.floor(Math.random() * transcripts.length)]);
      }, 4000);
    } else {
      setAmbientAudioLevel(15);
      setLiveTranscript('Mic bridge offline.');
    }

    return () => {
      clearInterval(audioInterval);
      clearInterval(transcriptInterval);
    };
  }, [selectedEmp]);

  // Cab Journey Simulator Game Loop
  useEffect(() => {
    let loop;
    if (cabRideActive && !cabAnomalyTriggered) {
      loop = setInterval(() => {
        setCabPosition(prev => {
          // Creep from left (pick up) to right (Capgemini Campus)
          const nextX = prev.x + 8;
          
          if (nextX >= 280) {
            // Reached destination!
            setCabRideActive(false);
            setCabStatusText('✅ Cab safely arrived at Capgemini campus. Journey secured.');
            return { x: 280, y: 30 };
          }

          // Generate sequential journey log entries based on vehicle X position
          if (nextX < 100) {
            setCabStatusText(`🚕 Cab boarding completed. Passing Tech-Park Gate. Speed: 42km/h.`);
          } else if (nextX >= 100 && nextX < 200) {
            setCabStatusText(`🚕 Entering Main Ring-road Highway. GPS Alignment: 100%.`);
          } else {
            setCabStatusText(`🚕 Approaching Sector 5 flyover. Speed: 52km/h. Escort check-in: SECURE.`);
          }

          return { x: nextX, y: 110 - (nextX * 0.28) }; // Move diagonally upwards
        });
      }, 1000);
    }
    return () => clearInterval(loop);
  }, [cabRideActive, cabAnomalyTriggered]);

  // Sync selected employee state when employees array updates
  useEffect(() => {
    if (selectedEmp) {
      const updated = employees.find(e => e._id === selectedEmp._id);
      if (updated) setSelectedEmp(updated);
    }
  }, [employees]);

  const startCabJourney = () => {
    setCabPosition({ x: 20, y: 110 });
    setCabAnomalyTriggered(false);
    setCabRideActive(true);
    setCabStatusText('🚕 Cab trip initiated. Tracking route safety grids...');
  };

  const triggerCabAnomaly = async () => {
    if (!cabRideActive) return;
    
    setCabAnomalyTriggered(true);
    setCabStatusText('🚨 ALERT: Cab deviated from planned corporate route by 450 meters! Accelerometer spikes detected!');
    
    // Update MERN database user status to "Anomaly Detected"
    try {
      await fetch('https://safecompanion-rxve.onrender.com/api/auth/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'Anomaly Detected' })
      });
      fetchEmployees(); // Sync employee roster instantly!
    } catch (e) {
      console.error(e);
    }
  };

  const triggerPatrol = (empName) => {
    setPatrolStatus(`🚓 Dispatching Capgemini Emergency Patrol to ${empName}'s live coordinates...`);
    setTimeout(() => {
      setPatrolStatus(`🚨 PATROL IN TRANSIT: Emergency vehicle is 3 minutes away from ${empName}.`);
    }, 3000);
    setTimeout(() => {
      setPatrolStatus(null);
    }, 10000);
  };

  const requestImmediateCheckin = (empName) => {
    alert(`📞 SENT CHECK-IN: High priority check-in ping triggered for ${empName}. Voice synthesized callback request sent.`);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Corporate B2B HR Desk</h1>
          <p style={{ color: 'var(--text-muted)' }}>Real-time night-shift safety status monitoring center</p>
        </div>
        
        {/* Tab Selector Widgets */}
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '6px' }}>
          <button
            onClick={() => setActiveTab('roster')}
            style={{
              background: activeTab === 'roster' ? 'rgba(82, 183, 136, 0.18)' : 'none',
              border: 'none',
              color: activeTab === 'roster' ? 'var(--primary)' : 'var(--text-muted)',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className="fa-solid fa-users"></i> Active Roster
          </button>
          <button
            onClick={() => {
              setActiveTab('evidence');
              fetchEvidenceLogs();
            }}
            style={{
              background: activeTab === 'evidence' ? 'rgba(217, 78, 52, 0.18)' : 'none',
              border: 'none',
              color: activeTab === 'evidence' ? 'var(--secondary)' : 'var(--text-muted)',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className="fa-solid fa-lock"></i> Evidence Vault ({evidenceLogs.length})
          </button>
        </div>
      </div>

      {patrolStatus && (
        <div className="safety-banner danger" style={{ animation: 'alarm-flash 1s infinite alternate' }}>
          <i className="fa-solid fa-truck-medical fa-bounce" style={{ fontSize: '1.4rem' }}></i>
          <span style={{ fontWeight: '700' }}>{patrolStatus}</span>
        </div>
      )}

      {activeTab === 'roster' ? (
        /* ROSTER TRACKING TAB */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', alignItems: 'start' }}>
          
          {/* Employee List Panel */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-users" style={{ color: 'var(--primary)' }}></i> Shift Roster
            </h3>

            {loading && employees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-spinner fa-spin"></i> Fetching roster...
              </div>
            ) : employees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No registered night-shift employees. <br />
                <span style={{ fontSize: '0.8rem' }}>(Create an employee account from the Signup screen!)</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {employees.map(emp => (
                  <div
                    key={emp._id}
                    onClick={() => setSelectedEmp(emp)}
                    style={{
                      background: selectedEmp?._id === emp._id ? 'rgba(82, 183, 136, 0.12)' : 'rgba(255,255,255,0.02)',
                      border: '1px solid',
                      borderColor: selectedEmp?._id === emp._id ? 'var(--primary)' : 'var(--border-glass)',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '1rem', color: selectedEmp?._id === emp._id ? 'var(--primary)' : 'white' }}>{emp.username}</h4>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Shift: {emp.shiftTime}</span>
                    </div>
                    
                    <span style={{
                      background: emp.status === 'Safe' ? 'rgba(82, 183, 136, 0.15)' : emp.status === 'Anomaly Detected' ? 'rgba(217, 78, 52, 0.15)' : 'rgba(185, 58, 37, 0.15)',
                      color: emp.status === 'Safe' ? 'var(--primary)' : emp.status === 'Anomaly Detected' ? 'var(--secondary)' : 'var(--danger)',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '700'
                    }}>
                      {emp.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Employee Detailed Panel */}
          {selectedEmp ? (
            <div className="glass-panel" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.6rem', color: 'white' }}>{selectedEmp.username}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Email: {selectedEmp.email}</p>
                </div>
                <span style={{
                  background: selectedEmp.status === 'Safe' ? 'rgba(82, 183, 136, 0.2)' : selectedEmp.status === 'Anomaly Detected' ? 'rgba(217, 78, 52, 0.2)' : 'rgba(185, 58, 37, 0.2)',
                  color: selectedEmp.status === 'Safe' ? 'var(--primary)' : selectedEmp.status === 'Anomaly Detected' ? 'var(--secondary)' : 'var(--danger)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  textTransform: 'uppercase'
                }}>
                  {selectedEmp.status}
                </span>
              </div>

              <hr style={{ border: 'none', borderBottom: '1px solid var(--border-glass)', marginBottom: '20px' }} />

              {/* ADVANCED B2B FEATURE: Real-time Audio listen-in monitor when selected employee triggers SOS! */}
              {selectedEmp.status === 'SOS Active' && (
                <div style={{ background: 'rgba(185, 58, 37, 0.06)', border: '1px solid rgba(185, 58, 37, 0.25)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ color: 'var(--danger)', fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-volume-high fa-beat"></i> LIVE MIC BRIDGE ACTIVE
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'monospace' }}>Decrypted Feed</span>
                  </div>
                  
                  {/* Dynamic waveform simulation */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${(ambientAudioLevel / 90) * 100}%`, height: '100%', background: 'var(--danger)', transition: 'width 0.3s ease' }}></div>
                    </div>
                    <span style={{ color: 'var(--danger)', fontFamily: 'monospace', fontSize: '0.78rem' }}>{ambientAudioLevel} dB</span>
                  </div>

                  <div style={{ background: '#040e0a', borderRadius: '8px', padding: '12px', border: '1px solid rgba(82,183,136,0.15)', fontSize: '0.85rem', color: '#f3f4f6', fontStyle: 'italic' }}>
                    "{liveTranscript}"
                  </div>
                </div>
              )}

              {/* DYNAMIC B2B FEATURE: Corporate Cab Ride Journey Simulator Game! */}
              <div className="glass-panel" style={{ padding: '16px', background: 'rgba(4, 14, 10, 0.4)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '0.88rem', color: 'var(--primary)', textTransform: 'uppercase' }}>
                    🚕 Late-Night Corporate Cab Escort
                  </h4>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    LSTM Movement Engine
                  </div>
                </div>

                {/* Canvas grid tracking route */}
                <div style={{ background: '#040e0a', border: '1px solid var(--border-glass)', borderRadius: '10px', height: '140px', position: 'relative', overflow: 'hidden', marginBottom: '12px' }}>
                  
                  {/* Dotted Route Line */}
                  <div style={{
                    position: 'absolute',
                    width: '320px',
                    height: '2px',
                    borderTop: '2px dashed rgba(82, 183, 136, 0.25)',
                    top: '50%',
                    left: '20px',
                    transform: 'translateY(-50%) rotate(-12deg)'
                  }} />

                  {/* Pick up marker */}
                  <div style={{ position: 'absolute', bottom: '15px', left: '15px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem' }}>🏡</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Pick-up</div>
                  </div>

                  {/* Destination Campus marker */}
                  <div style={{ position: 'absolute', top: '15px', right: '15px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem' }}>🏢</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Campus</div>
                  </div>

                  {/* Simulated Hijack off-route point */}
                  {cabAnomalyTriggered && (
                    <div style={{ position: 'absolute', bottom: '25px', right: '100px', textAlign: 'center', color: 'var(--danger)', animation: 'pulse-glow 1s infinite alternate' }}>
                      <div style={{ fontSize: '1.2rem' }}>⚠️</div>
                      <div style={{ fontSize: '0.68rem', fontWeight: '700' }}>Off Route</div>
                    </div>
                  )}

                  {/* Moving Cab Icon */}
                  <div style={{
                    position: 'absolute',
                    left: `${cabPosition.x}px`,
                    top: `${cabPosition.y}px`,
                    fontSize: '1.5rem',
                    transition: 'left 1s linear, top 1s linear',
                    zIndex: 10
                  }}>
                    🚕
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: cabAnomalyTriggered ? 'var(--danger)' : 'white', fontFamily: 'monospace', marginBottom: '16px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid currentColor' }}>
                  {cabStatusText}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn-primary" onClick={startCabJourney} disabled={cabRideActive} style={{ flex: 1, padding: '10px' }}>
                    <i className="fa-solid fa-play"></i> Start Cab Ride
                  </button>
                  <button className="btn-secondary" onClick={triggerCabAnomaly} disabled={!cabRideActive || cabAnomalyTriggered} style={{ flex: 1, padding: '10px' }}>
                    <i className="fa-solid fa-triangle-exclamation"></i> Deviate/Hijack
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '4px' }}>GPS Location</h4>
                  <div style={{ fontFamily: 'monospace', color: 'var(--secondary)', fontSize: '0.98rem', fontWeight: '600' }}>
                    {selectedEmp.location?.lat ? selectedEmp.location.lat.toFixed(6) : 12.9716}, {selectedEmp.location?.lng ? selectedEmp.location.lng.toFixed(6) : 77.5946}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Last ping: Just now</span>
                </div>
                
                <div>
                  <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '4px' }}>Emergency Circle</h4>
                  <div style={{ fontSize: '0.9rem' }}>
                    {selectedEmp.emergencyContacts && selectedEmp.emergencyContacts.length > 0 ? (
                      <div>
                        {selectedEmp.emergencyContacts[0].name} ({selectedEmp.emergencyContacts[0].phone})
                      </div>
                    ) : (
                      <span>No contacts configured</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <button className="btn-glass" onClick={() => requestImmediateCheckin(selectedEmp.username)}>
                  <i className="fa-solid fa-bell"></i> Request Check-in
                </button>
                <button
                  className="btn-danger"
                  onClick={() => triggerPatrol(selectedEmp.username)}
                  disabled={selectedEmp.status === 'Safe'}
                >
                  <i className="fa-solid fa-truck-medical"></i> Dispatch Patrol
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.05)', marginBottom: '16px' }}>💻</div>
              <h3 style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>No Employee Selected</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '300px', margin: '8px auto 0' }}>
                Select a shift employee from the roster on the left to track their live coordinates, contacts, and status.
              </p>
            </div>
          )}

        </div>
      ) : (
        /* SECURE CLOUD EVIDENCE VAULT DECRYPTED RETRIEVAL TAB */
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)', marginBottom: '12px' }}>
            <i className="fa-solid fa-lock-open"></i> Decrypted Forensic Evidence Logs
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px' }}>
            Forensic incident audio transcript packages are dynamically compiled and stored in MongoDB using AES-256 blocks. Click "Decrypt Block" to view transcripts and signatures.
          </p>

          {loadingEvidence ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-spinner fa-spin"></i> Querying secure database logs...
            </div>
          ) : evidenceLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No forensic audio blocks currently logged in database vault.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {evidenceLogs.map((log) => (
                <div
                  key={log._id}
                  style={{
                    background: 'rgba(217, 78, 52, 0.03)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                    <span style={{ fontWeight: '700', color: 'white' }}>
                      👤 Employee: {log.username}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      ⏱️ Timestamp: {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', alignItems: 'center' }}>
                    <div style={{ background: '#040e0a', borderRadius: '8px', padding: '12px', fontSize: '0.9rem', color: '#f3f4f6', fontStyle: 'italic', borderLeft: '3px solid var(--secondary)' }}>
                      "{log.transcript}"
                    </div>
                    
                    <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-muted)', textAlign: 'right' }}>
                      <div>Duration: {log.audioLength} sec</div>
                      <div style={{ color: '#52b788', marginTop: '4px' }}>🔒 Verified Signature:</div>
                      <div style={{ wordBreak: 'break-all' }}>{log.encryptedHash}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default HRDashboard;
