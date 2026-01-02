import React, { useState, useMemo } from 'react';
import { calculateAchievementScore, filterAndSortAchievements } from '../utils/rankingCalculations';
import './AchievementsRanking.css';

const AchievementsRanking = ({ achievementsStats = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMetric, setFilterMetric] = useState('score');

  // Filter and sort by selected metric
  const sortedUsers = useMemo(() => {
    return filterAndSortAchievements(achievementsStats, searchTerm, filterMetric);
  }, [achievementsStats, searchTerm, filterMetric]);

  return (
    <div className="achievements-ranking-container">
      {/* Search & Filter Bar */}
      <div className="achievements-ranking-controls">
        <div className="achievements-ranking-control-group">
          <label className="label">Search</label>
          <input
            type="text"
            placeholder="..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>
        <div className="achievements-ranking-control-group">
          <label className="label">Filter</label>
          <select value={filterMetric} onChange={(e) => setFilterMetric(e.target.value)} className="select">
            <option value="score">Score</option>
            <option value="achievements">Achievements</option>
            <option value="badges">Badges</option>
            <option value="milestones">Milestones</option>
            <option value="rare">Rare</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="achievements-ranking-table-container">
        <table className="achievements-ranking-table">
          <thead className="achievements-ranking-table-head">
            <tr>
              <th className="achievements-ranking-table-header-cell">Rank</th>
              <th className="achievements-ranking-table-header-cell">User</th>
              <th className="achievements-ranking-table-header-cell achievements-ranking-right">Achievements</th>
              <th className="achievements-ranking-table-header-cell achievements-ranking-right">Badges</th>
              <th className="achievements-ranking-table-header-cell achievements-ranking-right">Milestones</th>
              <th className="achievements-ranking-table-header-cell achievements-ranking-right">Rare</th>
              <th className="achievements-ranking-table-header-cell achievements-ranking-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((user, idx) => {
              const score = calculateAchievementScore(user);
              return (
                <tr key={user.user_id} className="achievements-ranking-table-row">
                  <td className="achievements-ranking-table-cell achievements-ranking-rank-cell">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </td>
                  <td className="achievements-ranking-table-cell achievements-ranking-user-cell">
                    <div className="achievements-ranking-user-info">
                      <img src={user.avatar_url} alt={user.display_name} className="achievements-ranking-avatar" />
                      <div>
                        <div className="achievements-ranking-user-name">{user.display_name}</div>
                        <span className="achievements-ranking-user-email">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="achievements-ranking-table-cell achievements-ranking-metric-cell achievements-ranking-right">
                    <span className="achievements-ranking-badge">{user.achievements_count || 0}</span>
                  </td>
                  <td className="achievements-ranking-table-cell achievements-ranking-metric-cell achievements-ranking-right">{user.badges_count || 0}</td>
                  <td className="achievements-ranking-table-cell achievements-ranking-metric-cell achievements-ranking-right">{user.milestones_unlocked || 0}</td>
                  <td className="achievements-ranking-table-cell achievements-ranking-metric-cell achievements-ranking-right">{user.rare_achievements || 0}</td>
                  <td className="achievements-ranking-table-cell achievements-ranking-score-cell achievements-ranking-right">{score}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AchievementsRanking;
