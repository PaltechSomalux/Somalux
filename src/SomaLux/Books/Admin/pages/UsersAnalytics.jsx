import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const UsersAnalytics = ({ rows }) => {
  const [range, setRange] = useState('month');

  const {
    kpiActive,
    kpiSignedOut,
    totalActiveNow,
    totalUsers,
    totalAuthenticated,
    totalWithTracking,
    totalSignedOut,
    chartData,
    rangeLabel,
    trackingCoverage,
  } = useMemo(() => {
    const now = new Date();
    let from;
    if (range === 'daily') {
      from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (range === 'week') {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === 'year') {
      from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    } else {
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const totalUsersLocal = rows.length;
    let totalActiveNowLocal = 0;
    let totalAuthenticatedLocal = 0;
    let totalWithTrackingLocal = 0;
    let totalSignedOutLocal = 0;
    let activePeriod = 0;
    let signedOutPeriod = 0;

    const ONLINE_WINDOW_MINUTES = 5;
    const onlineWindowMs = ONLINE_WINDOW_MINUTES * 60 * 1000;

    rows.forEach((u) => {
      // Count authenticated users (with id + email)
      if (u.id && u.email) {
        totalAuthenticatedLocal += 1;
      }

      const lastActiveAt = u.last_active_at ? new Date(u.last_active_at) : null;
      const deactivatedAt = u.deactivated_at ? new Date(u.deactivated_at) : null;

      // HONEST METRIC: Count only users where last_active_at is NOT null
      // This shows users with actual activity tracking
      if (lastActiveAt) {
        totalWithTrackingLocal += 1;

        // Only these users can be counted as "active"
        const isSignedOut = !!deactivatedAt && deactivatedAt <= now;
        
        if (!isSignedOut) {
          const isOnlineNow = (now.getTime() - lastActiveAt.getTime() <= onlineWindowMs);
          if (isOnlineNow) {
            totalActiveNowLocal += 1;
          }

          if (lastActiveAt >= from && lastActiveAt <= now) {
            activePeriod += 1;
          }
        }
      }

      // Count signed-out (only if deactivated_at exists)
      if (deactivatedAt && deactivatedAt <= now) {
        totalSignedOutLocal += 1;
        if (deactivatedAt >= from && deactivatedAt <= now) {
          signedOutPeriod += 1;
        }
      }
    });

    const rangeLabelLocal = range === 'daily' ? 'Last 24 hours' : range === 'week' ? 'Last 7 days' : range === 'year' ? 'Last 12 months' : 'Last 30 days';
    
    const trackingCoverageLocal = totalAuthenticatedLocal > 0
      ? Math.round((totalWithTrackingLocal / totalAuthenticatedLocal) * 100)
      : 0;

    return {
      kpiActive: activePeriod,
      kpiSignedOut: signedOutPeriod,
      totalActiveNow: totalActiveNowLocal,
      totalUsers: totalUsersLocal,
      totalAuthenticated: totalAuthenticatedLocal,
      totalWithTracking: totalWithTrackingLocal,
      totalSignedOut: totalSignedOutLocal,
      chartData: [],
      rangeLabel: rangeLabelLocal,
      trackingCoverage: trackingCoverageLocal,
    };
  }, [rows, range]);

  // Only graph removed, box counts remain
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {['daily', 'week', 'month', 'year'].map((key) => (
            <button
              key={key}
              className="btn"
              style={{
                padding: '4px 12px',
                borderRadius: 999,
                background: range === key ? '#005c4b' : '#202c33',
                color: '#e9edef',
                border: 'none',
                fontSize: 12,
                textTransform: 'capitalize',
              }}
              onClick={() => setRange(key)}
            >
              {key}
            </button>
          ))}
        </div>
        <div style={{ color: '#8696a0', fontSize: 12 }}>{rangeLabel}</div>
      </div>

      {/* CRITICAL WARNING IF NO TRACKING */}
      {trackingCoverage === 0 && (
        <div style={{ marginTop: 12, padding: 12, background: '#7c2d12', borderRadius: 8, border: '1px solid #ea580c', color: '#fed7aa' }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>⚠️ NO ACTIVITY TRACKING DETECTED</div>
          <div style={{ fontSize: 11, lineHeight: 1.5 }}>
            The system has 0% activity tracking coverage. Users don't have last_active_at timestamps. 
            <strong> Active user metrics are not available.</strong> Implement activity tracking to start monitoring user engagement.
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 6, marginTop: 8 }}>
        <div style={{ background: '#111b21', borderRadius: 6, padding: 8, border: '1px solid #202c33' }}>
          <div style={{ fontSize: 11, color: '#8696a0', marginBottom: 2 }}>Active users ({rangeLabel})</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#e9edef' }}>{kpiActive}</div>
          <div style={{ fontSize: 10, color: '#667a7f', marginTop: 2 }}>With activity tracking</div>
        </div>
        <div style={{ background: '#111b21', borderRadius: 6, padding: 8, border: '1px solid #202c33' }}>
          <div style={{ fontSize: 11, color: '#8696a0', marginBottom: 2 }}>Signed-out ({rangeLabel})</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#e9edef' }}>{kpiSignedOut}</div>
          <div style={{ fontSize: 10, color: '#667a7f', marginTop: 2 }}>Deactivated accounts</div>
        </div>
        <div style={{ background: '#111b21', borderRadius: 12, padding: 12, border: '1px solid #202c33' }}>
          <div style={{ fontSize: 12, color: '#8696a0', marginBottom: 4 }}>👥 Online now</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#00a884' }}>{totalActiveNow}</div>
          <div style={{ fontSize: 11, color: '#667a7f', marginTop: 2 }}>Last 5 minutes</div>
        </div>
        <div style={{ background: '#111b21', borderRadius: 12, padding: 12, border: '1px solid #202c33' }}>
          <div style={{ fontSize: 12, color: '#8696a0', marginBottom: 4 }}>📊 With tracking</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: trackingCoverage > 50 ? '#2196f3' : '#ff9800' }}>{totalWithTracking}</div>
          <div style={{ fontSize: 11, color: '#667a7f', marginTop: 2 }}>{trackingCoverage}% of {totalAuthenticated}</div>
        </div>
        <div style={{ background: '#111b21', borderRadius: 12, padding: 12, border: '1px solid #202c33' }}>
          <div style={{ fontSize: 12, color: '#8696a0', marginBottom: 4 }}>🔐 Total accounts</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#e9edef' }}>{totalAuthenticated}</div>
          <div style={{ fontSize: 11, color: '#667a7f', marginTop: 2 }}>Authenticated</div>
        </div>
        <div style={{ background: '#111b21', borderRadius: 12, padding: 12, border: '1px solid #202c33' }}>
          <div style={{ fontSize: 12, color: '#8696a0', marginBottom: 4 }}>🔌 Deactivated</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#ff6b6b' }}>{totalSignedOut}</div>
          <div style={{ fontSize: 11, color: '#667a7f', marginTop: 2 }}>All time</div>
        </div>
      </div>

      <div style={{ marginTop: 12, padding: 12, background: '#0a1115', borderRadius: 8, border: '1px solid #202c33' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#e9edef', marginBottom: 8 }}>📋 What these metrics mean</div>
        <div style={{ fontSize: 11, color: '#8696a0', lineHeight: 1.6 }}>
          <div style={{ marginBottom: 6 }}>
            <strong>Active users:</strong> Only users with last_active_at timestamps (requires activity tracking implementation)
          </div>
          <div style={{ marginBottom: 6 }}>
            <strong>Online now:</strong> Users active in last 5 minutes (requires activity tracking)
          </div>
          <div style={{ marginBottom: 6 }}>
            <strong>With tracking:</strong> How many authenticated users have last_active_at set
          </div>
          <div style={{ marginBottom: 6 }}>
            <strong>Total accounts:</strong> All users with valid profiles (id + email)
          </div>
          <div style={{ marginBottom: 6 }}>
            <strong>Deactivated:</strong> Users with deactivated_at set (requires deactivation implementation)
          </div>
        </div>

        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #202c33' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#ffc107', marginBottom: 6 }}>⚠️ Current limitations:</div>
          <div style={{ fontSize: 10, color: '#8696a0', lineHeight: 1.5 }}>
            {trackingCoverage === 0 ? (
              <>
                <div>❌ Activity tracking is not implemented - all metrics will show 0</div>
                <div>❌ Deactivation tracking is not implemented - deactivated users won't be tracked</div>
                <div style={{ marginTop: 6, color: '#ffc107' }}>→ Next step: Implement activity tracking in the app</div>
              </>
            ) : (
              <div>✅ Activity tracking is partially implemented ({trackingCoverage}% coverage)</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersAnalytics;
