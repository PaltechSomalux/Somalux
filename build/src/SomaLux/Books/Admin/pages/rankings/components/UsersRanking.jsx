import React, { useState, useMemo } from 'react';
import TimeRangeSelector from './TimeRangeSelector';
import { filterAndSortUsers } from '../utils/rankingCalculations';
import './UsersRanking.css';

const UsersRanking = ({ userActivityStats, timeRange, onTimeRangeChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMetric, setFilterMetric] = useState('score');

  // Filter and sort users by search term and metric
  const processedUsers = useMemo(() => {
    return filterAndSortUsers(userActivityStats, searchTerm, filterMetric);
  }, [userActivityStats, searchTerm, filterMetric]);

  return (
    <div className="users-ranking-container">
      {/* Search, Filter & Time Range Bar */}
      <div className="users-ranking-controls">
        <div className="users-ranking-control-group">
          <label className="label">Search</label>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>
        <div className="users-ranking-control-group">
          <label className="label">Filter</label>
          <select value={filterMetric} onChange={(e) => setFilterMetric(e.target.value)} className="select">
            <option value="score">Score</option>
            <option value="comments">Comments</option>
            <option value="ratings">Ratings</option>
            <option value="likes">Likes</option>
            <option value="views">Views</option>
            <option value="reads">Books Read</option>
            <option value="downloads">Downloads</option>
            <option value="follows">Follows</option>
            <option value="activity">Total Activity</option>
          </select>
        </div>
        <div className="users-ranking-control-group">
          <label className="label">Time Range</label>
          <TimeRangeSelector selected={timeRange} onChange={onTimeRangeChange} />
        </div>
      </div>

      {/* Results Table */}
      <div className="users-ranking-table-container">
        <table className="users-ranking-table">
          <thead className="users-ranking-table-head">
            <tr>
              <th className="users-ranking-table-header-cell">Rank</th>
              <th className="users-ranking-table-header-cell">User</th>
              <th className="users-ranking-table-header-cell users-ranking-right">Comments</th>
              <th className="users-ranking-table-header-cell users-ranking-right">Ratings</th>
              <th className="users-ranking-table-header-cell users-ranking-right">Likes</th>
              <th className="users-ranking-table-header-cell users-ranking-right">Views</th>
              <th className="users-ranking-table-header-cell users-ranking-right">Read</th>
              <th className="users-ranking-table-header-cell users-ranking-right">Downloads</th>
              <th className="users-ranking-table-header-cell users-ranking-right">Follows</th>
              <th className="users-ranking-table-header-cell users-ranking-right">Total Activity</th>
              <th className="users-ranking-table-header-cell users-ranking-right">Score</th>
            </tr>
          </thead>
          <tbody className="users-ranking-table-body">
            {processedUsers.map((user, idx) => (
              <tr key={user.user_id} className="users-ranking-table-row">
                <td className="users-ranking-table-cell users-ranking-rank-cell">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                </td>
                <td className="users-ranking-table-cell users-ranking-name-cell">
                  <div className="users-ranking-user-info">
                    <img src={user.avatar_url} alt={user.display_name} className="users-ranking-avatar" />
                    <div>
                      <div className="users-ranking-user-name">{user.display_name || 'Unknown'}</div>
                      <span className="users-ranking-user-email">{user.email}</span>
                    </div>
                  </div>
                </td>
                <td className="users-ranking-table-cell users-ranking-metric-cell users-ranking-right">{user.comments_count || 0}</td>
                <td className="users-ranking-table-cell users-ranking-metric-cell users-ranking-right">{user.ratings_count || 0}</td>
                <td className="users-ranking-table-cell users-ranking-metric-cell users-ranking-right">{user.likes_count || 0}</td>
                <td className="users-ranking-table-cell users-ranking-metric-cell users-ranking-right">{user.views_count || 0}</td>
                <td className="users-ranking-table-cell users-ranking-metric-cell users-ranking-right">{user.books_read || 0}</td>
                <td className="users-ranking-table-cell users-ranking-metric-cell users-ranking-right">{user.downloads_count || 0}</td>
                <td className="users-ranking-table-cell users-ranking-metric-cell users-ranking-right">{user.author_follows || 0}</td>
                <td className="users-ranking-table-cell users-ranking-metric-cell users-ranking-right">{user.total_activity || 0}</td>
                <td className="users-ranking-table-cell users-ranking-score-cell users-ranking-right">{Math.round(user.score || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersRanking;
