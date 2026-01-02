import React, { useState, useMemo } from 'react';
import TimeRangeSelector from './TimeRangeSelector';
import { calculateAuthorScore, filterAndSortAuthors } from '../utils/rankingCalculations';
import './AuthorsRanking.css';

const AuthorsRanking = ({ authorsStats = [], timeRange, onTimeRangeChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMetric, setFilterMetric] = useState('score');

  // Filter and sort by selected metric
  const sortedAuthors = useMemo(() => {
    return filterAndSortAuthors(authorsStats, searchTerm, filterMetric);
  }, [authorsStats, searchTerm, filterMetric]);

  return (
    <div className="authors-ranking-container">
      {/* Search, Filter & Time Range Bar */}
      <div className="authors-ranking-controls">
        <div className="authors-ranking-control-group">
          <label className="label">Search</label>
          <input
            type="text"
            placeholder="..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>
        <div className="authors-ranking-control-group">
          <label className="label">Filter</label>
          <select value={filterMetric} onChange={(e) => setFilterMetric(e.target.value)} className="select">
            <option value="score">Score</option>
            <option value="books">Books</option>
            <option value="downloads">Downloads</option>
            <option value="followers">Followers</option>
            <option value="rating">Rating</option>
          </select>
        </div>
        <div className="authors-ranking-control-group">
          <label className="label">Time Range</label>
          <TimeRangeSelector selected={timeRange} onChange={onTimeRangeChange} />
        </div>
      </div>

      {/* Results Table */}
      <div className="authors-ranking-table-container">
        <table className="authors-ranking-table">
          <thead className="authors-ranking-table-head">
            <tr>
              <th className="authors-ranking-table-header-cell">Rank</th>
              <th className="authors-ranking-table-header-cell">Author</th>
              <th className="authors-ranking-table-header-cell authors-ranking-right">Books</th>
              <th className="authors-ranking-table-header-cell authors-ranking-right">Downloads</th>
              <th className="authors-ranking-table-header-cell authors-ranking-right">Followers</th>
              <th className="authors-ranking-table-header-cell authors-ranking-right">Comments</th>
              <th className="authors-ranking-table-header-cell authors-ranking-right">Likes</th>
              <th className="authors-ranking-table-header-cell authors-ranking-right">Reviews</th>
              <th className="authors-ranking-table-header-cell authors-ranking-right">Shared</th>
              <th className="authors-ranking-table-header-cell authors-ranking-right">Rating</th>
              <th className="authors-ranking-table-header-cell authors-ranking-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {sortedAuthors.map((author, idx) => {
              const score = calculateAuthorScore(author);
              return (
                <tr key={author.author_id} className="authors-ranking-table-row">
                  <td className="authors-ranking-table-cell authors-ranking-rank-cell">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </td>
                  <td className="authors-ranking-table-cell authors-ranking-author-cell">
                    <img src={author.avatar_url} alt={author.display_name} className="authors-ranking-avatar" />
                    <div className="authors-ranking-author-info">
                      <div className="authors-ranking-author-name">{author.display_name}</div>
                      <div className="authors-ranking-email-text">{author.email}</div>
                    </div>
                  </td>
                  <td className="authors-ranking-table-cell authors-ranking-metric-cell authors-ranking-right">{author.books_count || 0}</td>
                  <td className="authors-ranking-table-cell authors-ranking-metric-cell authors-ranking-right">{author.total_downloads || 0}</td>
                  <td className="authors-ranking-table-cell authors-ranking-metric-cell authors-ranking-right">{author.followers_count || 0}</td>
                  <td className="authors-ranking-table-cell authors-ranking-metric-cell authors-ranking-right">{author.comments_count || 0}</td>
                  <td className="authors-ranking-table-cell authors-ranking-metric-cell authors-ranking-right">{author.likes_count || 0}</td>
                  <td className="authors-ranking-table-cell authors-ranking-metric-cell authors-ranking-right">{author.reviews_count || 0}</td>
                  <td className="authors-ranking-table-cell authors-ranking-metric-cell authors-ranking-right">{author.shares_count || 0}</td>
                  <td className="authors-ranking-table-cell authors-ranking-metric-cell authors-ranking-right">
                    <div className="authors-ranking-rating-display">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={star <= Math.round(author.avg_rating || 0) ? 'authors-ranking-star-filled' : 'authors-ranking-star-empty'}>★</span>
                      ))}
                      <span className="authors-ranking-rating-text">({(author.avg_rating || 0).toFixed(1)})</span>
                    </div>
                  </td>
                  <td className="authors-ranking-table-cell authors-ranking-score-cell authors-ranking-right">{score}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuthorsRanking;
