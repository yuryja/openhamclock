/**
 * SolarPanel Component
 * Toggleable between live sun image from NASA SDO and solar indices display
 */
import React, { useState } from 'react';

export const SolarPanel = ({ solarIndices }) => {
  const [showIndices, setShowIndices] = useState(() => {
    try {
      const saved = localStorage.getItem('openhamclock_solarPanelMode');
      return saved === 'indices';
    } catch (e) { return false; }
  });
  const [imageType, setImageType] = useState('0193');
  
  const toggleMode = () => {
    const newMode = !showIndices;
    setShowIndices(newMode);
    try {
      localStorage.setItem('openhamclock_solarPanelMode', newMode ? 'indices' : 'image');
    } catch (e) {}
  };
  
  const imageTypes = {
    '0193': { name: 'AIA 193Å', desc: 'Corona' },
    '0304': { name: 'AIA 304Å', desc: 'Chromosphere' },
    '0171': { name: 'AIA 171Å', desc: 'Quiet Corona' },
    '0094': { name: 'AIA 94Å', desc: 'Flaring' },
    'HMIIC': { name: 'HMI Int', desc: 'Visible' }
  };
  
  const timestamp = Math.floor(Date.now() / 900000) * 900000;
  const imageUrl = `https://sdo.gsfc.nasa.gov/assets/img/latest/latest_256_${imageType}.jpg?t=${timestamp}`;
  
  const getKpColor = (value) => {
    if (value >= 7) return '#ff0000';
    if (value >= 5) return '#ff6600';
    if (value >= 4) return '#ffcc00';
    if (value >= 3) return '#88cc00';
    return '#00ff88';
  };

  // Get K-Index data - server returns 'kp' not 'kIndex'
  const kpData = solarIndices?.data?.kp || solarIndices?.data?.kIndex;

  return (
    <div className="panel" style={{ padding: '8px' }}>
      {/* Header with toggle */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '6px'
      }}>
        <span style={{ fontSize: '12px', color: 'var(--accent-amber)', fontWeight: '700' }}>
          ☀ {showIndices ? 'SOLAR INDICES' : 'SOLAR'}
        </span>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {!showIndices && (
            <select 
              value={imageType}
              onChange={(e) => setImageType(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontSize: '10px',
                padding: '2px 4px',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              {Object.entries(imageTypes).map(([key, val]) => (
                <option key={key} value={key}>{val.desc}</option>
              ))}
            </select>
          )}
          <button
            onClick={toggleMode}
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
            title={showIndices ? 'Show solar image' : 'Show solar indices'}
          >
            {showIndices ? '🖼️' : '📊'}
          </button>
        </div>
      </div>
      
      {showIndices ? (
        /* Solar Indices View */
        <div>
          {solarIndices?.data ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* SFI Row */}
              <div style={{ background: 'var(--bg-tertiary)', borderRadius: '6px', padding: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ minWidth: '60px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SFI</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: '#ff8800', fontFamily: 'Orbitron, monospace' }}>
                    {solarIndices.data.sfi?.current || '--'}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  {solarIndices.data.sfi?.history?.length > 0 && (
                    <svg width="100%" height="30" viewBox="0 0 100 30" preserveAspectRatio="none">
                      {(() => {
                        const data = solarIndices.data.sfi.history.slice(-20);
                        const values = data.map(d => d.value);
                        const max = Math.max(...values, 1);
                        const min = Math.min(...values);
                        const range = max - min || 1;
                        const points = data.map((d, i) => {
                          const x = (i / (data.length - 1)) * 100;
                          const y = 30 - ((d.value - min) / range) * 25;
                          return `${x},${y}`;
                        }).join(' ');
                        return <polyline points={points} fill="none" stroke="#ff8800" strokeWidth="1.5" />;
                      })()}
                    </svg>
                  )}
                </div>
              </div>
              
              {/* K-Index Row */}
              <div style={{ background: 'var(--bg-tertiary)', borderRadius: '6px', padding: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ minWidth: '60px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>K-Index</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: getKpColor(kpData?.current), fontFamily: 'Orbitron, monospace' }}>
                    {kpData?.current ?? '--'}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  {kpData?.forecast?.length > 0 ? (
                    <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '30px' }}>
                      {kpData.forecast.slice(0, 8).map((item, i) => {
                        const val = typeof item === 'object' ? item.value : item;
                        return (
                          <div key={i} style={{
                            flex: 1,
                            height: `${Math.max(10, (val / 9) * 100)}%`,
                            background: getKpColor(val),
                            borderRadius: '2px',
                            opacity: 0.8
                          }} title={`Kp ${val}`} />
                        );
                      })}
                    </div>
                  ) : kpData?.history?.length > 0 ? (
                    <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '30px' }}>
                      {kpData.history.slice(-8).map((item, i) => {
                        const val = typeof item === 'object' ? item.value : item;
                        return (
                          <div key={i} style={{
                            flex: 1,
                            height: `${Math.max(10, (val / 9) * 100)}%`,
                            background: getKpColor(val),
                            borderRadius: '2px',
                            opacity: 0.8
                          }} title={`Kp ${val}`} />
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>No forecast data</div>
                  )}
                </div>
              </div>
              
              {/* SSN Row */}
              <div style={{ background: 'var(--bg-tertiary)', borderRadius: '6px', padding: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ minWidth: '60px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SSN</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: '#aa88ff', fontFamily: 'Orbitron, monospace' }}>
                    {solarIndices.data.ssn?.current || '--'}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  {solarIndices.data.ssn?.history?.length > 0 && (
                    <svg width="100%" height="30" viewBox="0 0 100 30" preserveAspectRatio="none">
                      {(() => {
                        const data = solarIndices.data.ssn.history.slice(-20);
                        const values = data.map(d => d.value);
                        const max = Math.max(...values, 1);
                        const min = Math.min(...values, 0);
                        const range = max - min || 1;
                        const points = data.map((d, i) => {
                          const x = (i / (data.length - 1)) * 100;
                          const y = 30 - ((d.value - min) / range) * 25;
                          return `${x},${y}`;
                        }).join(' ');
                        return <polyline points={points} fill="none" stroke="#aa88ff" strokeWidth="1.5" />;
                      })()}
                    </svg>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
              Loading solar data...
            </div>
          )}
        </div>
      ) : (
        /* Solar Image View */
        <div style={{ textAlign: 'center' }}>
          <img 
            src={imageUrl}
            alt="SDO Solar Image"
            style={{ 
              width: '100%', 
              maxWidth: '200px',
              borderRadius: '50%',
              border: '2px solid var(--border-color)'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
            SDO/AIA • Live from NASA
          </div>
        </div>
      )}
    </div>
  );
};

export default SolarPanel;
