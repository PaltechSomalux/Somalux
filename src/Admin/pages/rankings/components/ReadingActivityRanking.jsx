import React, { useState, useMemo } from 'react';
import TimeRangeSelector from './TimeRangeSelector';
import { calculateActivityScore, filterAndSortReadingActivity } from '../utils/rankingCalculations';
import './ReadingActivityRanking.css';

const ReadingActivityRanking = ({ readingActivityStats = [], timeRange, onTimeRangeChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMetric, setFilterMetric] = useState('score');

  // Filter and sort by selected metric
  const sortedActivity = useMemo(() => {
    return filterAndSortReadingActivity(readingActivityStats, searchTerm, filterMetric);
  }, [readingActivityStats, searchTerm, filterMetric]);

  return (
    <div className="reading-activity-ranking-container">
      {/* Search, Filter & Time Range Bar */}
      <div className="reading-activity-ranking-controls">
        <div className="reading-activity-ranking-control-group">
          <label className="label">Search</label>
          <input
            type="text"
            placeholder="..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>
        <div className="reading-activity-ranking-control-group">
          <label className="label">Filter</label>
          <select value={filterMetric} onChange={(e) => setFilterMetric(e.target.value)} className="select">
            <option value="score">Score</option>
            <option value="sessions">Sessions</option>
            <option value="pages">Pages Read</option>
          </select>
        </div>
        <div className="reading-activity-ranking-control-group">
          <label className="label">Time Range</label>
          <TimeRangeSelector selected={timeRange} onChange={onTimeRangeChange} />
        </div>
      </div>

      {/* Results Table */}
      <div className="reading-activity-ranking-table-container">
        <table className="reading-activity-ranking-table">
          <thead className="reading-activity-ranking-table-head">
            <tr>
              <th className="reading-activity-ranking-table-header-cell">Rank</th>
              <th className="reading-activity-ranking-table-header-cell">User</th>
              <th className="reading-activity-ranking-table-header-cell reading-activity-ranking-right">Sessions</th>
              <th className="reading-activity-ranking-table-header-cell reading-activity-ranking-right">Pages Read</th>
              <th className="reading-activity-ranking-table-header-cell reading-activity-ranking-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {sortedActivity.map((activity, idx) => {
              const score = calculateActivityScore(activity);
              return (
                <tr key={activity.user_id} className="reading-activity-ranking-table-row">
                  <td className="reading-activity-ranking-table-cell reading-activity-ranking-rank-cell">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </td>
                  <td className="reading-activity-ranking-table-cell reading-activity-ranking-name-cell">
                    <div className="reading-activity-ranking-user-info">
                      <img src={activity.avatar_url} alt={activity.display_name} className="reading-activity-ranking-avatar" />
                      <div>
                        <div className="reading-activity-ranking-user-name">{activity.display_name}</div>
                        <span className="reading-activity-ranking-user-email">{activity.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="reading-activity-ranking-table-cell reading-activity-ranking-metric-cell reading-activity-ranking-right">{activity.sessions}</td>
                  <td className="reading-activity-ranking-table-cell reading-activity-ranking-metric-cell reading-activity-ranking-right">{activity.pages_read}</td>
                  <td className="reading-activity-ranking-table-cell reading-activity-ranking-score-cell reading-activity-ranking-right">{score}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReadingActivityRanking;
