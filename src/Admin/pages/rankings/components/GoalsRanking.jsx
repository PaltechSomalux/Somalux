import React, { useState, useMemo } from 'react';
import TimeRangeSelector from './TimeRangeSelector';
import { calculateGoalScore, filterAndSortGoals } from '../utils/rankingCalculations';
import './GoalsRanking.css';

const GoalsRanking = ({ goalsStats = [], timeRange, onTimeRangeChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMetric, setFilterMetric] = useState('score');

  // Filter and sort by selected metric
  const sortedGoals = useMemo(() => {
    return filterAndSortGoals(goalsStats, searchTerm, filterMetric);
  }, [goalsStats, searchTerm, filterMetric]);

  return (
    <div className="goals-ranking-container">
      {/* Search, Filter & Time Range Bar */}
      <div className="goals-ranking-controls">
        <div className="goals-ranking-control-group">
          <label className="label">Search</label>
          <input
            type="text"
            placeholder="..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>
        <div className="goals-ranking-control-group">
          <label className="label">Filter</label>
          <select value={filterMetric} onChange={(e) => setFilterMetric(e.target.value)} className="select">
            <option value="score">Score</option>
            <option value="goals">Total Goals</option>
            <option value="completed">Completed</option>
            <option value="consistency">Consistency</option>
          </select>
        </div>
        <div className="goals-ranking-control-group">
          <label className="label">Time Range</label>
          <TimeRangeSelector selected={timeRange} onChange={onTimeRangeChange} />
        </div>
      </div>

      {/* Results Table */}
      <div className="goals-ranking-table-container">
        <table className="goals-ranking-table">
          <thead className="goals-ranking-table-head">
            <tr>
              <th className="goals-ranking-table-header-cell">Rank</th>
              <th className="goals-ranking-table-header-cell">User</th>
              <th className="goals-ranking-table-header-cell goals-ranking-right">Goals</th>
              <th className="goals-ranking-table-header-cell goals-ranking-right">Completed</th>
              <th className="goals-ranking-table-header-cell goals-ranking-right">Completion %</th>
              <th className="goals-ranking-table-header-cell goals-ranking-right">Days on Track</th>
              <th className="goals-ranking-table-header-cell goals-ranking-right">Consistency</th>
              <th className="goals-ranking-table-header-cell goals-ranking-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {sortedGoals.map((goal, idx) => {
              const completionPercent = goal.total_goals > 0 ? ((goal.completed_goals / goal.total_goals) * 100).toFixed(1) : 0;
              const score = calculateGoalScore(goal);
              return (
                <tr key={goal.user_id} className="goals-ranking-table-row">
                  <td className="goals-ranking-table-cell goals-ranking-rank-cell">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </td>
                  <td className="goals-ranking-table-cell goals-ranking-name-cell">
                    <div className="goals-ranking-user-info">
                      <img src={goal.avatar_url} alt={goal.display_name} className="goals-ranking-avatar" />
                      <div>
                        <div className="goals-ranking-user-name">{goal.display_name}</div>
                        <span className="goals-ranking-user-email">{goal.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="goals-ranking-table-cell goals-ranking-metric-cell goals-ranking-right">{goal.total_goals || 0}</td>
                  <td className="goals-ranking-table-cell goals-ranking-metric-cell goals-ranking-right">{goal.completed_goals || 0}</td>
                  <td className="goals-ranking-table-cell goals-ranking-metric-cell goals-ranking-right">
                    <div className="goals-ranking-progress-display">
                      <div className="goals-ranking-progress-bar" style={{ width: completionPercent + '%' }}></div>
                      <span className="goals-ranking-percent-text">{completionPercent}%</span>
                    </div>
                  </td>
                  <td className="goals-ranking-table-cell goals-ranking-metric-cell goals-ranking-right">{goal.days_on_track || 0}</td>
                  <td className="goals-ranking-table-cell goals-ranking-metric-cell goals-ranking-right">
                    <span className="goals-ranking-consistency-text">{(goal.consistency_score || 0).toFixed(1)}%</span>
                  </td>
                  <td className="goals-ranking-table-cell goals-ranking-score-cell goals-ranking-right">{score}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GoalsRanking;
