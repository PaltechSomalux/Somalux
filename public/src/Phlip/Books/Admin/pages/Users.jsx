import React, { useEffect, useState, useMemo } from 'react';
import { fetchProfiles, updateUserRole } from '../api';
import { FiSearch } from 'react-icons/fi';

const Users = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);

  const load = async () => {
    setLoading(true);
    try { setRows(await fetchProfiles()); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const changeRole = async (id, role) => {
    setSaving((s) => ({ ...s, [id]: true }));
    try {
      await updateUserRole(id, role);
      await load();
    } finally { setSaving((s) => ({ ...s, [id]: false })); }
  };

  const filteredRows = useMemo(() => {
    return rows.filter(u => {
      const matchSearch = !search || 
        (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
        (u.display_name && u.display_name.toLowerCase().includes(search.toLowerCase()));
      const matchRole = !roleFilter || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [rows, search, roleFilter]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredRows.slice(start, end);
  }, [filteredRows, page, pageSize]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredRows.length / pageSize)), [filteredRows.length, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  return (
    <div className="panel">
      <div className="panel-title">Users</div>
      
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 250px', minWidth: '200px', maxWidth: '270px' }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8696a0' }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            style={{ paddingLeft: 40, width: '100%' , backgroundColor:"black", color:"white"}}
          />
        </div>
        <select
          className="select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ minWidth: 150, width: 'auto' }}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={4} style={{ color: '#8696a0', textAlign: 'center' }}>Loading...</td></tr>
          ) : paginatedRows.length === 0 ? (
            <tr><td colSpan={4} style={{ color: '#8696a0', textAlign: 'center' }}>No users found</td></tr>
          ) : paginatedRows.map(u => (
            <tr key={u.id}>
              <td>{u.display_name || '—'}</td>
              <td>{u.email}</td>
              <td>
                <select className="select" value={u.role} onChange={(e) => changeRole(u.id, e.target.value)} disabled={!!saving[u.id]}>
                  <option value="admin">admin</option>
                  <option value="editor">editor</option>
                  <option value="viewer">viewer</option>
                </select>
              </td>
              <td>
                <div className="actions">
                  <button className="btn" disabled>View uploads</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Pagination */}
      {filteredRows.length > 0 && (
        <div className="actions" style={{ marginTop: 10, justifyContent: 'space-between' }}>
          <button className="btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
          <span style={{ color: '#cfd8dc' }}>Page {page} of {totalPages} ({filteredRows.length} users)</span>
          <button className="btn" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
        </div>
      )}
    </div>
  );
};

export default Users;
