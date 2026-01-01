import React, { useEffect, useState, useMemo } from 'react';
import { createCategory, deleteCategory, fetchCategories, updateCategory } from '../api';
import { useAdminUI } from '../AdminUIContext';
import { supabase } from '../../supabaseClient';
import { FiFolder, FiEdit2, FiTrash2, FiPlus, FiBookOpen, FiSearch } from 'react-icons/fi';

const Categories = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ name: '', description: '' });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [bookCounts, setBookCounts] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const { confirm, showToast } = useAdminUI();

  const load = async () => {
    setLoading(true);
    try {
      const categories = await fetchCategories();
      setRows(categories);
      
      // Fetch book counts for each category
      const counts = {};
      await Promise.all(
        categories.map(async (cat) => {
          const { count, error } = await supabase
            .from('books')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', cat.id);
          
          if (!error) {
            counts[cat.id] = count || 0;
          }
        })
      );
      setBookCounts(counts);
    } catch (e) {
      console.error('Failed to load categories:', e);
      showToast({ type: 'error', message: 'Failed to load categories.' });
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!adding.name.trim()) {
      showToast({ type: 'error', message: 'Please enter a category name.' });
      return;
    }
    try {
      await createCategory({ name: adding.name.trim(), description: adding.description || '' });
      setAdding({ name: '', description: '' });
      await load();
      showToast({ type: 'success', message: 'Category added successfully!' });
    } catch (e) {
      console.error('Failed to add category:', e);
      showToast({ type: 'error', message: e?.message || 'Failed to add category.' });
    }
  };

  const startEdit = (row) => { 
    setEditingId(row.id); 
    setDraft({ name: row.name, description: row.description || '' }); 
  };
  
  const cancel = () => { 
    setEditingId(null); 
    setDraft({ name: '', description: '' }); 
  };
  
  const save = async (id) => {
    if (!draft.name.trim()) {
      showToast({ type: 'error', message: 'Category name cannot be empty.' });
      return;
    }
    try {
      await updateCategory(id, { name: draft.name.trim(), description: draft.description });
      cancel();
      await load();
      showToast({ type: 'success', message: 'Category updated successfully!' });
    } catch (e) {
      console.error('Failed to update category:', e);
      showToast({ type: 'error', message: e?.message || 'Failed to update category.' });
    }
  };

  const handleDelete = async (row) => {
    const bookCount = bookCounts[row.id] || 0;
    const ok = await confirm({
      title: 'Delete category?',
      message: bookCount > 0 
        ? `This category contains ${bookCount} book${bookCount > 1 ? 's' : ''}. Deleting it will remove the category association from these books.`
        : 'This will permanently remove this category.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteCategory(row.id);
      await load();
      showToast({ type: 'success', message: 'Category deleted successfully!' });
    } catch (e) {
      console.error('Failed to delete category:', e);
      showToast({ type: 'error', message: e?.message || 'Failed to delete category.' });
    }
  };

  // Filter categories based on search
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter(row => 
      row.name.toLowerCase().includes(term) || 
      (row.description || '').toLowerCase().includes(term)
    );
  }, [rows, searchTerm]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredRows.slice(start, end);
  }, [filteredRows, page, pageSize]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredRows.length / pageSize)), [filteredRows.length, pageSize]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const totalBooks = useMemo(() => {
    return Object.values(bookCounts).reduce((sum, count) => sum + count, 0);
  }, [bookCounts]);

  return (
    <div>
      <div className="panel">
        <div className="panel-header" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '10px', 
              background: 'linear-gradient(135deg, #00a884 0%, #008069 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FiFolder size={20} color="#fff" />
            </div>
            <div>
              <div className="panel-title" style={{ marginBottom: '0.25rem' }}>Categories</div>
              <div style={{ fontSize: '0.875rem', color: '#8696a0' }}>
                {rows.length} {rows.length === 1 ? 'category' : 'categories'} • {totalBooks} total books
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <FiSearch 
              size={18} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: '#8696a0' 
              }} 
            />
            <input 
              className="input" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="Search categories..." 
              style={{ paddingLeft: '40px' }}
            />
          </div>
        </div>

        {/* Add Category Form */}
        <div style={{ 
          background: 'rgba(0, 168, 132, 0.05)', 
          border: '1px solid rgba(0, 168, 132, 0.2)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <FiPlus size={18} color="#00a884" />
            <span style={{ color: '#e9edef', fontWeight: '500' }}>Add New Category</span>
          </div>
          <div className="grid-2" style={{ marginBottom: '0.4rem' }}>
            <div>
              <label className="label" style={{ marginBottom: '0.3rem', fontSize: '0.85rem' }}>Name *</label>
              <input 
                className="input" 
                value={adding.name} 
                onChange={(e) => setAdding({ ...adding, name: e.target.value })} 
                placeholder="e.g., Science Fiction"
                style={{ fontSize: '0.9rem', padding: '0.4rem 0.6rem' }}
                onKeyPress={(e) => e.key === 'Enter' && add()}
              />
            </div>
            <div>
              <label className="label" style={{ marginBottom: '0.3rem', fontSize: '0.85rem' }}>Description</label>
              <input 
                className="input" 
                value={adding.description} 
                onChange={(e) => setAdding({ ...adding, description: e.target.value })} 
                placeholder="Optional description"
                style={{ fontSize: '0.9rem', padding: '0.4rem 0.6rem' }}
                onKeyPress={(e) => e.key === 'Enter' && add()}
              />
            </div>
          </div>
          <div className="actions">
            <button className="btn primary" onClick={add}>
              <FiPlus size={16} /> Add Category
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#8696a0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '3px' }} />
              <span>Loading categories...</span>
            </div>
          </div>
        ) : paginatedRows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#8696a0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <FiFolder size={32} color="#8696a0" />
              <span>{searchTerm ? 'No categories found matching your search' : 'No categories yet'}</span>
              {searchTerm && (
                <button 
                  className="btn" 
                  onClick={() => setSearchTerm('')}
                  style={{ marginTop: '0.5rem' }}
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            {paginatedRows.map(row => (
              <div 
                key={row.id}
                style={{
                  border: '1px solid rgba(134, 150, 160, 0.2)',
                  borderRadius: '12px',
                  padding: '1rem',
                  background: 'rgba(30, 30, 30, 0.5)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  cursor: editingId === row.id ? 'default' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (editingId !== row.id) {
                    e.currentTarget.style.borderColor = 'rgba(0, 168, 132, 0.4)';
                    e.currentTarget.style.background = 'rgba(0, 168, 132, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (editingId !== row.id) {
                    e.currentTarget.style.borderColor = 'rgba(134, 150, 160, 0.2)';
                    e.currentTarget.style.background = 'rgba(30, 30, 30, 0.5)';
                  }
                }}
              >
                {/* Header with Icon and Name */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '8px', 
                    background: 'rgba(0, 168, 132, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <FiFolder size={18} color="#00a884" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editingId === row.id ? (
                      <input 
                        className="input" 
                        value={draft.name} 
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })} 
                        autoFocus
                        style={{ fontSize: '0.9rem', padding: '0.35rem 0.5rem' }}
                      />
                    ) : (
                      <div style={{ fontWeight: '600', color: '#e9edef', fontSize: '1rem', wordBreak: 'break-word' }}>
                        {row.name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {editingId === row.id ? (
                  <input 
                    className="input" 
                    value={draft.description} 
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })} 
                    placeholder="Description"
                    style={{ fontSize: '0.85rem', padding: '0.35rem 0.5rem' }}
                  />
                ) : (
                  <div style={{ 
                    fontSize: '0.85rem', 
                    color: row.description ? '#a0aca8' : '#8696a0', 
                    fontStyle: row.description ? 'normal' : 'italic',
                    lineHeight: '1.4',
                    minHeight: '2.8rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    wordBreak: 'break-word'
                  }}>
                    {row.description || 'No description'}
                  </div>
                )}

                {/* Book Count Badge */}
                <div style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  background: bookCounts[row.id] > 0 ? 'rgba(0, 168, 132, 0.15)' : 'rgba(134, 150, 160, 0.1)',
                  color: bookCounts[row.id] > 0 ? '#00a884' : '#8696a0',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '18px',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  width: 'fit-content'
                }}>
                  <FiBookOpen size={13} />
                  {bookCounts[row.id] || 0} {bookCounts[row.id] === 1 ? 'book' : 'books'}
                </div>

                {/* Actions */}
                {editingId === row.id ? (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button className="btn primary" onClick={() => save(row.id)} style={{ fontSize: '0.8rem', flex: 1, padding: '0.5rem' }}>
                      Save
                    </button>
                    <button className="btn" onClick={cancel} style={{ fontSize: '0.8rem', flex: 1, padding: '0.5rem' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button 
                      className="btn" 
                      onClick={() => startEdit(row)}
                      style={{ padding: '0.4rem 0.8rem', flex: 1, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                      title="Edit category"
                    >
                      <FiEdit2 size={14} /> Edit
                    </button>
                    <button
                      className="btn"
                      onClick={() => handleDelete(row)}
                      style={{ padding: '0.4rem 0.8rem', flex: 1, fontSize: '0.8rem', color: '#ff4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                      title="Delete category"
                    >
                      <FiTrash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {filteredRows.length > 0 && (
          <div className="actions" style={{ marginTop: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
              className="btn" 
              disabled={page <= 1} 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{ opacity: page <= 1 ? 0.5 : 1 }}
            >
              Previo
            </button>
            <span style={{ color: '#cfd8dc', fontSize: '0.875rem' }}>
              Page {page} of {totalPages} ({filteredRows.length} {filteredRows.length === 1 ? 'category' : 'categories'})
            </span>
            <button 
              className="btn" 
              disabled={page >= totalPages} 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              style={{ opacity: page >= totalPages ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;