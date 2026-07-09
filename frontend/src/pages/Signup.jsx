import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Signup = ({ setPage }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [shiftTime, setShiftTime] = useState('22:00 - 06:00');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError('');
    setLoading(true);
    const res = await register(username, email, password, role, shiftTime);
    setLoading(false);
    
    if (!res.success) {
      setError(res.error || 'Registration failed. Please check inputs.');
    } else {
      setPage('dashboard');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card glass-heavy" style={{ maxWidth: '520px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🛡️</div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '6px' }} className="text-gradient">
            Join SafeCompanion
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Set up your AI guardian safety profile today
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255, 0, 84, 0.08)',
            border: '1px solid rgba(255, 0, 84, 0.3)',
            color: 'var(--danger)',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.88rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name / Username</label>
            <div style={{ position: 'relative' }}>
              <i className="fa-regular fa-user" style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}></i>
              <input
                type="text"
                className="input-field"
                style={{ paddingLeft: '44px' }}
                placeholder="Akshita Sharma"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <i className="fa-regular fa-envelope" style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}></i>
              <input
                type="email"
                className="input-field"
                style={{ paddingLeft: '44px' }}
                placeholder="akshita@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <i className="fa-solid fa-lock" style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}></i>
              <input
                type="password"
                className="input-field"
                style={{ paddingLeft: '44px' }}
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Profile Role</label>
              <select
                className="input-field"
                style={{ background: 'rgba(4, 1, 10, 0.7)', cursor: 'pointer' }}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="user">Employee (User)</option>
                <option value="hr">HR Administrator</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Shift Timing</label>
              <input
                type="text"
                className="input-field"
                placeholder="22:00 - 06:00"
                value={shiftTime}
                onChange={(e) => setShiftTime(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '12px', marginBottom: '20px' }}
            disabled={loading}
          >
            {loading ? (
              <span><i className="fa-solid fa-spinner fa-spin"></i> Creating Profile...</span>
            ) : (
              <span>Create AI Profile <i className="fa-solid fa-user-plus"></i></span>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already registered?{' '}
          <span
            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}
            onClick={() => setPage('login')}
          >
            Login securely
          </span>
        </div>
      </div>
    </div>
  );
};

export default Signup;
