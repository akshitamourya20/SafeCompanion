import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize and check current user with existing token on load
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch('https://safecompanion.onrender.com/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
        } else {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Error verifying auth token:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  // Register user
  const register = async (username, email, password, role, shiftTime) => {
    try {
      const response = await fetch('https://safecompanion.onrender.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password, role, shiftTime })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Registration API error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      const response = await fetch('https://safecompanion.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login API error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Update emergency contacts
  const updateContacts = async (emergencyContacts) => {
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const response = await fetch('https://safecompanion.onrender.com/api/auth/contacts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ emergencyContacts })
      });
      const data = await response.json();
      if (data.success) {
        setUser(prev => ({ ...prev, emergencyContacts: data.emergencyContacts }));
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Update contacts error:', error);
      return { success: false, error: 'Network error updating contacts' };
    }
  };

  // Update user safety status
  const updateStatus = async (status) => {
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const response = await fetch('https://safecompanion.onrender.com/api/auth/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (data.success) {
        setUser(prev => ({ ...prev, status: data.status }));
        return { success: true, status: data.status };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Update status error:', error);
      return { success: false, error: 'Network error updating status' };
    }
  };

  // Update GPS live coordinates
  const updateLocation = async (lat, lng) => {
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const response = await fetch('https://safecompanion.onrender.com/api/auth/location', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ lat, lng })
      });
      const data = await response.json();
      if (data.success) {
        setUser(prev => ({ ...prev, location: data.location }));
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (error) {
      console.error('Update location error:', error);
      return { success: false };
    }
  };

  // Advanced Feature: Send Ambient Record to secure vault
  const uploadEvidence = async (transcript, audioLength) => {
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const response = await fetch('https://safecompanion.onrender.com/api/auth/evidence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ transcript, audioLength })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Evidence upload error:', error);
      return { success: false, error: 'Network error syncing evidence vault.' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      register,
      login,
      logout,
      updateContacts,
      updateStatus,
      updateLocation,
      uploadEvidence
    }}>
      {children}
    </AuthContext.Provider>
  );
};
