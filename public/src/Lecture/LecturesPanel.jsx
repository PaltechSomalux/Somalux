import React, { useState, useEffect } from 'react';
import { Courses } from '../Lecture/Components/Courses';
import './LecturePanel.css';
import { Docs } from './Components/Docs';
import { Announcements } from '../Lecture/Components/Announcements';
import { Assignments } from '../Lecture/Components/Assignments';
import { Lectures } from '../Lecture/Components/Lecture';
import { Students } from '../Lecture/Components/Students';
import { Discussions } from '../Lecture/Components/Discussions';
import { Login } from '../Lecture/Components/Login';
import { Logout } from '../Lecture/Components/Logout';
import { BookConverter } from './Components/BookConverter/BookConverter';
import { UserProfile } from './UserProfile';

export const LectureDashboard = ({ user, onLogout }) => {
  // State management
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('students');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);

  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [docs, setDocs] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [discussions, setDiscussions] = useState([]);

  // Responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileDrawerVisible(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mock data initialization
  useEffect(() => {
    setStudents([
      { id: 1, name: 'John Doe', email: 'john@university.edu', status: 'active', 
        enrollment: '2022', major: 'Computer Science', lastActive: '2023-04-14', 
        courses: ['CS101', 'MATH202'], performance: 85, avatar: '👨‍🎓' },
    ]);
    
    setCourses([
      { id: 1, code: 'CS101', name: 'Introduction to Computer Science', 
        instructor: 'Prof. Smith', semester: 'Spring 2023', students: 45, 
        description: 'Fundamental concepts of computer science and programming.' },
    ]);
    
    setDocs([
      { id: 1, name: 'Syllabus.pdf', type: 'pdf', subject: 'Computer Science', 
        class: 'CS101', date: '2023-01-15', downloads: 42, starred: true, 
        size: '2.4 MB' },
    ]);
  }, []);

  const menuItems = [
    { key: 'students', icon: '👥', label: 'Students' },
    { key: 'courses', icon: '📚', label: 'Courses' },
    { key: 'docs', icon: '📄', label: 'Notes' },
    { key: 'lectures', icon: '📅', label: 'Lectures' },
    { key: 'assignments', icon: '📝', label: 'Assignments' },
    { key: 'announcements', icon: '📢', label: 'Announcements' },
    { key: 'discussions', icon: '💬', label: 'Discussions' },
    { key: 'BookConverter', icon: '⌛', label: 'PdfConverter' },
  ];

  const mobileNavItems = [
    { key: 'students', icon: '👥', label: 'Students' },
    { key: 'courses', icon: '📚', label: 'Courses' },
    { key: 'docs', icon: '📄', label: 'Notes' },
    { key: 'assignments', icon: '📝', label: 'Assign' },
    { key: 'discussions', icon: '💬', label: 'Discuss' },
    { key: 'more', icon: '⋮', label: 'More' },
  ];

  const handleMobileNavClick = (itemKey) => {
    if (itemKey === 'more') {
      setMobileDrawerVisible(prev => !prev);
    } else {
      setActiveTab(itemKey);
      setMobileDrawerVisible(false);
    }
  };

  const handleMenuItemClick = (itemKey) => {
    setActiveTab(itemKey);
    if (isMobile) {
      setMobileDrawerVisible(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'students': return <Students students={students} setStudents={setStudents} />;
      case 'courses': return <Courses courses={courses} setCourses={setCourses} />;
      case 'docs': return (
        <Docs 
          documents={docs} 
          setDocuments={setDocs} 
          classes={courses} 
          setAlert={(alert) => console.log(alert.message)} 
        />
      );
      case 'lectures': return <Lectures lectures={lectures} setLectures={setLectures} />;
      case 'assignments': return <Assignments assignments={assignments} setAssignments={setAssignments} />;
      case 'announcements': return <Announcements announcements={announcements} setAnnouncements={setAnnouncements} />;
      case 'discussions': return <Discussions discussions={discussions} setDiscussions={setDiscussions} />;
      case 'login': return <Login />;
      case 'BookConverter': return <BookConverter />;
      case 'logout': return <Logout />;
      default: return <Students students={students} setStudents={setStudents} />;
    }
  };

  return (
    <div className="lecture-app-layout">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className={`lecture-sidebar ${collapsed ? 'collapsed' : ''}`}>
          <div className="lecture-logo">
            {collapsed ? 'LP' : 'Lec. Portal'}
            <button 
              className="lecture-collapse-btn"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? '»' : '«'}
            </button>
          </div>
          <div className="lecture-menu">
            {menuItems.map(item => (
              <div 
                key={item.key}
                className={`lecture-menu-item ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => handleMenuItemClick(item.key)}
              >
                <span className="lecture-menu-icon">{item.icon}</span>
                {!collapsed && <span className="lecture-menu-label">{item.label}</span>}
              </div>
            ))}
            <div 
              className={`lecture-menu-item ${collapsed ? 'collapsed-profile' : ''}`}
              style={{ marginTop: 'auto', paddingBottom: '20px' }}
            >
              <UserProfile 
                user={user} 
                onLogout={onLogout}
                showAsIconOnly={collapsed}
                size={24}
              />
              {!collapsed && <span className="lecture-menu-label">Profile</span>}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {isMobile && mobileDrawerVisible && (
        <div className="lecture-mobile-drawer">
          <div className="lecture-drawer-content">
            <div className="lecture-logo">
              Portal
              <button 
                className="lecture-close-drawer"
                onClick={() => setMobileDrawerVisible(false)}
              >
                ×
              </button>
            </div>
            <div className="lecture-menu">
              {menuItems.map(item => (
                <div 
                  key={item.key}
                  className={`lecture-menu-item ${activeTab === item.key ? 'active' : ''}`}
                  onClick={() => handleMenuItemClick(item.key)}
                >
                  <span className="lecture-menu-icon">{item.icon}</span>
                  <span className="lecture-menu-label">{item.label}</span>
                </div>
              ))}
              <div className="lecture-menu-item" style={{ padding: '15px 20px' }}>
                <UserProfile 
                  user={user} 
                  onLogout={onLogout}
                  isMobile={true}
                />
              </div>
            </div>
          </div>
          <div 
            className="lecture-drawer-overlay" 
            onClick={() => setMobileDrawerVisible(false)}
          />
        </div>
      )}

      {/* Main Content */}
      <div 
        className="lecture-main-content" 
        style={{ 
          marginLeft: !isMobile && collapsed ? '80px' : !isMobile ? '250px' : '0',
          paddingBottom: isMobile ? '80px' : '20px'
        }}
      >
        <main className="lecture-content-area">
          <div className="lecture-content-card">
            {renderTabContent()}
          </div>
        </main>
        
        {/* Mobile bottom navigation */}
        {isMobile && (
          <div className="lecture-mobile-bottom-nav">
            {mobileNavItems.map(item => (
              <div 
                key={item.key}
                className={`lecture-mobile-nav-item ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => handleMobileNavClick(item.key)}
              >
                <span className="lecture-mobile-nav-icon">{item.icon}</span>
                <span className="lecture-mobile-nav-label">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};