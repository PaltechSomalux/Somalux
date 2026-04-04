import React, { useEffect, useState } from 'react';
import { fetchSearchAnalyticsTop } from '../api';

const SCOPES = [
  { id: 'books', label: 'Book Searches' },
  { id: 'categories', label: 'Category Searches' },
  { id: 'authors', label: 'Author Searches' },
  { id: 'past_papers', label: 'Past Paper Searches' },
];

const TIME_WINDOWS = [
  { id: '7', label: 'Last 7 days' },
  { id: '30', label: 'Last 30 days' },
  { id: '90', label: 'Last 90 days' },
];

const SearchAnalytics = () => {
  const [days, setDays] = useState('30');
  const [loading, setLoading] = useState(false);
  const [dataByScope, setDataByScope] = useState({
    books: [],
    categories: [],
    authors: [],
    past_papers: [],
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const entries = await Promise.all(
          SCOPES.map(async (s) => {
            const rows = await fetchSearchAnalyticsTop(s.id, { days: Number(days) || 30, limit: 20 });
            return [s.id, rows || []];
          })
        );
        if (!cancelled) {
          const mapped = {};
          entries.forEach(([scope, rows]) => {
            mapped[scope] = rows;
          });
          setDataByScope((prev) => ({ ...prev, ...mapped }));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [days]);

  return (
    <div className="panel">
      <div className="panel-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Search Overview</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {TIME_WINDOWS.map((tw) => (
            <button
              key={tw.id}
              className={days === tw.id ? 'btn' : 'btn btn-secondary'}
              onClick={() => setDays(tw.id)}
            >
              {tw.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ color: '#8696a0', padding: 8, fontSize: 12 }}>Loading search analytics...</div>
      )}

      <div className="grid-2" style={{ marginTop: 8 }}>
        {SCOPES.map((scope) => {
          const rows = dataByScope[scope.id] || [];
          return (
            <div key={scope.id} className="panel" style={{ background: '#111b21' }}>
              <div className="panel-title">{scope.label}</div>
              {rows.length === 0 ? (
                <div style={{ color: '#8696a0', padding: 6, fontSize: 11 }}>No search data yet for this period.</div>
              ) : (
                <table className="table overview-table">
                  <thead>
                    <tr>
                      <th>Query</th>
                      <th>Searches</th>
                      <th>Avg Results</th>
                      <th>Last Searched</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.query_text}</td>
                        <td>{row.search_count}</td>
                        <td>{row.avg_results != null ? Math.round(row.avg_results) : '—'}</td>
                        <td>{row.last_searched ? new Date(row.last_searched).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SearchAnalytics;
