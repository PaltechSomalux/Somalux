import React, { useState, useMemo } from 'react';
import { calculateSubscriberScore, filterAndSortSubscribers } from '../utils/rankingCalculations';
import './SubscribersRanking.css';

const SubscribersRanking = ({ subscribersStats = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMetric, setFilterMetric] = useState('score');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Filter and sort by selected metric
  const sortedSubscribers = useMemo(() => {
    return filterAndSortSubscribers(subscribersStats, searchTerm, filterMetric);
  }, [subscribersStats, searchTerm, filterMetric]);

  return (
    <div className="subscribers-ranking-container">
      {/* Search & Filter Bar */}
      <div className="subscribers-ranking-controls">
        <div className="subscribers-ranking-control-group">
          <label className="label">Search</label>
          <input
            type="text"
            placeholder="..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>
        <div className="subscribers-ranking-control-group">
          <label className="label">Filter</label>
          <select value={filterMetric} onChange={(e) => setFilterMetric(e.target.value)} className="select">
            <option value="score">Score</option>
            <option value="spent">Amount Spent</option>
            <option value="months">Subscription Months</option>
            <option value="renewals">Renewals</option>
            <option value="referrals">Referrals</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="subscribers-ranking-table-container">
        <table className="subscribers-ranking-table">
          <thead className="subscribers-ranking-table-head">
            <tr>
              <th className="subscribers-ranking-table-header-cell">Rank</th>
              <th className="subscribers-ranking-table-header-cell">User</th>
              <th className="subscribers-ranking-table-header-cell subscribers-ranking-right">Spent (KES)</th>
              <th className="subscribers-ranking-table-header-cell subscribers-ranking-right">Months</th>
              <th className="subscribers-ranking-table-header-cell subscribers-ranking-right">Renewals</th>
              <th className="subscribers-ranking-table-header-cell subscribers-ranking-right">Referrals</th>
              <th className="subscribers-ranking-table-header-cell subscribers-ranking-right">Active</th>
              <th className="subscribers-ranking-table-header-cell subscribers-ranking-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {sortedSubscribers.map((subscriber, idx) => {
              const score = calculateSubscriberScore(subscriber);
              return (
                <tr key={subscriber.user_id} className="subscribers-ranking-table-row">
                  <td className="subscribers-ranking-table-cell subscribers-ranking-rank-cell">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </td>
                  <td className="subscribers-ranking-table-cell subscribers-ranking-name-cell">
                    <div className="subscribers-ranking-user-info">
                      <img src={subscriber.avatar_url} alt={subscriber.display_name} className="subscribers-ranking-avatar" />
                      <div>
                        <div className="subscribers-ranking-user-name">{subscriber.display_name}</div>
                        <span className="subscribers-ranking-user-email">{subscriber.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="subscribers-ranking-table-cell subscribers-ranking-metric-cell subscribers-ranking-right">
                    <span className="subscribers-ranking-badge">{(subscriber.total_spent || 0).toLocaleString()}</span>
                  </td>
                  <td className="subscribers-ranking-table-cell subscribers-ranking-metric-cell subscribers-ranking-right">{subscriber.subscription_months || 0}</td>
                  <td className="subscribers-ranking-table-cell subscribers-ranking-metric-cell subscribers-ranking-right">{subscriber.renewals || 0}</td>
                  <td className="subscribers-ranking-table-cell subscribers-ranking-metric-cell subscribers-ranking-right">{subscriber.referrals || 0}</td>
                  <td className="subscribers-ranking-table-cell subscribers-ranking-metric-cell subscribers-ranking-right">
                    <span className={subscriber.is_active ? 'subscribers-ranking-active-yes' : 'subscribers-ranking-active-no'}>
                      {subscriber.is_active ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="subscribers-ranking-table-cell subscribers-ranking-score-cell subscribers-ranking-right">{score}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubscribersRanking;
