import React, { useState, useMemo } from 'react';
import TimeRangeSelector from './TimeRangeSelector';
import { calculatePaperScore, filterAndSortPapers } from '../utils/rankingCalculations';
import './PapersRanking.css';

const PapersRanking = ({ papersStats = [], timeRange, onTimeRangeChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMetric, setFilterMetric] = useState('score');

  // Filter and sort by selected metric
  const sortedPapers = useMemo(() => {
    return filterAndSortPapers(papersStats, searchTerm, filterMetric);
  }, [papersStats, searchTerm, filterMetric]);

  return (
    <div className="papers-ranking-container">
      {/* Search, Filter & Time Range Bar */}
      <div className="papers-ranking-controls">
        <div className="papers-ranking-control-group">
          <label className="label">Search</label>
          <input
            type="text"
            placeholder="..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>
        <div className="papers-ranking-control-group">
          <label className="label">Filter</label>
          <select value={filterMetric} onChange={(e) => setFilterMetric(e.target.value)} className="select">
            <option value="score">Score</option>
            <option value="views">Views</option>
            <option value="downloads">Downloads</option>
            <option value="likes">Likes</option>
            <option value="comments">Comments</option>
          </select>
        </div>
        <div className="papers-ranking-control-group">
          <label className="label">Time Range</label>
          <TimeRangeSelector selected={timeRange} onChange={onTimeRangeChange} />
        </div>
      </div>

      {/* Results Table */}
      <div className="papers-ranking-table-container">
        <table className="papers-ranking-table">
          <thead className="papers-ranking-table-head">
            <tr>
              <th className="papers-ranking-table-header-cell">Rank</th>
              <th className="papers-ranking-table-header-cell">Unit Code</th>
              <th className="papers-ranking-table-header-cell">Title</th>
              <th className="papers-ranking-table-header-cell papers-ranking-right">Views</th>
              <th className="papers-ranking-table-header-cell papers-ranking-right">Downloads</th>
              <th className="papers-ranking-table-header-cell papers-ranking-right">Likes</th>
              <th className="papers-ranking-table-header-cell papers-ranking-right">Comments</th>
              <th className="papers-ranking-table-header-cell papers-ranking-right">Shared</th>
              <th className="papers-ranking-table-header-cell papers-ranking-right">Bookmarks</th>
              <th className="papers-ranking-table-header-cell papers-ranking-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {sortedPapers.map((paper, idx) => {
              const score = calculatePaperScore(paper);
              return (
                <tr key={paper.paper_id} className="papers-ranking-table-row">
                  <td className="papers-ranking-table-cell papers-ranking-rank-cell">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </td>
                  <td className="papers-ranking-table-cell">
                    <span className="papers-ranking-code-badge">{paper.unit_code}</span>
                  </td>
                  <td className="papers-ranking-table-cell papers-ranking-title-cell">
                    <div className="papers-ranking-title-text">{paper.title}</div>
                  </td>
                  <td className="papers-ranking-table-cell papers-ranking-metric-cell papers-ranking-right">{paper.views || 0}</td>
                  <td className="papers-ranking-table-cell papers-ranking-metric-cell papers-ranking-right">{paper.downloads || 0}</td>
                  <td className="papers-ranking-table-cell papers-ranking-metric-cell papers-ranking-right">{paper.likes_count || 0}</td>
                  <td className="papers-ranking-table-cell papers-ranking-metric-cell papers-ranking-right">{paper.comments_count || 0}</td>
                  <td className="papers-ranking-table-cell papers-ranking-metric-cell papers-ranking-right">{paper.shares_count || 0}</td>
                  <td className="papers-ranking-table-cell papers-ranking-metric-cell papers-ranking-right">{paper.bookmarks_count || 0}</td>
                  <td className="papers-ranking-table-cell papers-ranking-score-cell papers-ranking-right">{score}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PapersRanking;
