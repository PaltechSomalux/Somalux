import React, { useState, useEffect } from 'react';
import "./Docs.css";
import { Download } from "../../Pages/Books/Download";
import { 
  FiFile, FiFileText as FiDoc, FiEye, FiStar, 
  FiShare2, FiMoreVertical, FiDownload, FiX,
  FiUpload, FiPlus, FiSearch, FiFilter, FiTrash2
} from 'react-icons/fi';

// Helper function to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// LocalStorage helper functions
const loadDocuments = () => {
  const saved = localStorage.getItem('documents');
  return saved ? JSON.parse(saved) : [];
};

const saveDocuments = (docs) => {
  localStorage.setItem('documents', JSON.stringify(docs));
};

export const Docs = ({ classes = [] }) => {
  // Document Management State
  const [documents, setDocuments] = useState(loadDocuments());
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState('root');
  const [documentTags, setDocumentTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [documentPreview, setDocumentPreview] = useState(null);
  const [documentSort, setDocumentSort] = useState({ field: 'date', order: 'desc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    documentType: '',
    subject: '',
    class: '',
    dateRange: ''
  });
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareSettings, setShareSettings] = useState({
    documentId: '',
    access: 'class',
    recipients: []
  });

  // Persist documents to localStorage when they change
  useEffect(() => {
    saveDocuments(documents);
  }, [documents]);

  // File icon helper
  const getFileIcon = (type) => {
    if (!type) return <FiFile className="file-icon" />;
    
    switch(type.toLowerCase()) {
      case 'pdf': return <FiFile className="file-icon pdf" />;
      case 'doc':
      case 'docx': return <FiDoc className="file-icon doc" />;
      case 'xls':
      case 'xlsx': return <FiFile className="file-icon xls" />;
      case 'ppt':
      case 'pptx': return <FiFile className="file-icon ppt" />;
      default: return <FiFile className="file-icon" />;
    }
  };

  // Document Handlers
  const handleFileSelect = (e) => {
    if (e.target.files) {
      setSelectedFiles([...e.target.files]);
    }
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) return;

    const newDocs = selectedFiles.map((file, idx) => ({
      id: generateId(),
      name: file.name || `Document ${idx + 1}`,
      type: file.name ? file.name.split('.').pop() : 'file',
      subject: 'General',
      class: currentFolder || 'root',
      date: new Date().toISOString().split('T')[0],
      downloads: 0,
      starred: false,
      size: file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '0 MB',
      tags: [...documentTags]
    }));

    setDocuments([...documents, ...newDocs]);
    setSelectedFiles([]);
    setDocumentTags([]);
  };

  const addTag = () => {
    if (newTag.trim() && !documentTags.includes(newTag)) {
      setDocumentTags([...documentTags, newTag]);
      setNewTag('');
    }
  };

  const toggleStarDocument = (id) => {
    const updated = documents.map(doc => 
      doc.id === id ? { ...doc, starred: !doc.starred } : doc
    );
    setDocuments(updated);
  };

  const deleteDocument = (id) => {
    const updated = documents.filter(doc => doc.id !== id);
    setDocuments(updated);
  };

  const previewDocument = (doc) => {
    setDocumentPreview(doc);
  };

  const handleDownload = (doc) => {
    // Update download count
    const updated = documents.map(d => 
      d.id === doc.id ? { ...d, downloads: (d.downloads || 0) + 1 } : d
    );
    setDocuments(updated);
    
    // Simulate file download (in a real app, this would fetch the actual file)
    const blob = new Blob([`This would be the content of ${doc.name}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name || 'document';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sortDocuments = (field) => {
    if (documentSort.field === field) {
      setDocumentSort({ ...documentSort, order: documentSort.order === 'asc' ? 'desc' : 'asc' });
    } else {
      setDocumentSort({ field, order: 'asc' });
    }
  };

  // Filter and sort documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !filters.documentType || doc.type === filters.documentType;
    const matchesSubject = !filters.subject || doc.subject === filters.subject;
    const matchesClass = !filters.class || doc.class === filters.class;
    
    return matchesSearch && matchesType && matchesSubject && matchesClass;
  });

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    const field = documentSort.field;
    const order = documentSort.order === 'asc' ? 1 : -1;
    
    if (a[field] < b[field]) return -1 * order;
    if (a[field] > b[field]) return 1 * order;
    return 0;
  });

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2 className="tab-title">Notes</h2>
        <div className="tab-actions">
          <div className="search-bar">
            <FiSearch />
            <input 
              type="text" 
              placeholder="Search documents..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              className="icon-btn"
              onClick={() => setAdvancedSearchOpen(!advancedSearchOpen)}
              aria-label="Toggle filters"
            >
              <FiFilter />
            </button>
          </div>
          <label className="btn btn-primary">
            <FiUpload /> Upload
            <input 
              type="file" 
              multiple 
              onChange={handleFileSelect} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>
      </div>

      {advancedSearchOpen && (
        <div className="advanced-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>Document Type</label>
              <select
                value={filters.documentType}
                onChange={(e) => setFilters({ ...filters, documentType: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="pdf">PDF</option>
                <option value="docx">Word</option>
                <option value="xlsx">Excel</option>
                <option value="pptx">PowerPoint</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Class</label>
              <select
                value={filters.class}
                onChange={(e) => setFilters({ ...filters, class: e.target.value })}
              >
                <option value="">All Classes</option>
                {classes.map(cls => (
                  <option key={cls.id || cls} value={cls.name || cls}>{cls.name || cls}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="filter-actions">
            <button className="btn btn-outline" onClick={() => setFilters({
              documentType: '',
              subject: '',
              class: '',
              dateRange: ''
            })}>
              Clear All
            </button>
          </div>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="upload-panel">
          <div className="panel-header">
            <h4>Upload Files ({selectedFiles.length})</h4>
            <button 
              className="icon-btn"
              onClick={() => setSelectedFiles([])}
              aria-label="Cancel upload"
            >
              <FiX />
            </button>
          </div>
          <div className="file-list">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="file-item">
                <div className="file-icon">
                  {getFileIcon(file.name?.split('.').pop())}
                </div>
                <div className="file-info">
                  <p>{file.name || `File ${idx + 1}`}</p>
                  <small>{file.size ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : '0 MB'}</small>
                </div>
                <button 
                  className="icon-btn"
                  onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))}
                  aria-label="Remove file"
                >
                  <FiX />
                </button>
              </div>
            ))}
          </div>
          <div className="upload-options">
            <div className="form-group">
              <label>Folder</label>
              <select
                value={currentFolder}
                onChange={(e) => setCurrentFolder(e.target.value)}
              >
                <option value="root">Root</option>
                {classes.map(cls => (
                  <option key={cls.id || cls} value={cls.name || cls}>{cls.name || cls}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Tags</label>
              <div className="tag-input">
                <input 
                  type="text" 
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  placeholder="Add tags..."
                />
                <button 
                  className="icon-btn"
                  onClick={addTag}
                  aria-label="Add tag"
                >
                  <FiPlus />
                </button>
              </div>
              <div className="tags-container">
                {documentTags.map((tag, idx) => (
                  <span key={idx} className="tag">
                    {tag}
                    <button 
                      className="icon-btn"
                      onClick={() => setDocumentTags(documentTags.filter(t => t !== tag))}
                      aria-label="Remove tag"
                    >
                      <FiX size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="upload-actions">
            <button 
              className="btn btn-primary"
              onClick={handleUpload}
            >
              Upload Documents
            </button>
          </div>
        </div>
      )}

      <div className="documents-table">
        <div className="table-header">
          <div 
            className={`header-cell ${documentSort.field === 'name' ? 'sorted' : ''}`}
            onClick={() => sortDocuments('name')}
          >
            Name {documentSort.field === 'name' && (documentSort.order === 'asc' ? '↑' : '↓')}
          </div>
          <div 
            className={`header-cell ${documentSort.field === 'type' ? 'sorted' : ''}`}
            onClick={() => sortDocuments('type')}
          >
            Type {documentSort.field === 'type' && (documentSort.order === 'asc' ? '↑' : '↓')}
          </div>
          <div 
            className={`header-cell ${documentSort.field === 'class' ? 'sorted' : ''}`}
            onClick={() => sortDocuments('class')}
          >
            Class {documentSort.field === 'class' && (documentSort.order === 'asc' ? '↑' : '↓')}
          </div>
          <div 
            className={`header-cell ${documentSort.field === 'date' ? 'sorted' : ''}`}
            onClick={() => sortDocuments('date')}
          >
            Date {documentSort.field === 'date' && (documentSort.order === 'asc' ? '↑' : '↓')}
          </div>
          <div className="header-cell actions">Actions</div>
        </div>
        <div className="table-body">
          {sortedDocuments.length > 0 ? (
            sortedDocuments.map(doc => (
              <div key={doc.id} className="table-row">
                <div className="table-cell name">
                  <div className="document-icon">
                    {getFileIcon(doc.type)}
                  </div>
                  <span>{doc.name || 'Untitled Document'}</span>
                  {doc.starred && <FiStar className="star" />}
                </div>
                <div className="table-cell type">
                  <span className={`doc-type ${doc.type || 'file'}`}>
                    {(doc.type || 'file').toUpperCase()}
                  </span>
                </div>
                <div className="table-cell class">{doc.class || '-'}</div>
                <div className="table-cell date">{doc.date || '-'}</div>
                <div className="table-cell actions">
                  <div className="action-buttons">
                    <button 
                      className="icon-btn"
                      onClick={() => previewDocument(doc)}
                      aria-label="Preview document"
                    >
                      <FiEye />
                    </button>
                    <button 
                      className="icon-btn"
                      onClick={() => handleDownload(doc)}
                      aria-label="Download document"
                    >
                      <FiDownload />
                    </button>
                    <button 
                      className="icon-btn"
                      onClick={() => toggleStarDocument(doc.id)}
                      aria-label={doc.starred ? "Unstar document" : "Star document"}
                    >
                      {doc.starred ? <FiStar className="star-filled" /> : <FiStar />}
                    </button>
                    <button 
                      className="icon-btn danger"
                      onClick={() => deleteDocument(doc.id)}
                      aria-label="Delete document"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No documents found</p>
              {searchQuery || Object.values(filters).some(Boolean) ? (
                <button 
                  className="btn btn-outline"
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({
                      documentType: '',
                      subject: '',
                      class: '',
                      dateRange: ''
                    });
                  }}
                >
                  Clear search/filters
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Document Preview Modal */}
      {documentPreview && (
        <div className="modal-overlay">
          <div className="modal document-preview">
            <div className="modal-header">
              <h3>{documentPreview.name || 'Document Preview'}</h3>
              <button 
                className="icon-btn"
                onClick={() => setDocumentPreview(null)}
                aria-label="Close document preview"
              >
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="document-info">
                <div className="info-grid">
                  <div className="info-item">
                    <label>Type:</label>
                    <span className={`doc-type ${documentPreview.type || 'file'}`}>
                      {(documentPreview.type || 'file').toUpperCase()}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Class:</label>
                    <span>{documentPreview.class || '-'}</span>
                  </div>
                  <div className="info-item">
                    <label>Uploaded:</label>
                    <span>{documentPreview.date || '-'}</span>
                  </div>
                  <div className="info-item">
                    <label>Size:</label>
                    <span>{documentPreview.size || '0 MB'}</span>
                  </div>
                  <div className="info-item">
                    <label>Downloads:</label>
                    <span>{documentPreview.downloads || 0}</span>
                  </div>
                </div>
                {documentPreview.tags?.length > 0 && (
                  <div className="info-item tags">
                    <label>Tags:</label>
                    <div className="tags-container">
                      {documentPreview.tags.map((tag, idx) => (
                        <span key={idx} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="document-viewer">
                <div className="viewer-placeholder">
                  {getFileIcon(documentPreview.type)}
                  <p>Document preview would appear here</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-primary"
                onClick={() => handleDownload(documentPreview)}
              >
                <FiDownload /> Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};