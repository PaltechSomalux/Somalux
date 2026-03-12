import React, { useState, useEffect } from 'react';
import { 
  FiSearch, FiPlus, FiX, FiEdit2, FiTrash2, 
  FiChevronDown, FiChevronUp, FiArrowLeft 
} from 'react-icons/fi';
import { FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';
import { IoMdNotifications } from 'react-icons/io';
import "./Students.css";

export const Students = ({ students: initialStudents = [] }) => {
  const [students, setStudents] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    status: 'active',
    major: '',
    enrollment: '',
    performance: 0
  });
  const [searchText, setSearchText] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [expandedStudent, setExpandedStudent] = useState(null);

  // Initialize students and handle window resize
  useEffect(() => {
    setStudents(initialStudents);
    
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initialStudents]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.email) {
      alert('Name and email are required fields');
      return;
    }

    if (!validateEmail(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    const student = currentStudent 
      ? { 
          ...currentStudent, 
          ...formData,
          performance: Math.min(100, Math.max(0, parseInt(formData.performance) || 0))
        }
      : {
          id: Date.now(),
          avatar: <FaUserGraduate />,
          courses: [],
          ...formData,
          performance: Math.min(100, Math.max(0, parseInt(formData.performance) || 0))
        };

    if (currentStudent) {
      setStudents(students.map(s => s.id === currentStudent.id ? student : s));
    } else {
      setStudents([student, ...students]);
    }

    setIsModalVisible(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      status: 'active',
      major: '',
      enrollment: '',
      performance: 0
    });
    setCurrentStudent(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      setStudents(students.filter(s => s.id !== id));
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedStudents = [...students].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const filteredStudents = sortedStudents.filter(student => {
    // Filter by search text only
    if (searchText && !(
      student.name.toLowerCase().includes(searchText.toLowerCase()) ||
      student.email.toLowerCase().includes(searchText.toLowerCase()) ||
      student.major.toLowerCase().includes(searchText.toLowerCase()) ||
      student.enrollment.toString().includes(searchText)
    )) {
      return false;
    }
    
    return true;
  });

  const getStatusTag = (status) => {
    const statusMap = {
      active: { class: 'status-active', icon: '✓', text: 'Active' },
      inactive: { class: 'status-inactive', icon: '⏱', text: 'Inactive' },
      suspended: { class: 'status-suspended', icon: '⚠', text: 'Suspended' }
    };
    const statusInfo = statusMap[status] || { class: '', icon: '', text: status };
    
    return (
      <span className={`status-tag ${statusInfo.class}`}>
        {statusInfo.icon && <span className="status-icon">{statusInfo.icon}</span>}
        {statusInfo.text}
      </span>
    );
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <FiChevronUp /> : <FiChevronDown />;
  };

  const toggleStudentExpand = (studentId) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  return (
    <div className="students-container">
      <div className="section-header">
        <h2>Student </h2>
        <div className="header-actions">
          <div className="search-box">
         
            <input
              type="text"
              placeholder="Search students . . ."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="search-input"
            />
          </div>
          <button 
            className="primary-btn"
            onClick={() => setIsModalVisible(true)}
          >
            <FiPlus /> {isMobileView ? 'Add' : 'Add Student'}
          </button>
        </div>
      </div>

      {isMobileView ? (
        <div className="students-list-mobile">
          {filteredStudents.length > 0 ? (
            filteredStudents.map(student => (
              <div 
                key={student.id} 
                className="student-card-mobile"
                onClick={() => toggleStudentExpand(student.id)}
              >
                <div className="student-card-header">
                  <div className="student-avatar">{student.avatar}</div>
                  <div className="student-info">
                    <h3>{student.name}</h3>
                    <p>{student.email}</p>
                    <div className="student-meta">
                      {getStatusTag(student.status)}
                      {student.major && <span className="major-tag">{student.major}</span>}
                    </div>
                  </div>
                  <div className="expand-icon">
                    {expandedStudent === student.id ? <FiChevronUp /> : <FiChevronDown />}
                  </div>
                </div>
                
                {expandedStudent === student.id && (
                  <div className="student-card-details">
                    <div className="performance-container">
                      <div className="performance-label">Performance:</div>
                      <div className="performance-bar-container">
                        <div 
                          className={`performance-bar ${
                            student.performance > 90 ? 'performance-high' : 
                            student.performance > 70 ? 'performance-medium' : 'performance-low'
                          }`}
                          style={{ width: `${student.performance}%` }}
                        ></div>
                        <span className="performance-text">{student.performance}%</span>
                      </div>
                    </div>
                    
                    <div className="student-details-row">
                      <span>Enrollment:</span>
                      <span>{student.enrollment || '-'}</span>
                    </div>
                    
                    <div className="student-actions">
                      <button 
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentStudent(student);
                          setFormData({
                            name: student.name,
                            email: student.email,
                            status: student.status,
                            major: student.major,
                            enrollment: student.enrollment,
                            performance: student.performance.toString()
                          });
                          setIsModalVisible(true);
                        }}
                      >
                        <FiEdit2 /> Edit
                      </button>
                      <button 
                        className="action-btn danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(student.id);
                        }}
                      >
                        <FiTrash2 /> Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="empty-state">
              {students.length === 0 
                ? 'No students available. Add your first student!' 
                : `No students found matching your search`}
            </div>
          )}
        </div>
      ) : (
        <div className="students-table">
          <table>
            <thead>
              <tr>
                <th onClick={() => requestSort('name')}>
                  <div className="table-header">
                    Name {getSortIndicator('name')}
                  </div>
                </th>
                <th onClick={() => requestSort('email')}>
                  <div className="table-header">
                    Email {getSortIndicator('email')}
                  </div>
                </th>
                <th onClick={() => requestSort('status')}>
                  <div className="table-header">
                    Status {getSortIndicator('status')}
                  </div>
                </th>
                <th onClick={() => requestSort('major')}>
                  <div className="table-header">
                    Major {getSortIndicator('major')}
                  </div>
                </th>
                <th onClick={() => requestSort('performance')}>
                  <div className="table-header">
                    Performance {getSortIndicator('performance')}
                  </div>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <tr key={student.id}>
                    <td>
                      <div className="student-name-cell">
                        <span className="student-avatar">{student.avatar}</span>
                        <div>
                          <strong>{student.name}</strong>
                          {student.performance > 90 && (
                            <span className="top-performer-icon" title="Top performer">⭐</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{student.email}</td>
                    <td>{getStatusTag(student.status)}</td>
                    <td>{student.major || '-'}</td>
                    <td>
                      <div className="performance-bar-container">
                        <div 
                          className={`performance-bar ${
                            student.performance > 90 ? 'performance-high' : 
                            student.performance > 70 ? 'performance-medium' : 'performance-low'
                          }`}
                          style={{ width: `${student.performance}%` }}
                        ></div>
                        <span className="performance-text">{student.performance}%</span>
                      </div>
                    </td>
                    <td>
                      <button 
                        className="action-btn"
                        onClick={() => {
                          setCurrentStudent(student);
                          setFormData({
                            name: student.name,
                            email: student.email,
                            status: student.status,
                            major: student.major,
                            enrollment: student.enrollment,
                            performance: student.performance.toString()
                          });
                          setIsModalVisible(true);
                        }}
                      >
                        <FiEdit2 /> Edit
                      </button>
                      <button 
                        className="action-btn danger"
                        onClick={() => handleDelete(student.id)}
                      >
                        <FiTrash2 /> Remove
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    {students.length === 0 
                      ? 'No students available. Add your first student!' 
                      : `No students found matching your search`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalVisible && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{currentStudent ? 'Edit Student' : 'Add Student'}</h3>
              <button 
                className="close-btn" 
                onClick={() => {
                  setIsModalVisible(false);
                  resetForm();
                }}
              >
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="John Doe"
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="john@example.com"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Major</label>
                  <select
                    name="major"
                    value={formData.major}
                    onChange={handleInputChange}
                  >
                    <option value="">Select major</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Biology">Biology</option>
                    <option value="Physics">Physics</option>
                    <option value="Business Administration">Business Administration</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Psychology">Psychology</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Enrollment Year</label>
                  <input
                    type="text"
                    name="enrollment"
                    value={formData.enrollment}
                    onChange={handleInputChange}
                    placeholder="e.g., 2022"
                  />
                </div>
                <div className="form-group">
                  <label>Performance (%)</label>
                  <input
                    type="number"
                    name="performance"
                    value={formData.performance}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                  />
                </div>
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
                disabled={!formData.name || !formData.email}
              >
                {currentStudent ? 'Update Student' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};