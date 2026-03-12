import React, { useState, useEffect } from 'react';
import moment from 'moment';
import './Lecture.css';

export const Lectures = ({ 
  initialLectures = [], 
  setActiveTab, 
  setCurrentItem, 
  showModal = () => console.warn('showModal function not provided'),
  courses = []
}) => {
  // Load lectures from localStorage or initial props
  const [lectures, setLectures] = useState(() => {
    const saved = localStorage.getItem('lectures');
    return saved ? JSON.parse(saved) : initialLectures;
  });

  const [calendarView, setCalendarView] = useState('week');
  const [selectedDate, setSelectedDate] = useState(moment());
  const [filteredLectures, setFilteredLectures] = useState([]);
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Save to localStorage whenever lectures change
  useEffect(() => {
    localStorage.setItem('lectures', JSON.stringify(lectures));
  }, [lectures]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768 && calendarView === 'month') {
        setCalendarView('week');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calendarView]);

  // Filter lectures
  useEffect(() => {
    const startDate = selectedDate.clone().startOf(calendarView);
    const endDate = selectedDate.clone().endOf(calendarView);
    
    const filtered = lectures.filter(lecture => {
      const lectureDate = moment(lecture.date);
      const dateInRange = lectureDate.isSameOrAfter(startDate) && lectureDate.isSameOrBefore(endDate);
      const courseMatch = courseFilter === 'all' || lecture.courseId === courseFilter;
      const statusMatch = statusFilter === 'all' || lecture.status === statusFilter;
      
      return dateInRange && courseMatch && statusMatch;
    });

    setFilteredLectures(filtered);
  }, [lectures, selectedDate, calendarView, courseFilter, statusFilter]);

  const navigateCalendar = (direction) => {
    setSelectedDate(prev => prev.clone().add(direction === 'prev' ? -1 : 1, calendarView));
  };

  const handleLectureUpdate = (updatedLecture) => {
    setLectures(prev => 
      prev.map(lecture => 
        lecture.id === updatedLecture.id ? updatedLecture : lecture
      )
    );
  };

  const handleLectureDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this lecture?')) {
      setLectures(prev => prev.filter(lecture => lecture.id !== id));
    }
  };

  const handleLectureCreate = (newLecture) => {
    const lectureWithId = {
      ...newLecture,
      id: Date.now(), // Using timestamp for unique IDs
      status: newLecture.status || 'upcoming'
    };
    setLectures(prev => [lectureWithId, ...prev]);
  };

  const getStatusTag = (status) => {
    const statusMap = {
      upcoming: { className: 'upcoming', text: 'Upcoming', icon: '⏳' },
      completed: { className: 'completed', text: 'Completed', icon: '✅' },
      cancelled: { className: 'cancelled', text: 'Cancelled', icon: '❌' },
      default: { className: 'default', text: status, icon: 'ℹ️' }
    };
    
    const statusConfig = statusMap[status.toLowerCase()] || statusMap.default;
    
    return (
      <span className={`status-tag ${statusConfig.className}`}>
        {!isMobile && statusConfig.icon} {statusConfig.text}
      </span>
    );
  };

  const renderCalendarHeader = () => {
    const startDate = selectedDate.clone().startOf(calendarView);
    const endDate = selectedDate.clone().endOf(calendarView);
    
    return (
      <div className="calendar-header">
        <div className="calendar-nav">
          <button 
            className="nav-btn icon-btn"
            onClick={() => navigateCalendar('prev')}
            aria-label="Previous period"
          >
            &lt;
          </button>
          <button 
            className="today-btn"
            onClick={() => setSelectedDate(moment())}
          >
            Today
          </button>
          <button 
            className="nav-btn icon-btn"
            onClick={() => navigateCalendar('next')}
            aria-label="Next period"
          >
            &gt;
          </button>
        </div>
        
        <h3 className="calendar-title">
          {calendarView === 'month' 
            ? selectedDate.format('MMMM YYYY')
            : `${startDate.format('MMM D')} - ${endDate.format('MMM D, YYYY')}`}
        </h3>
        
        <div className="view-toggle">
          <button
            className={`view-btn ${calendarView === 'week' ? 'active' : ''}`}
            onClick={() => setCalendarView('week')}
          >
            Week
          </button>
          <button
            className={`view-btn ${calendarView === 'month' ? 'active' : ''}`}
            onClick={() => setCalendarView('month')}
            disabled={isMobile}
          >
            Month
          </button>
        </div>
      </div>
    );
  };

  const renderDayEvents = (day) => {
    const dayLectures = filteredLectures.filter(lecture => 
      moment(lecture.date).isSame(day, 'day')
    );

    if (dayLectures.length === 0) {
      return <div className="no-events">No lectures</div>;
    }

    return dayLectures.map(lecture => (
      <div 
        key={lecture.id} 
        className={`calendar-event ${lecture.status}`}
        onClick={() => {
          setCurrentItem(lecture);
          setActiveTab('lecture-detail');
        }}
      >
        <div className="event-time">{moment(lecture.time, 'HH:mm').format('h:mm A')}</div>
        <div className="event-main">
          <h4 className="event-title">{lecture.title}</h4>
          <div className="event-meta">
            {lecture.courseName && (
              <span className="event-course">{lecture.courseName}</span>
            )}
            {lecture.location && (
              <span className="event-location">
                <span className="icon">📍</span> {lecture.location}
              </span>
            )}
          </div>
        </div>
        <div className="event-status">
          {getStatusTag(lecture.status)}
          <div className="event-actions">
            <button
              className="action-btn"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentItem(lecture);
                showModal('lecture');
              }}
            >
              Edit
            </button>
            <button
              className="action-btn danger"
              onClick={(e) => {
                e.stopPropagation();
                handleLectureDelete(lecture.id);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    ));
  };

  const renderCalendarGrid = () => {
    const startDate = selectedDate.clone().startOf(calendarView);
    const endDate = selectedDate.clone().endOf(calendarView);
    const days = [];
    let currentDate = startDate.clone();
    
    while (currentDate.isSameOrBefore(endDate)) {
      days.push(currentDate.clone());
      currentDate.add(1, 'day');
    }

    if (calendarView === 'month') {
      return (
        <div className="month-grid">
          <div className="month-header">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="month-day-name">{day}</div>
            ))}
          </div>
          
          <div className="month-days">
            {days.map(day => (
              <div 
                key={day.format('YYYY-MM-DD')}
                className={`month-day ${day.isSame(moment(), 'day') ? 'today' : ''} ${
                  day.month() !== selectedDate.month() ? 'other-month' : ''
                }`}
              >
                <div className="day-number">{day.format('D')}</div>
                <div className="day-events">
                  {filteredLectures
                    .filter(lecture => moment(lecture.date).isSame(day, 'day'))
                    .slice(0, 2)
                    .map(lecture => (
                      <div 
                        key={lecture.id}
                        className="month-event"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentItem(lecture);
                          setActiveTab('lecture-detail');
                        }}
                      >
                        {moment(lecture.time, 'HH:mm').format('h:mm A')} {lecture.title}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="week-grid">
        {days.map(day => (
          <div 
            key={day.format('YYYY-MM-DD')} 
            className={`week-day ${day.isSame(moment(), 'day') ? 'today' : ''}`}
          >
            <div className="day-header">
              <div className="day-name">{day.format('ddd')}</div>
              <div className="day-number">{day.format('D')}</div>
            </div>
            <div className="day-events">
              {renderDayEvents(day)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="lectures-header">
        <h2>Lecture Schedule</h2>
        
        <div className="controls-container">
          <div className="filters-container">
            <div className="filter-group">
              <select
                className="filter-select"
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
              >
                <option value="all">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          <button
            className="add-lecture-btn primary-btn"
            onClick={() => {
              setCurrentItem(null);
              showModal('lecture');
            }}
          >
            {isMobile ? '+' : 'Schedule Lecture'}
          </button>
        </div>
      </div>

      <div className="calendar-wrapper">
        {renderCalendarHeader()}
        {renderCalendarGrid()}
      </div>
    </>
  );
};