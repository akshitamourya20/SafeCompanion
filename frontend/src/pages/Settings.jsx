import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

const Settings = () => {
  const { user, updateContacts } = useContext(AuthContext);
  const [contacts, setContacts] = useState([
    { name: '', phone: '' },
    { name: '', phone: '' }
  ]);
  const [voiceChoice, setVoiceChoice] = useState(localStorage.getItem('safety_voice') || 'father');
  const [feedback, setFeedback] = useState({ type: '', msg: '' });
  const [saving, setSaving] = useState(false);

  // Sync state with logged in user emergency contacts on load
  useEffect(() => {
    if (user && user.emergencyContacts && user.emergencyContacts.length > 0) {
      // Ensure we always have at least 2 contact slots
      const paddedContacts = [...user.emergencyContacts];
      while (paddedContacts.length < 2) {
        paddedContacts.push({ name: '', phone: '' });
      }
      setContacts(paddedContacts);
    }
  }, [user]);

  const handleContactChange = (index, field, value) => {
    const nextContacts = [...contacts];
    nextContacts[index][field] = value;
    setContacts(nextContacts);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', msg: '' });

    // Filter out blank contacts
    const activeContacts = contacts.filter(c => c.name.trim() !== '' && c.phone.trim() !== '');

    if (activeContacts.length === 0) {
      setFeedback({ type: 'error', msg: 'Please configure at least one active emergency contact.' });
      setSaving(false);
      return;
    }

    // Call context to sync MERN DB
    const res = await updateContacts(activeContacts);
    setSaving(false);

    if (res.success) {
      // Save local TTS settings
      localStorage.setItem('safety_voice', voiceChoice);
      setFeedback({ type: 'success', msg: '✅ Profile settings synchronized with MERN database successfully.' });
      setTimeout(() => setFeedback({ type: '', msg: '' }), 5000);
    } else {
      setFeedback({ type: 'error', msg: res.error || 'Failed to sync database settings.' });
    }
  };

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Guard Configuration</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage emergency contacts, speech parameters, and profile details</p>
      </div>

      {feedback.msg && (
        <div style={{
          background: feedback.type === 'success' ? 'rgba(221, 192, 169, 0.18)' : 'rgba(154, 32, 18, 0.18)',
          border: '1px solid',
          borderColor: feedback.type === 'success' ? 'var(--border-glass)' : 'rgba(154, 32, 18, 0.3)',
          color: feedback.type === 'success' ? 'var(--primary)' : 'var(--danger)',
          padding: '14px 18px',
          borderRadius: '10px',
          fontSize: '0.9rem',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <i className={feedback.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'}></i>
          <span>{feedback.msg}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="glass-panel" style={{ padding: '32px' }}>
        
        {/* Section 1: Emergency contacts */}
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-phone-flip" style={{ color: 'var(--primary)' }}></i> Emergency Circle (MERN Storage)
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
          Configure trusted co-workers, family members or authorities who receive Twilio distress alerts.
        </p>

        {contacts.map((contact, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid var(--border-glass)',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Contact Name {index + 1}</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Papa, HR Security Desk"
                  value={contact.name}
                  onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Phone Number {index + 1}</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. +91 99999 00000"
                  value={contact.phone}
                  onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                />
              </div>
            </div>

            {/* Test Call Trigger option */}
            {contact.phone && contact.phone.trim() !== '' && (
              <div style={{ alignSelf: 'flex-end', marginTop: '4px' }}>
                <a
                  href={`tel:${contact.phone}`}
                  className="btn-glass"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '6px'
                  }}
                >
                  <i className="fa-solid fa-phone" style={{ color: 'var(--primary)' }}></i> Dial {contact.name || `Guardian ${index + 1}`}
                </a>
              </div>
            )}
          </div>
        ))}

        <hr style={{ border: 'none', borderBottom: '1px solid var(--border-glass)', margin: '24px 0' }} />

        {/* Section 2: Star feature Voice choices */}
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-volume-high" style={{ color: 'var(--secondary)' }}></i> Anonymous AI Voice Configuration
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
          Select the context persona generated by Gemini TTS when triggering the deterrent loudspeaker call.
        </p>

        <div className="form-group" style={{ marginBottom: '32px' }}>
          <label className="form-label">AI Caller Profile Voice</label>
          <select
            className="input-field"
            value={voiceChoice}
            onChange={(e) => setVoiceChoice(e.target.value)}
            style={{ background: 'rgba(4, 1, 10, 0.7)' }}
          >
            <option value="father">👨‍🦳 Father Persona ("Hello beta, where are you? Papa aa raha hai!")</option>
            <option value="mother">👩‍🦳 Mother Persona ("Beta ruko, main and police 2 minute mein pahunch rahi hoon!")</option>
            <option value="police">👮 Police Station Beat ("Police patrol head quarters, share your coordinates!")</option>
            <option value="brother">👦 Brother Persona ("Are you safe? Bro is tracking your location, wait there.")</option>
          </select>
        </div>

        {/* Sync Save Button */}
        <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px' }} disabled={saving}>
          {saving ? (
            <span><i className="fa-solid fa-spinner fa-spin"></i> Saving Settings...</span>
          ) : (
            <span>Synchronize Guard Profile <i className="fa-solid fa-cloud-arrow-up"></i></span>
          )}
        </button>

      </form>
    </div>
  );
};

export default Settings;
