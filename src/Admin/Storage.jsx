import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { FiRefreshCcw, FiExternalLink, FiFile, FiImage } from 'react-icons/fi';
import { BsFilePdf, BsFileImage, BsFilter } from 'react-icons/bs';
import './Storage.css';

const BUCKETS = ['elib-books', 'elib-covers'];

function humanSize(bytes = 0) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

const Storage = () => {
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]); // { bucket, name, size, updated_at, publicUrl }
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [sortBy, setSortBy] = useState({ field: 'size', direction: 'desc' });
  
  const sortOptions = [
    { field: 'name', label: 'File Name' },
    { field: 'size', label: 'File Size' },
    { field: 'updated_at', label: 'Last Updated' },
    { field: 'bucket', label: 'All Files' },
    { field: 'elib-books', label: 'Books Only' },
    { field: 'elib-covers', label: 'Covers Only' },
    { field: 'type', label: 'File Type' }
  ];

  const loadBucket = async (bucket) => {
    const out = [];
    const processPath = async (prefix = '', depth = 0) => {
      if (depth > 5) return; // Prevent infinite recursion
      
      const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });
      if (error) throw error;
      
      for (const item of data || []) {
        const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
        
        // If it's a folder (id is null), recurse into it
        if (item.id === null || item.name.endsWith('/')) {
          await processPath(fullPath, depth + 1);
        } else {
          // It's a file
          const publicUrl = supabase.storage.from(bucket).getPublicUrl(fullPath).data.publicUrl;
          const size = typeof item.metadata?.size === 'number' ? item.metadata.size : 0;
          out.push({
            bucket,
            name: fullPath,
            updated_at: item.updated_at || item.last_accessed_at || null,
            size,
            publicUrl
          });
        }
      }
    };
    
    await processPath();
    return out;
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const results = await Promise.all(BUCKETS.map(loadBucket));
      setFiles(results.flat());
    } catch (e) {
      console.error('Storage load failed:', e);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const totals = useMemo(() => {
    const count = files.length;
    const size = files.reduce((a, b) => a + (b.size || 0), 0);
    return { count, size };
  }, [files]);

  const sortedFiles = useMemo(() => {
    // First filter by bucket if it's a bucket-specific sort
    let filteredFiles = [...files];
    if (sortBy.field === 'elib-books') {
      filteredFiles = files.filter(f => f.bucket === 'elib-books');
    } else if (sortBy.field === 'elib-covers') {
      filteredFiles = files.filter(f => f.bucket === 'elib-covers');
    }

    return filteredFiles.sort((a, b) => {
      const modifier = sortBy.direction === 'asc' ? 1 : -1;
      
      switch (sortBy.field) {
        case 'name':
          return modifier * a.name.localeCompare(b.name);
        case 'size':
          return modifier * ((b.size || 0) - (a.size || 0));
        case 'updated_at':
          return modifier * (new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
        case 'bucket':
          return modifier * a.bucket.localeCompare(b.bucket);
        case 'elib-books':
        case 'elib-covers':
          // Sort by name within the filtered bucket
          return modifier * a.name.localeCompare(b.name);
        case 'type':
          const getType = (file) => {
            const ext = file.name.split('.').pop().toLowerCase();
            return ext === 'pdf' ? 'pdf' : 
                   ['jpg', 'jpeg', 'png', 'gif'].includes(ext) ? 'image' : 'other';
          };
          return modifier * getType(a).localeCompare(getType(b));
        default:
          return 0;
      }
    });
  }, [files, sortBy]);

  const paginatedFiles = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return sortedFiles.slice(start, end);
  }, [sortedFiles, page, pageSize]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(sortedFiles.length / pageSize)), [sortedFiles.length, pageSize]);

  return (
    <div>
      <div className="panel">
        <div className="panel-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Storage Summary</span>
          <button className="btn" onClick={refresh} disabled={loading}>
            <FiRefreshCcw /> <span style={{ marginLeft: 6 }}>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
        <div className="kpi">
          <div style={{ color: '#cfd8dc' }}>Total files: {loading ? '--' : totals.count}</div>
          <div style={{ color: '#cfd8dc' }}>Total size: {loading ? '--' : humanSize(totals.size)}</div>
        </div>
        <div className="progress" style={{ marginTop: 8 }}>
          <span style={{ width: '0%' }} />
        </div>
      </div>

      <div className="panel">
        <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>Files</span>
          <div className="btn" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
          }}>
            <BsFilter size={18} />
            <select 
              value={`${sortBy.field}-${sortBy.direction}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                setSortBy({ field, direction });
                setPage(1);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: 'inherit',
                fontWeight: 'inherit',
                padding: 0,
                marginRight: '4px',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
            >
              {sortOptions.map(option => (
                <React.Fragment key={option.field}>
                  <option value={`${option.field}-asc`}>Sort by {option.label} (A-Z)</option>
                  <option value={`${option.field}-desc`}>Sort by {option.label} (Z-A)</option>
                </React.Fragment>
              ))}
            </select>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>File</th>
              <th>Bucket</th>
              <th>Size</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ color: '#8696a0', textAlign: 'center' }}>Loading...</td>
              </tr>
            ) : paginatedFiles.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ color: '#8696a0', textAlign: 'center' }}>No files</td>
              </tr>
            ) : (
              paginatedFiles.map((f) => (
                <tr key={`${f.bucket}/${f.name}`}>
                  <td style={{ textAlign: 'center' }}>
                    {f.name.toLowerCase().endsWith('.pdf') ? (
                      <BsFilePdf size={20} style={{ color: '#ff5555' }} />
                    ) : f.name.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/) ? (
                      <BsFileImage size={20} style={{ color: '#00a884' }} />
                    ) : (
                      <FiFile size={20} style={{ color: '#8696a0' }} />
                    )}
                  </td>
                  <td style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</td>
                  <td>{f.bucket}</td>
                  <td>{humanSize(f.size)}</td>
                  <td>{f.updated_at ? new Date(f.updated_at).toLocaleString() : '--'}</td>
                  <td>
                    <a href={f.publicUrl} target="_blank" rel="noreferrer" className="btn" title="Open">
                      <FiExternalLink />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination */}
        {sortedFiles.length > 0 && (
          <div className="actions" style={{ marginTop: 10, justifyContent: 'space-between' }}>
            <button className="btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
            <span style={{ color: '#cfd8dc' }}>Page {page} of {totalPages} ({sortedFiles.length} files)</span>
            <button className="btn" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Storage;
