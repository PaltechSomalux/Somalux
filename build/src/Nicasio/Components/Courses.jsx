import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiChevronRight, FiX, FiArrowLeft } from 'react-icons/fi';
import { FaChalkboardTeacher, FaUserGraduate } from 'react-icons/fa';
import PropTypes from 'prop-types';
import "./Courses.css";

export const Courses = ({ 
  initialCourses = [], 
  currentUser = { id: 'user-1', name: 'Professor', role: 'instructor' },
  theme = 'dark'
}) => {
  const [courses, setCourses] = useState(initialCourses);
  const [activeCourse, setActiveCourse] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    instructor: '',
    semester: '',
    description: ''
  });
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setCourses(initialCourses);
  }, [initialCourses]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.code || !formData.name) {
      alert('Course code and name are required');
      return;
    }

    const updatedCourse = {
      ...formData,
      id: activeCourse?.id || Date.now(),
      students: activeCourse?.students || 0,
      materials: activeCourse?.materials || 0
    };

    if (activeCourse) {
      setCourses(courses.map(c => c.id === activeCourse.id ? updatedCourse : c));
    } else {
      setCourses([updatedCourse, ...courses]);
    }

    closeModal();
  };

  const openEditModal = (course) => {
    setActiveCourse(course);
    setFormData({
      code: course.code,
      name: course.name,
      instructor: course.instructor,
      semester: course.semester,
      description: course.description || ''
    });
    setIsModalVisible(true);
  };

  const openAddModal = () => {
    setActiveCourse(null);
    setFormData({
      code: '',
      name: '',
      instructor: '',
      semester: '',
      description: ''
    });
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setActiveCourse(null);
    setFormData({
      code: '',
      name: '',
      instructor: '',
      semester: '',
      description: ''
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      setCourses(courses.filter(c => c.id !== id));
      if (activeCourse && activeCourse.id === id) {
        setActiveCourse(null);
      }
    }
  };

  const filteredCourses = courses.filter(course => {
    if (!searchText.trim()) return true;
    const searchLower = searchText.toLowerCase();
    return (
      course.code.toLowerCase().includes(searchLower) ||
      course.name.toLowerCase().includes(searchLower) ||
      (course.instructor && course.instructor.toLowerCase().includes(searchLower))
    );
  });

  const renderCourseCard = (course) => (
    <div 
      className={`course-card ${activeCourse?.id === course.id ? 'active' : ''}`}
      key={course.id}
      onClick={() => setActiveCourse(course)}
    >
      <div className="course-card-header">
        <span className="course-code">{course.code}</span>
        {course.instructor && (
          <span className="course-instructor">
            <FaChalkboardTeacher /> {course.instructor}
          </span>
        )}
      </div>
      
      <div className="course-card-body">
        <h3 className="course-name" onClick={() => navigate(`/courses/${course.id}`)}>
          {course.name}
        </h3>
        
        {course.semester && (
          <div className="course-semester">
            {course.semester}
          </div>
        )}
        
        {course.description && (
          <div className="course-description">
            {course.description.length > 100 
              ? `${course.description.substring(0, 100)}...` 
              : course.description}
          </div>
        )}
      </div>
      
      <div className="course-card-footer">
        <div className="course-stats">
          <span><FaUserGraduate /> {course.students || 0} students</span>
          <span>📚 {course.materials || 0} materials</span>
        </div>
        
        <div className="course-actions">
          <button 
            className="icon-btn edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(course);
            }}
            aria-label="Edit course"
          >
            <FiEdit2 />
          </button>
          <button 
            className="icon-btn danger-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(course.id);
            }}
            aria-label="Delete course"
          >
            <FiTrash2 />
          </button>
          <button 
            className="icon-btn view-btn"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/courses/${course.id}`);
            }}
            aria-label="View course"
          >
            <FiChevronRight />
          </button>
        </div>
      </div>
    </div>
  );

  const renderCoursesList = () => (
    <div className={`courses-list ${theme}-theme`}>
      <div className="section-header">
        <h2>Courses</h2>
        <div className="header-actions">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <button className="search-btn"><FiSearch /></button>
          </div>
          {currentUser.role === 'instructor' && (
            <button 
              className="primary-btn"
              onClick={openAddModal}
            >
              <FiPlus /> New Course
            </button>
          )}
        </div>
      </div>

      <div className="courses-grid">
        {filteredCourses.length > 0 ? (
          filteredCourses.map(renderCourseCard)
        ) : (
          <div className="empty-state">
            <p>No courses found {searchText && `matching "${searchText}"`}</p>
            {!searchText && currentUser.role === 'instructor' && (
              <button 
                className="primary-btn"
                onClick={openAddModal}
              >
                <FiPlus /> Add Course
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderCourseDetail = () => {
    if (!activeCourse) return null;
    
    return (
      <div className={`course-detail ${theme}-theme`}>
        <div className="course-header">
          <button 
            className="back-button"
            onClick={() => setActiveCourse(null)}
          >
            <FiArrowLeft /> Back to Courses
          </button>
          
          <div className="course-title">
            <h2>{activeCourse.name}</h2>
            <div className="course-code">{activeCourse.code}</div>
          </div>
          
          <div className="course-meta">
            {activeCourse.instructor && (
              <span className="instructor">
                <FaChalkboardTeacher /> {activeCourse.instructor}
              </span>
            )}
            {activeCourse.semester && (
              <span className="semester">{activeCourse.semester}</span>
            )}
            <span className="stats">
              <FaUserGraduate /> {activeCourse.students || 0} students
            </span>
          </div>
        </div>
        
        <div className="course-content">
          <h3>Description</h3>
          <p>{activeCourse.description || 'No description provided.'}</p>
          
          <div className="course-sections">
            <div className="section">
              <h3>Materials ({activeCourse.materials || 0})</h3>
              <div className="materials-list">
                {/* Materials would be rendered here */}
              </div>
            </div>
            
            <div className="section">
              <h3>Students</h3>
              <div className="students-list">
                {/* Students would be rendered here */}
              </div>
            </div>
          </div>
        </div>
        
        {currentUser.role === 'instructor' && (
          <div className="course-actions">
            <button 
              className="secondary-btn"
              onClick={() => openEditModal(activeCourse)}
            >
              <FiEdit2 /> Edit Course
            </button>
            <button 
              className="danger-btn"
              onClick={() => handleDelete(activeCourse.id)}
            >
              <FiTrash2 /> Delete Course
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Add/Edit Course Modal */}
      {isModalVisible && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{activeCourse ? 'Edit Course' : 'Add New Course'}</h3>
              <button 
                className="close-button"
                onClick={closeModal}
              >
                <FiX />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Course Code *</label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., CS101"
                  />
                </div>
                
                <div className="form-group">
                  <label>Course Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Introduction to Computer Science"
                  />
                </div>
                
                <div className="form-group">
                  <label>Instructor</label>
                  <input
                    type="text"
                    name="instructor"
                    value={formData.instructor}
                    onChange={handleInputChange}
                    placeholder="e.g., Dr. Smith"
                  />
                </div>
                
                <div className="form-group">
                  <label>Semester</label>
                  <input
                    type="text"
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    placeholder="e.g., Fall 2023"
                  />
                </div>
                
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Course description..."
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={!formData.code.trim() || !formData.name.trim()}
                >
                  {activeCourse ? 'Update Course' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {activeCourse ? renderCourseDetail() : renderCoursesList()}
    </>
  );
};

Courses.propTypes = {
  initialCourses: PropTypes.array,
  currentUser: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    role: PropTypes.oneOf(['instructor', 'student']),
    avatar: PropTypes.string
  }),
  theme: PropTypes.oneOf(['light', 'dark'])
};

Courses.defaultProps = {
  initialCourses: [],
  currentUser: { id: 'user-1', name: 'Professor', role: 'instructor' },
  theme: 'dark'
};