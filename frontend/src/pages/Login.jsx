import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Login = ({ setPage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    
    if (!res.success) {
      setError(res.error || 'Invalid credentials. Please try again.');
    } else {
      setPage('dashboard');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card glass-heavy">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '10px' }}>🛡️</div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '6px' }} className="text-gradient">
            SafeCompanion
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            AI-Powered Safety Companion & Active Guardian
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
                placeholder="you@corporate.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginBottom: '20px' }}
            disabled={loading}
          >
            {loading ? (
              <span><i className="fa-solid fa-spinner fa-spin"></i> Authenticating...</span>
            ) : (
              <span>Secure Login <i className="fa-solid fa-arrow-right-to-bracket"></i></span>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <span
            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}
            onClick={() => setPage('signup')}
          >
            Create an Account
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
