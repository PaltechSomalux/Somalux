import React, { useEffect, useState } from 'react';
import { fetchStats, fetchViewDetails } from '../api';

import { FiX, FiEye } from 'react-icons/fi';

const COLORS = ['#00a884', '#34B7F1', '#FFCC00', '#f15e6c', '#8b5cf6', '#22d3ee'];

const Dashboard = () => {
  const [stats, setStats] = useState({
    counts: { books: 0, users: 0, downloads: 0, views: 0, universities: 0, pastPapers: 0 },
    monthly: [],
    categories: [],
    top: [],
    recent: [],
  });
  const [loading, setLoading] = useState(true);
  const [showViewsModal, setShowViewsModal] = useState(false);
  const [viewDetails, setViewDetails] = useState([]);
  const [loadingViews, setLoadingViews] = useState(false);
  const [viewerPages, setViewerPages] = useState({});
  const [monthlyPage, setMonthlyPage] = useState(1);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [topPage, setTopPage] = useState(1);

  const OVERVIEW_PAGE_SIZE = 7;

  // Normalized datasets for charts
  const safeMonthly = (stats.monthly || []).map(d => ({
    month: d.month || 'Unknown',
    Uploads: Number(d.uploads || d.uploads || 0),
  })).filter(d => !isNaN(d.Uploads));
  const safeCategories = (stats.categories || []).map(c => ({
    name: c.name || 'Unknown',
    count: Number(c.count || c.Count || 0),
  })).filter(c => !isNaN(c.count));
  const safeTop = (stats.top || []).map(b => ({
    title: b.title || 'Untitled',
    downloads: Number(b.downloads || b.Downloads || 0),
  })).filter(b => !isNaN(b.downloads));

  // Only show non-zero rows in tables and sort highest first
  const nonZeroMonthly = safeMonthly
    .filter(m => m.Uploads > 0)
    .sort((a, b) => b.Uploads - a.Uploads);
  const nonZeroCategories = safeCategories
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count);
  const nonZeroTop = safeTop
    .filter(b => b.downloads > 0)
    .sort((a, b) => b.downloads - a.downloads);

  const monthlyTotalPages = Math.max(1, Math.ceil((nonZeroMonthly.length || 0) / OVERVIEW_PAGE_SIZE));
  const categoriesTotalPages = Math.max(1, Math.ceil((nonZeroCategories.length || 0) / OVERVIEW_PAGE_SIZE));
  const topTotalPages = Math.max(1, Math.ceil((nonZeroTop.length || 0) / OVERVIEW_PAGE_SIZE));

  const monthlyStart = (monthlyPage - 1) * OVERVIEW_PAGE_SIZE;
  const monthlyEnd = monthlyStart + OVERVIEW_PAGE_SIZE;
  const pagedMonthly = nonZeroMonthly.slice(monthlyStart, monthlyEnd);

  const categoriesStart = (categoriesPage - 1) * OVERVIEW_PAGE_SIZE;
  const categoriesEnd = categoriesStart + OVERVIEW_PAGE_SIZE;
  const pagedCategories = nonZeroCategories.slice(categoriesStart, categoriesEnd);

  const topStart = (topPage - 1) * OVERVIEW_PAGE_SIZE;
  const topEnd = topStart + OVERVIEW_PAGE_SIZE;
  const pagedTop = nonZeroTop.slice(topStart, topEnd);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await fetchStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  

  if (loading) {
    return <div className="admin-loading">Loading...</div>;
  }

  return (
    <div className="admin-content">
      <div className="cards">
        <div className="card">
          <div className="card-title">Total Books</div>
          <div className="card-value">{stats.counts.books}</div>
        </div>
        <div className="card">
          <div className="card-title">Universities</div>
          <div className="card-value">{stats.counts.universities}</div>
        </div>
        <div className="card">
          <div className="card-title">Past Papers</div>
          <div className="card-value">{stats.counts.pastPapers}</div>
        </div>
        <div className="card">
          <div className="card-title">Total Users</div>
          <div className="card-value">{stats.counts.users}</div>
        </div>
        <div className="card">
          <div className="card-title">Total Downloads</div>
          <div className="card-value">{stats.counts.downloads}</div>
        </div>
        <div
          className="card"
          onClick={async () => {
            setShowViewsModal(true);
            setLoadingViews(true);
            try {
              const details = await fetchViewDetails();
              setViewDetails(details);
            } catch (error) {
              console.error('Error fetching view details:', error);
            } finally {
              setLoadingViews(false);
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="card-title">
            Total Views <FiEye style={{ marginLeft: 8 }} />
          </div>
          <div className="card-value">{stats.counts.views}</div>
          <div style={{ fontSize: 11, color: '#8696a0', marginTop: 4 }}>
            Click to view details
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-title">Uploads per Month</div>
          <table className="table overview-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Uploads</th>
              </tr>
            </thead>
            <tbody>
              {(pagedMonthly.length ? pagedMonthly : []).map((m, i) => (
                <tr key={i}>
                  <td>{m.month}</td>
                  <td>{m.Uploads}</td>
                </tr>
              ))}
              {nonZeroMonthly.length === 0 && (
                <tr><td colSpan={2} style={{ color: '#8696a0' }}>No uploads yet</td></tr>
              )}
            </tbody>
          </table>
          {nonZeroMonthly.length > OVERVIEW_PAGE_SIZE && (
            <div className="actions" style={{ marginTop: 10, justifyContent: 'space-between' }}>
              <button
                className="btn"
                disabled={monthlyPage <= 1}
                onClick={() => setMonthlyPage(p => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <span style={{ color: '#cfd8dc', fontSize: 12 }}>
                Page {monthlyPage} of {monthlyTotalPages}
              </span>
              <button
                className="btn"
                disabled={monthlyPage >= monthlyTotalPages}
                onClick={() => setMonthlyPage(p => Math.min(monthlyTotalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-title">Categories Distribution</div>
          <table className="table overview-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {(pagedCategories.length ? pagedCategories : []).map((c, i) => (
                <tr key={i}>
                  <td>{c.name}</td>
                  <td>{c.count}</td>
                </tr>
              ))}
              {nonZeroCategories.length === 0 && (
                <tr><td colSpan={2} style={{ color: '#8696a0' }}>No category data</td></tr>
              )}
            </tbody>
          </table>
          {nonZeroCategories.length > OVERVIEW_PAGE_SIZE && (
            <div className="actions" style={{ marginTop: 10, justifyContent: 'space-between' }}>
              <button
                className="btn"
                disabled={categoriesPage <= 1}
                onClick={() => setCategoriesPage(p => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <span style={{ color: '#cfd8dc', fontSize: 12 }}>
                Page {categoriesPage} of {categoriesTotalPages}
              </span>
              <button
                className="btn"
                disabled={categoriesPage >= categoriesTotalPages}
                onClick={() => setCategoriesPage(p => Math.min(categoriesTotalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Top Books (Downloads)</div>
        <table className="table overview-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Downloads</th>
            </tr>
          </thead>
          <tbody>
            {(pagedTop.length ? pagedTop : []).map((b, i) => (
              <tr key={i}>
                <td>{b.title}</td>
                <td>{b.downloads}</td>
              </tr>
            ))}
            {nonZeroTop.length === 0 && (
              <tr><td colSpan={2} style={{ color: '#8696a0' }}>No top books data</td></tr>
            )}
          </tbody>
        </table>
        {nonZeroTop.length > OVERVIEW_PAGE_SIZE && (
          <div className="actions" style={{ marginTop: 10, justifyContent: 'space-between' }}>
            <button
              className="btn"
              disabled={topPage <= 1}
              onClick={() => setTopPage(p => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span style={{ color: '#cfd8dc', fontSize: 12 }}>
              Page {topPage} of {topTotalPages}
            </span>
            <button
              className="btn"
              disabled={topPage >= topTotalPages}
              onClick={() => setTopPage(p => Math.min(topTotalPages, p + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showViewsModal && (
        <div className="modal-overlay" onClick={() => setShowViewsModal(false)}>
            <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 style={{ margin: 0, color: '#e9edef' }}>Book View Details</h2>
              <button onClick={() => setShowViewsModal(false)} className="icon-btn">
                <FiX size={20} />
              </button>
            </div>
            <div className="modal-body">
            {loadingViews ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#8696a0' }}>
                Loading...
              </div>
            ) : (
              <div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Book Title</th>
                      <th>Total Views</th>
                      <th>Unique Users</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewDetails.map((book, idx) => (
                      <React.Fragment key={book.book_id}>
                        <tr>
                          <td><strong>{book.book_title}</strong></td>
                          <td>{book.total_views}</td>
                          <td>{book.unique_users}</td>
                          <td>
                            <button
                              className="btn"
                              onClick={() => {
                                const expanded = document.getElementById(`expand-${idx}`);
                                if (expanded) {
                                  expanded.style.display = expanded.style.display === 'none' ? 'table-row' : 'none';
                                }
                                setViewerPages((p) => ({ ...p, [idx]: p[idx] || 1 }));
                              }}
                            >
                              View Users
                            </button>
                          </td>
                        </tr>
                        <tr id={`expand-${idx}`} style={{ display: 'none', backgroundColor: '#111b21' }}>
                          <td colSpan={4}>
                            <div className="viewer-section">
                              <div className="viewer-section-title">Users who viewed</div>
                              {(() => {
                                const pageSize = 8;
                                const page = viewerPages[idx] || 1;
                                const totalPages = Math.max(1, Math.ceil((book.users?.length || 0) / pageSize));
                                const start = (page - 1) * pageSize;
                                const end = start + pageSize;
                                const current = (book.users || []).slice(start, end);
                                return (
                                  <>
                                    <div className="viewer-list">
                                      {current.map((user, userIdx) => (
                                        <div className="viewer-item" key={userIdx}>
                                          <div className="viewer-avatar">
                                            {(user.email || '?').charAt(0).toUpperCase()}
                                          </div>
                                          <div className="viewer-meta">
                                            <div className="viewer-email">{user.email}</div>
                                            <div className="viewer-time">
                                              {new Date(user.viewed_at).toLocaleString()}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                      {current.length === 0 && (
                                        <div style={{ color: '#8696a0' }}>
                                          No viewers on this page.
                                        </div>
                                      )}
                                    </div>
                                    {book.users && book.users.length > pageSize && (
                                      <div
                                        className="actions"
                                        style={{ marginTop: 10, justifyContent: 'space-between' }}
                                      >
                                        <button
                                          className="btn"
                                          disabled={page <= 1}
                                          onClick={() =>
                                            setViewerPages((p) => ({
                                              ...p,
                                              [idx]: Math.max(1, (p[idx] || 1) - 1),
                                            }))
                                          }
                                        >
                                          Prev
                                        </button>
                                        <span style={{ color: '#cfd8dc' }}>
                                          Page {page} of {totalPages} ({book.users.length} viewers)
                                        </span>
                                        <button
                                          className="btn"
                                          disabled={page >= totalPages}
                                          onClick={() =>
                                            setViewerPages((p) => ({
                                              ...p,
                                              [idx]: Math.min(totalPages, (p[idx] || 1) + 1),
                                            }))
                                          }
                                        >
                                          Next
                                        </button>
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;