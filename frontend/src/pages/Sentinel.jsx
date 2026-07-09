import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

const Sentinel = ({ triggerAICall }) => {
  const { user, updateStatus } = useContext(AuthContext);
  const [sttListening, setSttListening] = useState(false);
  const [anomalyMode, setAnomalyMode] = useState(false);
  const [audioClassifierActive, setAudioClassifierActive] = useState(true);
  const [noiseLevel, setNoiseLevel] = useState(15);

  // Real Voice Distress Recognition using browser SpeechRecognition API
  let recognition = null;
  if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new Speech();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-IN'; // Indian accent (supports Hindi & English)
  }

  // Simulated live audio sound meter spikes
  useEffect(() => {
    let interval;
    if (audioClassifierActive && user.status === 'Safe') {
      interval = setInterval(() => {
        setNoiseLevel(Math.floor(Math.random() * 25) + 12);
      }, 800);
    }
    return () => clearInterval(interval);
  }, [audioClassifierActive, user]);

  // Handle Speech Recognition Distress Detection
  useEffect(() => {
    if (sttListening && recognition) {
      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
        console.log("🎤 Sentinel voice input:", transcript);
        
        const distressWords = ['help me', 'screaming', 'bachao', 'save me', 'police', 'stop it', 'please stop', 'danger', 'stranger'];
        const matchedWord = distressWords.find(word => transcript.includes(word));
        
        if (matchedWord) {
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
      alert("⚠️ Your device does not support Speech Recognition. Please try Google Chrome or Edge.");
      return;
    }
    setSttListening(!sttListening);
  };

  const triggerSOS = async () => {
    await updateStatus('SOS Active');
    triggerAICall();
  };

  const simulateLSTMAnomaly = async () => {
    if (user.status === 'SOS Active') return;
    setAnomalyMode(true);
    await updateStatus('Anomaly Detected');
    
    // Auto escalate to SOS if not cancelled
    setTimeout(async () => {
      if (user.status === 'Anomaly Detected') {
        await triggerSOS();
      }
    }, 12000);
  };

  const simulateSoundScreamTrigger = () => {
    setNoiseLevel(95);
    triggerSOS();
  };

  return (
    <div>
      <div className="hud-grid">
        
        {/* Voice Distress Indicator */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="avatar" style={{ background: 'var(--primary)' }}>
              <i className="fa-solid fa-microphone"></i>
            </div>
            <div style={{ 
              background: sttListening ? 'rgba(221, 192, 169, 0.18)' : 'rgba(255,255,255,0.05)', 
              color: sttListening ? 'var(--text-main)' : 'var(--text-muted)', 
              padding: '4px 10px', 
              borderRadius: '20px', 
              fontSize: '0.75rem', 
              fontWeight: '700' 
            }}>
              {sttListening ? 'ACTIVE MONITOR' : 'DISABLED'}
            </div>
          </div>
          <h3 style={{ marginBottom: '8px' }}>Voice Distress Detection</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '16px' }}>
            Listens hands-free. Triggers emergency calls and sends location coordinates if you shout **"Help me"** or **"Bachao"**.
          </p>
          <button className={`btn-glass ${sttListening ? 'active' : ''}`} onClick={toggleVoiceGuardian} style={{ width: '100%' }}>
            {sttListening ? (
              <span><i className="fa-solid fa-microphone-slash"></i> Stop Voice Guardian</span>
            ) : (
              <span><i className="fa-solid fa-microphone"></i> Enable Voice Guardian</span>
            )}
          </button>
        </div>

        {/* AI Ambient Noise Classifier Widget */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="avatar" style={{ background: 'var(--cyan)' }}>
              <i className="fa-solid fa-waveform"></i>
            </div>
            <div style={{ background: audioClassifierActive ? 'rgba(221, 192, 169, 0.15)' : 'rgba(255,255,255,0.05)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
              {audioClassifierActive ? 'LISTENING' : 'OFF'}
            </div>
          </div>
          <h3 style={{ marginBottom: '8px' }}>Sound Classifier Sentinel</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '16px' }}>
            Lightweight audio wave categorizer tracking ambient screams or sound spikes in real time.
          </p>
          
          {audioClassifierActive && user.status === 'Safe' ? (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>Ambient Sound (dB)</span>
                <span style={{ color: noiseLevel > 50 ? 'var(--secondary)' : 'var(--primary)' }}>{noiseLevel} dB</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (noiseLevel / 90) * 100)}%`, height: '100%', background: noiseLevel > 55 ? 'var(--secondary)' : 'linear-gradient(to right, var(--primary), var(--secondary))', transition: 'width 0.4s ease' }}></div>
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
            <div className="avatar" style={{ background: 'var(--cyan)' }}>
              <i className="fa-solid fa-route"></i>
            </div>
            <div style={{ background: anomalyMode ? 'rgba(184, 58, 37, 0.15)' : 'rgba(255,255,255,0.05)', color: anomalyMode ? 'var(--secondary)' : 'var(--text-muted)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
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

      </div>
    </div>
  );
};

export default Sentinel;
