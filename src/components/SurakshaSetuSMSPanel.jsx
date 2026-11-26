'use client';
import { useState, useEffect, useCallback, useRef, Fragment } from 'react';

export default function SurakshaSetuSMSPanel({ onAlertsUpdate }) {
  // Offline SOS Dispatch state
  const [emergencyNote, setEmergencyNote] = useState('Emergency Extraction Needed');
  const [dispatchStatus, setDispatchStatus] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // Live SMS Feed state
  const [smsAlerts, setSmsAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [aiDedupActive, setAiDedupActive] = useState(true);
  const [expandedClusters, setExpandedClusters] = useState({});

  const hqPhone = process.env.NEXT_PUBLIC_HQ_GATEWAY_PHONE || '';
  const onAlertsUpdateRef = useRef(onAlertsUpdate);

  // AI Deduplication & Clustering for SMS alerts
  const clusteredSmsData = useCallback(() => {
    if (!aiDedupActive) {
      return { clusters: smsAlerts.map((row, idx) => ({ primary: row, duplicates: [], id: idx })), suppressedCount: 0, noiseReduction: 0 };
    }

    const clusters = [];
    const visited = new Set();

    const normalize = (val) => String(val || '').replace(/[^0-9]/g, '');
    const cleanText = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]/g, ' ');

    for (let i = 0; i < smsAlerts.length; i++) {
      if (visited.has(i)) continue;
      const primary = smsAlerts[i];
      visited.add(i);

      const pPhone = normalize(primary.FROM ?? primary.From ?? '');
      const pMsg = cleanText(primary['RAW MESSAGE'] ?? primary['Raw Message'] ?? '');
      const pLat = parseFloat(primary.LATITUDE ?? primary.Latitude);
      const pLng = parseFloat(primary.LONGITUDE ?? primary.Longitude);

      const duplicates = [];

      for (let j = i + 1; j < smsAlerts.length; j++) {
        if (visited.has(j)) continue;
        const candidate = smsAlerts[j];
        const cPhone = normalize(candidate.FROM ?? candidate.From ?? '');
        const cMsg = cleanText(candidate['RAW MESSAGE'] ?? candidate['Raw Message'] ?? '');
        const cLat = parseFloat(candidate.LATITUDE ?? candidate.Latitude);
        const cLng = parseFloat(candidate.LONGITUDE ?? candidate.Longitude);

        let isMatch = false;
        let matchReason = '';

        // Match 1: Same sender phone number within stream
        if (pPhone && cPhone && (pPhone === cPhone || pPhone.endsWith(cPhone) || cPhone.endsWith(pPhone))) {
          isMatch = true;
          matchReason = `Repeated SMS from sender ${pPhone}`;
        }

        // Match 2: Near coordinates (within ~1km) and overlapping text
        if (!isMatch && !isNaN(pLat) && !isNaN(cLat) && Math.abs(pLat - cLat) < 0.015 && Math.abs(pLng - cLng) < 0.015) {
          isMatch = true;
          matchReason = 'Identical GPS Disaster Sector';
        }

        // Match 3: High textual similarity
        if (!isMatch && pMsg.length > 5 && cMsg.length > 5) {
          const wordsA = new Set(pMsg.split(' ').filter(w => w.length > 3));
          const wordsB = new Set(cMsg.split(' ').filter(w => w.length > 3));
          let common = 0;
          for (const w of wordsA) if (wordsB.has(w)) common++;
          if (common >= 2 || (wordsA.size > 0 && common / wordsA.size > 0.5)) {
            isMatch = true;
            matchReason = 'High Semantic Overlap';
          }
        }

        if (isMatch) {
          visited.add(j);
          duplicates.push({ row: candidate, reason: matchReason });
        }
      }

      clusters.push({
        id: i,
        primary,
        duplicates,
        totalCalls: duplicates.length + 1
      });
    }

    const total = smsAlerts.length;
    const suppressed = total - clusters.length;
    const rate = total > 0 ? Math.round((suppressed / total) * 100) : 0;

    return { clusters, suppressedCount: suppressed, noiseReduction: rate };
  }, [smsAlerts, aiDedupActive]);

  const { clusters: displayClusters, suppressedCount, noiseReduction } = clusteredSmsData();

  useEffect(() => {
    onAlertsUpdateRef.current = onAlertsUpdate;
  }, [onAlertsUpdate]);

  // Fetch SMS Alerts from internal API proxy for manual refresh
  const fetchSmsAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/surakshasetu-sms', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();
      const alertsArray = Array.isArray(data) ? data : [];
      setSmsAlerts(alertsArray);
      setLastUpdated(new Date());
      setError(null);
      if (onAlertsUpdateRef.current) {
        onAlertsUpdateRef.current(alertsArray);
      }
    } catch (err) {
      console.error('SurakshaSetu SMS polling error:', err);
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const handleManualSync = async () => {
    setIsLoading(true);
    await fetchSmsAlerts();
    setIsLoading(false);
  };

  // Poll every 5 seconds
  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        const res = await fetch('/api/surakshasetu-sms', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        if (!active) return;
        const alertsArray = Array.isArray(data) ? data : [];
        setSmsAlerts(alertsArray);
        setLastUpdated(new Date());
        setError(null);
        if (onAlertsUpdateRef.current) {
          onAlertsUpdateRef.current(alertsArray);
        }
      } catch (err) {
        if (!active) return;
        console.error('SurakshaSetu SMS polling error:', err);
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Handle Offline SOS Dispatch
  const handleDispatchSMS = () => {
    const note = emergencyNote.trim() || 'Emergency Extraction Needed';
    const targetPhone = hqPhone;

    const launchSms = (bodyText) => {
      const encodedBody = encodeURIComponent(bodyText);
      const smsUri = `sms:${targetPhone}?body=${encodedBody}`;
      window.location.href = smsUri;
    };

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setDispatchStatus({
        type: 'warning',
        message: 'Geolocation unavailable in this environment. Launching fallback plain-text SMS...'
      });
      launchSms(note);
      return;
    }

    setIsLocating(true);
    setDispatchStatus({
      type: 'info',
      message: 'Acquiring GPS coordinates for off-grid SOS dispatch...'
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const formattedSOS = `SurakshaSetu#SOS#${lat.toFixed(4)},${lng.toFixed(4)}#${note}`;

        setDispatchStatus({
          type: 'success',
          message: `GPS Locked (${lat.toFixed(4)}, ${lng.toFixed(4)}). Launching SOS SMS dispatch...`
        });

        launchSms(formattedSOS);
      },
      (geoError) => {
        setIsLocating(false);
        console.warn('Geolocation error / permission denied:', geoError);
        setDispatchStatus({
          type: 'warning',
          message: 'GPS access denied/timed out. Falling back to plain note SMS...'
        });

        launchSms(note);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  };

  return (
    <div className="section" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header with Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fas fa-tower-broadcast" style={{ color: '#2563eb', fontSize: '20px' }}></i>
          <h2 style={{ margin: 0, fontSize: '18px' }}>SurakshaSetu Off-Grid SMS Gateway</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {hqPhone && (
            <span
              style={{
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="fas fa-sim-card"></i> HQ Gateway: {hqPhone}
            </span>
          )}
          <span className="status-badge status-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }}></span>
            Live (5s)
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={handleManualSync}
            disabled={isLoading}
            style={{ padding: '4px 10px', fontSize: '12px' }}
            title="Manual sync"
          >
            <i className={`fas fa-sync-alt ${isLoading ? 'fa-spin' : ''}`}></i> Sync
          </button>
        </div>
      </div>

      {/* Offline SOS Dispatch Area */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
          border: '1px solid #bfdbfe',
          borderRadius: '10px',
          padding: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <i className="fas fa-satellite-dish" style={{ color: '#ea580c' }}></i>
          <strong style={{ fontSize: '14px', color: '#1e293b' }}>Offline SOS Dispatcher (Direct Device-to-SIM)</strong>
        </div>
        <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
          When mobile data/internet is unavailable, dispatch structured GPS coordinates to the HQ Gateway via SMS protocol.
        </p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 280px' }}>
            <input
              type="text"
              className="form-control"
              value={emergencyNote}
              onChange={(e) => setEmergencyNote(e.target.value)}
              placeholder="Emergency extraction or casualty note..."
              style={{ margin: 0, height: '42px', fontSize: '13px' }}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDispatchSMS}
            disabled={isLocating}
            style={{
              height: '42px',
              padding: '0 18px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
              borderColor: '#c2410c',
              fontSize: '13px',
              fontWeight: 700
            }}
          >
            <i className={`fas ${isLocating ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
            {isLocating ? 'Acquiring GPS...' : 'Dispatch SOS via SMS'}
          </button>
        </div>

        {dispatchStatus && (
          <div
            style={{
              marginTop: '10px',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              background:
                dispatchStatus.type === 'success'
                  ? '#ecfdf5'
                  : dispatchStatus.type === 'warning'
                  ? '#fffbeb'
                  : '#eff6ff',
              color:
                dispatchStatus.type === 'success'
                  ? '#047857'
                  : dispatchStatus.type === 'warning'
                  ? '#b45309'
                  : '#1d4ed8',
              border: `1px solid ${
                dispatchStatus.type === 'success'
                  ? '#a7f3d0'
                  : dispatchStatus.type === 'warning'
                  ? '#fde68a'
                  : '#bfdbfe'
              }`
            }}
          >
            <i
              className={`fas ${
                dispatchStatus.type === 'success'
                  ? 'fa-check-circle'
                  : dispatchStatus.type === 'warning'
                  ? 'fa-exclamation-triangle'
                  : 'fa-info-circle'
              }`}
              style={{ marginRight: '6px' }}
            ></i>
            {dispatchStatus.message}
          </div>
        )}
      </div>

      {/* Live SMS Feed Table & AI Deduplication Banner */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{ fontSize: '13px', color: '#334155' }}>
              Incoming Off-Grid Alerts ({smsAlerts.length})
            </strong>
            <button
              type="button"
              onClick={() => setAiDedupActive(prev => !prev)}
              style={{
                fontSize: '11px',
                padding: '3px 9px',
                borderRadius: '14px',
                border: '1px solid',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: aiDedupActive ? '#eff6ff' : '#f8fafc',
                color: aiDedupActive ? '#2563eb' : '#64748b',
                borderColor: aiDedupActive ? '#93c5fd' : '#cbd5e1'
              }}
              title="Toggle AI Deduplication & Call Clustering"
            >
              <i className={`fas ${aiDedupActive ? 'fa-wand-magic-sparkles' : 'fa-list'}`}></i>
              {aiDedupActive ? 'AI Deduplication Active' : 'Raw Feed (No Dedup)'}
            </button>
          </div>
          {lastUpdated && (
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Synced: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* AI Noise Reduction Banner when active */}
        {aiDedupActive && smsAlerts.length > 0 && (
          <div
            style={{
              padding: '8px 12px',
              marginBottom: '10px',
              background: '#f0fdf4',
              color: '#166534',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              fontSize: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fas fa-shield-halved" style={{ color: '#16a34a' }}></i>
              <span>
                <strong>AI Incident Deduplication:</strong> {displayClusters.length} distinct incidents identified from {smsAlerts.length} raw alerts.
              </span>
            </div>
            <span
              style={{
                background: '#dcfce7',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '11px',
                color: '#15803d'
              }}
            >
              {suppressedCount} duplicate calls suppressed ({noiseReduction}% noise cut)
            </span>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '10px 12px',
              marginBottom: '10px',
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              fontSize: '12px'
            }}
          >
            <i className="fas fa-circle-exclamation" style={{ marginRight: '6px' }}></i>
            Sync notice: {error}
          </div>
        )}

        <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Timestamp</th>
                <th style={{ width: '130px' }}>From</th>
                <th style={{ width: '110px' }}>Latitude</th>
                <th style={{ width: '110px' }}>Longitude</th>
                <th>Incident & Call Cluster</th>
              </tr>
            </thead>
            <tbody>
              {displayClusters.length > 0 ? (
                displayClusters.map((cluster) => {
                  const row = cluster.primary;
                  const idx = cluster.id;
                  const duplicates = cluster.duplicates || [];
                  const isExpanded = Boolean(expandedClusters[idx]);

                  const timestamp = row.TIMESTAMP ?? row.Timestamp ?? '';
                  const fromVal = row.FROM ?? row.From ?? 'N/A';
                  const latVal = row.LATITUDE ?? row.Latitude;
                  const lngVal = row.LONGITUDE ?? row.Longitude;
                  const rawMsg = row['RAW MESSAGE'] ?? row['Raw Message'] ?? '';

                  const isStructured = Boolean(
                    typeof rawMsg === 'string' && rawMsg.includes('SurakshaSetu#SOS#')
                  );

                  let timeFormatted = 'N/A';
                  if (timestamp) {
                    try {
                      const d = new Date(timestamp);
                      timeFormatted = isNaN(d.getTime()) ? String(timestamp) : d.toLocaleString();
                    } catch {
                      timeFormatted = String(timestamp);
                    }
                  }

                  const latNum = parseFloat(latVal);
                  const lngNum = parseFloat(lngVal);
                  const hasValidCoords = !isNaN(latNum) && !isNaN(lngNum) && (latNum !== 0 || lngNum !== 0);

                  return (
                    <Fragment key={idx}>
                      <tr
                        style={{
                          backgroundColor: isStructured ? '#fffbeb' : duplicates.length > 0 ? '#f8fafc' : undefined,
                          borderLeft: isStructured ? '4px solid #ea580c' : duplicates.length > 0 ? '4px solid #3b82f6' : undefined
                        }}
                      >
                        <td style={{ fontSize: '11px', whiteSpace: 'nowrap', color: '#475569' }}>
                          {timeFormatted}
                        </td>
                        <td style={{ fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              background: '#f1f5f9',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              color: '#1e293b'
                            }}
                          >
                            <i className="fas fa-phone-alt" style={{ fontSize: '10px', marginRight: '4px', color: '#64748b' }}></i>
                            {String(fromVal)}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                          {hasValidCoords ? latNum.toFixed(4) : (latVal != null && latVal !== '' ? String(latVal) : 'N/A')}
                        </td>
                        <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                          {hasValidCoords ? lngNum.toFixed(4) : (lngVal != null && lngVal !== '' ? String(lngVal) : 'N/A')}
                        </td>
                        <td style={{ fontSize: '12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              {isStructured ? (
                                <span
                                  style={{
                                    background: '#fef3c7',
                                    color: '#b45309',
                                    border: '1px solid #f59e0b',
                                    fontWeight: 700,
                                    fontSize: '10px',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <i className="fas fa-satellite-dish"></i> STRUCTURED SOS
                                </span>
                              ) : (
                                <span
                                  style={{
                                    background: '#f1f5f9',
                                    color: '#64748b',
                                    border: '1px solid #cbd5e1',
                                    fontWeight: 600,
                                    fontSize: '10px',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <i className="fas fa-envelope"></i> PLAIN SMS
                                </span>
                              )}

                              {duplicates.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedClusters(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                  style={{
                                    background: '#dbeafe',
                                    color: '#1d4ed8',
                                    border: '1px solid #93c5fd',
                                    fontWeight: 700,
                                    fontSize: '10.5px',
                                    padding: '1px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-layer-group'}`}></i>
                                  {duplicates.length + 1} Calls Merged ({duplicates.length} duplicate)
                                </button>
                              )}
                            </div>

                            <span
                              style={{
                                wordBreak: 'break-word',
                                color: isStructured ? '#9a3412' : '#334155',
                                fontWeight: isStructured ? 600 : 400
                              }}
                            >
                              {rawMsg || 'Empty payload'}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Child Duplicate Rows */}
                      {isExpanded && duplicates.map((dup, dupIdx) => (
                        <tr
                          key={`${idx}-dup-${dupIdx}`}
                          style={{
                            backgroundColor: '#f1f5f9',
                            borderLeft: '4px solid #94a3b8',
                            fontSize: '11px'
                          }}
                        >
                          <td style={{ color: '#64748b', paddingLeft: '24px' }}>
                            <i className="fas fa-turn-up fa-rotate-90" style={{ marginRight: '6px', color: '#94a3b8' }}></i>
                            {dup.row.TIMESTAMP || 'N/A'}
                          </td>
                          <td style={{ color: '#475569' }}>
                            <span style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: '3px' }}>
                              {dup.row.FROM || 'N/A'}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'monospace', color: '#64748b' }}>{dup.row.LATITUDE || '—'}</td>
                          <td style={{ fontFamily: 'monospace', color: '#64748b' }}>{dup.row.LONGITUDE || '—'}</td>
                          <td>
                            <span style={{ color: '#2563eb', fontWeight: 600, marginRight: '6px' }}>
                              [{dup.reason}]
                            </span>
                            <span style={{ color: '#475569' }}>
                              {dup.row['RAW MESSAGE'] || dup.row.message || 'Duplicate content'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    <i className="fas fa-inbox" style={{ fontSize: '20px', display: 'block', marginBottom: '8px', opacity: 0.5 }}></i>
                    No incoming off-grid SMS alerts recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
