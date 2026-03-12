import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiDollarSign, FiPercent, FiCalendar } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../../supabaseClient';
import './RentalsAdmin.css';

export const RentalsAnalytics = ({ userProfile }) => {
  const [analytics, setAnalytics] = useState({
    revenue: {
      total: 0,
      thisMonth: 0,
      lastMonth: 0,
      growth: 0
    },
    commission: {
      total: 0,
      thisMonth: 0,
      rate: 8
    },
    listings: {
      total: 0,
      active: 0,
      occupied: 0,
      occupancyRate: 0
    },
    bookings: {
      total: 0,
      thisMonth: 0,
      conversionRate: 0
    },
    revenueTrend: [],
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, 1y

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/rentals/admin/analytics?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(prev => ({
          ...prev,
          ...(data.analytics || {}),
        }));
      } else {
        console.warn('Analytics request failed with status', response.status);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token || '';
    if (!token) console.warn('No Supabase session token found');
    return token;
  };

  if (loading) {
    return <div className="table-loading">Loading analytics...</div>;
  }

  return (
    <div className="rentals-analytics">
      <div className="page-header">
        <h1>Rentals Analytics</h1>
        <div className="time-range-selector">
          <button className={timeRange === '7d' ? 'active' : ''} onClick={() => setTimeRange('7d')}>7 Days</button>
          <button className={timeRange === '30d' ? 'active' : ''} onClick={() => setTimeRange('30d')}>30 Days</button>
          <button className={timeRange === '90d' ? 'active' : ''} onClick={() => setTimeRange('90d')}>90 Days</button>
          <button className={timeRange === '1y' ? 'active' : ''} onClick={() => setTimeRange('1y')}>1 Year</button>
        </div>
      </div>

      {/* Revenue Analytics */}
      <div className="analytics-section">
        <h2><FiDollarSign /> Revenue Overview</h2>
        <div className="analytics-grid">
          <div className="analytics-card">
            <h3>Total Revenue</h3>
            <div className="analytics-value">KES {analytics.revenue.total.toLocaleString()}</div>
            <div className="analytics-meta">
              <span className={`trend ${analytics.revenue.growth >= 0 ? 'positive' : 'negative'}`}>
                <FiTrendingUp /> {analytics.revenue.growth}% vs last month
              </span>
            </div>
          </div>

          <div className="analytics-card">
            <h3>This Month</h3>
            <div className="analytics-value">KES {analytics.revenue.thisMonth.toLocaleString()}</div>
            <div className="analytics-meta">
              <span className="text-muted">Last Month: KES {analytics.revenue.lastMonth.toLocaleString()}</span>
            </div>
          </div>

          <div className="analytics-card">
            <h3>Platform Commission</h3>
            <div className="analytics-value">KES {analytics.commission.thisMonth.toLocaleString()}</div>
            <div className="analytics-meta">
              <span className="text-muted">{analytics.commission.rate}% of bookings</span>
            </div>
          </div>
        </div>
      </div>

      {/* Listings Analytics */}
      <div className="analytics-section">
        <h2><FiPercent /> Occupancy & Performance</h2>
        <div className="analytics-grid">
          <div className="analytics-card">
            <h3>Total Listings</h3>
            <div className="analytics-value">{analytics.listings.total}</div>
            <div className="analytics-meta">
              <span className="text-success">{analytics.listings.active} active</span>
            </div>
          </div>

          <div className="analytics-card">
            <h3>Occupancy Rate</h3>
            <div className="analytics-value">{analytics.listings.occupancyRate}%</div>
            <div className="analytics-meta">
              <span className="text-muted">{analytics.listings.occupied} occupied</span>
            </div>
          </div>

          <div className="analytics-card">
            <h3>Conversion Rate</h3>
            <div className="analytics-value">{analytics.bookings.conversionRate}%</div>
            <div className="analytics-meta">
              <span className="text-muted">Views to bookings</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Analytics */}
      <div className="analytics-section">
        <h2><FiCalendar /> Booking Trends</h2>
        <div className="analytics-grid">
          <div className="analytics-card">
            <h3>Total Bookings</h3>
            <div className="analytics-value">{analytics.bookings.total}</div>
          </div>

          <div className="analytics-card">
            <h3>This Month</h3>
            <div className="analytics-value">{analytics.bookings.thisMonth}</div>
            <div className="analytics-meta">
              <span className="trend positive">
                <FiTrendingUp /> Growing
              </span>
            </div>
          </div>

          <div className="analytics-card">
            <h3>Average Booking Value</h3>
            <div className="analytics-value">
              KES {analytics.bookings.total > 0 
                ? Math.round(analytics.revenue.total / analytics.bookings.total).toLocaleString() 
                : 0}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="analytics-section">
        <h2>Revenue Trend (last 6 months)</h2>
        {(!analytics.revenueTrend || analytics.revenueTrend.length === 0) ? (
          <div className="chart-placeholder">
            <p>No revenue data available yet.</p>
          </div>
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={analytics.revenueTrend} margin={{ top: 10, right: 24, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2933" />
                <XAxis
                  dataKey="month"
                  stroke="#9ca3af"
                  tick={{ fontSize: 12 }}
                  tickMargin={8}
                />
                <YAxis
                  stroke="#9ca3af"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `KES ${v.toLocaleString()}`}
                />
                <Tooltip
                  formatter={(value) => [`KES ${Number(value).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#e5e7eb' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#22c55e"
                  strokeWidth={2.4}
                  dot={{ r: 4, fill: '#22c55e', strokeWidth: 1, stroke: '#065f46' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default RentalsAnalytics;
