import React, { useState, useEffect, useRef } from 'react';

const AnonymousCall = ({ active, onClose }) => {
  const [callState, setCallState] = useState('incoming'); // 'incoming', 'active', 'ended'
  const [seconds, setSeconds] = useState(0);
  const voiceChoice = localStorage.getItem('safety_voice') || 'father';
  const audioIntervalRef = useRef(null);

  // Formatting calling seconds
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    if (!active) {
      setCallState('incoming');
      setSeconds(0);
      return;
    }

    // Play ringing tone via browser synth
    const playRingTone = () => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // Standard US ringing frequency
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        
        osc.start();
        
        // Ringing cadence (2 sec ring, 4 sec silence)
        setTimeout(() => osc.stop(), 1500);
      } catch (e) {
        console.error("Audio Context not supported yet:", e);
      }
    };

    if (callState === 'incoming') {
      playRingTone();
      audioIntervalRef.current = setInterval(playRingTone, 4000);
    }

    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [active, callState]);

  // Call timer once accepted
  useEffect(() => {
    let timer;
    if (callState === 'active') {
      timer = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callState]);

  const speakDeterrentLines = () => {
    if (!('speechSynthesis' in window)) {
      console.warn("Speech Synthesis is not supported in this browser.");
      return;
    }

    // Cancel any ongoing speaking
    window.speechSynthesis.cancel();

    // Select text lines based on voice profile configured in Settings
    let text = '';
    if (voiceChoice === 'father') {
      text = "Hello beta, where are you? Papa aa raha hai abhi! Main main road cross kar chuka hoon aur do minute mein tech-park pahunch raha hoon. Tum wahan security guard ke paas hi khadi raho, main bilkul paas mein hoon!";
    } else if (voiceChoice === 'mother') {
      text = "Beta tum kahan ho? Ruko, main aur police inspector dono gaadi mein hain aur bilkul tumhare coordinate par do minute mein pahunch rahe hain! Tum call mat kaatna, main line pe hi hoon aur tumhari live location dekh sakti hoon!";
    } else if (voiceChoice === 'police') {
      text = "Police control room headquarters se bol raha hoon. Madam, aapka distress location feed humare interceptor par aa gaya hai. Humaari petrol car 500 meters door hai aur deep beacon ke saath pahunch rahi hai. Attacker ko bataiye ki location trace ho chuki hai!";
    } else {
      text = "Hey! I am tracking your live location right now. I am right outside with my friends, just waiting at the corner. Stay on the call, I am coming to pick you up in two seconds!";
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN'; // Elegant Indian accent mapping
    utterance.volume = 1.0; // Play at maximum volume
    utterance.rate = 0.9;  // Slightly slow to make it clear and realistic

    // Try to find a male voice for 'father'/'police' if available, otherwise browser default
    const voices = window.speechSynthesis.getVoices();
    if (voiceChoice === 'father' || voiceChoice === 'police') {
      const maleVoice = voices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('google standard'));
      if (maleVoice) utterance.voice = maleVoice;
    } else if (voiceChoice === 'mother') {
      const femaleVoice = voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira'));
      if (femaleVoice) utterance.voice = femaleVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  const handleAnswer = () => {
    if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    setCallState('active');
    // Play deterrent voice speech synthesis loudly!
    speakDeterrentLines();
  };

  const handleDecline = () => {
    if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    window.speechSynthesis.cancel(); // Stop talking
    setCallState('ended');
    setTimeout(() => onClose(), 1000);
  };

  if (!active) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: '#04010a',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '60px 24px',
      color: 'white',
      fontFamily: 'var(--font-main)'
    }}>
      
      {/* Top Metadata */}
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <div style={{
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
          margin: '0 auto 20px',
          border: '1px solid rgba(255,255,255,0.15)'
        }}>
          {voiceChoice === 'father' ? '👴' : voiceChoice === 'mother' ? '👵' : voiceChoice === 'police' ? '👮' : '👤'}
        </div>
        
        <h1 style={{ fontSize: '2.2rem', fontWeight: '700', marginBottom: '8px' }}>
          {voiceChoice === 'father' ? 'Papa (AI Guardian)' : voiceChoice === 'mother' ? 'Mumma (AI Guardian)' : voiceChoice === 'police' ? 'Police Station HQ' : 'Family Companion'}
        </h1>
        
        <p style={{
          color: callState === 'incoming' ? 'rgba(255,255,255,0.6)' : '#06d6a0',
          fontSize: '1rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          fontWeight: '600'
        }}>
          {callState === 'incoming' ? 'SafeCompanion deterrent incoming...' : `ACTIVE SPEECH: ${formatTime(seconds)}`}
        </p>
      </div>

      {/* Mid Visual Call Speaker Indicator */}
      {callState === 'active' && (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '1.2rem', animation: 'pulse-glow 1.5s infinite alternate' }}>
          <i className="fa-solid fa-volume-high" style={{ color: '#06d6a0', marginRight: '8px' }}></i> Playing through Loudspeaker...
        </div>
      )}

      {/* Dialer Buttons overlay */}
      <div style={{ width: '100%', maxWidth: '340px', margin: '0 auto' }}>
        
        {callState === 'incoming' ? (
          /* Slide to Answer/Decline view */
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 20px' }}>
            
            {/* Decline Action */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleDecline}
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'var(--danger)',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.8rem',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(255,0,84,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className="fa-solid fa-phone-slash" style={{ transform: 'rotate(135deg)' }}></i>
              </button>
              <div style={{ fontSize: '0.85rem', marginTop: '10px', color: 'rgba(255,255,255,0.5)' }}>Decline</div>
            </div>

            {/* Accept Action */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleAnswer}
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: '#06d6a0',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.8rem',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(6,214,160,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulse-glow 1s infinite alternate'
                }}
              >
                <i className="fa-solid fa-phone"></i>
              </button>
              <div style={{ fontSize: '0.85rem', marginTop: '10px', color: 'rgba(255,255,255,0.5)' }}>Answer</div>
            </div>

          </div>
        ) : (
          /* Active Call red hangup view */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            <button
              onClick={handleDecline}
              style={{
                width: '75px',
                height: '75px',
                borderRadius: '50%',
                background: 'var(--danger)',
                border: 'none',
                color: 'white',
                fontSize: '2rem',
                cursor: 'pointer',
                boxShadow: '0 0 30px rgba(255,0,84,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="fa-solid fa-phone-slash"></i>
            </button>
            <div style={{ fontSize: '0.88rem', marginTop: '12px', color: 'rgba(255,255,255,0.5)' }}>End Deterrent Call</div>
            
          </div>
        )}

      </div>
    </div>
  );
};

export default AnonymousCall;
