import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const AIChat = ({ triggerAICall }) => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [aiSosWarning, setAiSosWarning] = useState(false);
  
  const chatEndRef = useRef(null);

  // Seed default chat greeting on mount
  useEffect(() => {
    setMessages([
      {
        sender: 'assistant',
        text: `Hello ${user ? user.username : 'Guardian'}! I am your AI Safety Guardian. 

I monitor your routes, track LSTM movement anomalies, and stand ready to trigger emergency protocols.

Tell me, where are you heading tonight, or are you feeling unsafe in your current location? I'm here with you.`,
        timestamp: new Date()
      }
    ]);
  }, [user?.id]); // Only re-run if the logged-in user changes, not on parent re-renders!

  // Auto scroll chat to bottom (only scroll internally, do not scroll the parent window)
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessageText = inputText;
    setInputText('');
    
    // Add user message to state
    setMessages(prev => [...prev, {
      sender: 'user',
      text: userMessageText,
      timestamp: new Date()
    }]);

    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: userMessageText,
          chatSessionId: sessionId
        })
      });
      const data = await res.json();
      
      if (data.success) {
        if (data.chatSessionId) {
          setSessionId(data.chatSessionId);
        }

        // Add assistant reply to state
        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: data.reply,
          timestamp: new Date()
        }]);

        // If emergency distress detected by GenAI
        if (data.isEmergency) {
          setAiSosWarning(true);
          triggerAICall(); // Trigger star feature TTS call
          setTimeout(() => setAiSosWarning(false), 8000);
        }
      }
    } catch (err) {
      console.error("AI Chat API Error:", err);
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: "⚠️ System offline. I was unable to connect to the SafeCompanion AI network. Please check your internet connection or backend port.",
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // AI Message Auto-Generator: Rapid distress text writing!
  const generateRapidSOSAlert = () => {
    const lat = user?.location?.lat || 12.9716;
    const lng = user?.location?.lng || 77.5946;
    
    const rapidMsg = `🚨 EMERGENCY ALERT from SafeCompanion. 
User: ${user ? user.username : 'Guardian'}
Time: ${new Date().toLocaleTimeString()}
Status: SOS Active!
Live Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}
Map URL: https://maps.google.com/?q=${lat},${lng}

"I feel unsafe. Please coordinate with Capgemini Safe Desk immediately."`;

    setInputText(rapidMsg);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>AI Safety Companion</h1>
          <p style={{ color: 'var(--text-muted)' }}>Always-on Agentic Guardian linked with Gemini API</p>
        </div>
        <button className="btn-glass" onClick={generateRapidSOSAlert}>
          <i className="fa-solid fa-wand-magic-sparkles" style={{ color: 'var(--secondary)' }}></i> Rapid SOS Draft
        </button>
      </div>

      {/* AI SOS Distress alert flash */}
      {aiSosWarning && (
        <div style={{
          background: 'rgba(255, 0, 84, 0.95)',
          border: '2px solid white',
          borderRadius: '12px',
          color: 'white',
          padding: '16px 24px',
          fontSize: '1rem',
          fontWeight: '700',
          position: 'absolute',
          top: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '560px',
          zIndex: 100,
          boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
          textAlign: 'center',
          animation: 'pulse-glow 1.5s infinite alternate'
        }}>
          ⚠️ DISTRESS DETECTED BY AI AGENT! <br />
          Broadcasting coordinates and starting deterrent speech on speaker!
        </div>
      )}

      {/* Chat Display Area */}
      <div className="glass-panel" style={{
        flex: 1,
        padding: '24px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        background: 'rgba(12, 6, 26, 0.45)',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        marginBottom: '0'
      }}>
        {messages.map((msg, index) => {
          const isAssistant = msg.sender === 'assistant';
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isAssistant ? 'flex-start' : 'flex-end',
                maxWidth: '80%',
                alignSelf: isAssistant ? 'flex-start' : 'flex-end'
              }}
            >
              {/* Message Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isAssistant ? (
                  <>
                    <span style={{ fontWeight: '700', color: 'var(--primary)' }}>🤖 SafeCompanion AI</span>
                    <span>•</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </>
                ) : (
                  <>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span style={{ fontWeight: '700', color: 'var(--secondary)' }}>👤 You</span>
                  </>
                )}
              </div>

              {/* Message Box */}
              <div style={{
                background: isAssistant ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(135deg, var(--primary) 0%, #7b2cbf 100%)',
                border: isAssistant ? '1px solid var(--border-glass)' : 'none',
                borderRadius: isAssistant ? '14px 14px 14px 2px' : '14px 14px 2px 14px',
                padding: '14px 18px',
                fontSize: '0.95rem',
                color: 'white',
                boxShadow: isAssistant ? 'none' : '0 4px 15px rgba(157, 78, 221, 0.2)',
                whiteSpace: 'pre-wrap'
              }}>
                {msg.text}
              </div>
            </div>
          );
        })}
        {loading && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <div className="avatar" style={{ width: '28px', height: '28px', background: 'var(--border-glass)' }}>
              <i className="fa-solid fa-spinner fa-spin"></i>
            </div>
            <span>AI Guardian is formulating safety steps...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Message Area */}
      <form onSubmit={handleSendMessage} style={{
        display: 'flex',
        gap: '12px',
        padding: '16px',
        background: 'var(--bg-darker)',
        border: '1px solid var(--border-glass)',
        borderTop: 'none',
        borderBottomLeftRadius: '16px',
        borderBottomRightRadius: '16px'
      }}>
        <input
          type="text"
          className="input-field"
          style={{ background: 'rgba(0,0,0,0.3)' }}
          placeholder='Describe your route, e.g. "I am walking back alone from Tech Park" or type "HELP"'
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="btn-primary" style={{ padding: '12px 20px' }} disabled={loading}>
          <i className="fa-regular fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

export default AIChat;
