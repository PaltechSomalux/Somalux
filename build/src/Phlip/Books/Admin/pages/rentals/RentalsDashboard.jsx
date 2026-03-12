import React, { useState, useEffect } from 'react';
import { FiHome, FiCheckCircle, FiClock, FiDollarSign, FiTrendingUp, FiUsers, FiStar, FiAlertCircle } from 'react-icons/fi';
import { supabase } from '../../../supabaseClient';
import './RentalsAdmin.css';

export const RentalsDashboard = ({ userProfile }) => {
  const [stats, setStats] = useState({
    totalListings: 0,
    pendingListings: 0,
    approvedListings: 0,
    totalBookings: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalLandlords: 0,
    activeLandlords: 0,
    totalReviews: 0,
    averageRating: 0,
    pendingReviews: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/rentals/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentActivity(data.recentActivity || []);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
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
    return <div className="rentals-admin-loading">Loading dashboard...</div>;
  }

  return (
    <div className="rentals-dashboard">
      <div className="dashboard-header">
        <h1>Rentals Dashboard</h1>
        <p>Manage your off-campus housing platform</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">
            <FiHome />
          </div>
          <div className="stat-content">
            <h3>{stats.totalListings}</h3>
            <p>Total Listings</p>
            {stats.pendingListings > 0 && (
              <span className="stat-badge pending">{stats.pendingListings} pending</span>
            )}
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <FiCheckCircle />
          </div>
          <div className="stat-content">
            <h3>{stats.totalBookings}</h3>
            <p>Total Bookings</p>
            {stats.pendingBookings > 0 && (
              <span className="stat-badge warning">{stats.pendingBookings} pending</span>
            )}
          </div>
        </div>

        <div className="stat-card revenue">
          <div className="stat-icon">
            <FiDollarSign />
          </div>
          <div className="stat-content">
            <h3>KES {stats.totalRevenue.toLocaleString()}</h3>
            <p>Total Revenue</p>
            <span className="stat-badge info">KES {stats.monthlyRevenue.toLocaleString()} this month</span>
          </div>
        </div>

        <div className="stat-card users">
          <div className="stat-icon">
            <FiUsers />
          </div>
          <div className="stat-content">
            <h3>{stats.totalLandlords}</h3>
            <p>Total Landlords</p>
            <span className="stat-badge success">{stats.activeLandlords} active</span>
          </div>
        </div>

        <div className="stat-card rating">
          <div className="stat-icon">
            <FiStar />
          </div>
          <div className="stat-content">
            <h3>{stats.averageRating.toFixed(1)}</h3>
            <p>Average Rating</p>
            <span className="stat-badge">{stats.totalReviews} reviews</span>
          </div>
        </div>

        <div className="stat-card alert">
          <div className="stat-icon">
            <FiAlertCircle />
          </div>
          <div className="stat-content">
            <h3>{stats.pendingListings + stats.pendingBookings + stats.pendingReviews}</h3>
            <p>Pending Actions</p>
            <span className="stat-badge warning">Requires attention</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button className="action-btn" onClick={() => window.location.href = '/books/admin/rentals/listings'}>
            <FiHome />
            <span>Manage Listings</span>
            {stats.pendingListings > 0 && <span className="badge">{stats.pendingListings}</span>}
          </button>
          <button className="action-btn" onClick={() => window.location.href = '/books/admin/rentals/bookings'}>
            <FiCheckCircle />
            <span>Manage Bookings</span>
            {stats.pendingBookings > 0 && <span className="badge">{stats.pendingBookings}</span>}
          </button>
          <button className="action-btn" onClick={() => window.location.href = '/books/admin/rentals/reviews'}>
            <FiStar />
            <span>Moderate Reviews</span>
            {stats.pendingReviews > 0 && <span className="badge">{stats.pendingReviews}</span>}
          </button>
          <button className="action-btn" onClick={() => window.location.href = '/books/admin/rentals/analytics'}>
            <FiTrendingUp />
            <span>View Analytics</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h2>Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <div className="empty-state">
            <FiClock size={48} />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="activity-list">
            {recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className={`activity-icon ${activity.type}`}>
                  {activity.type === 'listing' && <FiHome />}
                  {activity.type === 'booking' && <FiCheckCircle />}
                  {activity.type === 'review' && <FiStar />}
                  {activity.type === 'payment' && <FiDollarSign />}
                </div>
                <div className="activity-content">
                  <h4>{activity.title}</h4>
                  <p>{activity.description}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
                {activity.status && (
                  <span className={`activity-status ${activity.status}`}>
                    {activity.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Performance Summary */}
      <div className="performance-grid">
        <div className="performance-card">
          <h3>Top Performing Listings</h3>
          <div className="metric">
            <span>Highest bookings</span>
            <span className="value">12 bookings</span>
          </div>
          <div className="metric">
            <span>Best rated</span>
            <span className="value">4.9 ⭐</span>
          </div>
        </div>

        <div className="performance-card">
          <h3>Platform Health</h3>
          <div className="metric">
            <span>Approval rate</span>
            <span className="value">85%</span>
          </div>
          <div className="metric">
            <span>Response time</span>
            <span className="value">2.5 hrs</span>
          </div>
        </div>

        <div className="performance-card">
          <h3>Growth Metrics</h3>
          <div className="metric">
            <span>New listings (30d)</span>
            <span className="value">+24</span>
          </div>
          <div className="metric">
            <span>New bookings (30d)</span>
            <span className="value">+48</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalsDashboard;
