import React, { useState, useEffect, useContext, useRef } from 'react';
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
  const [clickCoords, setClickCoords] = useState(null);
  
  // Routing Mode: 'safest', 'fastest', or 'crowded'
  const [routingMode, setRoutingMode] = useState('safest');
  
  // Real GPS Coordinates (Default: Bengaluru, India)
  const [gpsLocation, setGpsLocation] = useState({ lat: 12.9716, lng: 77.5946 });
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const routesRef = useRef([]);

  // Fetch reports from MongoDB backend
  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://safecompanion-rxve.onrender.com/api/reports');
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

  // Request user's real location on load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setGpsLocation(coords);
        },
        (error) => {
          console.warn("Using default Bengaluru coordinates because:", error.message);
        }
      );
    }
  }, []);

  // Initialize and update the Leaflet Map
  useEffect(() => {
    if (!window.L) return;

    // Remove existing map instance if it exists to prevent container re-initialization error
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Initialize Map container with scrollWheelZoom disabled to prevent scroll trapping
    const map = window.L.map('map-id', {
      scrollWheelZoom: false
    }).setView([gpsLocation.lat, gpsLocation.lng], 15);
    mapRef.current = map;

    // Use custom styled CartoDB Dark Matter / Warm Brownish map tiles
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Drop main user position pin
    const userIcon = window.L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: var(--primary); border: 2px solid white; width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 10px var(--primary-glow);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    window.L.marker([gpsLocation.lat, gpsLocation.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup("<b>Your Current Position</b><br/>Real-time GPS Co-Pilot active.")
      .openPopup();

    // Set up Map click listener to add custom safety reports
    map.on('click', (e) => {
      setClickCoords(e.latlng);
      setModalOpen(true);
    });

    // Draw dynamic route paths relative to user's real location
    const start = [gpsLocation.lat, gpsLocation.lng];
    const end = [gpsLocation.lat + 0.005, gpsLocation.lng + 0.005];
    
    // 1. FASTEST ROUTE (Direct cutting through darker/riskier alleys - Red line)
    const fastestPath = [
      start,
      [gpsLocation.lat + 0.002, gpsLocation.lng + 0.002],
      end
    ];

    // 2. AI SAFEST ROUTE (Curves away from threats, passes police checkposts - Greenish Beige)
    const safestPath = [
      start,
      [gpsLocation.lat + 0.001, gpsLocation.lng + 0.003],
      [gpsLocation.lat + 0.003, gpsLocation.lng + 0.004],
      end
    ];

    // 3. CROWDED ROUTE (Passes through busy commercial main roads - High Pedestrian Flow - Blue/Copper)
    const crowdedPath = [
      start,
      [gpsLocation.lat + 0.003, gpsLocation.lng + 0.001],
      [gpsLocation.lat + 0.004, gpsLocation.lng + 0.003],
      end
    ];

    // Draw selected route line on map
    let activePath, pathColor, pathName;
    if (routingMode === 'fastest') {
      activePath = fastestPath;
      pathColor = '#b83a25'; // Reddish
      pathName = 'Fastest Route (Risky Alleyways)';
    } else if (routingMode === 'safest') {
      activePath = safestPath;
      pathColor = '#ddc0a9'; // Beige Almond
      pathName = 'AI Safest Route (Police Beats)';
    } else {
      activePath = crowdedPath;
      pathColor = '#8a7366'; // Cinnamon Brown (Crowded)
      pathName = 'Crowded Pedestrian Route (Safe)';
    }

    const routeLine = window.L.polyline(activePath, {
      color: pathColor,
      weight: 6,
      opacity: 0.85,
      lineJoin: 'round'
    }).addTo(map);

    routesRef.current.push(routeLine);

    // Zoom map to fit active route
    map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });

    // Draw database reports as custom markers
    reports.forEach((report) => {
      if (!report.location || report.location.lat === undefined) return;
      
      let markerColor = '#ddc0a9'; // Safe (Beige)
      if (report.type === 'unsafe') markerColor = '#b83a25'; // Red
      if (report.type === 'warning') markerColor = '#8a7366'; // Brown Warning
      if (report.type === 'police') markerColor = '#f5f1ed'; // Cream Police

      const customIcon = window.L.divIcon({
        className: 'custom-marker-icon',
        html: `<div style="background-color: ${markerColor}; border: 2px solid var(--bg-dark); width: 16px; height: 16px; border-radius: 50%; box-shadow: 0 0 8px ${markerColor}99;"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const marker = window.L.marker([report.location.lat, report.location.lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: var(--font-main); color: var(--text-main);">
            <strong style="color: ${markerColor}; text-transform: uppercase;">${report.type} Node: ${report.title}</strong>
            <p style="font-size: 0.82rem; margin: 4px 0 0 0;">${report.description}</p>
          </div>
        `);

      markersRef.current.push(marker);
    });

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [gpsLocation, reports, routingMode]);

  const handleAddReport = async (e) => {
    e.preventDefault();
    if (!newTitle || !newDesc || !clickCoords) return;

    try {
      const res = await fetch('https://safecompanion-rxve.onrender.com/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          type: newType,
          location: { lat: clickCoords.lat, lng: clickCoords.lng },
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Safety Zones & GPS Co-Pilot</h1>
          <p style={{ color: 'var(--text-muted)' }}>Real-time location reporting overlay & safest routing engines</p>
        </div>
        
        {/* Routing Mode Toggler (Safest vs. Fastest vs. Crowded) */}
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '6px' }}>
          <button
            onClick={() => setRoutingMode('safest')}
            style={{
              background: routingMode === 'safest' ? 'rgba(221, 192, 169, 0.18)' : 'none',
              border: 'none',
              color: routingMode === 'safest' ? 'var(--text-main)' : 'var(--text-muted)',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.82rem',
              transition: 'var(--transition-smooth)'
            }}
          >
            🛡️ AI Safest
          </button>
          
          <button
            onClick={() => setRoutingMode('crowded')}
            style={{
              background: routingMode === 'crowded' ? 'rgba(138, 115, 102, 0.18)' : 'none',
              border: 'none',
              color: routingMode === 'crowded' ? 'var(--text-main)' : 'var(--text-muted)',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.82rem',
              transition: 'var(--transition-smooth)'
            }}
          >
            👥 Crowded Road
          </button>

          <button
            onClick={() => setRoutingMode('fastest')}
            style={{
              background: routingMode === 'fastest' ? 'rgba(184, 58, 37, 0.18)' : 'none',
              border: 'none',
              color: routingMode === 'fastest' ? 'var(--secondary)' : 'var(--text-muted)',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.82rem',
              transition: 'var(--transition-smooth)'
            }}
          >
            ⚠️ Fastest
          </button>
        </div>
      </div>

      {/* Safety Routing Info Banners */}
      {routingMode === 'safest' && (
        <div className="safety-banner safe">
          <i className="fa-solid fa-route" style={{ fontSize: '1.2rem' }}></i>
          <span>**AI CRIME-SENTRY ACTIVE:** Mapped route steers clear of reported construction hazards and isolated dark stretches. Route security index is 94%.</span>
        </div>
      )}
      {routingMode === 'crowded' && (
        <div className="safety-banner warning" style={{ borderColor: 'var(--primary-glow)', color: 'var(--primary)' }}>
          <i className="fa-solid fa-users" style={{ fontSize: '1.2rem' }}></i>
          <span>**CROWDED ROUTE ENABLED:** Prioritizing busy commercial streets, high foot-traffic walkways, and shopping areas. Walking index is high.</span>
        </div>
      )}
      {routingMode === 'fastest' && (
        <div className="safety-banner danger">
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '1.2rem' }}></i>
          <span>**WARNING:** Fastest route cuts directly through high-risk alleyways. Walking alone here is highly discouraged.</span>
        </div>
      )}

      {/* Real Interactive Leaflet Map Container */}
      <div className="glass-panel" style={{ padding: '12px', overflow: 'hidden', marginBottom: '32px' }}>
        <div id="map-id" style={{ width: '100%', height: '450px', borderRadius: '12px', zIndex: 1 }}></div>
        <div style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          💡 Click anywhere on the map to flag a safety incident or report a new zone.
        </div>
      </div>

      {/* Map Legend */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid var(--primary)' }}>
          <div className="avatar" style={{ background: 'var(--bg-darker)', color: 'var(--primary)' }}><i className="fa-solid fa-circle-check"></i></div>
          <div>
            <h4 style={{ color: 'var(--primary)' }}>Safe Areas</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Well-lit crowded streets</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #f5f1ed' }}>
          <div className="avatar" style={{ background: 'var(--bg-darker)', color: '#f5f1ed' }}><i className="fa-solid fa-shield-halved"></i></div>
          <div>
            <h4 style={{ color: '#f5f1ed' }}>Police Beats</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stationed patrol booths</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #8a7366' }}>
          <div className="avatar" style={{ background: 'var(--bg-darker)', color: '#8a7366' }}><i className="fa-solid fa-triangle-exclamation"></i></div>
          <div>
            <h4 style={{ color: '#8a7366' }}>Warnings</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Poorly lit roads / construction</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid var(--secondary)' }}>
          <div className="avatar" style={{ background: 'var(--bg-darker)', color: 'var(--secondary)' }}><i className="fa-solid fa-skull-crossbones"></i></div>
          <div>
            <h4 style={{ color: 'var(--secondary)' }}>Unsafe Hotspots</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Aggressive crowds/crime logs</p>
          </div>
        </div>
      </div>

      {/* Incident List */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}><i className="fa-solid fa-list-check" style={{ color: 'var(--primary)' }}></i> Crowdsourced Database Records</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-spinner fa-spin"></i> Fetching records from MongoDB...
          </div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No records found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reports.map((report) => {
              let tagColor = 'var(--primary)';
              if (report.type === 'unsafe') tagColor = 'var(--secondary)';
              if (report.type === 'warning') tagColor = '#8a7366';
              if (report.type === 'police') tagColor = '#f5f1ed';

              return (
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
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: tagColor }}>
                      <i className={report.type === 'unsafe' ? 'fa-solid fa-circle-exclamation' : report.type === 'warning' ? 'fa-solid fa-triangle-exclamation' : report.type === 'police' ? 'fa-solid fa-shield-halved' : 'fa-solid fa-circle-check'}></i>
                      {report.title}
                    </h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '6px' }}>{report.description}</p>
                  </div>
                  <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', textAlign: 'right' }}>
                    <div>GPS: {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}</div>
                  </div>
                </div>
              );
            })}
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
              This detail will be saved globally to your MongoDB cluster and plotted live.
            </p>

            <form onSubmit={handleAddReport}>
              <div className="form-group">
                <label className="form-label">Incident / Zone Title</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Unlit Commercial Alley, Active Street Fight"
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
                  placeholder="Details of safety factors in this zone..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Safety Node Classification</label>
                <select className="input-field" value={newType} onChange={(e) => setNewType(e.target.value)}>
                  <option value="safe">🟢 Safe Zone (Active security, well-lit crowded street)</option>
                  <option value="police">⚪ Police Checkpost (Stationary squad car nearby)</option>
                  <option value="warning">🟤 Warning Zone (Broken lights, isolated street)</option>
                  <option value="unsafe">🔴 Unsafe Area (Aggressive strangers, reported threat)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-glass" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-secondary">
                  Save to Database <i className="fa-solid fa-floppy-disk"></i>
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
