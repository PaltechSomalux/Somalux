import React, { useEffect, useState, useMemo } from 'react';
import { createCategory, deleteCategory, fetchCategories, updateCategory } from '../api';
import { useAdminUI } from '../AdminUIContext';
import { supabase } from '../../supabaseClient';
import { FiFolder, FiEdit2, FiTrash2, FiPlus, FiBookOpen, FiSearch, FiLoader } from 'react-icons/fi';
import { autoFillCategoryDescription } from './shared/universityPrefillApi';

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
  const [autoFillingAdd, setAutoFillingAdd] = useState(false);
  const [autoFillingEdit, setAutoFillingEdit] = useState(false);

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
  
  const handleAutoFillDescription = async (categoryName, isEditMode = false) => {
    if (isEditMode) {
      setAutoFillingEdit(true);
    } else {
      setAutoFillingAdd(true);
    }

    try {
      const result = await autoFillCategoryDescription(categoryName);
      
      if (result && result.description) {
        if (isEditMode) {
          setDraft({ ...draft, description: result.description });
        } else {
          setAdding({ ...adding, description: result.description });
        }
        showToast({ type: 'success', message: `Description auto-filled for ${categoryName}!` });
      } else {
        showToast({ type: 'info', message: `No description found for "${categoryName}". Please enter manually.` });
      }
    } catch (error) {
      console.error('Error auto-filling description:', error);
      showToast({ type: 'error', message: 'Failed to auto-fill description. Please try again.' });
    } finally {
      if (isEditMode) {
        setAutoFillingEdit(false);
      } else {
        setAutoFillingAdd(false);
      }
    }
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
              <div style={{ position: 'relative' }}>
                <input 
                  className="input" 
                  value={adding.description} 
                  onChange={(e) => setAdding({ ...adding, description: e.target.value })} 
                  placeholder="Optional description"
                  style={{ fontSize: '0.9rem', padding: '0.4rem 0.6rem', paddingRight: '75px' }}
                  onKeyPress={(e) => e.key === 'Enter' && add()}
                />
                <button 
                  onClick={() => handleAutoFillDescription(adding.name, false)}
                  disabled={!adding.name || autoFillingAdd}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#00a884',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: adding.name && !autoFillingAdd ? 'pointer' : 'not-allowed',
                    fontSize: '11px',
                    opacity: adding.name && !autoFillingAdd ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    whiteSpace: 'nowrap'
                  }}
                  title="Auto-fill description"
                >
                  {autoFillingAdd ? <><FiLoader className="spin" style={{ fontSize: '12px' }} /> Fill</> : <>Fill</>}
                </button>
              </div>
            </div>
          </div>
          <div className="actions">
            <button className="btn primary" onClick={add}>
              <FiPlus size={16} /> Add Category
            </button>
          </div>
        </div>

        {/* Categories Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Category</th>
                <th style={{ width: '40%' }}>Description</th>
                <th style={{ width: '15%', textAlign: 'center' }}>Books</th>
                <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ color: '#8696a0', textAlign: 'center', padding: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '3px' }} />
                      <span>Loading categories...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ color: '#8696a0', textAlign: 'center', padding: '2rem' }}>
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
                  </td>
                </tr>
              ) : paginatedRows.map(row => (
                <tr key={row.id}>
                  <td>
                    {editingId === row.id ? (
                      <input 
                        className="input" 
                        value={draft.name} 
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })} 
                        autoFocus
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '8px', 
                          background: 'rgba(0, 168, 132, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <FiFolder size={16} color="#00a884" />
                        </div>
                        <span style={{ fontWeight: '500', color: '#e9edef' }}>{row.name}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    {editingId === row.id ? (
                      <div style={{ position: 'relative' }}>
                        <input 
                          className="input" 
                          value={draft.description} 
                          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                          style={{ paddingRight: '75px' }}
                        />
                        <button 
                          onClick={() => handleAutoFillDescription(draft.name, true)}
                          disabled={!draft.name || autoFillingEdit}
                          style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: '#00a884',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: draft.name && !autoFillingEdit ? 'pointer' : 'not-allowed',
                            fontSize: '11px',
                            opacity: draft.name && !autoFillingEdit ? 1 : 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            whiteSpace: 'nowrap'
                          }}
                          title="Auto-fill description"
                        >
                          {autoFillingEdit ? <><FiLoader className="spin" style={{ fontSize: '12px' }} /> Fill</> : <>Fill</>}
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: row.description ? '#cfd8dc' : '#8696a0', fontStyle: row.description ? 'normal' : 'italic' }}>
                        {row.description || 'No description'}
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      background: bookCounts[row.id] > 0 ? 'rgba(0, 168, 132, 0.1)' : 'rgba(134, 150, 160, 0.1)',
                      color: bookCounts[row.id] > 0 ? '#00a884' : '#8696a0',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      <FiBookOpen size={14} />
                      {bookCounts[row.id] || 0}
                    </div>
                  </td>
                  <td>
                    {editingId === row.id ? (
                      <div className="actions" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn primary" onClick={() => save(row.id)} style={{ fontSize: '0.875rem' }}>
                          Save
                        </button>
                        <button className="btn" onClick={cancel} style={{ fontSize: '0.875rem' }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="actions" style={{ justifyContent: 'flex-end' }}>
                        <button 
                          className="btn" 
                          onClick={() => startEdit(row)}
                          style={{ padding: '0.5rem', minWidth: 'auto' }}
                          title="Edit category"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          className="btn"
                          onClick={() => handleDelete(row)}
                          style={{ padding: '0.5rem', minWidth: 'auto', color: '#ff4444' }}
                          title="Delete category"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredRows.length > 0 && (
          <div className="actions" style={{ marginTop: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
              className="btn" 
              disabled={page <= 1} 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{ opacity: page <= 1 ? 0.5 : 1 }}
            >
              Previous
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