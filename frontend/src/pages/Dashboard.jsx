import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

const Dashboard = ({ triggerAICall, setPage }) => {
  const { user, updateStatus, updateLocation, uploadEvidence } = useContext(AuthContext);
  const [sosCountdown, setSosCountdown] = useState(null);
  const [anomalyMode, setAnomalyMode] = useState(false);
  const [sttListening, setSttListening] = useState(false);
  const [gpsSimulated, setGpsSimulated] = useState({ lat: 12.9716, lng: 77.5946 });
  const [twilioAlertLog, setTwilioAlertLog] = useState([]);
  
  // Advanced Features State
  const [audioClassifierActive, setAudioClassifierActive] = useState(true);
  const [noiseLevel, setNoiseLevel] = useState(15); // Dynamic slider simulation
  const [evidenceSyncedLogs, setEvidenceSyncedLogs] = useState([]);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Real Voice Distress Recognition using browser SpeechRecognition API
  let recognition = null;
  if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new Speech();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';
  }

  // Simulated live audio sound meter spikes
  useEffect(() => {
    let interval;
    if (audioClassifierActive && user.status === 'Safe') {
      interval = setInterval(() => {
        // Random sound waves between 8dB and 45dB
        setNoiseLevel(Math.floor(Math.random() * 25) + 12);
      }, 800);
    }
    return () => clearInterval(interval);
  }, [audioClassifierActive, user]);

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
      // Start recording timer
      setRecordingSeconds(0);
      timer = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      // Simulate evidence uploads every 5 seconds to MERN cloud!
      let counter = 0;
      interval = setInterval(async () => {
        counter += 5;
        const transcriptions = [
          "Ambient heavy footfalls. Rapid scuffling sounds in background.",
          "High frequency vocal screams. Alert triggered.",
          "Loud arguing noise. Distant vehicle engines."
        ];
        const selectedTranscription = transcriptions[Math.floor(Math.random() * transcriptions.length)];
        
        // Save to real localDb/Mongoose evidence database dynamically!
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

  // Handle Speech Recognition Distress Detection
  useEffect(() => {
    if (sttListening && recognition) {
      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
        console.log("🎤 Voice input detected:", transcript);
        
        const distressWords = ['help me', 'screaming', 'bachao', 'save me', 'police', 'stop it', 'please stop', 'danger', 'stranger'];
        const matchedWord = distressWords.find(word => transcript.includes(word));
        
        if (matchedWord) {
          logTwilioAlert(`Voice distress keyword "${matchedWord}" detected! Auto-escalating.`);
          triggerSOS();
        }
      };

      recognition.onerror = (err) => {
        console.error("Speech Recognition error:", err);
      };

      recognition.onend = () => {
        if (sttListening) recognition.start();
      };

      recognition.start();
    } else if (recognition) {
      recognition.stop();
    }

    return () => {
      if (recognition) recognition.stop();
    };
  }, [sttListening]);

  const toggleVoiceGuardian = () => {
    if (!recognition) {
      alert("⚠️ Your browser does not support HTML5 Speech Recognition. Please try Google Chrome or Edge.");
      return;
    }
    setSttListening(!sttListening);
  };

  const triggerSOS = async () => {
    setSosCountdown(null);
    await updateStatus('SOS Active');
    logTwilioAlert('🔴 TWILIO ALERT: Sent emergency location SMS & audio call to all contacts.');
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
    setAnomalyMode(false);
    logTwilioAlert('🟢 STATUS RESOLVED: Alarm canceled. Contacts notified of safety.');
  };

  const simulateLSTMAnomaly = async () => {
    if (user.status === 'SOS Active') return;
    
    setAnomalyMode(true);
    await updateStatus('Anomaly Detected');
    logTwilioAlert('⚠️ LSTM ANOMALY: Route deviation of 350 meters detected. Corporate HR dashboard alerted.');
    
    setTimeout(async () => {
      const userElement = document.getElementById('dashboard-status-banner');
      if (userElement && userElement.innerText.includes('ANOMALY')) {
        await triggerSOS();
      }
    }, 12000);
  };

  const simulateSoundScreamTrigger = () => {
    setNoiseLevel(95); // Spikes graph to red
    logTwilioAlert('🔊 SOUND SENTINEL: Audio classification captured vocal scream spike (92dB)! Auto-activating.');
    triggerSOS();
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

      <div style={{ display: 'grid', gridTemplateColumns: user.status === 'SOS Active' ? '1.2fr 1fr' : '1fr', gap: '24px', transition: 'all 0.5s' }}>
        
        {/* Core SOS Button */}
        <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '220px', margin: '0 auto 20px' }}>
            <div className="sos-outer-ring">
              <div className="sos-middle-ring">
                <button
                  className="sos-btn"
                  onClick={startSOSCountdown}
                  style={{
                    background: sosCountdown !== null ? 'var(--secondary)' : undefined,
                    boxShadow: sosCountdown !== null ? '0 8px 30px var(--secondary-glow)' : undefined
                  }}
                >
                  {sosCountdown !== null ? (
                    <span style={{ fontSize: '2.5rem', fontWeight: '900' }}>{sosCountdown}</span>
                  ) : user.status === 'SOS Active' ? (
                    <span style={{ fontSize: '1rem' }}><i className="fa-solid fa-shield-halved fa-beat"></i> ON CALL</span>
                  ) : (
                    <span>SOS</span>
                  )}
                </button>
              </div>
            </div>
          </div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>
            {sosCountdown !== null ? 'HOLD TO CANCEL - SENDING IN...' : user.status === 'SOS Active' ? 'SOS BROADCAST ACTIVE' : 'TAP TO BROADCAST'}
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto', fontSize: '0.9rem' }}>
            {user.status === 'SOS Active'
              ? 'Your emergency contacts are receiving live location links. Incident sound records are locked.'
              : 'Press once to trigger a 3-second countdown. Shouting distress keywords triggers instantly.'}
          </p>
        </div>

        {/* Real-time Evidence Vault Secure Upload Console (Visible during active SOS!) */}
        {user.status === 'SOS Active' && (
          <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--danger)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                <i className="fa-solid fa-lock fa-bounce"></i> AI Evidence Vault
              </h3>
              <div style={{ background: 'rgba(255,0,84,0.15)', color: 'var(--danger)', fontSize: '0.72rem', fontWeight: '800', padding: '4px 8px', borderRadius: '4px' }}>
                🔴 SECURE STREAMING
              </div>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Smartphone microphones are active. Audio streams are divided into 3-second packages, encrypted with **AES-256**, and dynamically synced to MERN nodes.
            </p>

            <div style={{ background: '#0a051b', borderRadius: '10px', padding: '16px', flex: 1, overflowY: 'auto', maxHeight: '160px', border: '1px solid var(--border-glass)' }}>
              {evidenceSyncedLogs.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '16px' }}>
                  <i className="fa-solid fa-spinner fa-spin"></i> Initializing encrypted connection block...
                </div>
              ) : (
                evidenceSyncedLogs.map((log, index) => (
                  <div key={index} style={{ fontSize: '0.8rem', color: '#06d6a0', fontFamily: 'monospace', marginBottom: '8px', borderBottom: '1px dashed rgba(6,214,160,0.1)', paddingBottom: '6px' }}>
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
        )}

      </div>

      {/* 4 Feature HUD Grid */}
      <div className="hud-grid" style={{ marginTop: '24px' }}>
        
        {/* Voice Distress Indicator */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="avatar" style={{ background: 'var(--primary)' }}>
              <i className="fa-solid fa-microphone"></i>
            </div>
            <div style={{ background: sttListening ? 'rgba(6, 214, 160, 0.15)' : 'rgba(255,255,255,0.05)', color: sttListening ? '#06d6a0' : 'var(--text-muted)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
              {sttListening ? 'ACTIVE MONITOR' : 'DISABLED'}
            </div>
          </div>
          <h3 style={{ marginBottom: '8px' }}>Voice Distress Detection</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '16px' }}>
            Uses Gemini STT framework to listen hands-free. Triggers emergency if you shout "Help me" or "Bachao".
          </p>
          <button className={`btn-glass ${sttListening ? 'active' : ''}`} onClick={toggleVoiceGuardian} style={{ width: '100%' }}>
            {sttListening ? (
              <span><i className="fa-solid fa-microphone-slash"></i> Stop Voice Guardian</span>
            ) : (
              <span><i className="fa-solid fa-microphone"></i> Enable Voice Guardian</span>
            )}
          </button>
        </div>

        {/* AI Ambient Noise Classifier Widget (NEW FEATURE) */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="avatar" style={{ background: 'var(--info)' }}>
              <i className="fa-solid fa-waveform"></i>
            </div>
            <div style={{ background: audioClassifierActive ? 'rgba(0, 245, 212, 0.15)' : 'rgba(255,255,255,0.05)', color: '#00f5d4', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
              {audioClassifierActive ? 'LISTENING' : 'OFF'}
            </div>
          </div>
          <h3 style={{ marginBottom: '8px' }}>Sound Classifier Sentinel</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '16px' }}>
            Lightweight audio wave categorizer tracking ambient screams or scuffles in real time.
          </p>
          
          {audioClassifierActive && user.status === 'Safe' ? (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>Ambient Sound (dB)</span>
                <span style={{ color: noiseLevel > 50 ? 'var(--danger)' : '#00f5d4' }}>{noiseLevel} dB</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (noiseLevel / 90) * 100)}%`, height: '100%', background: noiseLevel > 55 ? 'var(--danger)' : 'linear-gradient(to right, #00f5d4, var(--primary))', transition: 'width 0.4s ease' }}></div>
              </div>
            </div>
          ) : (
            <div style={{ height: '40px' }}></div>
          )}

          <button className="btn-glass" onClick={simulateSoundScreamTrigger} disabled={user.status !== 'Safe'} style={{ width: '100%' }}>
            <span><i className="fa-solid fa-volume-xmark"></i> Simulate Sound Spike</span>
          </button>
        </div>

        {/* LSTM Movement Anomaly */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="avatar" style={{ background: 'var(--secondary)' }}>
              <i className="fa-solid fa-route"></i>
            </div>
            <div style={{ background: anomalyMode ? 'rgba(255, 0, 84, 0.15)' : 'rgba(255,255,255,0.05)', color: anomalyMode ? 'var(--danger)' : 'var(--text-muted)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
              {anomalyMode ? 'ANOMALY!' : 'TRACKING'}
            </div>
          </div>
          <h3 style={{ marginBottom: '8px' }}>Movement Anomaly (LSTM)</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '16px' }}>
            Detects deviation from mapped route, abrupt halts, or being followed using TensorFlow.js LSTM model.
          </p>
          <button className="btn-glass" onClick={simulateLSTMAnomaly} disabled={user.status !== 'Safe'} style={{ width: '100%' }}>
            <span><i className="fa-solid fa-bolt"></i> Simulate Route Deviation</span>
          </button>
        </div>

        {/* Anonymous AI Deterrent Call */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="avatar" style={{ background: 'var(--danger)' }}>
              <i className="fa-solid fa-phone-volume"></i>
            </div>
            <div style={{ color: 'var(--secondary)', fontSize: '0.75rem', fontWeight: '700', padding: '4px 8px' }}>
              STAR FEATURE
            </div>
          </div>
          <h3 style={{ marginBottom: '8px' }}>Anonymous AI Call</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '16px' }}>
            Generates realistic family guardian call plays loudly on speaker to scare away strangers and attackers.
          </p>
          <button className="btn-secondary" onClick={triggerAICall} style={{ width: '100%' }}>
            <span><i className="fa-solid fa-phone"></i> Play Deterrent Call</span>
          </button>
        </div>

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
                <span style={{ color: log.text.includes('🔴') ? 'var(--danger)' : log.text.includes('⚠️') ? 'var(--secondary)' : '#06d6a0', fontWeight: '600' }}>
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
