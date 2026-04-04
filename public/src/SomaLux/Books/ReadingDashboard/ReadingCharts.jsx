import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FiTrendingUp } from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import './ReadingCharts.css';

const ReadingCharts = ({ stats, userId }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardType, setLeaderboardType] = useState('books');

  useEffect(() => {
    fetchLeaderboard();
  }, [leaderboardType]);

  const fetchLeaderboard = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await fetch(`http://localhost:5000/api/reading/leaderboard?type=${leaderboardType}&limit=10`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Leaderboard fetch failed:', response.status, text);
        return;
      }

      const data = await response.json();
      if (data.ok) {
        setLeaderboard(data.leaderboard || []);
      } else {
        console.error('Leaderboard returned not ok:', data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  if (!stats) return null;

  const { genreDistribution, monthly } = stats;

  // Prepare genre data for pie chart
  const genreData = Object.entries(genreDistribution || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Top 8 genres

  const COLORS = ['#00a884', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#f97316', '#ec4899'];

  // Prepare monthly data for line chart
  const monthlyData = (monthly || []).map(item => ({
    month: item.month_name || item.month || '',
    books: item.books_completed || 0,
    pages: item.pages_read || 0
  }));

  return (
    <div className="reading-charts-container">
      {/* Genre Distribution */}
      <div className="chart-section">
        <h2>📊 Reading by Genre</h2>
        <div className="chart-wrapper">
          {genreData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genreData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">Start reading to see your genre preferences!</div>
          )}
        </div>
        
        {genreData.length > 0 && (
          <div className="genre-stats">
            <h3>Top Genres</h3>
            <div className="genre-list">
              {genreData.slice(0, 5).map((genre, index) => (
                <div key={index} className="genre-item">
                  <div className="genre-color" style={{ backgroundColor: COLORS[index] }}></div>
                  <div className="genre-name">{genre.name}</div>
                  <div className="genre-count">{genre.value} books</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Monthly Reading Trend */}
      {monthlyData.length > 0 && (
        <div className="chart-section">
          <h2>📈 Reading Trend (Last 12 Months)</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3942" />
                <XAxis dataKey="month" stroke="#8696a0" />
                <YAxis stroke="#8696a0" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2c33', 
                    border: '1px solid #2a3942',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="books" stroke="#00a884" strokeWidth={2} name="Books Completed" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Pages Read per Month */}
      {monthlyData.length > 0 && (
        <div className="chart-section">
          <h2>📖 Pages Read per Month</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3942" />
                <XAxis dataKey="month" stroke="#8696a0" />
                <YAxis stroke="#8696a0" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2c33', 
                    border: '1px solid #2a3942',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="pages" fill="#6366f1" name="Pages Read" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="chart-section">
        <div className="leaderboard-header">
          <h2>🏆 Leaderboard</h2>
          <div className="leaderboard-filters">
            <button 
              className={`filter-btn ${leaderboardType === 'books' ? 'active' : ''}`}
              onClick={() => setLeaderboardType('books')}
            >
              Books
            </button>
            <button 
              className={`filter-btn ${leaderboardType === 'pages' ? 'active' : ''}`}
              onClick={() => setLeaderboardType('pages')}
            >
              Pages
            </button>
            <button 
              className={`filter-btn ${leaderboardType === 'streak' ? 'active' : ''}`}
              onClick={() => setLeaderboardType('streak')}
            >
              Streak
            </button>
          </div>
        </div>

        <div className="leaderboard-list">
          {leaderboard.length > 0 ? leaderboard.map((user, index) => (
            <div key={index} className="leaderboard-item">
              <div className="leaderboard-rank">
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
                {index > 2 && `#${index + 1}`}
              </div>
              <div className="leaderboard-avatar">
                {user.profiles?.avatar_url ? (
                  <img
                    src={user.profiles.avatar_url}
                    alt={user.profiles.display_name || user.profiles.email || 'User avatar'}
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {(user.profiles?.display_name || user.profiles?.email || '?')
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
              </div>
              <div className="leaderboard-name">{user.profiles?.display_name || user.profiles?.email || 'Anonymous'}</div>
              <div className="leaderboard-score">
                {leaderboardType === 'books' && `${user.total_books_completed || 0} books`}
                {leaderboardType === 'pages' && `${(user.total_pages_read || 0).toLocaleString()} pages`}
                {leaderboardType === 'streak' && `${user.current_streak || 0} days`}
              </div>
            </div>
          )) : (
            <div className="no-data">No data available</div>
          )}
        </div>
      </div>

      {/* Reading Insights */}
      <div className="chart-section">
        <h2>💡 Reading Insights</h2>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">📚</div>
            <div className="insight-content">
              <div className="insight-title">Most Read Genre</div>
              <div className="insight-value">
                {genreData[0]?.name || 'N/A'}
              </div>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">⚡</div>
            <div className="insight-content">
              <div className="insight-title">Avg Pages/Book</div>
              <div className="insight-value">
                {Math.round(stats.overall?.avg_pages_per_book || 0)}
              </div>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">🎯</div>
            <div className="insight-content">
              <div className="insight-title">Reading Pace</div>
              <div className="insight-value">
                {monthlyData.length > 0 ? 
                  `${Math.round(monthlyData.reduce((a, b) => a + b.books, 0) / monthlyData.length)} books/month` 
                  : 'N/A'
                }
              </div>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">🔥</div>
            <div className="insight-content">
              <div className="insight-title">Current Streak</div>
              <div className="insight-value">
                {stats.streak?.current_streak || 0} days
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingCharts;
