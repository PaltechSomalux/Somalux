import React, { useState, useEffect } from 'react';
import moment from 'moment';
import "./Analytics.css";

export const AnalyticsDashboard = ({ 
  students = [], 
  courses = [], 
  grades = [], 
  stats = {} 
}) => {
  const [analyticsFilter, setAnalyticsFilter] = useState('students');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate derived statistics
  const calculateStats = () => {
    try {
      const totalStudents = students.length;
      const totalCourses = courses.length;
      
      // Calculate average performance across all students
      const avgPerformance = students.length > 0 
        ? students.reduce((sum, student) => sum + (student.performance || 0), 0) / students.length 
        : 0;
      
      // Calculate course statistics
      const courseStats = courses.map(course => {
        const courseGrades = grades.filter(g => g.course === course.code);
        const avgGrade = courseGrades.length > 0 
          ? courseGrades.reduce((sum, g) => sum + (g.totalGrade || 0), 0) / courseGrades.length 
          : 0;
        
        return {
          ...course,
          avgGrade,
          totalStudents: courseGrades.length
        };
      });

      return {
        totalStudents,
        totalCourses,
        avgPerformance,
        courseStats
      };
    } catch (err) {
      setError('Error calculating statistics');
      console.error(err);
      return {};
    }
  };

  const derivedStats = calculateStats();

  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.courses?.some(course => course.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter courses based on search term
  const filteredCourses = courses.filter(course => 
    course.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  ;

  // Handle time range change
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    // In a real app, you would fetch data based on the time range
  };

  return (
    <div className="analytics-view">
      <div className="analytics-header">
        <div className="header-row">
          <h2>Analytics & Reports</h2>
          <div className="time-range-selector">
            <button 
              className={`time-btn ${timeRange === 'week' ? 'active' : ''}`}
              onClick={() => handleTimeRangeChange('week')}
            >
              Week
            </button>
            <button 
              className={`time-btn ${timeRange === 'month' ? 'active' : ''}`}
              onClick={() => handleTimeRangeChange('month')}
            >
              Month
            </button>
            <button 
              className={`time-btn ${timeRange === 'year' ? 'active' : ''}`}
              onClick={() => handleTimeRangeChange('year')}
            >
              Year
            </button>
          </div>
        </div>
        
        <div className="header-row">
          <div className="analytics-filters">
            <button 
              className={`filter-btn ${analyticsFilter === 'students' ? 'active' : ''}`}
              onClick={() => setAnalyticsFilter('students')}
            >
              Student Performance
            </button>
            <button 
              className={`filter-btn ${analyticsFilter === 'courses' ? 'active' : ''}`}
              onClick={() => setAnalyticsFilter('courses')}
            >
              Course Analytics
            </button>
            <button 
              className={`filter-btn ${analyticsFilter === 'engagement' ? 'active' : ''}`}
              onClick={() => setAnalyticsFilter('engagement')}
            >
              Engagement Metrics
            </button>
          </div>
          
          <div className="search-box">
            <input
              type="text"
              placeholder={`Search ${analyticsFilter}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              Clear
            </button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      <div className="analytics-content">
        {isLoading ? (
          <div className="loading-spinner">Loading data...</div>
        ) : (
          <>
            {analyticsFilter === 'students' && (
              <div className="analytics-section">
                <div className="section-header">
                  <h3>Student Performance Overview</h3>
                  <div className="summary-stats">
                    <span>Total Students: {derivedStats.totalStudents}</span>
                    <span>Avg Performance: {derivedStats.avgPerformance?.toFixed(1)}%</span>
                  </div>
                </div>
                
                {filteredStudents.length > 0 ? (
                  <div className="performance-grid">
                    {filteredStudents.map(student => {
                      const lastUpdated = student.lastUpdated 
                        ? moment(student.lastUpdated).fromNow() 
                        : 'No data';
                      
                      return (
                        <div key={student.id} className="student-performance">
                          <div className="student-info">
                            <span className="student-avatar">
                              {student.avatar || student.name.charAt(0)}
                            </span>
                            <div className="student-details">
                              <span className="student-name">{student.name}</span>
                              <span className="student-id">{student.id}</span>
                            </div>
                          </div>
                          <div className="performance-bar-container">
                            <div 
                              className={`performance-bar ${student.performance > 90 ? 'performance-high' : 
                                student.performance > 70 ? 'performance-medium' : 'performance-low'}`}
                              style={{ width: `${Math.min(100, Math.max(0, student.performance || 0))}%` }}
                            ></div>
                            <span className="performance-text">
                              {student.performance?.toFixed(1) || 0}%
                            </span>
                          </div>
                          <div className="student-meta">
                            <div className="student-courses">
                              {student.courses?.join(', ') || 'No courses'}
                            </div>
                            <div className="last-updated">
                              Updated: {lastUpdated}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-data-message">
                    {searchTerm ? 'No matching students found' : 'No student data available'}
                  </div>
                )}
              </div>
            )}
            
            {analyticsFilter === 'courses' && (
              <div className="analytics-section">
                <div className="section-header">
                  <h3>Course Statistics</h3>
                  <div className="summary-stats">
                    <span>Total Courses: {derivedStats.totalCourses}</span>
                  </div>
                </div>
                
                {filteredCourses.length > 0 ? (
                  <div className="course-stats-grid">
                    {filteredCourses.map(course => {
                      const courseGrades = grades.filter(g => g.course === course.code);
                      const avgGrade = courseGrades.length > 0 
                        ? courseGrades.reduce((sum, g) => sum + (g.totalGrade || 0), 0) / courseGrades.length 
                        : 0;
                      
                      return (
                        <div key={course.id} className="course-stat-card">
                          <div className="course-header">
                            <div className="course-code">{course.code}</div>
                            <div className="course-name">{course.name}</div>
                          </div>
                          <div className="course-stats">
                            <div className="stat-row">
                              <span>Enrolled:</span>
                              <span>{courseGrades.length || 0}</span>
                            </div>
                            <div className="stat-row">
                              <span>Avg Grade:</span>
                              <span className={`grade-value ${avgGrade > 90 ? 'high-grade' : avgGrade > 70 ? 'medium-grade' : 'low-grade'}`}>
                                {avgGrade.toFixed(1)}%
                              </span>
                            </div>
                            <div className="stat-row">
                              <span>Materials:</span>
                              <span>{course.materials || 0}</span>
                            </div>
                            <div className="stat-row">
                              <span>Last Activity:</span>
                              <span>{course.lastActivity ? moment(course.lastActivity).format('MMM D') : 'None'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-data-message">
                    {searchTerm ? 'No matching courses found' : 'No course data available'}
                  </div>
                )}
              </div>
            )}
            
            {analyticsFilter === 'engagement' && (
              <div className="analytics-section">
                <h3>Engagement Metrics</h3>
                <div className="time-range-note">
                  Showing data for the last {timeRange}
                </div>
                
                <div className="engagement-metrics">
                  <div className="metric-card">
                    <div className="metric-value">
                      {stats.attendanceRate !== undefined ? stats.attendanceRate.toFixed(1) : '--'}%
                    </div>
                    <div className="metric-title">Average Attendance</div>
                    <div className="metric-trend positive">
                      {stats.attendanceTrend || 'No trend data'}
                    </div>
                    <div className="metric-details">
                      {stats.attendanceSessions || 0} sessions tracked
                    </div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-value">
                      {stats.averageGrade !== undefined ? stats.averageGrade.toFixed(1) : '--'}%
                    </div>
                    <div className="metric-title">Average Grade</div>
                    <div className={`metric-trend ${stats.gradeTrend?.includes('↑') ? 'positive' : 
                      stats.gradeTrend?.includes('↓') ? 'warning' : 'neutral'}`}>
                      {stats.gradeTrend || 'No trend data'}
                    </div>
                    <div className="metric-details">
                      Based on {stats.gradedAssignments || 0} assignments
                    </div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-value">
                      {stats.gradedAssignments !== undefined && stats.pendingAssignments !== undefined
                        ? Math.round((stats.gradedAssignments / (stats.pendingAssignments + stats.gradedAssignments)) * 100)
                        : '--'}%
                    </div>
                    <div className="metric-title">Assignments Graded</div>
                    <div className={`metric-trend ${stats.gradingTrend?.includes('↑') ? 'positive' : 
                      stats.gradingTrend?.includes('↓') ? 'warning' : 'neutral'}`}>
                      {stats.gradingTrend || 'No trend data'}
                    </div>
                    <div className="metric-details">
                      {stats.pendingAssignments || 0} pending
                    </div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-value">
                      {stats.materialDownloads !== undefined ? stats.materialDownloads : '--'}
                    </div>
                    <div className="metric-title">Material Downloads</div>
                    <div className="metric-trend positive">
                      {stats.downloadTrend || 'No trend data'}
                    </div>
                    <div className="metric-details">
                      {stats.newMaterials || 0} new this {timeRange}
                    </div>
                  </div>
                </div>
                
                <div className="engagement-charts">
                  <div className="chart-container">
                    <h4>Activity Over Time</h4>
                    <div className="placeholder-chart">
                      [Chart would show engagement over selected time range]
                    </div>
                  </div>
                  <div className="chart-container">
                    <h4>Course Comparison</h4>
                    <div className="placeholder-chart">
                      [Chart would compare courses by engagement metrics]
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};