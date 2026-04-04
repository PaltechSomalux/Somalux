import React, { useState, useMemo } from 'react';
import TimeRangeSelector from './TimeRangeSelector';
import { calculateCategoryScore, filterAndSortCategories } from '../utils/rankingCalculations';
import './CategoriesRanking.css';

const CategoriesRanking = ({ categoriesStats = [], timeRange, onTimeRangeChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMetric, setFilterMetric] = useState('score');

  // Filter and sort by selected metric
  const sortedCategories = useMemo(() => {
    return filterAndSortCategories(categoriesStats, searchTerm, filterMetric);
  }, [categoriesStats, searchTerm, filterMetric]);

  return (
    <div className="categories-ranking-container">
      {/* Search, Filter & Time Range Bar */}
      <div className="categories-ranking-controls">
        <div className="categories-ranking-control-group">
          <label className="label">Search</label>
          <input
            type="text"
            placeholder="..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>
        <div className="categories-ranking-control-group">
          <label className="label">Filter</label>
          <select value={filterMetric} onChange={(e) => setFilterMetric(e.target.value)} className="select">
            <option value="score">Score</option>
            <option value="books">Books</option>
            <option value="downloads">Downloads</option>
            <option value="views">Views</option>
          </select>
        </div>
        <div className="categories-ranking-control-group">
          <label className="label">Time Range</label>
          <TimeRangeSelector selected={timeRange} onChange={onTimeRangeChange} />
        </div>
      </div>

      {/* Results Table */}
      <div className="categories-ranking-table-container">
        <table className="categories-ranking-table">
          <thead className="categories-ranking-table-head">
            <tr>
              <th className="categories-ranking-table-header-cell">Category</th>
              <th className="categories-ranking-table-header-cell categories-ranking-right">Books</th>
              <th className="categories-ranking-table-header-cell categories-ranking-right">Downloads</th>
              <th className="categories-ranking-table-header-cell categories-ranking-right">Views</th>
              <th className="categories-ranking-table-header-cell categories-ranking-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {sortedCategories.map((category, idx) => {
              const score = calculateCategoryScore(category);
              return (
                <tr key={category.category_id} className="categories-ranking-table-row">
                  <td className="categories-ranking-table-cell categories-ranking-name-cell">
                    <span className="categories-ranking-icon">📁</span>
                    <span className="categories-ranking-name-text">{category.name}</span>
                  </td>
                  <td className="categories-ranking-table-cell categories-ranking-metric-cell categories-ranking-right">
                    <span className="categories-ranking-badge">{category.books_count}</span>
                  </td>
                  <td className="categories-ranking-table-cell categories-ranking-metric-cell categories-ranking-right">{category.downloads}</td>
                  <td className="categories-ranking-table-cell categories-ranking-metric-cell categories-ranking-right">{category.views}</td>
                  <td className="categories-ranking-table-cell categories-ranking-score-cell categories-ranking-right">{score}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoriesRanking;
