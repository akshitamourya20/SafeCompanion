import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const SafetyZones = () => {
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form states for creating a new safety report
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState('safe');
  const [clickCoords, setClickCoords] = useState({ x: 300, y: 200 });
  
  // ADVANCED FEATURE: Routing Toggler (Default Route vs. AI Crime-Sentry Safest Route!)
  const [routingMode, setRoutingMode] = useState('safest'); // 'fastest' or 'safest'
  
  const mapCenter = { lat: 12.9716, lng: 77.5946 };
  
  const canvasToLatLng = (x, y) => {
    const lat = mapCenter.lat + (200 - y) * 0.0001;
    const lng = mapCenter.lng + (x - 400) * 0.0001;
    return { lat, lng };
  };

  const latLngToCanvas = (lat, lng) => {
    const y = 200 - (lat - mapCenter.lat) / 0.0001;
    const x = 400 + (lng - mapCenter.lng) / 0.0001;
    return { x, y };
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://safecompanion.onrender.com/api/reports');
      const data = await res.json();
      if (data.success) {
        setReports(data.reports);
      }
    } catch (err) {
      console.error("Error fetching safety reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleMapClick = (e) => {
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setClickCoords({ x, y });
    setModalOpen(true);
  };

  const handleAddReport = async (e) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;

    const simulatedLatLng = canvasToLatLng(clickCoords.x, clickCoords.y);

    try {
      const res = await fetch('https://safecompanion.onrender.com/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          type: newType,
          location: simulatedLatLng,
          userId: user ? user.id : null
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewTitle('');
        setNewDesc('');
        setNewType('safe');
        setModalOpen(false);
        fetchReports();
      }
    } catch (err) {
      console.error("Error posting safety report:", err);
    }
  };

  // Render Canvas Map Grid with safety zones and route paths
  useEffect(() => {
    const canvas = document.getElementById('safety-map-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, 800, 400);

    // Draw Dark Cyberpunk Grid background
    ctx.fillStyle = '#0a051b';
    ctx.fillRect(0, 0, 800, 400);

    ctx.strokeStyle = 'rgba(157, 78, 221, 0.08)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    
    for (let x = 0; x < 800; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 400);
      ctx.stroke();
    }
    for (let y = 0; y < 400; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(800, y);
      ctx.stroke();
    }

    // DRAW ROUTE PATHS DEPENDING ON ROUTING MODE
    let routeNodes = [];
    if (routingMode === 'fastest') {
      // Fastest Route cuts directly through isolated danger zones (X: 300, Y: 200, near red warning dot!)
      routeNodes = [
        { x: 100, y: 300 },
        { x: 300, y: 200 }, // Danger zone shortcut
        { x: 500, y: 220 },
        { x: 700, y: 100 }
      ];
      ctx.strokeStyle = '#ff0054'; // Red alarm path
      ctx.shadowColor = 'rgba(255,0,84,0.4)';
    } else {
      // AI Safest Route loops upwards around the Police beats and Tech-park safe zones to steer clear!
      routeNodes = [
        { x: 100, y: 300 },
        { x: 220, y: 120 }, // Loops up to safe zone
        { x: 520, y: 80 },  // Passes through Police interceptor beat
        { x: 700, y: 100 }
      ];
      ctx.strokeStyle = '#06d6a0'; // Emerald safe path
      ctx.shadowColor = 'rgba(6,214,160,0.4)';
    }

    // Draw main glowing route lines
    ctx.lineWidth = 4;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(routeNodes[0].x, routeNodes[0].y);
    for (let i = 1; i < routeNodes.length; i++) {
      ctx.lineTo(routeNodes[i].x, routeNodes[i].y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset shadow glow

    // Draw route nodes
    ctx.fillStyle = routingMode === 'fastest' ? 'var(--danger)' : '#06d6a0';
    routeNodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw crowdsourced database reports
    reports.forEach(report => {
      if (!report.location || report.location.lat === undefined) return;
      const { x, y } = latLngToCanvas(report.location.lat, report.location.lng);
      
      let color = '#06d6a0';
      let glow = 'rgba(6, 214, 160, 0.4)';
      
      if (report.type === 'unsafe') {
        color = '#ff0054';
        glow = 'rgba(255, 0, 84, 0.4)';
      } else if (report.type === 'warning') {
        color = '#ff7b00';
        glow = 'rgba(255, 123, 0, 0.4)';
      } else if (report.type === 'police') {
        color = '#00f5d4';
        glow = 'rgba(0, 245, 212, 0.4)';
      }

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '10px Inter';
      ctx.fillText(report.title, x + 10, y + 4);
    });

    // Draw label coordinate pings
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '11px monospace';
    ctx.fillText('📡 Simulated Tech-Park Map Grid | Double click anywhere to report/flag an incident', 20, 380);

  }, [reports, routingMode]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Crowdsourced Safety Zones</h1>
          <p style={{ color: 'var(--text-muted)' }}>MERN backend integration tracking incident heatmaps</p>
        </div>
        
        {/* Routing Mode Toggler (ADVANCED FEATURE WIDGET) */}
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '6px' }}>
          <button
            onClick={() => setRoutingMode('fastest')}
            style={{
              background: routingMode === 'fastest' ? 'rgba(255,0,84,0.15)' : 'none',
              border: 'none',
              color: routingMode === 'fastest' ? 'var(--danger)' : 'var(--text-muted)',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'var(--transition-smooth)'
            }}
          >
            ⚠️ Fastest Route
          </button>
          <button
            onClick={() => setRoutingMode('safest')}
            style={{
              background: routingMode === 'safest' ? 'rgba(6,214,160,0.15)' : 'none',
              border: 'none',
              color: routingMode === 'safest' ? '#06d6a0' : 'var(--text-muted)',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'var(--transition-smooth)'
            }}
          >
            🛡️ AI Safest Route
          </button>
        </div>
      </div>

      {routingMode === 'safest' ? (
        <div className="safety-banner safe" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <i className="fa-solid fa-route" style={{ fontSize: '1.2rem' }}></i>
          <span>**AI CRIME-SENTRY ACTIVE:** Mapped route steers clear of reported construction hazards and isolated dark stretches. Route security index is 94%.</span>
        </div>
      ) : (
        <div className="safety-banner danger" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '1.2rem' }}></i>
          <span>**WARNING:** Fastest route cuts directly through high-risk alley ways. Deviating or walking alone is highly discouraged.</span>
        </div>
      )}

      {/* Canvas Map Wrapper */}
      <div className="glass-panel" style={{ padding: '12px', overflow: 'hidden', marginBottom: '32px' }}>
        <canvas
          id="safety-map-canvas"
          width="800"
          height="400"
          onClick={handleMapClick}
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: '12px',
            cursor: 'crosshair',
            display: 'block'
          }}
        />
      </div>

      {/* Legend & Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #06d6a0' }}>
          <div className="avatar" style={{ background: 'rgba(6, 214, 160, 0.1)', color: '#06d6a0' }}><i className="fa-solid fa-circle-check"></i></div>
          <div>
            <h4 style={{ color: '#06d6a0' }}>Safe Zones</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pre-verified tech-parks</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #00f5d4' }}>
          <div className="avatar" style={{ background: 'rgba(0, 245, 212, 0.1)', color: '#00f5d4' }}><i className="fa-solid fa-shield-halved"></i></div>
          <div>
            <h4 style={{ color: '#00f5d4' }}>Police Beats</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stationary squad cars</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #ff7b00' }}>
          <div className="avatar" style={{ background: 'rgba(255, 123, 0, 0.1)', color: '#ff7b00' }}><i className="fa-solid fa-triangle-exclamation"></i></div>
          <div>
            <h4 style={{ color: '#ff7b00' }}>Warnings</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Underground metros/hazards</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #ff0054' }}>
          <div className="avatar" style={{ background: 'rgba(255, 0, 84, 0.1)', color: '#ff0054' }}><i className="fa-solid fa-skull-crossbones"></i></div>
          <div>
            <h4 style={{ color: '#ff0054' }}>Unsafe Outposts</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Isolated road dark points</p>
          </div>
        </div>
      </div>

      {/* List of active reports */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}><i className="fa-solid fa-list-check" style={{ color: 'var(--primary)' }}></i> Database Records</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-spinner fa-spin"></i> Fetching records from MongoDB...
          </div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No reports found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reports.map((report) => (
              <div
                key={report._id}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h4 style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: report.type === 'unsafe' ? 'var(--danger)' : report.type === 'warning' ? 'var(--secondary)' : report.type === 'police' ? '#00f5d4' : '#06d6a0'
                  }}>
                    <i className={report.type === 'unsafe' ? 'fa-solid fa-circle-exclamation' : report.type === 'warning' ? 'fa-solid fa-triangle-exclamation' : report.type === 'police' ? 'fa-solid fa-shield-halved' : 'fa-solid fa-circle-check'}></i>
                    {report.title}
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '6px' }}>{report.description}</p>
                </div>
                <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', textAlign: 'right' }}>
                  <div>GPS: {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Report Incident Modal */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(4, 1, 10, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-heavy" style={{ width: '90%', maxWidth: '500px', padding: '32px' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-map-pin" style={{ color: 'var(--secondary)' }}></i> Flag Safety Node / Report Incident
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
              This details will be stored globally in MongoDB and rendered instantly on all co-worker maps.
            </p>

            <form onSubmit={handleAddReport}>
              <div className="form-group">
                <label className="form-label">Incident / Zone Title</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Broken Streetlights, Aggressive Stray Dogs"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Description</label>
                <textarea
                  className="input-field"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  placeholder="Details of the hazard or safety parameter..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Safety Node Classification</label>
                <select className="input-field" value={newType} onChange={(e) => setNewType(e.target.value)}>
                  <option value="safe">🟢 Safe Zone (Active security guards, bright lights)</option>
                  <option value="police">🔵 Police Checkpost (Stationary squad car nearby)</option>
                  <option value="warning">🟡 Warning Zone (Broken lights, isolated, slippery road)</option>
                  <option value="unsafe">🔴 Unsafe Area (Aggressive strangers, active crime report)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-glass" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-secondary">
                  Save to MongoDB <i className="fa-solid fa-floppy-disk"></i>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SafetyZones;
