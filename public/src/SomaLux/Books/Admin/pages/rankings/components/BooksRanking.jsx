import React, { useState, useMemo } from 'react';
import TimeRangeSelector from './TimeRangeSelector';
import { calculateBookScore, filterAndSortBooks } from '../utils/rankingCalculations';
import './BooksRanking.css';

const BooksRanking = ({ bookStats = [], timeRange, onTimeRangeChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMetric, setFilterMetric] = useState('score');

  // Sort and filter books
  const processedBooks = useMemo(() => {
    return filterAndSortBooks(bookStats, searchTerm, filterMetric);
  }, [bookStats, searchTerm, filterMetric]);

  return (
    <div className="books-ranking-container">
      {/* Search, Filter & Time Range Bar */}
      <div className="books-ranking-controls">
        <div className="books-ranking-control-group">
          <label className="label">Search</label>
          <input
            type="text"
            placeholder="Search by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>
        <div className="books-ranking-control-group">
          <label className="label">Filter</label>
          <select value={filterMetric} onChange={(e) => setFilterMetric(e.target.value)} className="select">
            <option value="score">Score</option>
            <option value="views">Views</option>
            <option value="downloads">Downloads</option>
            <option value="likes">Likes</option>
            <option value="comments">Comments</option>
          </select>
        </div>
        <div className="books-ranking-control-group">
          <label className="label">Time Range</label>
          <TimeRangeSelector selected={timeRange} onChange={onTimeRangeChange} />
        </div>
      </div>

      {/* Results Table */}
      <div className="books-ranking-table-container">
        <table className="books-ranking-table">
          <thead className="books-ranking-table-head">
            <tr>
              <th className="books-ranking-table-header-cell">Rank</th>
              <th className="books-ranking-table-header-cell">Title</th>
              <th className="books-ranking-table-header-cell">Author</th>
              <th className="books-ranking-table-header-cell books-ranking-right">Views</th>
              <th className="books-ranking-table-header-cell books-ranking-right">Downloads</th>
              <th className="books-ranking-table-header-cell books-ranking-right">Read</th>
              <th className="books-ranking-table-header-cell books-ranking-right">Likes</th>
              <th className="books-ranking-table-header-cell books-ranking-right">Comments</th>
              <th className="books-ranking-table-header-cell books-ranking-right">Shared</th>
              <th className="books-ranking-table-header-cell books-ranking-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {processedBooks.map((book, idx) => {
              const score = calculateBookScore(book);
              return (
                <tr key={book.book_id} className="books-ranking-table-row">
                  <td className="books-ranking-table-cell books-ranking-rank-cell">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </td>
                  <td className="books-ranking-table-cell books-ranking-title-cell" title={book.title}>
                    <div className="books-ranking-title-text">
                      {book.title}
                    </div>
                  </td>
                  <td className="books-ranking-table-cell books-ranking-author-cell">
                    <img src={book.author_avatar} alt={book.author_name} className="books-ranking-avatar" />
                    <div className="books-ranking-author-name">{book.author_name}</div>
                  </td>
                  <td className="books-ranking-table-cell books-ranking-metric-cell books-ranking-right">{book.views_count || 0}</td>
                  <td className="books-ranking-table-cell books-ranking-metric-cell books-ranking-right">{book.downloads_count || 0}</td>
                  <td className="books-ranking-table-cell books-ranking-metric-cell books-ranking-right">{book.read_count || 0}</td>
                  <td className="books-ranking-table-cell books-ranking-metric-cell books-ranking-right">{book.likes_count || 0}</td>
                  <td className="books-ranking-table-cell books-ranking-metric-cell books-ranking-right">{book.comments_count || 0}</td>
                  <td className="books-ranking-table-cell books-ranking-metric-cell books-ranking-right">{book.shares_count || 0}</td>
                  <td className="books-ranking-table-cell books-ranking-score-cell books-ranking-right">{score}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BooksRanking;
