import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { Chat } from "../../Chat/Chat";
import "./Discussions.jsx";
import { 
  FiArrowLeft, FiMessageSquare, FiPlus, FiX, 
  FiSearch, FiBookmark, FiLock, FiUnlock
} from 'react-icons/fi';
import { FaChalkboardTeacher, FaUserGraduate, FaStar } from 'react-icons/fa';
import { IoMdNotifications } from 'react-icons/io';
import PropTypes from 'prop-types';

export const Discussions = ({ 
  initialDiscussions = [],
  currentUser = { id: 'user-1', name: 'Professor', role: 'instructor', avatar: null },
  courses = ['CS101', 'MATH202', 'PHYS101'],
  onDiscussionCreated,
  onDiscussionClosed,
  onDiscussionPinned,
  theme = 'light',
}) => {
  const [discussions, setDiscussions] = useState(initialDiscussions);
  const [activeDiscussion, setActiveDiscussion] = useState(null);
  const [isCreatingDiscussion, setIsCreatingDiscussion] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({
    topic: '',
    course: courses[0] || '',
    content: '',
    isPinned: false,
    isPrivate: false,
    tags: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    setDiscussions(initialDiscussions);
  }, [initialDiscussions]);

  const toggleDiscussionClose = (discussionId) => {
    const updatedDiscussions = discussions.map(discussion => {
      if (discussion.id === discussionId) {
        const updated = {
          ...discussion,
          isClosed: !discussion.isClosed
        };
        
        if (onDiscussionClosed) {
          onDiscussionClosed(discussionId, updated.isClosed);
        }
        
        return updated;
      }
      return discussion;
    });

    setDiscussions(updatedDiscussions);
    
    if (activeDiscussion && activeDiscussion.id === discussionId) {
      setActiveDiscussion({
        ...activeDiscussion,
        isClosed: !activeDiscussion.isClosed
      });
    }
  };

  const renderDiscussionCard = (discussion) => (
    <div 
      key={discussion.id}
      className={`discussion-card ${discussion.isPinned ? 'pinned' : ''}`}
      onClick={() => setActiveDiscussion(discussion)}
    >
      <div className="discussion-header">
        <h3>{discussion.topic}</h3>
        <div className="discussion-badges">
          {discussion.isPinned && <span className="pinned-badge">📌 Pinned</span>}
          {discussion.isClosed && <span className="closed-badge">🔒 Closed</span>}
          {discussion.isPrivate && <span className="private-badge">👤 Private</span>}
        </div>
      </div>
      <div className="discussion-content">
        {discussion.content.length > 150 
          ? `${discussion.content.substring(0, 150)}...` 
          : discussion.content}
      </div>
      <div className="discussion-footer">
        <span className="course-tag">{discussion.course}</span>
        <span className="author">
          {discussion.authorRole === 'instructor' ? (
            <FaChalkboardTeacher className="role-icon instructor" />
          ) : (
            <FaUserGraduate className="role-icon student" />
          )}
          {discussion.author}
        </span>
        <span className="date">{moment(discussion.date).fromNow()}</span>
        <span className="replies">
          <FiMessageSquare /> {discussion.replies} replies
        </span>
      </div>
      {currentUser.role === 'instructor' && (
        <div className="discussion-actions">
          <button 
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDiscussionPinned && onDiscussionPinned(discussion.id, !discussion.isPinned);
              setDiscussions(discussions.map(d => 
                d.id === discussion.id ? { ...d, isPinned: !d.isPinned } : d
              ));
            }}
          >
            {discussion.isPinned ? 'Unpin' : 'Pin'}
          </button>
          <button 
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              toggleDiscussionClose(discussion.id);
            }}
          >
            {discussion.isClosed ? 'Reopen' : 'Close'}
          </button>
        </div>
      )}
    </div>
  );

  const renderDiscussionsList = () => {
    const filteredDiscussions = discussions.filter(discussion => 
      discussion.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discussion.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className={`discussions-view ${theme}-theme`}>
        <div className="section-header">
          <h2>Course Discussions</h2>
          <div className="header-actions">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search discussions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="search-btn"><FiSearch /></button>
            </div>
            <button 
              className="primary-btn"
              onClick={() => setIsCreatingDiscussion(true)}
            >
              <FiPlus /> New Discussion
            </button>
          </div>
        </div>

        <div className="discussions-grid">
          {filteredDiscussions.length > 0 ? (
            filteredDiscussions
              .sort((a, b) => moment(b.date).diff(moment(a.date)))
              .map(renderDiscussionCard)
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><FiMessageSquare size={48} /></div>
              <p>No discussions found {searchTerm && `matching "${searchTerm}"`}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDiscussionDetail = () => {
    if (!activeDiscussion) return null;
    
    return (
      <div className={`discussion-detail ${theme}-theme`}>
        <div className="discussion-header">
          <button 
            className="back-button"
            onClick={() => setActiveDiscussion(null)}
          >
            <FiArrowLeft /> Back to Discussions
          </button>
          
          <div className="discussion-title">
            <h2>{activeDiscussion.topic}</h2>
            <div className="discussion-actions">
              <button className="icon-button">
                <FiBookmark />
              </button>
              <button className="icon-button">
                <IoMdNotifications />
              </button>
              {currentUser.role === 'instructor' && (
                <>
                  <button 
                    className="icon-button"
                    onClick={() => toggleDiscussionClose(activeDiscussion.id)}
                  >
                    {activeDiscussion.isClosed ? <FiUnlock /> : <FiLock />}
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="discussion-meta">
            <span className="course-tag">{activeDiscussion.course}</span>
            <span className="author">
              {activeDiscussion.authorRole === 'instructor' ? (
                <FaChalkboardTeacher className="role-icon instructor" />
              ) : (
                <FaUserGraduate className="role-icon student" />
              )}
              {activeDiscussion.author}
            </span>
            <span className="date">{moment(activeDiscussion.date).fromNow()}</span>
            <span className="replies">
              <FiMessageSquare /> {activeDiscussion.replies} replies
            </span>
          </div>
        </div>
        
        <div className="discussion-content">
          <p>{activeDiscussion.content}</p>
        </div>
        
        <Chat 
          discussionId={activeDiscussion.id}
          currentUser={currentUser}
          isDiscussionClosed={activeDiscussion.isClosed}
          theme={theme}
        />
        
        {!isOnline && (
          <div className="offline-notification">
            <i className="fas fa-wifi"></i> No internet connection
          </div>
        )}
      </div>
    );
  };

  const handleCreateDiscussion = () => {
    const discussion = {
      id: uuidv4(),
      topic: newDiscussion.topic,
      course: newDiscussion.course,
      content: newDiscussion.content,
      author: currentUser.name,
      authorId: currentUser.id,
      authorRole: currentUser.role,
      date: moment().toISOString(),
      lastReply: moment().toISOString(),
      replies: 0,
      messages: [],
      isPinned: newDiscussion.isPinned,
      isPrivate: newDiscussion.isPrivate,
      isClosed: false,
      tags: newDiscussion.tags
    };
    
    setDiscussions([discussion, ...discussions]);
    setActiveDiscussion(discussion);
    setIsCreatingDiscussion(false);
    setNewDiscussion({
      topic: '',
      course: courses[0] || '',
      content: '',
      isPinned: false,
      isPrivate: false,
      tags: []
    });
    
    if (onDiscussionCreated) onDiscussionCreated(discussion);
  };

  return (
    <div className={`discussions-container ${theme}-theme`}>
      {isCreatingDiscussion && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>New Discussion</h3>
              <button 
                className="close-button"
                onClick={() => {
                  setIsCreatingDiscussion(false);
                  setNewDiscussion({
                    topic: '',
                    course: courses[0] || '',
                    content: '',
                    isPinned: false,
                    isPrivate: false,
                    tags: []
                  });
                }}
              >
                <FiX />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Topic</label>
                <input
                  type="text"
                  value={newDiscussion.topic}
                  onChange={(e) => setNewDiscussion({
                    ...newDiscussion,
                    topic: e.target.value
                  })}
                  placeholder="Enter discussion topic"
                />
              </div>
              
              <div className="form-group">
                <label>Course</label>
                <select
                  value={newDiscussion.course}
                  onChange={(e) => setNewDiscussion({
                    ...newDiscussion,
                    course: e.target.value
                  })}
                >
                  {courses.map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Content</label>
                <textarea
                  value={newDiscussion.content}
                  onChange={(e) => setNewDiscussion({
                    ...newDiscussion,
                    content: e.target.value
                  })}
                  placeholder="Enter your discussion content"
                  rows={5}
                />
              </div>
              
              <div className="form-options">
                {currentUser.role === 'instructor' && (
                  <label>
                    <input
                      type="checkbox"
                      checked={newDiscussion.isPinned}
                      onChange={(e) => setNewDiscussion({
                        ...newDiscussion,
                        isPinned: e.target.checked
                      })}
                    />
                    Pin this discussion
                  </label>
                )}
                
                <label>
                  <input
                    type="checkbox"
                    checked={newDiscussion.isPrivate}
                    onChange={(e) => setNewDiscussion({
                      ...newDiscussion,
                      isPrivate: e.target.checked
                    })}
                  />
                  Make private (visible only to instructors)
                </label>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                className="secondary-btn"
                onClick={() => setIsCreatingDiscussion(false)}
              >
                Cancel
              </button>
              <button
                className="primary-btn"
                onClick={handleCreateDiscussion}
                disabled={!newDiscussion.topic.trim() || !newDiscussion.content.trim()}
              >
                Create Discussion
              </button>
            </div>
          </div>
        </div>
      )}
      
      {activeDiscussion ? renderDiscussionDetail() : renderDiscussionsList()}
    </div>
  );
};

Discussions.propTypes = {
  initialDiscussions: PropTypes.array,
  currentUser: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    role: PropTypes.oneOf(['instructor', 'student']),
    avatar: PropTypes.string
  }),
  courses: PropTypes.arrayOf(PropTypes.string),
  onDiscussionCreated: PropTypes.func,
  onDiscussionClosed: PropTypes.func,
  onDiscussionPinned: PropTypes.func,
  theme: PropTypes.oneOf(['light', 'dark'])
};

Discussions.defaultProps = {
  initialDiscussions: [],
  currentUser: { id: 'user-1', name: 'Professor', role: 'instructor', avatar: null },
  courses: ['CS101', 'MATH202', 'PHYS101'],
  theme: 'light'
};