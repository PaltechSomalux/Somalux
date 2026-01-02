import React, { useEffect, useMemo, useState } from 'react';
import { fetchBooks, fetchCategories, deleteBook, updateBook } from '../api';
import { useAdminUI } from '../AdminUIContext';

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

  const { confirm, showToast } = useAdminUI();

  const ADMIN_EMAILS = ['campuslives254@gmail.com', 'paltechsomalux@gmail.com'];
  const isAdmin = userProfile?.role === 'admin' || ADMIN_EMAILS.includes(userProfile?.email);
  const isEditor = userProfile?.role === 'editor' || ADMIN_EMAILS.includes(userProfile?.email);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count, pageSize]);

  const load = async () => {
    setLoading(true);
    try {
      const { data, count: total } = await fetchBooks({ 
        page, 
        pageSize, 
        search, 
        categoryId, 
        sort
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
    if (isEditor) return true;
    return false;
  };

  const startEdit = (row) => {
    if (!canEdit(row)) {
      showToast({ type: 'error', message: 'You do not have permission to edit this book.' });
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
      console.error('Failed to update book:', e);
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
    <div>
      <div className="panel">
        <div className="panel-title">Books Management</div>

        {/* Stats Summary */}
        {!loading && rows.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', marginBottom: '12px' }}>
            <div style={{ background: '#1a2332', border: '1px solid #2a3f56', borderRadius: '6px', padding: '8px 12px', color: '#8696a0', fontSize: '0.85rem' }}>
              <div style={{ color: '#00a884', fontSize: '1.2rem', fontWeight: '600' }}>{rows.reduce((sum, r) => sum + (r.downloads || 0), 0)}</div>
              <div>Total Downloads</div>
            </div>
            <div style={{ background: '#1a2332', border: '1px solid #2a3f56', borderRadius: '6px', padding: '8px 12px', color: '#8696a0', fontSize: '0.85rem' }}>
              <div style={{ color: '#34B7F1', fontSize: '1.2rem', fontWeight: '600' }}>{rows.reduce((sum, r) => sum + (r.views || 0), 0)}</div>
              <div>Total Views</div>
            </div>
            <div style={{ background: '#1a2332', border: '1px solid #2a3f56', borderRadius: '6px', padding: '8px 12px', color: '#8696a0', fontSize: '0.85rem' }}>
              <div style={{ color: '#FF6B9D', fontSize: '1.2rem', fontWeight: '600' }}>{rows.reduce((sum, r) => sum + (r.comments_count || 0), 0)}</div>
              <div>Total Comments</div>
            </div>
            <div style={{ background: '#1a2332', border: '1px solid #2a3f56', borderRadius: '6px', padding: '8px 12px', color: '#8696a0', fontSize: '0.85rem' }}>
              <div style={{ color: '#F44336', fontSize: '1.2rem', fontWeight: '600' }}>{rows.reduce((sum, r) => sum + (r.likes_count || 0), 0)}</div>
              <div>Total Likes</div>
            </div>
            <div style={{ background: '#1a2332', border: '1px solid #2a3f56', borderRadius: '6px', padding: '8px 12px', color: '#8696a0', fontSize: '0.85rem' }}>
              <div style={{ color: '#FFCC00', fontSize: '1.2rem', fontWeight: '600' }}>{rows.length}/{count}</div>
              <div>Page Books</div>
            </div>
          </div>
        )}

        <div className="grid-2" style={{ marginBottom: 6 }}>
          <div className="panel" style={{ padding: '6px 8px' }}>
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

        <div className="actions" style={{ marginBottom: 10 }}>
          <button className="btn primary" onClick={() => (window.location.href = '/books/admin/upload')}>Add / Upload New Book</button>
        </div>

        <div className="panel" style={{ padding: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="table" style={{ minWidth: '1620px', borderCollapse: 'separate', borderSpacing: 0 }}>
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
                <th style={{ width: '80px', cursor: 'pointer', background: 'rgba(52, 183, 241, 0.1)', borderBottom: '2px solid #34B7F1' }} onClick={() => toggleSort('views')}>Views {sort.col === 'views' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</th>
                <th style={{ width: '80px', cursor: 'pointer', background: 'rgba(255, 107, 157, 0.1)', borderBottom: '2px solid #FF6B9D' }} onClick={() => toggleSort('comments_count')}>Comments {sort.col === 'comments_count' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</th>
                <th style={{ width: '80px', cursor: 'pointer', background: 'rgba(244, 67, 54, 0.1)', borderBottom: '2px solid #F44336' }} onClick={() => toggleSort('likes_count')}>Likes {sort.col === 'likes_count' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</th>
                <th style={{ width: '100px' }}>Date Added</th>
                <th style={{ width: '200px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={13} style={{ color: '#8696a0', textAlign: 'center' }}>Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={13} style={{ color: '#8696a0', textAlign: 'center' }}>No data</td></tr>
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
                  <td style={{ fontWeight: '500', color: '#00a884' }}>{row.views || 0}</td>
                  <td style={{ fontWeight: '500', color: '#FF6B9D' }}>{row.comments_count || 0}</td>
                  <td style={{ fontWeight: '500', color: '#F44336' }}>{row.likes_count || 0}</td>
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
          <span style={{ color: '#cfd8dc' }}>Page {page} of {totalPages}</span>
          <button className="btn" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default Books;
