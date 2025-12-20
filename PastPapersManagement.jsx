import React, { useEffect, useMemo, useState } from 'react';
import { fetchPastPapers, deletePastPaper, updatePastPaper, getFaculties } from '../pastPapersApi';
import { useAdminUI } from '../AdminUIContext';

const PastPapersManagement = ({ userProfile }) => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [faculties, setFaculties] = useState([]);
  const [facultyFilter, setFacultyFilter] = useState(null);
  const [sort, setSort] = useState({ col: 'created_at', dir: 'desc' });
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [newPdf, setNewPdf] = useState(null);

  const { confirm, showToast } = useAdminUI();

  const isAdmin = userProfile?.role === 'admin';
  const isEditor = userProfile?.role === 'editor';
  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count, pageSize]);

  const load = async () => {
    setLoading(true);
    try {
      const { data, count: total } = await fetchPastPapers({ page, pageSize, search, faculty: facultyFilter, sort });
      setRows(data);
      setCount(total);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    (async () => { try { setFaculties(await getFaculties()); } catch {} })();
  }, []);

  useEffect(() => {
    if (userProfile) load();
  }, [page, search, facultyFilter, sort.col, sort.dir, userProfile]);

  const canEdit = (row) => {
    if (isAdmin) return true;
    if (isEditor) return row.uploaded_by === userProfile?.id;
    return false;
  };

  const startEdit = (row) => {
    if (!canEdit(row)) {
      showToast({ type: 'error', message: 'You can only edit past papers you uploaded.' });
      return;
    }
    setEditingId(row.id);
    setEditDraft({
      faculty: row.faculty || '', unit_code: row.unit_code || '', unit_name: row.unit_name || '',
      year: row.year || '', semester: row.semester || '', exam_type: row.exam_type || ''
    });
    setNewPdf(null);
  };

  const cancelEdit = () => { setEditingId(null); setEditDraft({}); setNewPdf(null); };

  const saveEdit = async (row) => {
    if (!canEdit(row)) {
      showToast({ type: 'error', message: 'You can only edit past papers you uploaded.' });
      return;
    }
    const updates = { ...editDraft };

    try {
      await updatePastPaper(row.id, { updates, newPdfFile: newPdf, oldFilePath: row.file_path });
      cancelEdit();
      await load();
      showToast({ type: 'success', message: 'Past paper updated.' });
    } catch (e) {
      console.error('Failed to update past paper:', e?.message || e);
      showToast({ type: 'error', message: e?.message || 'Failed to update past paper.' });
    }
  };

  const handleDelete = async (row) => {
    if (!canEdit(row)) {
      showToast({ type: 'error', message: 'You can only delete past papers you uploaded.' });
      return;
    }

    const ok = await confirm({
      title: 'Delete past paper?',
      message: `Delete "${row.unit_code} - ${row.unit_name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await deletePastPaper({ id: row.id, file_path: row.file_path });
      await load();
      showToast({ type: 'success', message: 'Past paper deleted.' });
    } catch (e) {
      console.error('Failed to delete past paper:', e);
      showToast({ type: 'error', message: e?.message || 'Failed to delete past paper.' });
    }
  };

  const toggleSort = (col) => setSort((s) => (s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' }));

  return (
    <div>
      <div className="panel">
        <div className="panel-title">Past Papers Management</div>
        <div className="grid-2" style={{ marginBottom: 6 }}>
          <div className="panel">
            <label className="label">Search</label>
            <input className="input" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="Search by unit code or name..." />
          </div>
          <div className="panel">
            <label className="label">Faculty</label>
            <select className="select" value={facultyFilter || ''} onChange={(e) => { setPage(1); setFacultyFilter(e.target.value || null); }}>
              <option value="">All Faculties</option>
              {faculties.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
        <div className="actions" style={{ marginBottom: 6 }}>
          <button className="btn primary" onClick={() => (window.location.href = '/books/admin/upload')}>Add New Past Paper</button>
        </div>
        <div className="panel" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table" style={{ minWidth: '1200px' }}>
            <thead>
              <tr>
                <th style={{ width: '150px', cursor: 'pointer' }} onClick={() => toggleSort('unit_code')}>Unit Code {sort.col === 'unit_code' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</th>
                <th style={{ width: '250px' }}>Unit Name</th>
                <th style={{ width: '150px' }}>Faculty</th>
                <th style={{ width: '100px', cursor: 'pointer' }} onClick={() => toggleSort('year')}>Year {sort.col === 'year' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</th>
                <th style={{ width: '100px' }}>Semester</th>
                <th style={{ width: '120px' }}>Exam Type</th>
                <th style={{ width: '80px', cursor: 'pointer' }} onClick={() => toggleSort('views')}>Views {sort.col === 'views' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</th>
                <th style={{ width: '100px', cursor: 'pointer' }} onClick={() => toggleSort('downloads')}>Downloads {sort.col === 'downloads' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</th>
                <th style={{ width: '200px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: '#8696a0' }}>Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: '#8696a0' }}>No data</td></tr>
              ) : rows.map(row => (
                <tr key={row.id}>
                  <td>{editingId === row.id ? <input className="input" value={editDraft.unit_code} onChange={(e) => setEditDraft({ ...editDraft, unit_code: e.target.value })} /> : row.unit_code}</td>
                  <td>{editingId === row.id ? <input className="input" value={editDraft.unit_name} onChange={(e) => setEditDraft({ ...editDraft, unit_name: e.target.value })} /> : row.unit_name}</td>
                  <td>{editingId === row.id ? <input className="input" value={editDraft.faculty} onChange={(e) => setEditDraft({ ...editDraft, faculty: e.target.value })} /> : row.faculty}</td>
                  <td>{editingId === row.id ? <input className="input" type="number" value={editDraft.year} onChange={(e) => setEditDraft({ ...editDraft, year: e.target.value })} /> : (row.year || '—')}</td>
                  <td>{editingId === row.id ? <select className="select" value={editDraft.semester} onChange={(e) => setEditDraft({ ...editDraft, semester: e.target.value })}><option value="">—</option><option value="1">1</option><option value="2">2</option><option value="3">3</option></select> : (row.semester || '—')}</td>
                  <td>{editingId === row.id ? <select className="select" value={editDraft.exam_type} onChange={(e) => setEditDraft({ ...editDraft, exam_type: e.target.value })}><option value="Main">Main</option><option value="Supplementary">Supplementary</option><option value="CAT">CAT</option><option value="Mock">Mock</option></select> : (row.exam_type || 'Main')}</td>
                  <td>{row.views || 0}</td>
                  <td>{row.downloads || 0}</td>
                  <td>
                    {editingId === row.id ? (
                      <div style={{ display: 'flex', gap: '4px', flexDirection: 'column' }}>
                        <button className="btn primary" onClick={() => saveEdit(row)}>Save</button>
                        <button className="btn" onClick={cancelEdit}>Cancel</button>
                      </div>
                    ) : (
                      <div className="actions">
                        <button className="btn" onClick={() => startEdit(row)} disabled={!canEdit(row)}>Edit</button>
                        <button className="btn" onClick={() => handleDelete(row)} disabled={!canEdit(row)}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="actions" style={{ marginTop: 6 }}>
          <button className="btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
          <span style={{ color: '#cfd8dc' }}>Page {page} of {totalPages}</span>
          <button className="btn" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default PastPapersManagement;
