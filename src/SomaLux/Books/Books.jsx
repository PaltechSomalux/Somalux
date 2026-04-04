import React, { useEffect, useMemo, useState } from 'react';
import { fetchBooks, fetchCategories, deleteBook, updateBook } from '../../Admin/api';
import { useAdminUI } from '../../Admin/AdminUIContext';
import { API_URL } from '../../config';

// Notification Badge Component
const NotificationBadge = ({ count }) => {
  console.log('🏷️ [NOTIF-BADGE] Rendering with count:', count, 'should show?', count && count > 0);
  if (!count || count === 0) return null;
  return (
    <span className="books-notification-badge" title={`${count} pending submissions`}>
      {count > 99 ? '99+' : count}
    </span>
  );
};

const Books = ({ userProfile }) => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(null);
  const [sort, setSort] = useState({ col: 'created_at', dir: 'desc' });
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [newPdf, setNewPdf] = useState(null);
  const [newCover, setNewCover] = useState(null);
  const [pendingSubmissions, setPendingSubmissions] = useState(0);

  const { confirm, showToast } = useAdminUI();

  const isAdmin = userProfile?.role === 'admin';
  const isEditor = userProfile?.role === 'editor';

  console.log('📚 Books component - userProfile:', { 
    id: userProfile?.id, 
    email: userProfile?.email, 
    role: userProfile?.role, 
    isAdmin 
  });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count, pageSize]);

  // Fetch pending submissions count for badge
  useEffect(() => {
    if (isAdmin) {
      const fetchSubmissionsCount = async () => {
        try {
          console.log('🔔 [BADGE] Fetching submissions summary from:', `${API_URL}/api/elib/submissions/summary`);
          const res = await fetch(`${API_URL}/api/elib/submissions/summary`);
          if (res.ok) {
            const json = await res.json();
            console.log('🔔 [BADGE] API Response:', json);
            setPendingSubmissions(json.totalPending || 0);
            console.log('🔔 [BADGE] Updated pendingSubmissions to:', json.totalPending || 0);
          } else {
            console.warn('🔔 [BADGE] Failed to fetch submissions: HTTP', res.status);
          }
        } catch (err) {
          console.warn('🔔 [BADGE] Failed to fetch submissions count:', err);
        }
      };

      fetchSubmissionsCount();
      // Refresh every 30 seconds
      const interval = setInterval(fetchSubmissionsCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const load = async () => {
    setLoading(true);
    try {
      const { data, count: total } = await fetchBooks({ 
        page, 
        pageSize, 
        search, 
        categoryId, 
        sort,
        uploadedBy: isEditor ? userProfile?.id : null
      });
      
      setRows(data);
      setCount(total);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    (async () => {
      try { setCategories(await fetchCategories()); } catch {}
      if (userProfile) {
        await load();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, categoryId, sort.col, sort.dir, userProfile]);

  const canEdit = (row) => {
    if (isAdmin) return true;
    if (isEditor) return row.uploaded_by === userProfile?.id;
    return false;
  };

  const startEdit = (row) => {
    if (!canEdit(row)) {
      showToast({ type: 'error', message: 'You can only edit books you uploaded.' });
      return;
    }
    setEditingId(row.id);
    setEditDraft({
      title: row.title || '',
      author: row.author || '',
      year: row.year || '',
      category_id: row.category_id || null,
      language: row.language || '',
      isbn: row.isbn || '',
      pages: row.pages || '',
      publisher: row.publisher || ''
    });
    setNewPdf(null);
    setNewCover(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({});
    setNewPdf(null);
    setNewCover(null);
  };

  const saveEdit = async (row) => {
    if (!canEdit(row)) {
      showToast({ type: 'error', message: 'You can only edit books you uploaded.' });
      return;
    }
    const updates = { ...editDraft };

    try {
      await updateBook(row.id, { updates, newPdfFile: newPdf, newCoverFile: newCover, oldFilePath: row.file_path });
      cancelEdit();
      await load();
      showToast({ type: 'success', message: 'Book details updated.' });
    } catch (e) {
      console.error('Failed to update book:', e?.message || e);
      showToast({ type: 'error', message: e?.message || 'Failed to update book.' });
    }
  };

  const handleDelete = async (row) => {
    if (!canEdit(row)) {
      showToast({ type: 'error', message: 'You can only delete books you uploaded.' });
      return;
    }
    const ok = await confirm({
      title: 'Delete book?',
      message: `Delete "${row.title}" and its files? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await deleteBook({ id: row.id, file_path: row.file_path });
      await load();
      showToast({ type: 'success', message: 'Book deleted.' });
    } catch (e) {
      console.error('Failed to delete book:', e);
      showToast({ type: 'error', message: e?.message || 'Failed to delete book.' });
    }
  };

  const toggleSort = (col) => {
    setSort((s) => (s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' }));
  };

  return (
    <>
    <div>
      <div className="panel">
        <div className="panel-title">Books Management</div>

        <div className="grid-2" style={{ marginBottom: 6 }}>
          <div className="panel" style={{ padding: '6px 8px', maxWidth: '150px' }}>
            <label className="label" style={{ marginBottom: '0.2rem' }}>Search</label>
            <input className="input" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="Search by title..." style={{ fontSize: '0.9rem' }} />
          </div>
          <div className="panel" style={{ padding: '6px 8px' }}>
            <label className="label" style={{ marginBottom: '0.2rem' }}>Category</label>
            <select className="select" value={categoryId || ''} onChange={(e) => { setPage(1); setCategoryId(e.target.value || null); }} style={{ fontSize: '0.9rem' }}>
              <option value="">All</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="actions" style={{ marginBottom: 10, display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn primary" onClick={() => (window.location.href = '/books/admin/upload')}>Add / Upload New Book</button>
          {isAdmin && (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button className="btn" onClick={() => (window.location.href = '/books/admin')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                ⚙️ Admin
              </button>
              <NotificationBadge count={pendingSubmissions} />
            </div>
          )}
        </div>

        <div className="panel" style={{ padding: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="table" style={{ minWidth: '1540px', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Cover</th>
                <th style={{ width: '300px', cursor: 'pointer' }} onClick={() => toggleSort('title')}>Title {sort.col === 'title' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</th>
                <th style={{ width: '200px', cursor: 'pointer' }} onClick={() => toggleSort('author')}>Author {sort.col === 'author' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</th>
                <th style={{ width: '120px' }}>Category</th>
                <th style={{ width: '100px', cursor: 'pointer' }} onClick={() => toggleSort('year')}>Year {sort.col === 'year' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</th>
                <th style={{ width: '100px' }}>Pages</th>
                <th style={{ width: '180px' }}>Publisher</th>
                <th style={{ width: '100px', cursor: 'pointer' }} onClick={() => toggleSort('downloads')}>Downloads {sort.col === 'downloads' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</th>
                <th style={{ width: '80px', cursor: 'pointer' }} onClick={() => toggleSort('views')}>Views {sort.col === 'views' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</th>
                <th style={{ width: '100px' }}>Date Added</th>
                <th style={{ width: '200px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} style={{ color: '#8696a0', textAlign: 'center' }}>Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={11} style={{ color: '#8696a0', textAlign: 'center' }}>No data</td></tr>
              ) : rows.map(row => (
                <tr key={row.id}>
                  <td>{row.cover_url ? <img src={row.cover_url} alt="cover" style={{ width: 36, height: 48, objectFit: 'cover', borderRadius: 4 }} /> : <span className="badge">No cover</span>}</td>
                  <td>
                    {editingId === row.id ? (
                      <input className="input" value={editDraft.title} onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })} />
                    ) : row.title}
                  </td>
                  <td>
                    {editingId === row.id ? (
                      <input className="input" value={editDraft.author} onChange={(e) => setEditDraft({ ...editDraft, author: e.target.value })} />
                    ) : row.author}
                  </td>
                  <td>
                    {editingId === row.id ? (
                      <select className="select" value={editDraft.category_id || ''} onChange={(e) => setEditDraft({ ...editDraft, category_id: e.target.value || null })}>
                        <option value="">Uncategorized</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    ) : (categories.find(c => c.id === row.category_id)?.name || '—')}
                  </td>
                  <td>
                    {editingId === row.id ? (
                      <input className="input" value={editDraft.year} onChange={(e) => setEditDraft({ ...editDraft, year: e.target.value })} />
                    ) : (row.year || '—')}
                  </td>
                  <td>
                    {editingId === row.id ? (
                      <input className="input" type="number" placeholder="Pages" value={editDraft.pages} onChange={(e) => setEditDraft({ ...editDraft, pages: e.target.value })} />
                    ) : (row.pages || '—')}
                  </td>
                  <td>
                    {editingId === row.id ? (
                      <input className="input" placeholder="Publisher" value={editDraft.publisher} onChange={(e) => setEditDraft({ ...editDraft, publisher: e.target.value })} />
                    ) : (row.publisher || '—')}
                  </td>
                  <td>{row.downloads || 0}</td>
                  <td>{row.views || 0}</td>
                  <td>{new Date(row.created_at).toLocaleDateString()}</td>
                  <td>
                    {editingId === row.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '180px' }}>
                        <div>
                          <label className="label">Replace PDF</label>
                          <div
                            className="file-upload-btn"
                            onClick={() => document.getElementById(`pdf-input-${row.id}`).click()}
                            style={{
                              border: '1px solid #374151',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: newPdf ? 'rgba(0, 168, 132, 0.1)' : 'transparent',
                              color: newPdf ? '#00a884' : '#e9edef',
                              transition: 'all 0.2s'
                            }}
                          >
                            <input
                              id={`pdf-input-${row.id}`}
                              type="file"
                              accept="application/pdf"
                              onChange={(e) => setNewPdf(e.target.files?.[0] || null)}
                              style={{ display: 'none' }}
                            />
                            {newPdf ? (
                              <>📄 {newPdf.name.slice(0, 20)}{newPdf.name.length > 20 ? '...' : ''}</>
                            ) : (
                              <>📄 Choose PDF</>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="label">Replace Cover</label>
                          <div
                            className="file-upload-btn"
                            onClick={() => document.getElementById(`cover-input-${row.id}`).click()}
                            style={{
                              border: '1px solid #374151',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: newCover ? 'rgba(0, 168, 132, 0.1)' : 'transparent',
                              color: newCover ? '#00a884' : '#e9edef',
                              transition: 'all 0.2s'
                            }}
                          >
                            <input
                              id={`cover-input-${row.id}`}
                              type="file"
                              accept="image/*"
                              onChange={(e) => setNewCover(e.target.files?.[0] || null)}
                              style={{ display: 'none' }}
                            />
                            {newCover ? (
                              <>🖼️ {newCover.name.slice(0, 20)}{newCover.name.length > 20 ? '...' : ''}</>
                            ) : (
                              <>🖼️ Choose Image</>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <button className="btn primary" onClick={() => saveEdit(row)}>Save</button>
                          <button className="btn" onClick={cancelEdit}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="actions">
                        <button 
                          className="btn" 
                          onClick={() => startEdit(row)}
                          disabled={!canEdit(row)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn" 
                          onClick={() => handleDelete(row)}
                          disabled={!canEdit(row)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="actions" style={{ marginTop: 10 }}>
          <button className="btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
          {(userProfile?.subscription_tier === 'premium' || userProfile?.subscription_tier === 'premium_pro') && (
            <span style={{ color: '#cfd8dc' }}>Page {page} of {totalPages}</span>
          )}
          <button className="btn" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
        </div>
      </div>
    </div>

    <style>{`
      .books-notification-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        background: #dc2626;
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        border-radius: 9px;
        margin-left: 8px;
        line-height: 1;
        box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);
        position: absolute;
        top: -8px;
        right: -12px;
        min-width: 20px;
        padding: 0 4px;
        z-index: 10;
      }
    `}</style>
    </>
  );
};

export default Books;
