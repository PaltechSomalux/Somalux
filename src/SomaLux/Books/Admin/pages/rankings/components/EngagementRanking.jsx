import React, { useState, useMemo } from 'react';
import TimeRangeSelector from './TimeRangeSelector';
import { calculateEngagementScore, filterAndSortEngagement } from '../utils/rankingCalculations';
import './EngagementRanking.css';

const EngagementRanking = ({ engagementStats = [], timeRange, onTimeRangeChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMetric, setFilterMetric] = useState('score');

  // Filter and sort by selected metric
  const sortedEngagement = useMemo(() => {
    return filterAndSortEngagement(engagementStats, searchTerm, filterMetric);
  }, [engagementStats, searchTerm, filterMetric]);

  return (
    <div className="engagement-ranking-container">
      {/* Search, Filter & Time Range Bar */}
      <div className="engagement-ranking-controls">
        <div className="engagement-ranking-control-group">
          <label className="label">Search</label>
          <input
            type="text"
            placeholder="..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>
        <div className="engagement-ranking-control-group">
          <label className="label">Filter</label>
          <select value={filterMetric} onChange={(e) => setFilterMetric(e.target.value)} className="select">
            <option value="score">Score</option>
            <option value="comments">Comments</option>
            <option value="ratings">Ratings</option>
            <option value="likes">Likes</option>
            <option value="mentions">Mentions</option>
            <option value="follows">Follows</option>
          </select>
        </div>
        <div className="engagement-ranking-control-group">
          <label className="label">Time Range</label>
          <TimeRangeSelector selected={timeRange} onChange={onTimeRangeChange} />
        </div>
      </div>

      {/* Results Table */}
      <div className="engagement-ranking-table-container">
        <table className="engagement-ranking-table">
          <thead className="engagement-ranking-table-head">
            <tr>
              <th className="engagement-ranking-table-header-cell">Rank</th>
              <th className="engagement-ranking-table-header-cell">User</th>
              <th className="engagement-ranking-table-header-cell engagement-ranking-right">Comments</th>
              <th className="engagement-ranking-table-header-cell engagement-ranking-right">Ratings</th>
              <th className="engagement-ranking-table-header-cell engagement-ranking-right">Likes</th>
              <th className="engagement-ranking-table-header-cell engagement-ranking-right">Replies</th>
              <th className="engagement-ranking-table-header-cell engagement-ranking-right">Mentions</th>
              <th className="engagement-ranking-table-header-cell engagement-ranking-right">Follows</th>
              <th className="engagement-ranking-table-header-cell engagement-ranking-right">Response Time</th>
              <th className="engagement-ranking-table-header-cell engagement-ranking-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {sortedEngagement.map((engagement, idx) => {
              const score = calculateEngagementScore(engagement);
              return (
                <tr key={engagement.user_id} className="engagement-ranking-table-row">
                  <td className="engagement-ranking-table-cell engagement-ranking-rank-cell">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </td>
                  <td className="engagement-ranking-table-cell engagement-ranking-user-cell">
                    <div className="engagement-ranking-user-info">
                      <img src={engagement.avatar_url} alt={engagement.display_name} className="engagement-ranking-avatar" />
                      <div>
                        <div className="engagement-ranking-user-name">{engagement.display_name}</div>
                        <span className="engagement-ranking-user-email">{engagement.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="engagement-ranking-table-cell engagement-ranking-metric-cell engagement-ranking-right">{engagement.comments || 0}</td>
                  <td className="engagement-ranking-table-cell engagement-ranking-metric-cell engagement-ranking-right">{engagement.ratings || 0}</td>
                  <td className="engagement-ranking-table-cell engagement-ranking-metric-cell engagement-ranking-right">{engagement.likes || 0}</td>
                  <td className="engagement-ranking-table-cell engagement-ranking-metric-cell engagement-ranking-right">{engagement.replies || 0}</td>
                  <td className="engagement-ranking-table-cell engagement-ranking-metric-cell engagement-ranking-right">{engagement.mentions || 0}</td>
                  <td className="engagement-ranking-table-cell engagement-ranking-metric-cell engagement-ranking-right">{engagement.follows || 0}</td>
                  <td className="engagement-ranking-table-cell engagement-ranking-metric-cell engagement-ranking-right">
                    <span className="engagement-ranking-response-time-text">{engagement.avg_response_time ? `${engagement.avg_response_time}h` : '-'}</span>
                  </td>
                  <td className="engagement-ranking-table-cell engagement-ranking-score-cell engagement-ranking-right">{score}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EngagementRanking;
