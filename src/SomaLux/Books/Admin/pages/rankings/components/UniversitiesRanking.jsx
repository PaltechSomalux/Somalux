import React, { useState, useMemo } from 'react';
import TimeRangeSelector from './TimeRangeSelector';
import { calculateUniversityScore, filterAndSortUniversities } from '../utils/rankingCalculations';
import './UniversitiesRanking.css';

const UniversitiesRanking = ({ universitiesStats = [], timeRange, onTimeRangeChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMetric, setFilterMetric] = useState('score');

  // Filter and sort by selected metric
  const sortedUnis = useMemo(() => {
    return filterAndSortUniversities(universitiesStats, searchTerm, filterMetric);
  }, [universitiesStats, searchTerm, filterMetric]);

  return (
    <div className="universities-ranking-container">
      {/* Search, Filter & Time Range Bar */}
      <div className="universities-ranking-controls">
        <div className="universities-ranking-control-group">
          <label className="label">Search</label>
          <input
            type="text"
            placeholder="..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>
        <div className="universities-ranking-control-group">
          <label className="label">Filter</label>
          <select value={filterMetric} onChange={(e) => setFilterMetric(e.target.value)} className="select">
            <option value="score">Score</option>
            <option value="papers">Papers</option>
            <option value="views">Views</option>
            <option value="downloads">Downloads</option>
            <option value="followers">Followers</option>
          </select>
        </div>
        <div className="universities-ranking-control-group">
          <label className="label">Time Range</label>
          <TimeRangeSelector selected={timeRange} onChange={onTimeRangeChange} />
        </div>
      </div>

      {/* Results Table */}
      <div className="universities-ranking-table-container">
        <table className="universities-ranking-table">
          <thead className="universities-ranking-table-head">
            <tr>
              <th className="universities-ranking-table-header-cell">Rank</th>
              <th className="universities-ranking-table-header-cell">University</th>
              <th className="universities-ranking-table-header-cell universities-ranking-right">Papers</th>
              <th className="universities-ranking-table-header-cell universities-ranking-right">Views</th>
              <th className="universities-ranking-table-header-cell universities-ranking-right">Downloads</th>
              <th className="universities-ranking-table-header-cell universities-ranking-right">Likes</th>
              <th className="universities-ranking-table-header-cell universities-ranking-right">Comments</th>
              <th className="universities-ranking-table-header-cell universities-ranking-right">Shared</th>
              <th className="universities-ranking-table-header-cell universities-ranking-right">Followers</th>
              <th className="universities-ranking-table-header-cell universities-ranking-right">Rating</th>
              <th className="universities-ranking-table-header-cell universities-ranking-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {sortedUnis.map((uni, idx) => {
              const score = calculateUniversityScore(uni);
              return (
                <tr key={uni.university_id} className="universities-ranking-table-row">
                  <td className="universities-ranking-table-cell universities-ranking-rank-cell">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </td>
                  <td className="universities-ranking-table-cell universities-ranking-name-cell">
                    <span className="universities-ranking-icon">🎓</span>
                    <span className="universities-ranking-name-text">{uni.name}</span>
                  </td>
                  <td className="universities-ranking-table-cell universities-ranking-metric-cell universities-ranking-right">
                    <span className="universities-ranking-badge">{uni.papers_count || 0}</span>
                  </td>
                  <td className="universities-ranking-table-cell universities-ranking-metric-cell universities-ranking-right">{uni.views || 0}</td>
                  <td className="universities-ranking-table-cell universities-ranking-metric-cell universities-ranking-right">{uni.downloads || 0}</td>
                  <td className="universities-ranking-table-cell universities-ranking-metric-cell universities-ranking-right">{uni.likes_count || 0}</td>
                  <td className="universities-ranking-table-cell universities-ranking-metric-cell universities-ranking-right">{uni.comments_count || 0}</td>
                  <td className="universities-ranking-table-cell universities-ranking-metric-cell universities-ranking-right">{uni.shares_count || 0}</td>
                  <td className="universities-ranking-table-cell universities-ranking-metric-cell universities-ranking-right">{uni.followers_count || 0}</td>
                  <td className="universities-ranking-table-cell universities-ranking-metric-cell universities-ranking-right">
                    <span className="universities-ranking-rating-text">{(uni.avg_rating || 0).toFixed(1)} ⭐</span>
                  </td>
                  <td className="universities-ranking-table-cell universities-ranking-score-cell universities-ranking-right">{score}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UniversitiesRanking;
