import React, { useState, useEffect, useMemo } from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';

export const Dashboard = ({
  stats,
  announcements = [],
  assignments = [],
  submissions = [],
  lectures = [],
  students = [],
  courses = [],
  onQuickAction
}) => {
  const [calendarView, setCalendarView] = useState('week');
  const [selectedDate, setSelectedDate] = useState(moment());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Filter lectures based on calendar view
  const filteredLectures = useMemo(() => {
    const startDate = selectedDate.clone().startOf(calendarView);
    const endDate = selectedDate.clone().endOf(calendarView);
  
    return lectures.filter(lecture => {
      const lectureDate = moment(lecture.date);
      return lectureDate.isSameOrAfter(startDate) && lectureDate.isSameOrBefore(endDate);
    });
  }, [lectures, selectedDate, calendarView]);

  // Filter assignments based on status
  const filteredAssignments = useMemo(() => {
    let result = assignments.filter(a => a.status === 'active');
    
    if (activeFilter === 'pending') {
      result = result.filter(a => a.submissions < a.students);
    } else if (activeFilter === 'completed') {
      result = result.filter(a => a.submissions === a.students);
    }
    
    return result.sort((a, b) => moment(a.dueDate).unix() - moment(b.dueDate).unix());
  }, [assignments, activeFilter]);

  // Filter submissions based on status
  const filteredSubmissions = useMemo(() => {
    return submissions.sort((a, b) => moment(b.submittedDate).unix() - moment(a.submittedDate).unix());
  }, [submissions]);

  // Calendar navigation
  const navigateCalendar = (direction) => {
    setSelectedDate(prev => 
      direction === 'prev' 
        ? prev.clone().subtract(1, calendarView)
        : prev.clone().add(1, calendarView)
    );
  };

  // Render calendar view
  const renderCalendar = () => {
    const startDate = selectedDate.clone().startOf(calendarView);
    const endDate = selectedDate.clone().endOf(calendarView);
    const days = [];
    let currentDate = startDate.clone();
    
    while (currentDate.isSameOrBefore(endDate)) {
      days.push(currentDate.clone());
      currentDate.add(1, 'day');
    }

    return (
      <div className="calendar-view">
        <div className="calendar-header">
          <button 
            onClick={() => navigateCalendar('prev')}
            aria-label="Previous period"
          >
            ◀
          </button>
          <h3>
            {startDate.format('MMM D')} - {endDate.format('MMM D, YYYY')}
          </h3>
          <button 
            onClick={() => navigateCalendar('next')}
            aria-label="Next period"
          >
            ▶
          </button>
        </div>
        <div className="calendar-grid">
          {days.map(day => {
            const dayLectures = filteredLectures.filter(lecture => 
              moment(lecture.date).isSame(day, 'day')
            );
            
            return (
              <div 
                key={day.format('YYYY-MM-DD')} 
                className={`calendar-day ${day.isSame(moment(), 'day') ? 'today' : ''}`}
                aria-label={`Day ${day.format('MMMM D, YYYY')}`}
              >
                <div className="day-header">
                  <div className="day-name">{day.format('ddd')}</div>
                  <div className="day-number">{day.format('D')}</div>
                </div>
                <div className="day-events">
                  {dayLectures.length > 0 ? (
                    dayLectures.map(lecture => (
                      <div 
                        key={lecture.id} 
                        className="calendar-event"
                        onClick={() => onQuickAction('view-lecture', lecture)}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => e.key === 'Enter' && onQuickAction('view-lecture', lecture)}
                      >
                        <div className="event-time">{lecture.time}</div>
                        <div className="event-title">{lecture.title}</div>
                        <div className="event-course">{lecture.course}</div>
                      </div>
                    ))
                  ) : (
                    <div className="no-events">No lectures scheduled</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Quick action buttons
  const quickActions = [
    { id: 'schedule-lecture', icon: '📅', label: 'Schedule Lecture', action: 'lecture' },
    { id: 'create-assignment', icon: '📝', label: 'Create Assignment', action: 'assignment' },
    { id: 'upload-material', icon: '📂', label: 'Upload Material', action: 'material' },
    { id: 'post-announcement', icon: '📢', label: 'Post Announcement', action: 'announcement' },
    { id: 'view-analytics', icon: '📊', label: 'View Analytics', action: 'analytics' },
    { id: 'settings', icon: '⚙️', label: 'Settings', action: 'settings' }
  ];

  // Calculate completion percentage
  const getCompletionPercentage = (submitted, total) => {
    return total > 0 ? Math.round((submitted / total) * 100) : 0;
  };

  return (
    <div className="dashboard-content">
      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => onQuickAction('view-students')} role="button" tabIndex={0}>
          <div className="stat-value">{stats.totalStudents}</div>
          <div className="stat-title">Total Students</div>
          <div className="stat-meta">
            <span className="stat-change positive">↑ {stats.activeStudents} active</span>
          </div>
        </div>
        <div className="stat-card" onClick={() => onQuickAction('view-courses')} role="button" tabIndex={0}>
          <div className="stat-value">{stats.totalCourses}</div>
          <div className="stat-title">Courses</div>
          <div className="stat-meta">
            {stats.courseMaterials} materials uploaded
          </div>
        </div>
        <div className="stat-card" onClick={() => onQuickAction('view-assignments')} role="button" tabIndex={0}>
          <div className="stat-value">{stats.pendingAssignments + stats.gradedAssignments}</div>
          <div className="stat-title">Assignments</div>
          <div className="stat-meta">
            <span className="stat-change warning">⚠ {stats.pendingAssignments} to grade</span>
          </div>
        </div>
        <div className="stat-card" onClick={() => onQuickAction('view-lectures')} role="button" tabIndex={0}>
          <div className="stat-value">{stats.upcomingLectures}</div>
          <div className="stat-title">Upcoming Lectures</div>
          <div className="stat-meta">
            {lectures[0] ? `Next: ${lectures[0].title}` : 'No lectures scheduled'}
          </div>
        </div>
      </div>
      
      <div className="divider"></div>
      
      {/* Quick Actions and Announcements */}
      <div className="dashboard-row">
        <div className="dashboard-col">
          <div className="dashboard-card">
            <h3>Quick Actions</h3>
            <div className="quick-actions-grid">
              {quickActions.map(action => (
                <button 
                  key={action.id}
                  className={`quick-action-btn ${action.id === 'schedule-lecture' ? 'primary' : ''}`}
                  onClick={() => onQuickAction(action.action)}
                  aria-label={action.label}
                >
                  <span className="action-icon">{action.icon}</span> 
                  <span className="action-label">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="dashboard-col">
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Recent Announcements</h3>
              <div className="header-actions">
                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <button 
                  className="link-btn" 
                  onClick={() => onQuickAction('view-announcements')}
                  aria-label="View all announcements"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="announcements-list">
              {announcements
                .filter(announcement => 
                  announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  announcement.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  announcement.course.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .sort((a, b) => moment(b.date).unix() - moment(a.date).unix())
                .slice(0, 3)
                .map(item => (
                  <div key={item.id} className="announcement-item" onClick={() => onQuickAction('view-announcement', item)}>
                    <div className="announcement-icon">📢</div>
                    <div className="announcement-content">
                      <div className="announcement-title">{item.title}</div>
                      <div className="announcement-text" title={item.content}>
                        {item.content.length > 50 ? `${item.content.substring(0, 50)}...` : item.content}
                      </div>
                      <div className="announcement-meta">
                        <span className="course-badge">{item.course}</span>
                        <span>{moment(item.date).fromNow()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              {announcements.length === 0 && (
                <div className="empty-state">
                  No announcements available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="divider"></div>
      
      {/* Assignments and Submissions */}
      <div className="dashboard-row">
        <div className="dashboard-col">
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Upcoming Assignments</h3>
              <div className="header-actions">
                <div className="filter-tabs">
                  <button 
                    className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('all')}
                  >
                    All
                  </button>
                  <button 
                    className={`filter-tab ${activeFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('pending')}
                  >
                    Pending
                  </button>
                  <button 
                    className={`filter-tab ${activeFilter === 'completed' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('completed')}
                  >
                    Completed
                  </button>
                </div>
                <button 
                  className="link-btn" 
                  onClick={() => onQuickAction('view-assignments')}
                  aria-label="View all assignments"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="assignments-list">
              {filteredAssignments.slice(0, 3).map(assignment => (
                <div 
                  key={assignment.id} 
                  className="assignment-item"
                  onClick={() => onQuickAction('view-assignment', assignment)}
                >
                  <div className="assignment-header">
                    <div className="assignment-title">{assignment.title}</div>
                    <div className="assignment-due">
                      Due: {moment(assignment.dueDate).format('MMM D, h:mm A')}
                    </div>
                  </div>
                  <div className="assignment-meta">
                    <span className="course-badge">{assignment.course}</span>
                    <span className={`status ${getCompletionPercentage(assignment.submissions, assignment.students) === 100 ? 'completed' : 'pending'}`}>
                      {getCompletionPercentage(assignment.submissions, assignment.students)}% Complete
                    </span>
                  </div>
                  <div className="assignment-progress">
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${getCompletionPercentage(assignment.submissions, assignment.students)}%`,
                        backgroundColor: getCompletionPercentage(assignment.submissions, assignment.students) === 100 ? '#4caf50' : '#2196f3'
                      }}
                    ></div>
                    <span className="progress-text">
                      {assignment.submissions}/{assignment.students} submitted
                    </span>
                  </div>
                </div>
              ))}
              {filteredAssignments.length === 0 && (
                <div className="empty-state">
                  No {activeFilter !== 'all' ? activeFilter : ''} assignments available
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="dashboard-col">
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Recent Submissions</h3>
              <button 
                className="link-btn" 
                onClick={() => onQuickAction('view-submissions')}
                aria-label="View all submissions"
              >
                View All
              </button>
            </div>
            <div className="submissions-list">
              {filteredSubmissions.slice(0, 3).map(submission => {
                const student = students.find(s => s.id === submission.studentId);
                const assignment = assignments.find(a => a.id === submission.assignmentId);
                return (
                  <div 
                    key={submission.id} 
                    className="submission-item"
                    onClick={() => onQuickAction('view-submission', submission)}
                  >
                    <div className="submission-header">
                      <div className="student-info">
                        <div className="student-avatar">
                          {student?.avatar || '👤'}
                        </div>
                        <div className="student-name">
                          {student?.name || 'Unknown Student'}
                        </div>
                      </div>
                      <div className="submission-date">
                        {moment(submission.submittedDate).fromNow()}
                      </div>
                    </div>
                    <div className="assignment-info">
                      {assignment?.title || 'Unknown Assignment'}
                    </div>
                    <div className="submission-footer">
                      <span className="course-badge">{assignment?.course || 'Unknown Course'}</span>
                      <span className={`status ${submission.status}`}>
                        {submission.status}
                      </span>
                    </div>
                  </div>
                );
              })}
              {filteredSubmissions.length === 0 && (
                <div className="empty-state">
                  No submissions available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="divider"></div>
      
      {/* Calendar View */}
      <div className="dashboard-card">
        <div className="card-header">
          <h3>Upcoming Lectures</h3>
          <div className="header-actions">
            <div className="view-options">
              <button 
                className={`view-option ${calendarView === 'week' ? 'active' : ''}`}
                onClick={() => setCalendarView('week')}
              >
                Week
              </button>
              <button 
                className={`view-option ${calendarView === 'month' ? 'active' : ''}`}
                onClick={() => setCalendarView('month')}
              >
                Month
              </button>
            </div>
            <button 
              className="primary-btn" 
              onClick={() => onQuickAction('lecture')}
              aria-label="Schedule new lecture"
            >
              <span>+</span> Schedule Lecture
            </button>
          </div>
        </div>
        {renderCalendar()}
      </div>
      
      <div className="divider"></div>
      
      {/* Performance Metrics */}
      <div className="dashboard-card">
        <div className="card-header">
          <h3>Student Performance Overview</h3>
          <button 
            className="link-btn" 
            onClick={() => onQuickAction('view-analytics')}
            aria-label="View detailed analytics"
          >
            View Details
          </button>
        </div>
        <div className="performance-grid">
          <div className="performance-item">
            <div className="performance-chart">
              <div 
                className="circular-progress" 
                style={{ '--percentage': stats.attendanceRate || 0 }}
                role="progressbar"
                aria-valuenow={stats.attendanceRate || 0}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <span>{stats.attendanceRate || 0}%</span>
              </div>
            </div>
            <div className="performance-label">Attendance Rate</div>
            <div className="performance-trend">
              {stats.attendanceTrend || 'No trend data'}
            </div>
          </div>
          <div className="performance-item">
            <div className="performance-chart">
              <div 
                className="circular-progress" 
                style={{ '--percentage': getCompletionPercentage(stats.gradedAssignments, stats.pendingAssignments + stats.gradedAssignments) }}
                role="progressbar"
                aria-valuenow={getCompletionPercentage(stats.gradedAssignments, stats.pendingAssignments + stats.gradedAssignments)}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <span>{stats.gradedAssignments || 0} Graded</span>
              </div>
            </div>
            <div className="performance-label">Assignment Completion</div>
            <div className="performance-trend">
              {stats.gradingTrend || 'No trend data'}
            </div>
          </div>
          <div className="performance-item">
            <div className="performance-chart">
              <div 
                className="circular-progress" 
                style={{ '--percentage': stats.averageGrade || 0 }}
                role="progressbar"
                aria-valuenow={stats.averageGrade || 0}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <span>{stats.averageGrade || 0}%</span>
              </div>
            </div>
            <div className="performance-label">Average Grade</div>
            <div className="performance-trend">
              {stats.gradeTrend || 'No trend data'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Dashboard.propTypes = {
  stats: PropTypes.shape({
    totalStudents: PropTypes.number,
    activeStudents: PropTypes.number,
    totalCourses: PropTypes.number,
    courseMaterials: PropTypes.number,
    pendingAssignments: PropTypes.number,
    gradedAssignments: PropTypes.number,
    upcomingLectures: PropTypes.number,
    attendanceRate: PropTypes.number,
    averageGrade: PropTypes.number,
    attendanceTrend: PropTypes.string,
    gradingTrend: PropTypes.string,
    gradeTrend: PropTypes.string
  }).isRequired,
  announcements: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired,
      course: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired
    })
  ),
  assignments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      course: PropTypes.string.isRequired,
      dueDate: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      submissions: PropTypes.number.isRequired,
      students: PropTypes.number.isRequired
    })
  ),
  submissions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      studentId: PropTypes.string.isRequired,
      assignmentId: PropTypes.string.isRequired,
      submittedDate: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired
    })
  ),
  lectures: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      course: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      time: PropTypes.string.isRequired
    })
  ),
  students: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      avatar: PropTypes.string
    })
  ),
  courses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      code: PropTypes.string.isRequired
    })
  ),
  onQuickAction: PropTypes.func.isRequired
};