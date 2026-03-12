import React, { useState, useEffect } from 'react';
import moment from 'moment';
import "./Assignments.css";
import { 
  FiFile, FiFileText as FiDoc, FiDownload, FiUpload, 
  FiX, FiPlus, FiEye, FiTrash2, FiSearch, FiChevronRight
} from 'react-icons/fi';

// Constants
const STORAGE_VERSION = '1.0';
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB

// Helper function to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

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

// Storage helper functions
const loadFromLocalStorage = (key, defaultValue) => {
  try {
    const storedValue = localStorage.getItem(key);
    if (!storedValue) return defaultValue;
    
    const parsed = JSON.parse(storedValue);
    
    if (parsed.version !== STORAGE_VERSION) {
      console.warn('Storage version mismatch, consider data migration');
      return defaultValue;
    }
    
    return parsed.data || defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

const saveToLocalStorage = (key, value) => {
  try {
    const storageItem = {
      version: STORAGE_VERSION,
      data: value,
      lastUpdated: new Date().toISOString()
    };
    
    const stringValue = JSON.stringify(storageItem);
    
    if (stringValue.length > MAX_STORAGE_SIZE) {
      console.warn('Data too large for localStorage, consider alternative storage');
      return false;
    }
    
    localStorage.setItem(key, stringValue);
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

export const Assignments = ({ assignments: initialAssignments = [] }) => {
  const [assignments, setAssignments] = useState(
    loadFromLocalStorage('assignments', initialAssignments)
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    course: '',
    dueDate: moment().add(7, 'days').format('YYYY-MM-DD'),
    description: '',
    status: 'draft',
    attachments: []
  });
  const [searchText, setSearchText] = useState('');
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [documentPreview, setDocumentPreview] = useState(null);

  // Persist assignments to localStorage whenever they change
  useEffect(() => {
    saveToLocalStorage('assignments', assignments);
  }, [assignments]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      setSelectedFiles([...e.target.files]);
    }
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) return;

    const newAttachments = selectedFiles.map((file, idx) => ({
      id: generateId(),
      name: file.name || `Attachment ${idx + 1}`,
      type: file.name ? file.name.split('.').pop() : 'file',
      size: file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '0 MB',
      uploadDate: new Date().toISOString(),
      fileData: URL.createObjectURL(file)
    }));

    setFormData({
      ...formData,
      attachments: [...formData.attachments, ...newAttachments]
    });
    setSelectedFiles([]);
  };

  const removeAttachment = (id) => {
    const attachment = formData.attachments.find(file => file.id === id);
    if (attachment && attachment.fileData) {
      URL.revokeObjectURL(attachment.fileData);
    }
    
    setFormData({
      ...formData,
      attachments: formData.attachments.filter(file => file.id !== id)
    });
  };

  const previewDocument = (doc) => {
    setDocumentPreview(doc);
  };

  const handleDownload = (doc) => {
    if (doc.fileData) {
      const a = document.createElement('a');
      a.href = doc.fileData;
      a.download = doc.name || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) return;

    const assignment = currentAssignment 
      ? {
          ...currentAssignment,
          ...formData,
          submissions: currentAssignment.submissions,
          students: currentAssignment.students,
          graded: currentAssignment.graded
        }
      : {
          id: generateId(),
          title: formData.title,
          course: formData.course,
          dueDate: formData.dueDate,
          description: formData.description,
          status: formData.status,
          attachments: formData.attachments,
          submissions: 0,
          students: 30,
          graded: 0,
          createdAt: new Date().toISOString()
        };

    if (currentAssignment) {
      setAssignments(assignments.map(a => 
        a.id === currentAssignment.id ? assignment : a
      ));
    } else {
      setAssignments([assignment, ...assignments]);
    }

    setIsModalVisible(false);
    resetForm();
  };

  const resetForm = () => {
    formData.attachments.forEach(attachment => {
      if (attachment.fileData) {
        URL.revokeObjectURL(attachment.fileData);
      }
    });
    
    setFormData({
      title: '',
      course: '',
      dueDate: moment().add(7, 'days').format('YYYY-MM-DD'),
      description: '',
      status: 'draft',
      attachments: []
    });
    setCurrentAssignment(null);
    setSelectedFiles([]);
  };

  const handleEdit = (assignment) => {
    setCurrentAssignment(assignment);
    setFormData({
      title: assignment.title,
      course: assignment.course,
      dueDate: assignment.dueDate,
      description: assignment.description || '',
      status: assignment.status,
      attachments: assignment.attachments || []
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      const assignment = assignments.find(a => a.id === id);
      if (assignment && assignment.attachments) {
        assignment.attachments.forEach(attachment => {
          if (attachment.fileData) {
            URL.revokeObjectURL(attachment.fileData);
          }
        });
      }
      
      setAssignments(assignments.filter(a => a.id !== id));
    }
  };

  const toggleStatus = (id) => {
    setAssignments(assignments.map(a => 
      a.id === id 
        ? { 
            ...a, 
            status: a.status === 'active' ? 'draft' : 'active' 
          } 
        : a
    ));
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      (assignment.title && assignment.title.toLowerCase().includes(searchLower)) ||
      (assignment.course && assignment.course.toLowerCase().includes(searchLower)) ||
      (assignment.status && assignment.status.toLowerCase().includes(searchLower))
    );
  });

  const getStatusTag = (status) => {
    const statusClasses = {
      active: 'status-active',
      completed: 'status-completed',
      draft: 'status-draft',
      overdue: 'status-overdue'
    };

    const statusText = {
      active: 'Active',
      completed: 'Completed',
      draft: 'Draft',
      overdue: 'Overdue'
    };

    return (
      <span className={`status-tag ${statusClasses[status] || ''}`}>
        {statusText[status] || status}
      </span>
    );
  };

  const renderAssignmentCard = (assignment) => (
    <div key={assignment.id} className="assignment-card">
      <div className="card-header">
        <div className="assignment-title" onClick={() => handleEdit(assignment)}>
          {assignment.title}
        </div>
        <div className="assignment-meta">
          <span className="course-badge">{assignment.course}</span>
          <span className={`due-date ${moment(assignment.dueDate).isBefore(moment()) ? 'overdue' : ''}`}>
            Due: {moment(assignment.dueDate).format('MMM D')}
          </span>
          {getStatusTag(assignment.status)}
        </div>
      </div>
      
      {assignment.description && (
        <div className="assignment-description">
          {assignment.description}
        </div>
      )}
      
      {assignment.attachments?.length > 0 && (
        <div className="assignment-attachments">
          {assignment.attachments.slice(0, 2).map(file => (
            <div key={file.id} className="attachment-item">
              <div className="file-icon">
                {getFileIcon(file.type)}
              </div>
              <span className="file-name">{file.name}</span>
              <div className="file-actions">
                <button 
                  className="icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    previewDocument(file);
                  }}
                  aria-label="Preview file"
                >
                  <FiEye size={14} />
                </button>
                <button 
                  className="icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(file);
                  }}
                  aria-label="Download file"
                >
                  <FiDownload size={14} />
                </button>
              </div>
            </div>
          ))}
          {assignment.attachments.length > 2 && (
            <div className="more-files">
              +{assignment.attachments.length - 2} more files
            </div>
          )}
        </div>
      )}
      
      <div className="submission-progress">
        <div className="progress-text">
          Submissions: {assignment.submissions}/{assignment.students}
        </div>
        <div 
          className="progress-bar" 
          style={{ 
            width: `${assignment.students > 0 
              ? Math.min(100, (assignment.submissions / assignment.students) * 100) 
              : 0}%` 
          }}
        ></div>
      </div>
      
      <div className="card-actions">
        <button 
          className="action-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(assignment);
          }}
        >
          Edit
        </button>
        <button 
          className="action-btn"
          onClick={(e) => {
            e.stopPropagation();
            toggleStatus(assignment.id);
          }}
        >
          {assignment.status === 'active' ? 'Draft' : 'Activate'}
        </button>
        <button 
          className="action-btn danger"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(assignment.id);
          }}
        >
          Delete
        </button>
        <button 
          className="action-btn view"
          onClick={() => handleEdit(assignment)}
        >
          View <FiChevronRight />
        </button>
      </div>
    </div>
  );

  const renderDesktopRow = (assignment) => (
    <tr key={assignment.id} className="assignment-row">
      <td>
        <div className="assignment-title">{assignment.title}</div>
        <div className="assignment-description">{assignment.description}</div>
        {assignment.attachments?.length > 0 && (
          <div className="assignment-attachments">
            {assignment.attachments.map(file => (
              <div key={file.id} className="attachment-item">
                <div className="file-icon">
                  {getFileIcon(file.type)}
                </div>
                <span className="file-name">{file.name}</span>
                <div className="file-actions">
                  <button 
                    className="icon-btn"
                    onClick={() => previewDocument(file)}
                    aria-label="Preview file"
                  >
                    <FiEye size={14} />
                  </button>
                  <button 
                    className="icon-btn"
                    onClick={() => handleDownload(file)}
                    aria-label="Download file"
                  >
                    <FiDownload size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </td>
      <td>{assignment.course}</td>
      <td className={moment(assignment.dueDate).isBefore(moment()) ? 'text-danger' : ''}>
        {moment(assignment.dueDate).format('MMM D, YYYY')}
      </td>
      <td>
        <div className="submission-progress">
          <div 
            className="progress-bar" 
            style={{ 
              width: `${assignment.students > 0 
                ? Math.min(100, (assignment.submissions / assignment.students) * 100) 
                : 0}%` 
            }}
          ></div>
          <span>{assignment.graded}/{assignment.submissions} of {assignment.students}</span>
        </div>
      </td>
      <td>{getStatusTag(assignment.status)}</td>
      <td>
        <div className="assignment-actions">
          <button 
            className="action-btn"
            onClick={() => handleEdit(assignment)}
          >
            Edit
          </button>
          <button 
            className="action-btn"
            onClick={() => toggleStatus(assignment.id)}
          >
            {assignment.status === 'active' ? 'Set to Draft' : 'Activate'}
          </button>
          <button 
            className="action-btn danger"
            onClick={() => handleDelete(assignment.id)}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );

  const renderModal = () => (
    <div className="modal-overlay" onClick={() => {
      setIsModalVisible(false);
      resetForm();
    }}>
      <div className="modal assignment-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{currentAssignment ? 'Edit Assignment' : 'Create Assignment'}</h3>
          <button 
            className="close-btn" 
            onClick={() => {
              setIsModalVisible(false);
              resetForm();
            }}
            aria-label="Close modal"
          >
            <FiX />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Assignment title"
              required
            />
          </div>
          <div className="form-group">
            <label>Course *</label>
            <input
              type="text"
              name="course"
              value={formData.course}
              onChange={handleInputChange}
              placeholder="Course code"
              required
            />
          </div>
          <div className="form-group">
            <label>Due Date *</label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleInputChange}
              min={moment().format('YYYY-MM-DD')}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Assignment description"
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>Status *</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              required
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Attachments</label>
            {selectedFiles.length > 0 ? (
              <div className="upload-panel">
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
                <button 
                  className="btn btn-primary"
                  onClick={handleUpload}
                >
                  Add to Assignment
                </button>
              </div>
            ) : (
              <label className="btn btn-outline">
                <FiUpload /> Select Files
                <input 
                  type="file" 
                  multiple 
                  onChange={handleFileSelect} 
                  style={{ display: 'none' }} 
                />
              </label>
            )}
            
            {formData.attachments.length > 0 && (
              <div className="attachments-list">
                <h4>Current Attachments</h4>
                {formData.attachments.map(file => (
                  <div key={file.id} className="attachment-item">
                    <div className="file-icon">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="file-info">
                      <p>{file.name}</p>
                      <small>{file.size} • {moment(file.uploadDate).format('MMM D')}</small>
                    </div>
                    <button 
                      className="icon-btn danger"
                      onClick={() => removeAttachment(file.id)}
                      aria-label="Remove attachment"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button 
            className="secondary-btn"
            onClick={() => {
              setIsModalVisible(false);
              resetForm();
            }}
          >
            Cancel
          </button>
          <button 
            className="primary-btn"
            onClick={handleSubmit}
            disabled={!formData.title.trim() || !formData.course.trim()}
          >
            {currentAssignment ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderPreviewModal = () => (
    <div className="modal-overlay" onClick={() => setDocumentPreview(null)}>
      <div className="modal document-preview" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{documentPreview?.name || 'Document Preview'}</h3>
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
                <span className={`doc-type ${documentPreview?.type || 'file'}`}>
                  {(documentPreview?.type || 'file').toUpperCase()}
                </span>
              </div>
              <div className="info-item">
                <label>Size:</label>
                <span>{documentPreview?.size || '0 MB'}</span>
              </div>
            </div>
          </div>
          <div className="document-viewer">
            {documentPreview?.fileData ? (
              <iframe 
                src={documentPreview.fileData} 
                title={documentPreview.name}
                className="document-iframe"
              />
            ) : (
              <div className="viewer-placeholder">
                {getFileIcon(documentPreview?.type)}
                <p>Document preview would appear here</p>
              </div>
            )}
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
  );

  const renderMobileView = () => (
    <div className="assignments-mobile-view">
      <div className="mobile-search-bar">
        <div className="search-input-container">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <button 
          className="add-btn"
          onClick={() => setIsModalVisible(true)}
          aria-label="Add assignment"
        >
          <FiPlus />
        </button>
      </div>
      
      <div className="assignments-cards-container">
        {filteredAssignments.length > 0 ? (
          filteredAssignments
            .sort((a, b) => moment(a.dueDate) - moment(b.dueDate))
            .map(renderAssignmentCard)
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>No assignments found {searchText && `matching "${searchText}"`}</p>
            <button 
              className="primary-btn"
              onClick={() => setIsModalVisible(true)}
            >
              <FiPlus /> Create Assignment
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderDesktopView = () => (
    <div className="assignments-desktop-view">
      <div className="section-header">
        <h2>Assignments</h2>
        <div className="header-actions">
          <div className="search-input-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <button 
            className="primary-btn"
            onClick={() => setIsModalVisible(true)}
          >
            <FiPlus /> Create Assignment
          </button>
        </div>
      </div>

      <div className="assignments-table-container">
        <table className="assignments-table">
          <thead>
            <tr>
              <th>Title & Attachments</th>
              <th>Course</th>
              <th>Due Date</th>
              <th>Submissions</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignments.length > 0 ? (
              filteredAssignments
                .sort((a, b) => moment(a.dueDate) - moment(b.dueDate))
                .map(renderDesktopRow)
            ) : (
              <tr>
                <td colSpan={6} className="empty-state">
                  <div className="empty-icon">📝</div>
                  <p>No assignments found {searchText && `matching "${searchText}"`}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      {isMobileView ? renderMobileView() : renderDesktopView()}

      {isModalVisible && renderModal()}
      {documentPreview && renderPreviewModal()}
    </>
  );
};