import React, { useState, useMemo } from 'react';
import TimeRangeSelector from './TimeRangeSelector';
import { calculateAdScore, filterAndSortAds } from '../utils/rankingCalculations';
import './AdsRanking.css';

const AdsRanking = ({ adsStats = [], timeRange, onTimeRangeChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMetric, setFilterMetric] = useState('score');

  // Filter and sort by selected metric
  const sortedAds = useMemo(() => {
    return filterAndSortAds(adsStats, searchTerm, filterMetric);
  }, [adsStats, searchTerm, filterMetric]);

  return (
    <div className="ads-ranking-container">
      {/* Search, Filter & Time Range Bar */}
      <div className="ads-ranking-controls">
        <div className="ads-ranking-control-group">
          <label className="label">Search</label>
          <input
            type="text"
            placeholder="..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>
        <div className="ads-ranking-control-group">
          <label className="label">Filter</label>
          <select value={filterMetric} onChange={(e) => setFilterMetric(e.target.value)} className="select">
            <option value="score">Score</option>
            <option value="impressions">Impressions</option>
            <option value="clicks">Clicks</option>
            <option value="conversions">Conversions</option>
            <option value="revenue">Revenue</option>
          </select>
        </div>
        <div className="ads-ranking-control-group">
          <label className="label">Time Range</label>
          <TimeRangeSelector selected={timeRange} onChange={onTimeRangeChange} />
        </div>
      </div>

      {/* Results Table */}
      <div className="ads-ranking-table-container">
        <table className="ads-ranking-table">
          <thead className="ads-ranking-table-head">
            <tr>
              <th className="ads-ranking-table-header-cell">Ad Title</th>
              <th className="ads-ranking-table-header-cell ads-ranking-right">Impressions</th>
              <th className="ads-ranking-table-header-cell ads-ranking-right">Clicks</th>
              <th className="ads-ranking-table-header-cell ads-ranking-right">CTR %</th>
              <th className="ads-ranking-table-header-cell ads-ranking-right">Conversions</th>
              <th className="ads-ranking-table-header-cell ads-ranking-right">Revenue</th>
              <th className="ads-ranking-table-header-cell ads-ranking-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {sortedAds.map((ad, idx) => {
              const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : 0;
              const score = calculateAdScore(ad);
              return (
                <tr key={ad.ad_id} className="ads-ranking-table-row">
                  <td className="ads-ranking-table-cell ads-ranking-title-cell">
                    <div className="ads-ranking-title-text">{ad.title}</div>
                  </td>
                  <td className="ads-ranking-table-cell ads-ranking-metric-cell ads-ranking-right">{(ad.impressions || 0).toLocaleString()}</td>
                  <td className="ads-ranking-table-cell ads-ranking-metric-cell ads-ranking-right">{ad.clicks || 0}</td>
                  <td className="ads-ranking-table-cell ads-ranking-metric-cell ads-ranking-right">
                    <div className="ads-ranking-ctr-display">
                      <div className="ads-ranking-progress-bar" style={{ width: Math.min(parseFloat(ctr), 100) + '%' }}></div>
                      <span className="ads-ranking-ctr-text">{ctr}%</span>
                    </div>
                  </td>
                  <td className="ads-ranking-table-cell ads-ranking-metric-cell ads-ranking-right">{ad.conversions || 0}</td>
                  <td className="ads-ranking-table-cell ads-ranking-metric-cell ads-ranking-right">KES {(ad.revenue || 0).toLocaleString()}</td>
                  <td className="ads-ranking-table-cell ads-ranking-score-cell ads-ranking-right">{score}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdsRanking;
